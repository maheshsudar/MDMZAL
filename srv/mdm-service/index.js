/**
 * MDM Service Handlers - Main Registration
 *
 * This module registers all modular handlers for the MDM service.
 * Each handler is responsible for a specific domain of functionality:
 * - Duplicate Check: Duplicate detection and matching
 * - VIES Validation: VAT ID validation via VIES
 * - AEB Compliance: Trade compliance screening
 * - Approval: Approve and reject workflows
 * - Status Update: Integration status updates
 */

const DuplicateCheckHandler = require('./handlers/duplicate-check-handler');
const VIESValidationHandler = require('./handlers/vies-validation-handler');
const AEBComplianceHandler = require('./handlers/aeb-compliance-handler');
const ApprovalHandler = require('./handlers/approval-handler');
const StatusUpdateHandler = require('./handlers/status-update-handler');

/**
 * Register all MDM service handlers
 *
 * @param {Object} service - CAP service instance
 * @param {Object} entities - Service entities
 * @param {Object} log - Logger instance
 *
 * @example
 * const mdmHandlers = require('./mdm-service');
 * mdmHandlers.registerAll(this, this.entities, cds.log('mdm-service'));
 */
function registerAll(service, entities, log) {
  log.info('Registering MDM service handlers...');

  // Register each handler
  DuplicateCheckHandler.register(service, entities, log);
  VIESValidationHandler.register(service, entities, log);
  AEBComplianceHandler.register(service, entities, log);
  ApprovalHandler.register(service, entities, log);
  StatusUpdateHandler.register(service, entities, log);

  log.info('All MDM service handlers registered successfully');
}

module.exports = {
  registerAll,
  // Export individual handlers for selective use if needed
  DuplicateCheckHandler,
  VIESValidationHandler,
  AEBComplianceHandler,
  ApprovalHandler,
  StatusUpdateHandler
};
