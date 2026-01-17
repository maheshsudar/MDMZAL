const cds = require('@sap/cds');
const { v4: uuidv4 } = require('uuid');

// Import shared libraries
const duplicateChecker = require('./lib/shared/duplicate-checker');
const ErrorHandler = require('./lib/error-handler');
const InputValidator = require('./lib/input-validator');
const NotificationService = require('./lib/notification-service');
const enhancedAEBService = require('./lib/enhanced-aeb-service');
const VIESService = require('./lib/vies-service');
const ValidationService = require('./lib/validation-service');
const requestNumberGenerator = require('./utils/request-number-generator');

// Import modular handlers
const mdmHandlers = require('./mdm-service/index');

/**
 * Refactored MDM Service Implementation
 * - Uses modular handlers for duplicate check, VIES, AEB, approval, and status updates
 * - Maintains submit handler and before/after hooks
 * - Dynamically handles Coupa and Salesforce requests for approval
 * - All fields read-only except approver comments
 */
module.exports = cds.service.impl(async function () {
  const log = cds.log('mdm-service');

  const {
    MDMApprovalRequests,
    DuplicateChecks,
    PartnerAddresses,
    PartnerVatIds,
    PartnerEmails,
    PartnerBanks,
    ApprovalHistory,
    StatusTransitions
  } = this.entities;

  // Initialize notification service for submit handler
  const notificationService = new NotificationService();

  log.info('MDM Service initialized');

  // ================================
  // REGISTER MODULAR HANDLERS
  // ================================

  // Register all modular handlers (duplicate check, VIES, AEB, approval, status updates)
  mdmHandlers.registerAll(this, this.entities, log);

  // ================================
  // SUBMIT FOR APPROVAL
  // ================================

  /**
   * Submit request for approval
   */
  this.on('submit', MDMApprovalRequests, async (req) => {
    log.info('Submitting request', { requestID: req.params[0].ID });
    const { ID } = req.params[0];

    try {
      const request = await SELECT.one.from(MDMApprovalRequests).where({ ID });

      if (!request) {
        throw ErrorHandler.notFoundError('BusinessPartnerRequest', ID);
      }

      if (request.status !== 'New' && request.status !== 'Draft') {
        throw ErrorHandler.createError(
          ErrorHandler.ERROR_CODES.INVALID_STATUS_TRANSITION,
          `Cannot submit request with status ${request.status}. Only New or Draft requests can be submitted.`,
          'submit'
        );
      }

      // Validate using ValidationService (database-driven rules)
      const db = await cds.connect.to('db');
      const validationService = new ValidationService(db);

      // Get full request data with child entities
      const requestData = await getFullRequestData(ID, MDMApprovalRequests);

      // Run validation with 'Submitted' status (strictest validation)
      const validationResult = await validationService.validateRequest(
        requestData,
        'Submitted',
        requestData.sourceSystem || 'Manual',
        requestData.entityType,
        requestData.requestType || 'Create'
      );

      log.info('Submit validation result', {
        requestID: ID,
        isValid: validationResult.isValid,
        errors: validationResult.errors.length,
        warnings: validationResult.warnings.length,
        rulesExecuted: validationResult.totalRulesExecuted
      });

      // Block submission if validation fails
      if (!validationResult.isValid) {
        log.warn('Submit validation failed', { requestID: ID, errors: validationResult.errors });

        throw ErrorHandler.createError(
          ErrorHandler.ERROR_CODES.VALIDATION_FAILED,
          `Cannot submit - please fix ${validationResult.errors.length} validation error(s): ${validationResult.errors.map(e => e.message).join('; ')}`,
          'submit'
        );
      }

      // Update status
      await UPDATE(MDMApprovalRequests).set({
        status: 'Submitted',
        statusCriticality: 2 // Warning (pending approval)
      }).where({ ID });

      // Create approval history entry
      await createApprovalHistoryEntry(
        ID,
        'Submit',
        request.status,
        'Submitted',
        'Request submitted for approval',
        req.user.id
      );

      // Send notifications
      await notificationService.sendStatusChangeNotification(
        { ...request, status: 'Submitted' },
        'submitted',
        { userId: req.user.id, userDisplayName: req.user.displayName }
      );

      log.info('Request submitted successfully', { requestID: ID, requestNumber: request.requestNumber });

      return `Request ${request.requestNumber} submitted successfully. The MDM team will review and perform compliance checks.`;

    } catch (error) {
      log.error('Submit failed', { requestID: ID, error: error.message });
      throw error;
    }
  });

  // ================================
  // BEFORE/AFTER HANDLERS
  // ================================

  /**
   * Before CREATE - Set initial values
   */
  this.before('CREATE', MDMApprovalRequests, async (req) => {
    const { data } = req;

    try {
      // Get database connection
      const db = await cds.connect.to('db');

      // Handle AdhocSync request type
      if (data.requestType === 'AdhocSync') {
        log.info('Creating AdhocSync request', { sapBpNumber: data.sapBpNumber });

        // Validate required fields for AdhocSync
        if (!data.sapBpNumber) {
          throw ErrorHandler.createError(
            ErrorHandler.ERROR_CODES.VALIDATION_ERROR,
            'SAP Business Partner Number is required for AdhocSync',
            'create_adhoc_sync'
          );
        }
        if (!data.targetSystem) {
          throw ErrorHandler.createError(
            ErrorHandler.ERROR_CODES.VALIDATION_ERROR,
            'Target System is required for AdhocSync',
            'create_adhoc_sync'
          );
        }
        if (!data.adhocReason) {
          throw ErrorHandler.createError(
            ErrorHandler.ERROR_CODES.VALIDATION_ERROR,
            'Reason is required for AdhocSync',
            'create_adhoc_sync'
          );
        }

        // Generate ADHOC-XXXX request number
        data.requestNumber = await requestNumberGenerator.getNextNumber('ADHOC', db);

        // Set sourceSystem = targetSystem (for satellite filtering)
        data.sourceSystem = data.targetSystem;

        // Set status directly to Submitted (no draft for adhoc sync)
        data.status = 'Submitted';
        data.statusCriticality = 2; // Neutral

        log.info('AdhocSync request validated', {
          requestNumber: data.requestNumber,
          targetSystem: data.targetSystem
        });

      } else {
        // Standard Create/Change request handling
        // Generate request number using unified generator
        data.requestNumber = await requestNumberGenerator.getNextNumber('MDM', db);

        // Set initial status
        if (!data.status) data.status = 'New';
        data.statusCriticality = 2; // Neutral
      }

      // Set requester information
      if (req.user) {
        data.requesterId = req.user.id;
        data.requesterName = req.user.displayName || req.user.id;
        data.requesterEmail = req.user.email;
      }

      log.info('Creating new MDM request', {
        requestNumber: data.requestNumber,
        requestType: data.requestType
      });

    } catch (error) {
      log.error('Error during request creation', { error: error.message });
      throw error;
    }
  });

  /**
   * After CREATE - Create approval history entry
   */
  this.after('CREATE', MDMApprovalRequests, async (result, req) => {
    try {
      await createApprovalHistoryEntry(
        result.ID,
        'Create',
        null,
        'New',
        'Request created'
      );

      await notificationService.sendStatusChangeNotification(result, 'created', {
        userId: req.user?.id,
        userDisplayName: req.user?.displayName
      });

      log.info('Request created successfully', { requestNumber: result.requestNumber });

    } catch (error) {
      log.error('Error in after CREATE handler', { error: error.message });
    }
  });

  /**
   * Before UPDATE - Only allow updating approverComments field
   * All other fields are read-only in MDM approval view
   */
  this.before('UPDATE', MDMApprovalRequests, async (req) => {
    const updateData = req.data;
    const allowedFields = ['approverComments']; // Only this field can be updated

    // Get list of fields being updated
    const updatingFields = Object.keys(updateData).filter(key =>
      !key.startsWith('_') && // Exclude internal fields
      key !== 'ID' && // Exclude ID
      key !== 'modifiedAt' && // Exclude managed fields
      key !== 'modifiedBy' &&
      updateData[key] !== undefined
    );

    // Check if any non-allowed fields are being updated
    const unauthorizedFields = updatingFields.filter(field => !allowedFields.includes(field));

    if (unauthorizedFields.length > 0) {
      log.warn('Attempt to update read-only fields', {
        fields: unauthorizedFields,
        user: req.user?.id
      });

      // Remove unauthorized fields from update
      unauthorizedFields.forEach(field => {
        delete updateData[field];
      });
    }

    // Log the update
    if (updateData.approverComments) {
      log.info('Updating approver comments', {
        requestID: updateData.ID,
        user: req.user?.id
      });
    }
  });

  /**
   * Before READ - Filter out 'New' status requests (MDM app only shows Submitted onwards)
   */
  this.before('READ', MDMApprovalRequests, async (req) => {
    // Only apply filter for list reads (not single entity reads by ID)
    if (!req.query.SELECT.from.ref || req.query.SELECT.from.ref.length === 1) {
      const where = req.query.SELECT.where || [];
      // Add filter to exclude 'New' status - need to add 'and' operator if where already exists
      if (where.length > 0) {
        req.query.SELECT.where = [...where, 'and', { ref: ['status'] }, '!=', { val: 'New' }];
      } else {
        req.query.SELECT.where = [{ ref: ['status'] }, '!=', { val: 'New' }];
      }
    }
  });

  /**
   * After READ - Calculate virtual properties for dynamic Coupa/SF viewing
   * Applied to both active and draft entities
   */
  this.after(['READ', 'EDIT'], MDMApprovalRequests, async (results) => {
    if (!results) return;
    const requests = Array.isArray(results) ? results : [results];

    requests.forEach(req => {
      // All fields are read-only in MDM approval view except approver comments
      req.isEditable = false;
      req.fieldControl = 1; // ReadOnly for all fields

      // Child entities are NEVER editable in MDM (approval view is read-only)
      req.isChildEditable = false;

      // Only approver comments field is editable
      req.isApproverCommentsEditable = req.user?.is('MDMApprover');

      // ALWAYS calculate AEB status criticality (even if null/undefined)
      // This ensures the virtual field is always present in the response
      req.aebStatusCriticality = req.aebStatus ? calculateStatusCriticality(req.aebStatus) : 0;

      // ALWAYS calculate VIES status criticality (even if null/undefined)
      // This ensures the virtual field is always present in the response
      req.viesStatusCriticality = req.viesStatus ? calculateStatusCriticality(req.viesStatus) : 0;

      // Calculate SubAccount section visibility (hide for non-Salesforce requests)
      req.hideSubAccountSection = req.sourceSystem !== 'Salesforce';
    });
  });

  // ================================
  // GET BP DETAILS FUNCTION
  // ================================

  /**
   * Get BP details by BP number for popup display
   * CAP Best Practice: Handler for unbound function with parameter extraction from req.data
   */
  this.on('getBPDetails', async (req) => {
    // Extract parameter - OData V4 Context Binding with setParameter() passes params in req.data
    const bpNumber = req.data.bpNumber;

    log.info('getBPDetails called', { bpNumber });

    try {
      const db = await cds.connect.to('db');
      const { ExistingPartners } = db.entities('mdm.db');

      // Get partner details
      const partner = await SELECT.one.from(ExistingPartners).where({ sapBpNumber: bpNumber });

      if (!partner) {
        log.warn('BP not found', { bpNumber });
        return {
          sapBpNumber: bpNumber,
          partnerName: 'Not Found',
          partnerRole: 'N/A',
          status: 'N/A',
          satelliteSystemId: 'N/A',
          addresses: [],
          taxNumbers: [],
          bankAccounts: [],
          contacts: {
            email: '',
            phone: '',
            fax: ''
          }
        };
      }

      // Parse JSON fields - use correct field names from entity
      const allAddresses = partner.allAddresses ? JSON.parse(partner.allAddresses) : [];
      const allVatIds = partner.allVatIds ? JSON.parse(partner.allVatIds) : [];

      // Add established address if available
      const addresses = [...allAddresses];
      if (partner.establishedAddress && !addresses.length) {
        // Parse established address as single address
        addresses.push({
          street: partner.establishedAddress,
          city: '',
          postalCode: '',
          country: partner.establishedCountry || ''
        });
      }

      // Add established VAT ID if available
      const vatIds = [...allVatIds];
      if (partner.establishedVatId && !vatIds.length) {
        vatIds.push({
          country: partner.establishedCountry || '',
          vatNumber: partner.establishedVatId,
          isEstablished: true
        });
      }

      log.info('BP details retrieved', { bpNumber, partnerName: partner.partnerName });

      // Build addresses with addressType (matching Coupa/Salesforce format)
      const formattedAddresses = addresses.map(a => ({
        addressType: a.addressType || 'Business',
        street: a.street || '',
        city: a.city || '',
        postalCode: a.postalCode || '',
        country: a.country || ''
      }));

      // Build taxNumbers from vatIds (matching Coupa/Salesforce format)
      const taxNumbers = vatIds.map(v => ({
        country: v.country || '',
        taxType: 'VAT',
        taxNumber: v.vatNumber || ''
      }));

      // Build bankAccounts with mock data (matching Coupa/Salesforce format)
      const bankAccounts = [];
      if (partner.establishedCountry) {
        bankAccounts.push({
          bankName: 'Demo Bank ' + partner.establishedCountry,
          bankCountry: partner.establishedCountry,
          iban: partner.establishedCountry + '99' + partner.sapBpNumber + '00',
          accountNumber: partner.sapBpNumber,
          swiftCode: 'DEMO' + partner.establishedCountry + '22'
        });
      }

      // Build contacts object (matching Coupa/Salesforce format)
      const contacts = {
        email: 'info@' + partner.partnerName.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '') + '.com',
        phone: '+1 555 0100',
        fax: ''
      };

      // Return data structure matching Coupa/Salesforce format
      return {
        sapBpNumber: partner.sapBpNumber,
        partnerName: partner.partnerName,
        partnerRole: partner.partnerType || 'Supplier',
        status: partner.status || 'Active',
        satelliteSystemId: partner.sourceSystem || 'S4HANA',
        addresses: formattedAddresses,
        taxNumbers: taxNumbers,
        bankAccounts: bankAccounts,
        contacts: contacts
      };

    } catch (error) {
      log.error('Error getting BP details', { bpNumber, error: error.message });
      throw ErrorHandler.createError(
        ErrorHandler.ERROR_CODES.INTERNAL_SERVER_ERROR,
        `Failed to get BP details: ${error.message}`,
        'getBPDetails'
      );
    }
  });

  // ================================
  // GET SAP PARTNER DETAILS
  // ================================

  /**
   * Get comprehensive SAP Partner details for popup display
   * CAP Best Practice: Unbound function handler using shared service library
   */
  this.on('getSAPPartnerDetails', async (req) => {
    // Extract parameter - OData V4 Context Binding with setParameter() passes params in req.data
    const { sapBpNumber } = req.data;

    log.info('getSAPPartnerDetails called', { sapBpNumber });

    try {
      // Get database connection
      const db = await cds.connect.to('db');

      // Use shared service library for consistent implementation across all services
      const sapPartnerService = require('./lib/shared/sap-partner-service');
      const details = await sapPartnerService.getSAPPartnerDetails(sapBpNumber, db);

      log.info('getSAPPartnerDetails completed', { sapBpNumber, hasResult: !!details });
      return details;

    } catch (error) {
      log.error('getSAPPartnerDetails error', { sapBpNumber, error: error.message });
      req.error(500, `Failed to fetch partner details: ${error.message}`);
    }
  });

  // ================================
  // VALIDATE AND FETCH SAP BP (ADHOC SYNC)
  // ================================

  /**
   * Validate SAP BP exists and fetch full data for AdhocSync request creation
   * CAP Best Practice: Unbound function handler using shared service library
   */
  this.on('validateAndFetchSAPBP', async (req) => {
    const { sapBpNumber } = req.data;

    log.info('validateAndFetchSAPBP called', { sapBpNumber });

    try {
      // Get database connection
      const db = await cds.connect.to('db');

      // Use shared service library to fetch SAP partner details
      const sapPartnerService = require('./lib/shared/sap-partner-service');
      const details = await sapPartnerService.getSAPPartnerDetails(sapBpNumber, db);

      if (!details || !details.bpNumber) {
        log.warn('SAP BP not found', { sapBpNumber });
        return {
          isValid: false,
          errorMessage: `Business Partner ${sapBpNumber} not found in SAP`
        };
      }

      // Return validated data with all BP details
      log.info('SAP BP validated successfully', { sapBpNumber, bpName: details.bpName });
      return {
        isValid: true,
        bpNumber: details.bpNumber,
        bpName: details.bpName,
        bpType: details.bpType,
        addresses: details.addresses || [],
        banks: details.banks || [],
        vatIds: details.vatIds || [],
        emails: details.emails || [],
        identifications: details.identifications || [],
        errorMessage: null
      };

    } catch (error) {
      log.error('validateAndFetchSAPBP error', { sapBpNumber, error: error.message });
      return {
        isValid: false,
        errorMessage: `Failed to validate SAP BP: ${error.message}`
      };
    }
  });

  // ================================
  // CREATE ADHOC SYNC REQUEST ACTION
  // ================================

  /**
   * Create AdhocSync request action
   */
  this.on('createAdhocSyncRequest', async (req) => {
    const { sapBpNumber, existingBpName, targetSystem, adhocReason } = req.data;

    log.info('createAdhocSyncRequest called', { sapBpNumber, targetSystem });

    try {
      // Get database connection
      const db = await cds.connect.to('db');
      const { BusinessPartnerRequests } = db.entities('mdm.db');

      // Generate ADHOC-XXXX request number
      const requestNumber = await requestNumberGenerator.getNextNumber('ADHOC', db);

      // Create the AdhocSync request with explicit ID
      const requestId = cds.utils.uuid();
      await INSERT.into(BusinessPartnerRequests).entries({
        ID: requestId,
        requestType: 'AdhocSync',
        requestNumber,
        sapBpNumber,
        existingBpName,
        name1: existingBpName,
        partnerName: existingBpName,
        sourceSystem: targetSystem,  // Set sourceSystem = targetSystem for filtering
        targetSystem,
        adhocReason,
        status: 'Submitted',
        statusCriticality: 2,
        requesterId: req.user?.id || 'anonymous',
        requesterName: req.user?.displayName || req.user?.id || 'Anonymous User',
        requesterEmail: req.user?.email
      });

      // Create approval history entry
      await createApprovalHistoryEntry(
        requestId,
        'Create',
        null,
        'Submitted',
        'Adhoc Sync request created'
      );

      // Return the created request
      const result = await SELECT.one.from(MDMApprovalRequests).where({ ID: requestId });

      log.info('AdhocSync request created successfully', { requestNumber, ID: requestId });

      return result;

    } catch (error) {
      log.error('createAdhocSyncRequest error', { error: error.message });
      throw error;
    }
  });

  // ================================
  // GET SUB ACCOUNT DETAILS
  // ================================

  /**
   * Get SubAccount details for popup display
   * CAP Best Practice: Handler for unbound function with parameter extraction from req.data
   */
  this.on('getSubAccountDetails', async (req) => {
    // Extract parameters - OData V4 Context Binding with setParameter() passes params in req.data
    const subAccountId = req.data.subAccountId;
    const requestId = req.data.requestId;

    log.info('getSubAccountDetails called', { subAccountId, requestId });

    try {
      const db = await cds.connect.to('db');
      const { SubAccounts, SubAccountBanks, SubAccountEmails } = db.entities('mdm.db');

      // Find the sub account by subAccountId and request ID
      const subAccount = await SELECT.one.from(SubAccounts)
        .where({ subAccountId, request_ID: requestId });

      if (!subAccount) {
        log.warn('SubAccount not found', { subAccountId, requestId });
        return {
          subAccountId,
          revenueStream: 'Not Found',
          billingCycle: 'N/A',
          currency: 'N/A',
          paymentTerms: 'N/A',
          dunningProcedure: 'N/A',
          banks: [],
          emails: []
        };
      }

      // Get banks for this sub account
      const banks = await SELECT.from(SubAccountBanks)
        .where({ subAccount_ID: subAccount.ID });

      // Get emails for this sub account
      const emails = await SELECT.from(SubAccountEmails)
        .where({ subAccount_ID: subAccount.ID });

      log.info('SubAccount details retrieved', {
        subAccountId,
        banksCount: banks.length,
        emailsCount: emails.length
      });

      return {
        subAccountId: subAccount.subAccountId,
        revenueStream: subAccount.revenueStream_code || 'N/A',
        billingCycle: subAccount.billingCycle_code || 'N/A',
        currency: subAccount.currency_code || 'N/A',
        paymentTerms: subAccount.paymentTerms_code || 'N/A',
        dunningProcedure: subAccount.dunningProcedure_code || 'N/A',
        banks: banks.map(b => ({
          bankCountry: b.bankCountry_code || '',
          bankKey: b.bankKey || '',
          bankName: b.bankName || '',
          accountHolder: b.accountHolder || '',
          accountNumber: b.accountNumber || '',
          iban: b.iban || '',
          swiftCode: b.swiftCode || '',
          currency: b.currency_code || '',
          isDefault: b.isDefault || false
        })),
        emails: emails.map(e => ({
          emailType: e.emailType_code || '',
          contactType: e.contactType_code || '',
          emailAddress: e.emailAddress || ''
        }))
      };
    } catch (error) {
      log.error('Error getting SubAccount details', { subAccountId, requestId, error: error.message });
      throw ErrorHandler.createError(
        ErrorHandler.ERROR_CODES.INTERNAL_SERVER_ERROR,
        `Failed to get SubAccount details: ${error.message}`,
        'getSubAccountDetails'
      );
    }
  });

  // ================================
  // HELPER FUNCTIONS
  // ================================

  /**
   * Create approval history entry
   */
  async function createApprovalHistoryEntry(requestId, action, previousStatus, newStatus, comments, userId = 'system') {
    await INSERT.into(ApprovalHistory).entries({
      ID: uuidv4(),
      request_ID: requestId,
      action,
      previousStatus,
      newStatus,
      comments,
      approverUserId: userId,
      approverName: userId,
      createdAt: new Date().toISOString(),
      createdBy: userId
    });
  }

  /**
   * Calculate criticality for AEB and VIES status
   * Criticality values: 0=None(Grey), 1=Success(Green), 2=Warning(Orange), 3=Error(Red)
   * Note: Controller sets inverted=false, so use normal criticality values
   */
  function calculateStatusCriticality(status) {
    if (!status || status === 'NotChecked' || status === 'N/A') return 0; // None (Grey)

    // AEB Status
    if (status === 'Blocked') return 3; // Error (Red)
    if (status === 'Fail') return 3; // Error (Red)
    if (status === 'Warning') return 2; // Warning (Orange)
    if (status === 'Pass') return 1; // Success (Green)

    // VIES Status
    if (status === 'Valid') return 1; // Success (Green)
    if (status === 'Invalid') return 3; // Error (Red)
    if (status === 'Error') return 3; // Error (Red)
    if (status === 'Partial') return 2; // Warning (Orange)

    return 0; // None (Grey) for unknown statuses
  }

  /**
   * Get full request data with all child entities for validation
   * @param {String} requestID - Request UUID
   * @param {Object} entityRef - Entity reference (MDMApprovalRequests)
   * @returns {Object} Complete request data with addresses, emails, banks, vatIds
   */
  async function getFullRequestData(requestID, entityRef) {
    const request = await SELECT.one.from(entityRef)
      .where({ ID: requestID })
      .columns(r => {
        r('*'),
        r.addresses(a => a('*')),
        r.emails(e => e('*')),
        r.banks(b => b('*')),
        r.vatIds(v => v('*'))
      });

    if (!request) {
      throw new Error(`Request not found: ${requestID}`);
    }

    // Ensure child arrays exist (even if empty)
    request.addresses = request.addresses || [];
    request.emails = request.emails || [];
    request.banks = request.banks || [];
    request.vatIds = request.vatIds || [];

    return request;
  }

  /**
   * Integration Suite callback function to update SAP BP Number and Satellite System ID
   * Called after successful SAP integration
   */
  this.on('updateIntegrationData', async (req) => {
    const { requestId, sapBpNumber, satelliteSystemId } = req.data;

    log.info('updateIntegrationData called', { requestId, sapBpNumber, satelliteSystemId });

    const result = {
      success: false,
      requestId,
      sapBpNumberUpdated: false,
      identificationUpdated: false,
      identificationId: null,
      message: ''
    };

    try {
      // Update SAP BP Number
      if (sapBpNumber) {
        await UPDATE('mdm.db.BusinessPartnerRequests')
          .set({ sapBpNumber })
          .where({ ID: requestId });
        result.sapBpNumberUpdated = true;
        log.info('SAP BP Number updated', { requestId, sapBpNumber });
      }

      // Update or create satellite system ID in identifications
      if (satelliteSystemId) {
        // First, get the request to determine the source system
        const request = await SELECT.one.from('mdm.db.BusinessPartnerRequests')
          .where({ ID: requestId });

        if (!request) {
          throw new Error(`Request not found: ${requestId}`);
        }

        const sourceSystem = request.sourceSystem;
        if (!sourceSystem || !['Coupa', 'Salesforce', 'PI'].includes(sourceSystem)) {
          throw new Error(`Invalid source system: ${sourceSystem}`);
        }

        // Map source system to identification type
        const identificationTypeMap = {
          'Coupa': 'COUPA_ID',
          'Salesforce': 'SALESFORCE_ID',
          'PI': 'PI_ID'
        };

        const identificationType = identificationTypeMap[sourceSystem];

        // Check if identification already exists for this source system
        const existingIdentification = await SELECT.one.from('mdm.db.PartnerIdentifications')
          .where({
            request_ID: requestId,
            identificationType_code: identificationType
          });

        if (existingIdentification) {
          // Update existing identification
          await UPDATE('mdm.db.PartnerIdentifications')
            .set({ identificationNumber: satelliteSystemId })
            .where({ ID: existingIdentification.ID });

          result.identificationId = existingIdentification.ID;
          log.info('Satellite system ID updated', {
            requestId,
            identificationType,
            satelliteSystemId,
            identificationId: existingIdentification.ID
          });
        } else {
          // Create new identification
          const newId = cds.utils.uuid();
          await INSERT.into('mdm.db.PartnerIdentifications').entries({
            ID: newId,
            request_ID: requestId,
            identificationType_code: identificationType,
            identificationNumber: satelliteSystemId,
            createdAt: new Date().toISOString(),
            createdBy: 'IntegrationSuite'
          });

          result.identificationId = newId;
          log.info('Satellite system ID created', {
            requestId,
            identificationType,
            satelliteSystemId,
            identificationId: newId
          });
        }

        result.identificationUpdated = true;
      }

      result.success = true;
      result.message = 'Integration data updated successfully';

      return result;
    } catch (error) {
      log.error('Error updating integration data', { error: error.message, requestId });
      result.message = `Error: ${error.message}`;
      throw error;
    }
  });

  log.info('MDM Service initialization complete');
});
