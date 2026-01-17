const cds = require('@sap/cds');

// Import shared libraries
const duplicateChecker = require('./lib/shared/duplicate-checker');
const sapPartnerService = require('./lib/shared/sap-partner-service');
const ValidationService = require('./lib/validation-service');
const ChangeTracker = require('./lib/change-tracker');
const requestNumberGenerator = require('./utils/request-number-generator');

/**
 * Refactored Salesforce Service Implementation
 * - Uses shared duplicate checker
 * - Uses shared SAP partner service
 * - Clean, maintainable code
 */
module.exports = cds.service.impl(async function () {
    const log = cds.log('salesforce-service');
    const { SalesforceRequests } = this.entities;

    log.info('Salesforce Service initialized');

    // ================================
    // LOCALE FILTER FOR CODE LISTS
    // ================================
    // Filter code list entities by locale after query execution
    const codeListEntities = [
        'RequestTypes', 'SourceSystems', 'OverallStatuses', 'PaymentTerms', 'PaymentMethods',
        'RevenueStreams', 'BillingCycles', 'AddressTypes', 'EmailTypes', 'VatTypes',
        'IdentificationTypes', 'DocumentTypes', 'BPTypes', 'ContactTypes', 'DunningStrategies'
    ];

    codeListEntities.forEach(entity => {
        this.after('READ', entity, (results, req) => {
            if (!Array.isArray(results) || results.length === 0) return;

            // Get locale from Accept-Language header, fallback to 'en'
            const locale = req._.req?.headers?.['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
            // Only use supported locales (en, de), fallback to 'en' for others
            const supportedLocale = ['en', 'de'].includes(locale) ? locale : 'en';

            log.debug(`[${entity}] Filtering by locale: ${supportedLocale}`);

            // Filter results by locale - modify array in place
            for (let i = results.length - 1; i >= 0; i--) {
                if (results[i].locale && results[i].locale !== supportedLocale) {
                    results.splice(i, 1);
                }
            }
        });
    });

    // ================================
    // DRAFT INITIALIZATION
    // ================================

    this.before('NEW', 'SalesforceRequests', async (req) => {
        req.data.sourceSystem = 'Salesforce';
        req.data.status = 'Draft';
        if (!req.data.requestType) {
            req.data.requestType = 'Create';
        }
        if (!req.data.entityType) {
            req.data.entityType = 'Customer';
        }
        req.data.isEditable = true;
        if (!req.data.salesforceId) {
            req.data.salesforceId = cds.utils.uuid();
        }

        // NOTE: Request Number generation removed from here to prevent duplicates.
        // It's now ONLY generated in the before('CREATE', 'SalesforceRequests.drafts') handler
        // to ensure a single point of generation and avoid race conditions.
    });

    this.before('CREATE', 'SalesforceRequests', async (req) => {
        // Set default values for draft-enabled entity (CDS @default doesn't always apply in UI5 draft)
        req.data.sourceSystem = 'Salesforce';
        if (!req.data.requestType) req.data.requestType = 'Create';
        if (!req.data.entityType) req.data.entityType = 'Customer';
        if (!req.data.status) req.data.status = 'Draft';

        // Ensure Request Number exists using unified generator
        if (!req.data.requestNumber) {
            const db = await cds.connect.to('db');
            req.data.requestNumber = await requestNumberGenerator.getNextNumber('SALESFORCE', db);
        }
    });

    // CRITICAL FIX: For draft-enabled entities, explicitly handle draft creation
    this.before('CREATE', 'SalesforceRequests.drafts', async (req) => {
        // Detect if this is a Change request (existingBpNumber is provided)
        const isChangeRequest = req.data.existingBpNumber ? true : false;
        const requestType = isChangeRequest ? 'Change' : 'Create';

        log.info('=== Creating NEW DRAFT Salesforce request ===');
        log.info('Draft initialized', {
            requestType,
            existingBpNumber: req.data.existingBpNumber
        });

        // Set all defaults explicitly - this is critical for draft entities
        req.data.sourceSystem = 'Salesforce';
        req.data.requestType = requestType;
        req.data.status = 'New';

        if (!req.data.salesforceId) {
            req.data.salesforceId = cds.utils.uuid();
        }

        // Generate Request Number using unified generator
        // Works consistently for both draft and active entities
        if (!req.data.requestNumber) {
            const db = await cds.connect.to('db');
            req.data.requestNumber = await requestNumberGenerator.getNextNumber('SALESFORCE', db);
        }

        log.info('Draft initialized', {
            requestNumber: req.data.requestNumber,
            requestType: req.data.requestType,
            status: req.data.status,
            sourceSystem: req.data.sourceSystem
        });
    });

    // ================================
    // CHANGE TRACKING FOR UPDATE REQUESTS
    // ================================

    /**
     * Before UPDATE - Track field-level changes for Update requests
     * Only track changes for requestType='Update'
     */
    this.before('UPDATE', 'SalesforceRequests', async (req) => {
        const { ID } = req.data;

        if (!ID) return; // Skip if no ID

        log.info('=== Change Tracking: before UPDATE ===', { requestID: ID });

        try {
            // Get old request data (before update)
            const oldData = await getFullRequestData(ID, this, false);

            // Only track changes for Update requests
            if (oldData.requestType !== 'Update') {
                log.debug('Skipping change tracking - not an Update request', { requestType: oldData.requestType });
                return;
            }

            // Store old data in request context for after handler
            req._changeTrackingOldData = oldData;

        } catch (error) {
            log.error('Error in change tracking before UPDATE', {
                requestID: ID,
                error: error.message
            });
            // Don't block the update if change tracking fails
        }
    });

    // Removed: after UPDATE handler for change tracking
    // Change tracking now happens only in after SAVE handler to prevent duplicates
    // (SAVE internally triggers UPDATE, so having both handlers caused duplicate entries)

    // ================================
    // DYNAMIC VALIDATION WITH ValidationService
    // ================================

    /**
     * Before SAVE (draftActivate) - Validate using ValidationService AND Capture old data for change tracking
     * Uses database-driven validation rules for flexible, status-based validation
     */
    this.before('SAVE', 'SalesforceRequests', async (req) => {
        const { ID } = req.data;

        if (!ID) return; // Skip if no ID (new draft)

        log.info('=== ValidationService: before SAVE ===', { requestID: ID });

        try {
            // Get full request data with all child entities (from draft during SAVE)
            const requestData = await getFullRequestData(ID, this, true);

            // ===== CHANGE TRACKING: Capture old data for Change requests =====
            // Read from ACTIVE entity (before draft activation) to get OLD values
            if (requestData.requestType === 'Change') {
                log.info('=== Change Tracking: Capturing old data in before SAVE ===', { requestID: ID });
                const oldData = await getFullRequestData(ID, this, false); // Read from active entity
                req._changeTrackingOldData = oldData;
            }

            // Determine target status (Draft → New on activation)
            const targetStatus = requestData.status || 'New';
            const sourceSystem = requestData.sourceSystem || 'Salesforce';
            const entityType = requestData.entityType;
            const requestType = requestData.requestType || 'Create';

            // Initialize ValidationService
            const db = await cds.connect.to('db');
            const validationService = new ValidationService(db);

            // Run validation for target status
            const result = await validationService.validateRequest(
                requestData,
                targetStatus,
                sourceSystem,
                entityType,
                requestType
            );

            log.info('Validation result', {
                requestID: ID,
                isValid: result.isValid,
                errors: result.errors.length,
                warnings: result.warnings.length,
                rulesExecuted: result.totalRulesExecuted
            });

            // If validation fails with blocking errors, reject save
            const blockingErrors = result.errors.filter(e => e.blockSubmission);
            if (!result.isValid && blockingErrors.length > 0) {
                log.warn('Validation failed - blocking save', { requestID: ID, errors: blockingErrors });

                req.error(400, {
                    message: `Validation failed - please fix ${blockingErrors.length} error(s) before saving`,
                    '@Core.Messages': blockingErrors.map(e => ({
                        message: e.message,
                        code: e.ruleCode,
                        target: e.field,
                        severity: 'error'
                    }))
                });
            }

            // If warnings only, allow save but inform user
            if (result.warnings.length > 0) {
                log.info('Validation completed with warnings', { requestID: ID, warnings: result.warnings.length });

                result.warnings.forEach(w => {
                    req.info({
                        message: w.message,
                        code: w.ruleCode,
                        target: w.field
                    });
                });
            }

        } catch (error) {
            log.error('Error during validation', { requestID: ID, error: error.message, stack: error.stack });
            // Don't block save on validation service errors - fail open
        }
    });

    /**
     * After SAVE (draftActivate) - Track and save field-level changes for Change requests
     */
    this.after('SAVE', 'SalesforceRequests', async (result, req) => {
        const ID = req.data.ID;

        if (!ID || !req._changeTrackingOldData) return;

        log.info('=== Change Tracking: after SAVE ===', { requestID: ID });

        try {
            // Get new request data (after save) - read from active entity since draft is now activated
            const newData = await getFullRequestData(ID, this, false);

            // Track changes
            const changeTracker = new ChangeTracker();
            const userId = req.user?.id || 'system';
            const userDisplayName = req.user?.displayName || req.user?.id || 'System';

            const changeLogs = await changeTracker.trackChanges(
                ID,
                req._changeTrackingOldData,
                newData,
                userId,
                userDisplayName
            );

            // Save change logs to database
            if (changeLogs.length > 0) {
                await changeTracker.saveChangeLogs(changeLogs);
                log.info('Change logs saved', {
                    requestID: ID,
                    changeCount: changeLogs.length
                });
            } else {
                log.info('No changes detected', { requestID: ID });
            }

        } catch (error) {
            log.error('Error in change tracking after SAVE', {
                requestID: ID,
                error: error.message,
                stack: error.stack
            });
            // Don't block the response if change tracking fails
        }
    });

    // ================================
    // SUBMIT ACTION
    // ================================

    this.on('submit', SalesforceRequests, async (req) => {
        log.info('Submitting Salesforce request', { requestID: req.params[0].ID });
        const { ID } = req.params[0];

        // Validate with 'Submitted' status rules (strictest validation)
        try {
            const requestData = await getFullRequestData(ID, this);

            const db = await cds.connect.to('db');
            const validationService = new ValidationService(db);

            // Run validation with 'Submitted' status (includes section minimums)
            const result = await validationService.validateRequest(
                requestData,
                'Submitted', // Strictest validation
                requestData.sourceSystem || 'Salesforce',
                requestData.entityType,
                requestData.requestType || 'Create'
            );

            log.info('Submit validation result', {
                requestID: ID,
                isValid: result.isValid,
                errors: result.errors.length,
                warnings: result.warnings.length
            });

            // Block submission if validation fails
            if (!result.isValid) {
                log.warn('Submit validation failed', { requestID: ID, errors: result.errors });

                // For each error, add it as a message
                result.errors.forEach(e => {
                    // Construct proper target path based on entity
                    let target = e.field;

                    // Map entity names to navigation properties
                    const entityNavigationMap = {
                        'PartnerAddresses': 'addresses',
                        'PartnerEmails': 'emails',
                        'PartnerBanks': 'banks',
                        'PartnerVatIds': 'vatIds',
                        'SubAccounts': 'subAccounts'
                    };

                    // If error is for a child entity, prepend navigation property
                    if (e.entity && entityNavigationMap[e.entity]) {
                        const navigationProperty = entityNavigationMap[e.entity];

                        // Map field names to actual CDS property names
                        const fieldMap = {
                            'country': 'country_code',
                            'type': e.entity === 'PartnerAddresses' ? 'addressType_code' :
                                   e.entity === 'PartnerEmails' ? 'emailType_code' : 'type',
                            'bankCountry': 'bankCountry_code',
                            'vatType': 'vatType_code',
                            'contactType': 'contactType_code'
                        };

                        const actualFieldName = fieldMap[e.field] || e.field;
                        target = `${navigationProperty}/${actualFieldName}`;
                    }

                    req.error({
                        code: e.ruleCode,
                        message: e.message,
                        target: target,
                        status: 400
                    });
                });

                // Reject the request with summary message
                return req.reject(400, `Cannot submit - please fix ${result.errors.length} validation error(s)`);
            }

            // Submit the request
            await UPDATE(SalesforceRequests).set({ status: 'Submitted' }).where({ ID });

            log.info('Request submitted successfully', { requestID: ID });
            return 'Request submitted successfully';

        } catch (error) {
            log.error('Submit failed', { requestID: ID, error: error.message });
            req.error(500, `Submit failed: ${error.message}`);
        }
    });

    // ================================
    // DUPLICATE CHECK (Bound Action)
    // ================================

    const checkDuplicatesHandler = async (req) => {
        log.info('Checking for duplicates (Salesforce bound action)', { requestID: req.params[0].ID });
        const { ID } = req.params[0];

        try {
            // First try to check in draft entities (for unsaved requests)
            let duplicates;
            try {
                duplicates = await duplicateChecker.checkDuplicates(
                    ID,
                    this,
                    true, // Check draft first
                    'SalesforceService'
                );
                log.info('Duplicate check completed in draft mode', { requestID: ID, count: duplicates.length });
            } catch (draftError) {
                // If not found in draft, try active entities
                log.info('Request not found in draft, trying active entities', { requestID: ID });
                duplicates = await duplicateChecker.checkDuplicates(
                    ID,
                    this,
                    false, // Check active entities
                    'SalesforceService'
                );
                log.info('Duplicate check completed in active mode', { requestID: ID, count: duplicates.length });
            }

            if (duplicates.length === 0) {
                req.notify('No duplicates found');
            }

            return duplicates;

        } catch (error) {
            log.error('Duplicate check failed', { requestID: ID, error: error.message });
            return req.error(500, `Duplicate check failed: ${error.message}`);
        }
    };

    this.on('checkDuplicates', SalesforceRequests, checkDuplicatesHandler);
    this.on('checkDuplicates', 'SalesforceRequests.drafts', checkDuplicatesHandler);

    // ================================
    // DUPLICATE CHECK (Unbound Function)
    // ================================

    this.on('checkForDuplicates', async (req) => {
        log.info('Checking for duplicates (unbound function)', { requestID: req.data.requestID });
        const { requestID } = req.data;

        if (!requestID) {
            return req.error(400, 'requestID is required');
        }

        try {
            // First try to check in draft entities (for unsaved requests)
            let duplicates;
            try {
                duplicates = await duplicateChecker.checkDuplicates(
                    requestID,
                    this,
                    true, // Check draft first
                    'SalesforceService'
                );
                log.info('Duplicate check completed in draft mode', { requestID, count: duplicates.length });
            } catch (draftError) {
                // If not found in draft, try active entities
                log.info('Request not found in draft, trying active entities', { requestID });
                duplicates = await duplicateChecker.checkDuplicates(
                    requestID,
                    this,
                    false, // Check active entities
                    'SalesforceService'
                );
                log.info('Duplicate check completed in active mode', { requestID, count: duplicates.length });
            }

            return duplicates;

        } catch (error) {
            log.error('Duplicate check failed', { requestID, error: error.message });
            return req.error(500, `Duplicate check failed: ${error.message}`);
        }
    });

    // ================================
    // SAP PARTNER FUNCTIONS
    // ================================

    /**
     * Get SAP Partner Details
     */
    this.on('getSAPPartnerDetails', async (req) => {
        const { sapBpNumber } = req.data;
        log.info('Fetching SAP Partner Details', { sapBpNumber });

        try {
            const db = await cds.connect.to('db');
            const details = await sapPartnerService.getSAPPartnerDetails(sapBpNumber, db);
            return details;

        } catch (error) {
            log.error('Failed to fetch partner details', { sapBpNumber, error: error.message });
            req.error(500, `Failed to fetch details: ${error.message}`);
        }
    });

    /**
     * Import SAP Partner
     */
    this.on('importSAPPartner', async (req) => {
        const { sapBpNumber } = req.data;
        log.info('Importing SAP Partner', { sapBpNumber });

        try {
            const db = await cds.connect.to('db');
            const result = await sapPartnerService.importSAPPartner(sapBpNumber, 'Salesforce', db);
            return result;

        } catch (error) {
            log.error('Failed to import partner', { sapBpNumber, error: error.message });
            return JSON.stringify({
                success: false,
                message: error.message
            });
        }
    });

    /**
     * Create Change Request from SAP Partner (bypasses validation and draft mode)
     */
    this.on('createChangeRequestFromSAP', async (req) => {
        const { sapBpNumber } = req.data;
        log.info('Creating Change Request from SAP Partner', { sapBpNumber });

        try {
            const db = await cds.connect.to('db');

            // Import partner data
            const importResult = await sapPartnerService.importSAPPartner(sapBpNumber, 'Salesforce', db);
            const importData = JSON.parse(importResult);

            if (!importData.success) {
                throw new Error(importData.message);
            }

            // Create the request directly (no draft, no validation)
            const requestData = importData.data;

            // Generate request number
            const lastRequest = await SELECT.one.from('mdm.db.BusinessPartnerRequests')
                .where({ sourceSystem: 'Salesforce' })
                .orderBy('requestNumber desc');

            let nextNumber = 1;
            if (lastRequest && lastRequest.requestNumber) {
                const match = lastRequest.requestNumber.match(/SALESFORCE-(\d+)/);
                if (match) {
                    nextNumber = parseInt(match[1]) + 1;
                }
            }
            requestData.requestNumber = `SALESFORCE-${String(nextNumber).padStart(10, '0')}`;
            requestData.status = 'New'; // Not 'Draft'
            requestData.requestType = 'Change';

            // Insert directly into active entity (skip draft)
            const result = await INSERT.into('mdm.db.BusinessPartnerRequests').entries(requestData);
            const requestId = requestData.ID;

            log.info('Change Request created successfully', { requestId, requestNumber: requestData.requestNumber });

            return JSON.stringify({
                success: true,
                requestId: requestId,
                requestNumber: requestData.requestNumber,
                message: 'Change request created successfully'
            });

        } catch (error) {
            log.error('Failed to create change request', { sapBpNumber, error: error.message });
            return JSON.stringify({
                success: false,
                message: error.message
            });
        }
    });

    /**
     * Search SAP Partners
     */
    this.on('searchSAPPartners', async (req) => {
        const { partnerName, sapBpNumber, vatId, satelliteSystemId } = req.data;
        log.info('Searching SAP Partners', { criteria: req.data });

        try {
            const db = await cds.connect.to('db');
            const results = await sapPartnerService.searchSAPPartners(req.data, db);
            return results;

        } catch (error) {
            log.error('Partner search failed', { error: error.message });
            req.error(500, `Search failed: ${error.message}`);
        }
    });

    // ================================
    // VIRTUAL PROPERTIES
    // ================================

    const calculateVirtualProperties = async (data, isDraft) => {
        const records = Array.isArray(data) ? data : [data];

        // Fetch missing status if needed
        const missingStatusIds = records.filter(r => r.ID && !r.status).map(r => r.ID);
        if (missingStatusIds.length > 0) {
            log.debug('Fetching missing status for records', { count: missingStatusIds.length });
            const entity = isDraft ? 'SalesforceService.SalesforceRequests.drafts' : 'SalesforceService.SalesforceRequests';
            const statuses = await SELECT.from(entity).where({ ID: { in: missingStatusIds } }).columns('ID', 'status');
            const statusMap = new Map(statuses.map(s => [s.ID, s.status]));

            records.forEach(r => {
                if (!r.status && statusMap.has(r.ID)) {
                    r.status = statusMap.get(r.ID);
                }
            });
        }

        records.forEach(each => {
            // Submitted and Approved are read-only (under review or finalized)
            // Rejected should be editable so user can fix issues and resubmit
            // Completed and Error are read-only (final states)
            if (each.status === 'Submitted' || each.status === 'Approved' || each.status === 'Completed') {
                each.isEditable = false;
                each.isReadOnly = true;
                each.fieldControl = 1; // ReadOnly
                each.isSubmittable = false;
                each.isChildEditable = false;
            } else {
                // Editable statuses: Draft, New, Rejected, Error
                each.isEditable = true;
                each.isReadOnly = false;
                each.fieldControl = 3; // Editable
                each.isSubmittable = !isDraft && (each.status === 'New' || each.status === 'Rejected' || each.status === 'Error');
                // Child entities only editable when in draft/edit mode (user clicked Edit button)
                // NOT editable when viewing active entity even if status allows editing
                each.isChildEditable = isDraft;
            }
        });
    };

    // Force status to be selected and filter by sourceSystem
    this.before('READ', 'SalesforceRequests', (req) => {
        if (req.query.SELECT.columns && !req.query.SELECT.columns.find(c => c.ref && c.ref[0] === 'status')) {
            req.query.SELECT.columns.push({ ref: ['status'] });
        }
        // Filter by sourceSystem = 'Salesforce'
        if (req.query.SELECT && req.query.SELECT.where) {
            req.query.SELECT.where.push('and', { ref: ['sourceSystem'] }, '=', { val: 'Salesforce' });
        } else if (req.query.SELECT) {
            req.query.SELECT.where = [{ ref: ['sourceSystem'] }, '=', { val: 'Salesforce' }];
        }
    });
    this.before('READ', 'SalesforceRequests.drafts', (req) => {
        if (req.query.SELECT.columns && !req.query.SELECT.columns.find(c => c.ref && c.ref[0] === 'status')) {
            req.query.SELECT.columns.push({ ref: ['status'] });
        }
        // Filter by sourceSystem = 'Salesforce'
        if (req.query.SELECT && req.query.SELECT.where) {
            req.query.SELECT.where.push('and', { ref: ['sourceSystem'] }, '=', { val: 'Salesforce' });
        } else if (req.query.SELECT) {
            req.query.SELECT.where = [{ ref: ['sourceSystem'] }, '=', { val: 'Salesforce' }];
        }
    });

    this.after('READ', 'SalesforceRequests', (data) => calculateVirtualProperties(data, false));
    this.after('READ', 'SalesforceRequests.drafts', (data) => calculateVirtualProperties(data, true));

    // Set fieldControl for child entities based on parent request's isChildEditable
    const setChildFieldControl = async (childData, entityName, isDraft) => {
        const records = Array.isArray(childData) ? childData : [childData];
        if (records.length === 0) return;

        // Get unique request IDs from child records
        const requestIds = [...new Set(records.map(r => r.request_ID).filter(Boolean))];
        if (requestIds.length === 0) return;

        // Fetch parent requests with their isChildEditable flags
        const parentEntity = isDraft ? 'SalesforceService.SalesforceRequests.drafts' : 'SalesforceService.SalesforceRequests';
        const parents = await SELECT.from(parentEntity)
            .where({ ID: { in: requestIds } })
            .columns('ID', 'status', 'IsActiveEntity');

        // Calculate virtual properties for parents to get isChildEditable
        await calculateVirtualProperties(parents, isDraft);
        const parentMap = new Map(parents.map(p => [p.ID, p.isChildEditable !== false]));

        // Set fieldControl for each child record
        records.forEach(child => {
            if (child.request_ID) {
                const isEditable = parentMap.get(child.request_ID);
                child.fieldControl = isEditable ? 7 : 1; // 7 = Editable, 1 = ReadOnly
            }
        });
    };

    this.after('READ', 'PartnerAddresses', (data) => setChildFieldControl(data, 'PartnerAddresses', false));
    this.after('READ', 'PartnerAddresses.drafts', (data) => setChildFieldControl(data, 'PartnerAddresses', true));
    this.after('READ', 'PartnerBanks', (data) => setChildFieldControl(data, 'PartnerBanks', false));
    this.after('READ', 'PartnerBanks.drafts', (data) => setChildFieldControl(data, 'PartnerBanks', true));
    this.after('READ', 'PartnerEmails', (data) => setChildFieldControl(data, 'PartnerEmails', false));
    this.after('READ', 'PartnerEmails.drafts', (data) => setChildFieldControl(data, 'PartnerEmails', true));
    this.after('READ', 'PartnerVatIds', (data) => setChildFieldControl(data, 'PartnerVatIds', false));
    this.after('READ', 'PartnerVatIds.drafts', (data) => setChildFieldControl(data, 'PartnerVatIds', true));

    // ================================
    // IDENTIFICATION FIELD CONTROL - System-Specific
    // ================================
    // For identifications, apply multi-level field control:
    // 1. Check if parent request allows child editing
    // 2. Check if parent is a CHANGE request (vs CREATE)
    // 3. If CHANGE: Only SALESFORCE identifications are editable, others (COUPA, PI) are readonly
    // 4. If CREATE: All identifications editable (but dropdown only shows SALESFORCE anyway)
    const setIdentificationFieldControl = async (idData, isDraft) => {
        const records = Array.isArray(idData) ? idData : [idData];
        if (records.length === 0) return;

        // Get unique request IDs from identification records
        const requestIds = [...new Set(records.map(r => r.request_ID).filter(Boolean))];
        if (requestIds.length === 0) return;

        // Fetch parent requests with their isChildEditable flags and requestType
        const parentEntity = isDraft ? 'SalesforceService.SalesforceRequests.drafts' : 'SalesforceService.SalesforceRequests';
        const parents = await SELECT.from(parentEntity)
            .where({ ID: { in: requestIds } })
            .columns('ID', 'status', 'requestType', 'IsActiveEntity');

        // Calculate virtual properties for parents to get isChildEditable
        await calculateVirtualProperties(parents, isDraft);
        const parentMap = new Map(parents.map(p => [p.ID, {
            isEditable: p.isChildEditable !== false,
            requestType: p.requestType
        }]));

        // Set fieldControl for each identification record
        records.forEach(id => {
            if (id.request_ID) {
                const parent = parentMap.get(id.request_ID);
                if (!parent) return;

                if (!parent.isEditable) {
                    // Parent doesn't allow editing at all (e.g., Approved status)
                    id.fieldControl = 1; // ReadOnly
                } else if (parent.requestType === 'Change') {
                    // CHANGE requests: Only allow editing identifications owned by this system (SALESFORCE)
                    // If identificationType_code is empty/null, it's a new record being added - should be editable
                    if (!id.identificationType_code || id.identificationType_code === 'SALESFORCE') {
                        id.fieldControl = 7; // Editable (new record or owned by this system)
                    } else {
                        id.fieldControl = 1; // ReadOnly (owned by other system: COUPA, PI)
                    }
                } else {
                    // CREATE requests: All identifications editable (dropdown restricts to SALESFORCE only)
                    id.fieldControl = 7; // Editable
                }
            }
        });
    };

    this.after('READ', 'PartnerIdentifications', (data) => setIdentificationFieldControl(data, false));
    this.after('READ', 'PartnerIdentifications.drafts', (data) => setIdentificationFieldControl(data, true));

    // ================================
    // SUB-ACCOUNT DELETE CONTROL
    // ================================
    // For SubAccounts in CHANGE requests:
    // - Existing sub-accounts (with sapFICAContractAccount) cannot be deleted
    // - New sub-accounts (without sapFICAContractAccount) can be deleted
    // For CREATE requests: all sub-accounts can be deleted

    this.before('DELETE', ['SubAccounts', 'SubAccounts.drafts'], async (req) => {
        const { ID } = req.data;

        // Get the sub-account with its parent request
        const subAccount = await SELECT.one.from('SalesforceService.SubAccounts.drafts')
            .where({ ID })
            .columns('ID', 'sapFICAContractAccount', 'request_ID', 'subAccountId');

        if (!subAccount) {
            // Try active entity if draft not found
            const activeSubAccount = await SELECT.one.from('SalesforceService.SubAccounts')
                .where({ ID })
                .columns('ID', 'sapFICAContractAccount', 'request_ID', 'subAccountId');

            if (activeSubAccount) {
                Object.assign(subAccount || {}, activeSubAccount);
            }
        }

        if (!subAccount) {
            req.reject(404, `Sub-account not found`);
            return;
        }

        // Get parent request to check requestType
        const parentRequest = await SELECT.one.from('SalesforceService.SalesforceRequests.drafts')
            .where({ ID: subAccount.request_ID })
            .columns('ID', 'requestType');

        if (!parentRequest) {
            // Try active entity
            const activeParent = await SELECT.one.from('SalesforceService.SalesforceRequests')
                .where({ ID: subAccount.request_ID })
                .columns('ID', 'requestType');

            if (activeParent) {
                Object.assign(parentRequest || {}, activeParent);
            }
        }

        // Check if this is a CHANGE request with existing sub-account
        if (parentRequest && parentRequest.requestType === 'Change' && subAccount.sapFICAContractAccount) {
            req.reject(400, `Cannot delete existing sub-account ${subAccount.subAccountId}. Existing contract accounts from SAP cannot be removed.`);
        }
    });

    this.after('READ', 'SubAccounts', (data) => setChildFieldControl(data, 'SubAccounts', false));
    this.after('READ', 'SubAccounts.drafts', (data) => setChildFieldControl(data, 'SubAccounts', true));

    // ================================
    // AUTO-GENERATE ORDER INDEX FOR SUB-ACCOUNTS
    // ================================

    /**
     * Auto-generate orderIndex for sub-accounts to maintain creation order
     * This is used by Integration Suite webhook to match sub-accounts when updating IDs
     */
    this.before(['CREATE'], ['SubAccounts', 'SubAccounts.drafts'], async (req) => {
        if (req.data.request_ID) {
            const db = await cds.connect.to('db');
            const { SubAccounts } = db.entities('mdm.db');

            // Count existing sub-accounts for this request (including drafts)
            const existingCount = await SELECT.from(SubAccounts)
                .where({ request_ID: req.data.request_ID })
                .then(results => results.length);

            // Set orderIndex to the next sequence number (0-based)
            req.data.orderIndex = existingCount;

            log.info('Auto-generated orderIndex for new sub-account', {
                request_ID: req.data.request_ID,
                orderIndex: req.data.orderIndex,
                existingCount
            });
        }
    });

    // ================================
    // MAKE SAP IDs READONLY FOR CHANGE REQUESTS
    // ================================

    // Prevent editing SAP IDs - these are SAP-assigned system fields and should never be manually edited
    this.before(['CREATE', 'UPDATE', 'PATCH'], ['PartnerAddresses', 'PartnerBanks', 'PartnerEmails'], async (req) => {
        const entityName = req.target.name;
        let sapIdFields = [];

        if (entityName.includes('PartnerAddresses')) {
            sapIdFields = ['sapAddressId'];
        } else if (entityName.includes('PartnerBanks')) {
            sapIdFields = ['sapBankIdentification'];
        } else if (entityName.includes('PartnerEmails')) {
            sapIdFields = ['sapAddressId', 'sapOrdinalNumber'];
        }

        // Check if user is attempting to set any SAP ID field
        for (const sapIdField of sapIdFields) {
            if (req.data[sapIdField] !== undefined && req.data[sapIdField] !== null) {
                log.warn(`Attempt to modify SAP ID field: ${sapIdField}`, {
                    entityName,
                    value: req.data[sapIdField],
                    operation: req.event
                });
                req.error(403, `Cannot modify ${sapIdField}. This is a SAP-assigned system field and is managed automatically.`);
            }
        }
    });

    // Block editing of Submitted/Approved requests (but allow editing Rejected requests so they can be fixed and resubmitted)
    this.before('EDIT', 'SalesforceRequests', async (req) => {
        const { ID } = req.data;
        const record = await SELECT.one.from(SalesforceRequests).where({ ID }).columns('status');
        if (record && (record.status === 'Submitted' || record.status === 'Approved')) {
            req.reject(403, `Cannot edit request with status ${record.status}`);
        }
    });

    // ================================
    // HELPER FUNCTIONS
    // ================================

    /**
     * Get full request data with all child entities for validation
     * @param {String} requestID - Request UUID
     * @param {Object} service - Service context
     * @param {Boolean} isDraft - Whether to check draft entities (default: false)
     * @returns {Object} Complete request data with addresses, vatIds, subAccounts
     */
    async function getFullRequestData(requestID, service, isDraft = false) {
        const { SalesforceRequests } = service.entities;

        // Determine which entity to query
        const entityName = isDraft
            ? 'SalesforceService.SalesforceRequests.drafts'
            : SalesforceRequests;

        const request = await SELECT.one.from(entityName)
            .where({ ID: requestID })
            .columns(r => {
                r.ID,
                r.entityType,
                r.sourceSystem,
                r.requestType,
                r.partnerName,
                r.status,
                r.requestNumber,
                r.paymentTerms_code,
                r.paymentMethod_code,
                r.currency_code,
                r.addresses(a => {
                    a.ID,
                    a.country_code,
                    a.addressType_code,
                    a.street,
                    a.postalCode,
                    a.city,
                    a.name1
                }),
                r.vatIds(v => {
                    v.ID,
                    v.country_code,
                    v.vatNumber,
                    v.vatType_code
                }),
                r.identifications(i => {
                    i.ID,
                    i.identificationType_code,
                    i.identificationNumber,
                    i.country_code,
                    i.issuingAuthority,
                    i.validFrom,
                    i.validTo
                }),
                r.subAccounts(sa => {
                    sa.ID,
                    sa.subAccountId,
                    sa.address_ID,
                    sa.revenueStream_code,
                    sa.billingCycle_code,
                    sa.currency_code,
                    sa.paymentTerms_code,
                    sa.dunningStrategy_code,
                    sa.emails(e => {
                        e.ID,
                        e.emailAddress,
                        e.emailType_code,
                        e.contactType_code
                    }),
                    sa.banks(b => {
                        b.ID,
                        b.bankCountry_code,
                        b.iban,
                        b.accountNumber,
                        b.swiftCode,
                        b.bankName
                    })
                })
            });

        if (!request) {
            throw new Error(`Request not found: ${requestID}`);
        }

        // Ensure child arrays exist (even if empty)
        request.addresses = request.addresses || [];
        request.vatIds = request.vatIds || [];
        request.identifications = request.identifications || [];
        request.subAccounts = request.subAccounts || [];

        return request;
    }

    // ================================
    // WEBHOOK CALLBACKS
    // ================================

    /**
     * Webhook handler for CREATE request completion (called by Integration Suite)
     * Updates Salesforce Account ID, SAP BP Number, and sub-account IDs after creation
     */
    this.on('receiveCreateCallback', async (req) => {
        const { requestID, salesforceMainAccountID, sapBusinessPartnerNumber, subAccounts } = req.data;

        log.info('Received CREATE webhook callback', {
            requestID,
            salesforceMainAccountID,
            sapBusinessPartnerNumber,
            subAccountCount: subAccounts?.length || 0
        });

        try {
            // Find the request
            const request = await SELECT.one.from(SalesforceRequests).where({ requestNumber: requestID });

            if (!request) {
                log.error('Request not found for CREATE callback', { requestID });
                req.error(404, `Request not found: ${requestID}`);
                return;
            }

            // Update main request fields
            await UPDATE(SalesforceRequests)
                .set({
                    salesforceId: salesforceMainAccountID,
                    sapBpNumber: sapBusinessPartnerNumber
                })
                .where({ ID: request.ID });

            log.info('Updated main request', {
                requestID: request.ID,
                salesforceId: salesforceMainAccountID,
                sapBpNumber: sapBusinessPartnerNumber
            });

            // Create Salesforce identification entry in PartnerIdentifications
            const { PartnerIdentifications } = db.entities('mdm.db');
            await INSERT.into(PartnerIdentifications).entries({
                request_ID: request.ID,
                identificationType_code: 'SALESFORCE',
                identificationNumber: salesforceMainAccountID
            });

            log.info('Created Salesforce identification', {
                requestID: request.ID,
                salesforceAccountID: salesforceMainAccountID
            });

            // Update sub-accounts if provided
            if (subAccounts && subAccounts.length > 0) {
                for (const subAccountData of subAccounts) {
                    const { orderIndex, salesforceSubAccountID, sapFICAContractAccount } = subAccountData;

                    // Find sub-account by orderIndex
                    const { SubAccounts } = db.entities('mdm.db');
                    const subAccount = await SELECT.one.from(SubAccounts)
                        .where({ request_ID: request.ID, orderIndex: orderIndex });

                    if (!subAccount) {
                        log.warn('Sub-account not found for orderIndex', {
                            requestID,
                            orderIndex
                        });
                        continue;
                    }

                    // Update sub-account IDs
                    await UPDATE(SubAccounts)
                        .set({
                            subAccountId: salesforceSubAccountID,
                            sapFICAContractAccount: sapFICAContractAccount
                        })
                        .where({ ID: subAccount.ID });

                    log.info('Updated sub-account', {
                        subAccountID: subAccount.ID,
                        orderIndex,
                        salesforceSubAccountID,
                        sapFICAContractAccount
                    });
                }
            }

            log.info('CREATE callback completed successfully', { requestID });
            return `Success: Updated request ${requestID} with Salesforce and SAP details`;

        } catch (error) {
            log.error('Failed to process CREATE callback', {
                requestID,
                error: error.message,
                stack: error.stack
            });
            req.error(500, `Failed to process CREATE callback: ${error.message}`);
        }
    });

    /**
     * Webhook handler for UPDATE request completion (called by Integration Suite)
     * Updates only NEW sub-account IDs (existing sub-accounts remain unchanged)
     */
    this.on('receiveUpdateCallback', async (req) => {
        const { requestID, salesforceMainAccountID, sapBusinessPartnerNumber, subAccounts } = req.data;

        log.info('Received UPDATE webhook callback', {
            requestID,
            salesforceMainAccountID,
            sapBusinessPartnerNumber,
            subAccountCount: subAccounts?.length || 0
        });

        try {
            // Find the request
            const request = await SELECT.one.from(SalesforceRequests).where({ requestNumber: requestID });

            if (!request) {
                log.error('Request not found for UPDATE callback', { requestID });
                req.error(404, `Request not found: ${requestID}`);
                return;
            }

            log.info('Found request for UPDATE callback', {
                requestID: request.ID,
                existingSalesforceId: request.salesforceId,
                existingSapBpNumber: request.sapBpNumber
            });

            // Update ONLY NEW sub-accounts (by orderIndex)
            if (subAccounts && subAccounts.length > 0) {
                for (const subAccountData of subAccounts) {
                    const { orderIndex, salesforceSubAccountID, sapFICAContractAccount } = subAccountData;

                    // Find sub-account by orderIndex
                    const { SubAccounts } = db.entities('mdm.db');
                    const subAccount = await SELECT.one.from(SubAccounts)
                        .where({ request_ID: request.ID, orderIndex: orderIndex });

                    if (!subAccount) {
                        log.warn('Sub-account not found for orderIndex', {
                            requestID,
                            orderIndex
                        });
                        continue;
                    }

                    // Update sub-account IDs
                    await UPDATE(SubAccounts)
                        .set({
                            subAccountId: salesforceSubAccountID,
                            sapFICAContractAccount: sapFICAContractAccount
                        })
                        .where({ ID: subAccount.ID });

                    log.info('Updated new sub-account', {
                        subAccountID: subAccount.ID,
                        orderIndex,
                        salesforceSubAccountID,
                        sapFICAContractAccount
                    });
                }
            }

            log.info('UPDATE callback completed successfully', { requestID });
            return `Success: Updated request ${requestID} with new sub-account details`;

        } catch (error) {
            log.error('Failed to process UPDATE callback', {
                requestID,
                error: error.message,
                stack: error.stack
            });
            req.error(500, `Failed to process UPDATE callback: ${error.message}`);
        }
    });

    log.info('Salesforce Service initialization complete');
});
