const cds = require('@sap/cds');
const { v4: uuidv4 } = require('uuid');
const VIESService = require('../../lib/vies-service');
const ErrorHandler = require('../../lib/error-handler');

/**
 * VIES Validation Handler
 * Handles all VIES VAT validation logic for MDM approval requests
 */
class VIESValidationHandler {
  /**
   * Register handler with CAP service
   * @param {Object} service - CAP service instance
   * @param {Object} entities - Service entities
   * @param {Object} log - Logger instance
   */
  static register(service, entities, log) {
    const { MDMApprovalRequests, PartnerVatIds, ApprovalHistory } = entities;
    const viesService = new VIESService();

    /**
     * Perform VIES VAT validation for all VAT IDs
     */
    service.on('performVIESCheck', MDMApprovalRequests, async (req) => {
      log.info('Performing VIES Check', { requestID: req.params[0].ID });
      const { ID } = req.params[0];

      try {
        // Get all VAT IDs for this request
        const vatIds = await SELECT.from(PartnerVatIds).where({ request_ID: ID });

        if (!vatIds || vatIds.length === 0) {
          log.warn('No VAT IDs found to validate', { requestID: ID });
          return 'No VAT IDs found to validate';
        }

        const validationResults = [];
        let allValid = true;
        let hasError = false;

        // Validate each VAT ID
        for (const vat of vatIds) {
          if (vat.vatType_code === 'VAT') {
            log.debug('Validating VAT ID', { country: vat.country_code, vatNumber: vat.vatNumber });

            const result = await viesService.validateVatId(vat.country_code, vat.vatNumber);

            // Update VAT ID with validation results
            await UPDATE(PartnerVatIds).set({
              validationStatus: result.isValid ? 'Valid' : 'Invalid',
              validationDetails: result.isValid
                ? `Valid VAT ID - ${result.name || 'Company name unavailable'}`
                : (result.errorMessage || 'Invalid VAT ID'),
              validationDate: new Date().toISOString()
            }).where({ ID: vat.ID });

            validationResults.push({
              vatId: `${vat.country_code}${vat.vatNumber}`,
              valid: result.isValid,
              message: result.isValid ? 'Valid' : (result.errorMessage || 'Invalid')
            });

            if (!result.isValid) allValid = false;
            if (result.errorMessage) hasError = true;
          }
        }

        // Check if there were no VAT IDs to validate
        if (validationResults.length === 0) {
          log.warn('No VAT IDs with type "VAT" found to validate', { requestID: ID });

          await UPDATE(MDMApprovalRequests).set({
            viesStatus: 'N/A',
            viesCheckDate: new Date().toISOString(),
            viesCheckDetails: 'No VAT IDs found to validate'
          }).where({ ID });

          await createApprovalHistoryEntry(
            ID,
            'VIES Check',
            null,
            null,
            'VIES validation skipped - No VAT IDs found to validate',
            ApprovalHistory
          );

          return {
            overallStatus: 'N/A',
            validationResults: [],
            message: 'No VAT IDs found to validate. VIES check skipped.'
          };
        }

        // Update request header with VIES status
        const overallStatus = allValid ? 'Valid' : hasError ? 'Error' : 'Invalid';
        await UPDATE(MDMApprovalRequests).set({
          viesStatus: overallStatus,
          viesCheckDate: new Date().toISOString(),
          viesCheckDetails: `Validated ${validationResults.length} VAT ID(s). Status: ${overallStatus}`
        }).where({ ID });

        // Create approval history entry
        await createApprovalHistoryEntry(
          ID,
          'VIES Check',
          null,
          null,
          `VIES validation completed. ${validationResults.length} VAT IDs checked. Result: ${overallStatus}`,
          ApprovalHistory
        );

        log.info('VIES Check completed', { requestID: ID, overallStatus, results: validationResults });

        return {
          overallStatus,
          validationResults,
          message: `VIES Check completed. ${validationResults.filter(v => v.valid).length} of ${validationResults.length} VAT IDs are valid.`
        };

      } catch (error) {
        log.error('VIES Check failed', { requestID: ID, error: error.message });

        // Update request with error status
        await UPDATE(MDMApprovalRequests).set({
          viesStatus: 'Error',
          viesCheckDate: new Date().toISOString(),
          viesCheckDetails: `VIES validation failed: ${error.message}`
        }).where({ ID });

        throw ErrorHandler.createError(
          ErrorHandler.ERROR_CODES.EXTERNAL_SERVICE_ERROR,
          `VIES validation failed: ${error.message}`,
          'performVIESCheck'
        );
      }
    });

    log.info('VIES validation handler registered');
  }
}

/**
 * Helper function to create approval history entry
 * @param {String} requestId - Request ID
 * @param {String} action - Action performed
 * @param {String} previousStatus - Previous status
 * @param {String} newStatus - New status
 * @param {String} comments - Comments/notes
 * @param {Object} ApprovalHistory - Entity reference
 * @param {String} userId - User ID (defaults to 'system')
 */
async function createApprovalHistoryEntry(
  requestId,
  action,
  previousStatus,
  newStatus,
  comments,
  ApprovalHistory,
  userId = 'system'
) {
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

module.exports = VIESValidationHandler;
