const cds = require('@sap/cds');

// Import shared libraries
const duplicateChecker = require('./lib/shared/duplicate-checker');
const sapPartnerService = require('./lib/shared/sap-partner-service');
const ValidationService = require('./lib/validation-service');
const ChangeTracker = require('./lib/change-tracker');
const requestNumberGenerator = require('./utils/request-number-generator');

/**
 * Refactored PI Service Implementation
 * - Uses shared duplicate checker
 * - Uses shared SAP partner service
 * - Clean, maintainable code
 */
module.exports = cds.service.impl(async function () {
    const log = cds.log('coupa-service');
    const { PIRequests } = this.entities;

    log.info('PI Service initialized');

    // ================================
    // LOCALE FILTER FOR CODE LISTS
    // ================================
    // Filter code list entities by locale after query execution
    const codeListEntities = [
        'RequestTypes', 'SourceSystems', 'OverallStatuses', 'PaymentTerms', 'PaymentMethods',
        'AddressTypes', 'VatTypes', 'IdentificationTypes'
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
    // SUBMIT ACTION
    // ================================

    this.on('submit', PIRequests, async (req) => {
        log.info('Submitting PI request', { requestID: req.params[0].ID });
        const { ID } = req.params[0];

        // Validate with 'Submitted' status rules (strictest validation)
        try {
            const requestData = await getFullRequestData(ID, this);

            // Debug logging - DETAILED
            log.info('Request data for validation - DETAILED', {
                requestID: ID,
                entityType: requestData.entityType,
                sourceSystem: requestData.sourceSystem,
                requestType: requestData.requestType,
                addresses: requestData.addresses?.map(a => ({
                    country_code: a.country_code,
                    addressType_code: a.addressType_code,
                    street: a.street,
                    postalCode: a.postalCode
                })) || [],
                emails: requestData.emails?.map(e => ({
                    emailAddress: e.emailAddress,
                    emailType_code: e.emailType_code
                })) || [],
                banks: requestData.banks?.map(b => ({
                    bankCountry_code: b.bankCountry_code,
                    iban: b.iban,
                    accountNumber: b.accountNumber
                })) || [],
                vatIds: requestData.vatIds?.map(v => ({
                    country_code: v.country_code,
                    vatNumber: v.vatNumber
                })) || []
            });

            const db = await cds.connect.to('db');
            const validationService = new ValidationService(db);

            // Run validation with 'Submitted' status (includes section minimums)
            const result = await validationService.validateRequest(
                requestData,
                'Submitted', // Strictest validation
                requestData.sourceSystem || 'PI',
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
                        'PartnerVatIds': 'vatIds'
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
                            'vatType': 'vatType_code'
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
            await UPDATE(PIRequests).set({ status: 'Submitted' }).where({ ID });

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

    this.on('checkDuplicates', PIRequests, async (req) => {
        log.info('Checking for duplicates (PI bound action)', { requestID: req.params[0].ID });
        const { ID } = req.params[0];

        try {
            // First try to check in draft entities (for unsaved requests)
            let duplicates;
            try {
                duplicates = await duplicateChecker.checkDuplicates(
                    ID,
                    this,
                    true, // Check draft first
                    'PIService'
                );
                log.info('Duplicate check completed in draft mode', { requestID: ID, count: duplicates.length });
            } catch (draftError) {
                // If not found in draft, try active entities
                log.info('Request not found in draft, trying active entities', { requestID: ID });
                duplicates = await duplicateChecker.checkDuplicates(
                    ID,
                    this,
                    false, // Check active entities
                    'PIService'
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
    });

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
                    'PIService'
                );
                log.info('Duplicate check completed in draft mode', { requestID, count: duplicates.length });
            } catch (draftError) {
                // If not found in draft, try active entities
                log.info('Request not found in draft, trying active entities', { requestID });
                duplicates = await duplicateChecker.checkDuplicates(
                    requestID,
                    this,
                    false, // Check active entities
                    'PIService'
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
            const result = await sapPartnerService.importSAPPartner(sapBpNumber, 'PI', db);
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
     * Create Change Request from SAP Partner
     * Creates the request directly as an active entity (not a draft)
     * Returns request ID and number for popup navigation
     */
    this.on('createChangeRequestFromSAP', async (req) => {
        const { sapBpNumber } = req.data;
        log.info('Creating Change Request from SAP Partner', { sapBpNumber });

        try {
            const db = await cds.connect.to('db');
            const { v4: uuidv4 } = require('uuid');

            // Import partner data
            const importResult = await sapPartnerService.importSAPPartner(sapBpNumber, 'PI', db);
            const importData = JSON.parse(importResult);

            if (!importData.success) {
                throw new Error(importData.message);
            }

            // Create the request directly (no draft, no validation)
            const requestData = importData.data;
            requestData.ID = uuidv4();

            // Generate request number using unified generator
            requestData.requestNumber = await requestNumberGenerator.getNextNumber('COUPA', db);
            requestData.status = 'New'; // Not 'Draft'
            requestData.requestType = 'Change';

            // Insert directly into active entity (skip draft)
            await INSERT.into('mdm.db.BusinessPartnerRequests').entries(requestData);

            log.info('Change Request created successfully', {
                requestId: requestData.ID,
                requestNumber: requestData.requestNumber
            });

            return JSON.stringify({
                success: true,
                requestId: requestData.ID,
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
    // DRAFT INITIALIZATION
    // ================================

    this.before('NEW', 'PIRequests', async (req) => {
        req.data.sourceSystem = 'PI';
        req.data.status = 'Draft';
        if (!req.data.requestType) {
            req.data.requestType = 'Create';
        }
        if (!req.data.entityType) {
            req.data.entityType = 'Supplier';
        }
        req.data.isEditable = true;
        if (!req.data.piInternalNo) {
            req.data.piInternalNo = cds.utils.uuid();
        }

        // NOTE: Request Number generation removed from here to prevent duplicates.
        // It's now ONLY generated in the before('CREATE', 'PIRequests.drafts') handler
        // to ensure a single point of generation and avoid race conditions.
    });

    this.before('CREATE', 'PIRequests', async (req) => {
        // Set default values for draft-enabled entity (CDS @default doesn't always apply in UI5 draft)
        req.data.sourceSystem = 'PI';
        if (!req.data.requestType) req.data.requestType = 'Create';
        if (!req.data.entityType) req.data.entityType = 'Supplier';
        if (!req.data.status) req.data.status = 'Draft';

        // Ensure Request Number exists using unified generator
        if (!req.data.requestNumber) {
            const db = await cds.connect.to('db');
            req.data.requestNumber = await requestNumberGenerator.getNextNumber('PI', db);
        }
    });

    // CRITICAL FIX: For draft-enabled entities, explicitly handle draft creation
    this.before('CREATE', 'PIRequests.drafts', async (req) => {
        // Detect if this is a Change request (existingBpNumber is provided)
        const isChangeRequest = req.data.existingBpNumber ? true : false;
        const requestType = isChangeRequest ? 'Change' : 'Create';

        log.info('=== Creating NEW DRAFT PI request ===');
        log.info('Draft initialized', {
            requestType,
            existingBpNumber: req.data.existingBpNumber
        });

        // Set all defaults explicitly - this is critical for draft entities
        req.data.sourceSystem = 'PI';
        req.data.requestType = requestType;
        req.data.status = 'New';

        if (!req.data.piInternalNo) {
            req.data.piInternalNo = cds.utils.uuid();
        }

        // Generate Request Number using unified generator
        // Works consistently for both draft and active entities
        if (!req.data.requestNumber) {
            const db = await cds.connect.to('db');
            req.data.requestNumber = await requestNumberGenerator.getNextNumber('PI', db);
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
    this.before('UPDATE', 'PIRequests', async (req) => {
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

    /**
     * After UPDATE - Save change logs
     */
    this.after('UPDATE', 'PIRequests', async (result, req) => {
        const ID = req.data.ID;

        if (!ID || !req._changeTrackingOldData) return;

        log.info('=== Change Tracking: after UPDATE ===', { requestID: ID });

        try {
            // Get new request data (after update)
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
            }

        } catch (error) {
            log.error('Error in change tracking after UPDATE', {
                requestID: ID,
                error: error.message
            });
            // Don't block the response if change tracking fails
        }
    });

    // ================================
    // DYNAMIC VALIDATION WITH ValidationService
    // ================================

    /**
     * Before SAVE (draftActivate) - Validate using ValidationService AND Capture old data for change tracking
     * Uses database-driven validation rules for flexible, status-based validation
     */
    this.before('SAVE', 'PIRequests', async (req) => {
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
            const sourceSystem = requestData.sourceSystem || 'PI';
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
    this.after('SAVE', 'PIRequests', async (result, req) => {
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
    // VIRTUAL PROPERTIES
    // ================================

    const calculateVirtualProperties = async (data, isDraft) => {
        const records = Array.isArray(data) ? data : [data];

        // Fetch missing status if needed
        const missingStatusIds = records.filter(r => r.ID && !r.status).map(r => r.ID);
        if (missingStatusIds.length > 0) {
            log.debug('Fetching missing status for records', { count: missingStatusIds.length });
            const entity = isDraft ? 'PIService.PIRequests.drafts' : 'PIService.PIRequests';
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
                log.info(`Setting isChildEditable=${isDraft} for request ${each.ID} (status=${each.status}, isDraft=${isDraft})`);
            }
        });
    };

    // Force status to be selected and filter by sourceSystem
    this.before('READ', 'PIRequests', (req) => {
        if (req.query.SELECT.columns && !req.query.SELECT.columns.find(c => c.ref && c.ref[0] === 'status')) {
            req.query.SELECT.columns.push({ ref: ['status'] });
        }
        // Filter by sourceSystem = 'PI'
        if (req.query.SELECT && req.query.SELECT.where) {
            req.query.SELECT.where.push('and', { ref: ['sourceSystem'] }, '=', { val: 'PI' });
        } else if (req.query.SELECT) {
            req.query.SELECT.where = [{ ref: ['sourceSystem'] }, '=', { val: 'PI' }];
        }
    });
    this.before('READ', 'PIRequests.drafts', (req) => {
        if (req.query.SELECT.columns && !req.query.SELECT.columns.find(c => c.ref && c.ref[0] === 'status')) {
            req.query.SELECT.columns.push({ ref: ['status'] });
        }
        // Filter by sourceSystem = 'PI'
        if (req.query.SELECT && req.query.SELECT.where) {
            req.query.SELECT.where.push('and', { ref: ['sourceSystem'] }, '=', { val: 'PI' });
        } else if (req.query.SELECT) {
            req.query.SELECT.where = [{ ref: ['sourceSystem'] }, '=', { val: 'PI' }];
        }
    });

    this.after('READ', 'PIRequests', (data) => calculateVirtualProperties(data, false));
    this.after('READ', 'PIRequests.drafts', (data) => calculateVirtualProperties(data, true));

    // Set fieldControl for child entities based on parent request's isChildEditable
    const setChildFieldControl = async (childData, entityName, isDraft) => {
        const records = Array.isArray(childData) ? childData : [childData];
        if (records.length === 0) return;

        // Get unique request IDs from child records
        const requestIds = [...new Set(records.map(r => r.request_ID).filter(Boolean))];
        if (requestIds.length === 0) return;

        // Fetch parent requests with their isChildEditable flags
        const parentEntity = isDraft ? 'PIService.PIRequests.drafts' : 'PIService.PIRequests';
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
    // 3. If CHANGE: Only PI identifications are editable, others (COUPA, SALESFORCE) are readonly
    // 4. If CREATE: All identifications editable (but dropdown only shows PI anyway)
    const setIdentificationFieldControl = async (idData, isDraft) => {
        const records = Array.isArray(idData) ? idData : [idData];
        if (records.length === 0) return;

        // Get unique request IDs from identification records
        const requestIds = [...new Set(records.map(r => r.request_ID).filter(Boolean))];
        if (requestIds.length === 0) return;

        // Fetch parent requests with their isChildEditable flags and requestType
        const parentEntity = isDraft ? 'PIService.PIRequests.drafts' : 'PIService.PIRequests';
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
                    // CHANGE requests: Only allow editing identifications owned by this system (PI)
                    // If identificationType_code is empty/null, it's a new record being added - should be editable
                    if (!id.identificationType_code || id.identificationType_code === 'PI') {
                        id.fieldControl = 7; // Editable (new record or owned by this system)
                    } else {
                        id.fieldControl = 1; // ReadOnly (owned by other system: COUPA, SALESFORCE)
                    }
                } else {
                    // CREATE requests: All identifications editable (dropdown restricts to PI only)
                    id.fieldControl = 7; // Editable
                }
            }
        });
    };

    this.after('READ', 'PartnerIdentifications', (data) => setIdentificationFieldControl(data, false));
    this.after('READ', 'PartnerIdentifications.drafts', (data) => setIdentificationFieldControl(data, true));

    // ================================
    // MAKE SAP IDs READONLY FOR CHANGE REQUESTS
    // ================================

    // For Change requests, SAP ID fields should be readonly if they have values (existing records from SAP)
    const setSAPIDReadonly = async (childData, sapIdField, isDraft) => {
        const records = Array.isArray(childData) ? childData : [childData];
        if (records.length === 0) return;

        // Get unique request IDs
        const requestIds = [...new Set(records.map(r => r.request_ID).filter(Boolean))];
        if (requestIds.length === 0) return;

        // Fetch parent requests to check requestType
        const parentEntity = isDraft ? 'PIService.PIRequests.drafts' : 'PIService.PIRequests';
        const parents = await SELECT.from(parentEntity)
            .where({ ID: { in: requestIds } })
            .columns('ID', 'requestType');

        const changeRequestMap = new Map(parents.filter(p => p.requestType === 'Change').map(p => [p.ID, true]));

        // For each child record, if parent is Change request and SAP ID exists, make it readonly
        records.forEach(child => {
            if (child.request_ID && changeRequestMap.has(child.request_ID)) {
                // This is a Change request
                if (child[sapIdField]) {
                    // SAP ID exists, make it readonly
                    if (!child.sapIdReadonly) child.sapIdReadonly = {};
                    child.sapIdReadonly[sapIdField] = true;
                }
            }
        });
    };

    this.after('READ', 'PartnerAddresses', (data) => setSAPIDReadonly(data, 'sapAddressId', false));
    this.after('READ', 'PartnerAddresses.drafts', (data) => setSAPIDReadonly(data, 'sapAddressId', true));
    this.after('READ', 'PartnerBanks', (data) => setSAPIDReadonly(data, 'sapBankIdentification', false));
    this.after('READ', 'PartnerBanks.drafts', (data) => setSAPIDReadonly(data, 'sapBankIdentification', true));
    this.after('READ', 'PartnerEmails', (data) => setSAPIDReadonly(data, 'sapAddressId', false));
    this.after('READ', 'PartnerEmails.drafts', (data) => setSAPIDReadonly(data, 'sapAddressId', true));

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

    // ================================
    // DUPLICATE CHECK FOR IDENTIFICATIONS
    // ================================

    // Prevent duplicate identifications (same type + number for same request)
    this.before(['CREATE', 'UPDATE'], 'PartnerIdentifications', async (req) => {
        let { identificationType_code, identificationNumber, request_ID, ID } = req.data;

        // For UPDATE operations, get the current record to merge with changes
        if (req.event === 'UPDATE' && ID) {
            const currentRecord = await SELECT.one.from('PIService.PartnerIdentifications.drafts')
                .where({ ID })
                .columns('identificationType_code', 'identificationNumber', 'request_ID');

            if (currentRecord) {
                // Merge current record with updates
                identificationType_code = identificationType_code || currentRecord.identificationType_code;
                identificationNumber = identificationNumber || currentRecord.identificationNumber;
                request_ID = request_ID || currentRecord.request_ID;
            }
        }

        // Skip validation if required fields still missing
        if (!identificationType_code || !identificationNumber || !request_ID) {
            return;
        }

        // Check for duplicates in draft entities
        const existingInDraft = await SELECT.one.from('PIService.PartnerIdentifications.drafts')
            .where({
                request_ID: request_ID,
                identificationType_code: identificationType_code,
                identificationNumber: identificationNumber
            });

        // For UPDATE, allow if it's the same record
        if (existingInDraft && ID !== existingInDraft.ID) {
            req.error(400, `Duplicate identification: ${identificationType_code} with number ${identificationNumber} already exists for this request`);
        }
    });

    // Block editing of Submitted/Approved requests (but allow editing Rejected requests so they can be fixed and resubmitted)
    this.before('EDIT', 'PIRequests', async (req) => {
        const { ID } = req.data;
        const record = await SELECT.one.from(PIRequests).where({ ID }).columns('status');
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
     * @returns {Object} Complete request data with addresses, emails, banks, vatIds
     */
    async function getFullRequestData(requestID, service, isDraft = false) {
        const { PIRequests } = service.entities;

        // Determine which entity to query
        const entityName = isDraft
            ? 'PIService.PIRequests.drafts'
            : PIRequests;

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
                r.emails(e => {
                    e.ID,
                    e.emailAddress,
                    e.emailType_code
                }),
                r.banks(b => {
                    b.ID,
                    b.bankCountry_code,
                    b.iban,
                    b.accountNumber,
                    b.swiftCode,
                    b.bankName
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
                })
            });

        if (!request) {
            throw new Error(`Request not found: ${requestID}`);
        }

        // Ensure child arrays exist (even if empty)
        request.addresses = request.addresses || [];
        request.emails = request.emails || [];
        request.banks = request.banks || [];
        request.vatIds = request.vatIds || [];
        request.identifications = request.identifications || [];

        return request;
    }

    log.info('PI Service initialization complete');
});
