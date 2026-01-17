const cds = require('@sap/cds');
const { v4: uuidv4 } = require('uuid');

/**
 * Status Update Handler
 * Handles all integration status update logic for MDM approval requests
 */
class StatusUpdateHandler {
  /**
   * Register handler with CAP service
   * @param {Object} service - CAP service instance
   * @param {Object} entities - Service entities
   * @param {Object} log - Logger instance
   */
  static register(service, entities, log) {
    const { MDMApprovalRequests, ApprovalHistory } = entities;

    /**
     * Update SAP Initial Status
     * Called by Integration Suite after initial SAP system update
     */
    service.on('updateSAPStatus', MDMApprovalRequests, async (req) => {
      const { ID } = req.params[0];
      const { status } = req.data;

      log.info('Updating SAP Initial Status', { requestID: ID, status });

      try {
        await UPDATE(MDMApprovalRequests).set({ sapInitialStatus: status }).where({ ID });
        await checkCompletion(ID, MDMApprovalRequests, ApprovalHistory, log);

        log.info('SAP Initial Status updated', { requestID: ID, status });
        return 'SAP Status Updated';
      } catch (error) {
        log.error('Failed to update SAP status', { requestID: ID, error: error.message });
        throw error;
      }
    });

    /**
     * Update Satellite System Status
     * Called by Integration Suite after satellite system update (e.g., Coupa, Salesforce)
     */
    service.on('updateSatelliteStatus', MDMApprovalRequests, async (req) => {
      const { ID } = req.params[0];
      const { status } = req.data;

      log.info('Updating Satellite Status', { requestID: ID, status });

      try {
        await UPDATE(MDMApprovalRequests).set({ satelliteStatus: status }).where({ ID });
        await checkCompletion(ID, MDMApprovalRequests, ApprovalHistory, log);

        log.info('Satellite Status updated', { requestID: ID, status });
        return 'Satellite Status Updated';
      } catch (error) {
        log.error('Failed to update satellite status', { requestID: ID, error: error.message });
        throw error;
      }
    });

    /**
     * Update SAP ID Update Status
     * Called by Integration Suite after SAP BP number assignment to satellite system
     */
    service.on('updateSAPIdStatus', MDMApprovalRequests, async (req) => {
      const { ID } = req.params[0];
      const { status } = req.data;

      log.info('Updating SAP ID Update Status', { requestID: ID, status });

      try {
        await UPDATE(MDMApprovalRequests).set({ sapIdUpdateStatus: status }).where({ ID });
        await checkCompletion(ID, MDMApprovalRequests, ApprovalHistory, log);

        log.info('SAP ID Update Status updated', { requestID: ID, status });
        return 'SAP ID Update Status Updated';
      } catch (error) {
        log.error('Failed to update SAP ID status', { requestID: ID, error: error.message });
        throw error;
      }
    });

    log.info('Status update handler registered');
  }
}

/**
 * Check if all integration statuses are complete and auto-complete request
 * For Create requests: Need all 3 statuses (sapInitialStatus, satelliteStatus, sapIdUpdateStatus) = 'Success'
 * For Update requests: Need only 2 statuses (sapInitialStatus, satelliteStatus) = 'Success'
 *
 * @param {String} requestId - Request ID
 * @param {Object} MDMApprovalRequests - Entity reference
 * @param {Object} ApprovalHistory - Entity reference
 * @param {Object} log - Logger instance
 */
async function checkCompletion(requestId, MDMApprovalRequests, ApprovalHistory, log) {
  const request = await SELECT.one.from(MDMApprovalRequests).where({ ID: requestId });
  if (!request) return;

  let isComplete = false;

  if (request.requestType === 'Create') {
    // Create: Need ALL 3 statuses
    if (request.sapInitialStatus === 'Success' &&
      request.satelliteStatus === 'Success' &&
      request.sapIdUpdateStatus === 'Success') {
      isComplete = true;
    }
  } else {
    // Update: Need only 2 statuses
    if (request.sapInitialStatus === 'Success' &&
      request.satelliteStatus === 'Success') {
      isComplete = true;
    }
  }

  if (isComplete && request.status !== 'Completed') {
    log.info('Auto-completing request', {
      requestID: requestId,
      requestNumber: request.requestNumber,
      requestType: request.requestType
    });

    await UPDATE(MDMApprovalRequests).set({
      status: 'Completed',
      statusCriticality: 1, // Success (Green)
      modifiedBy: 'system',
      modifiedAt: new Date().toISOString()
    }).where({ ID: requestId });

    await createApprovalHistoryEntry(
      requestId,
      'AutoComplete',
      request.status,
      'Completed',
      'Request automatically completed after successful integration',
      ApprovalHistory,
      'system'
    );

    log.info('Request auto-completed successfully', {
      requestID: requestId,
      requestNumber: request.requestNumber
    });
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

module.exports = StatusUpdateHandler;
