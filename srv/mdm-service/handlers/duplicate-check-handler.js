const duplicateChecker = require('../../lib/shared/duplicate-checker');
const ErrorHandler = require('../../lib/error-handler');

/**
 * Duplicate Check Handler
 * Handles all duplicate checking logic for MDM approval requests
 */
class DuplicateCheckHandler {
  /**
   * Register handler with CAP service
   * @param {Object} service - CAP service instance
   * @param {Object} entities - Service entities
   * @param {Object} log - Logger instance
   */
  static register(service, entities, log) {
    const { MDMApprovalRequests } = entities;

    /**
     * Check for duplicates using shared duplicate checker
     */
    service.on('checkDuplicates', MDMApprovalRequests, async (req) => {
      log.info('Checking for duplicates', { requestID: req.params[0].ID });
      const { ID } = req.params[0];

      try {
        const duplicates = await duplicateChecker.checkDuplicates(
          ID,
          service,
          false,
          'MDMService'
        );

        return duplicates;
      } catch (error) {
        log.error('Duplicate check failed', { requestID: ID, error: error.message });
        throw ErrorHandler.createError(
          ErrorHandler.ERROR_CODES.BUSINESS_RULE_VIOLATION,
          `Duplicate check failed: ${error.message}`,
          'checkDuplicates'
        );
      }
    });

    log.info('Duplicate check handler registered');
  }
}

module.exports = DuplicateCheckHandler;
