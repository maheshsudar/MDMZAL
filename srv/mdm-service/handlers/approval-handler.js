const cds = require('@sap/cds');
const { v4: uuidv4 } = require('uuid');
const NotificationService = require('../../lib/notification-service');
const ErrorHandler = require('../../lib/error-handler');

/**
 * Approval Handler
 * Handles all approval and rejection logic for MDM approval requests
 */
class ApprovalHandler {
  /**
   * Register handler with CAP service
   * @param {Object} service - CAP service instance
   * @param {Object} entities - Service entities
   * @param {Object} log - Logger instance
   */
  static register(service, entities, log) {
    const { MDMApprovalRequests, ApprovalHistory } = entities;
    const notificationService = new NotificationService();

    /**
     * Approve request
     */
    service.on('approveRequest', MDMApprovalRequests, async (req) => {
      log.info('Approving request', { requestID: req.params[0].ID });
      const { ID } = req.params[0];

      try {
        const request = await SELECT.one.from(MDMApprovalRequests).where({ ID });

        if (!request) {
          throw ErrorHandler.notFoundError('BusinessPartnerRequest', ID);
        }

        if (!['Submitted', 'ComplianceCheck', 'DuplicateReview'].includes(request.status)) {
          throw ErrorHandler.createError(
            ErrorHandler.ERROR_CODES.INVALID_STATUS_TRANSITION,
            `Request is not in a state that can be approved. Current status: ${request.status}`,
            'approveRequest'
          );
        }

        // Update status and set integration statuses to Pending
        await UPDATE(MDMApprovalRequests).set({
          status: 'Approved',
          statusCriticality: 1, // Success (Green)
          sapInitialStatus: 'Pending',
          satelliteStatus: 'Pending',
          sapIdUpdateStatus: 'Pending'
        }).where({ ID });

        // Create approval history entry
        await createApprovalHistoryEntry(
          ID,
          'Approve',
          request.status,
          'Approved',
          'Request approved by MDM approver',
          ApprovalHistory,
          req.user.id
        );

        // Send notifications
        await notificationService.sendStatusChangeNotification(
          { ...request, status: 'Approved' },
          'approved',
          { userId: req.user.id, userDisplayName: req.user.displayName }
        );

        // Detect and notify other satellite systems (Update requests only)
        if (request.requestType === 'Update') {
          try {
            await detectAndNotifyOtherSystems(ID, request, log, req.user.id);
          } catch (satelliteError) {
            // Log error but don't fail the approval
            log.error('Satellite system notification failed', {
              requestID: ID,
              error: satelliteError.message
            });
          }
        }

        log.info('Request approved successfully', { requestID: ID, requestNumber: request.requestNumber });

        return `Request ${request.requestNumber} approved successfully.`;

      } catch (error) {
        log.error('Approve failed', { requestID: ID, error: error.message });
        throw error;
      }
    });

    /**
     * Reject request
     */
    service.on('rejectRequest', MDMApprovalRequests, async (req) => {
      log.info('Rejecting request', { requestID: req.params[0].ID });
      const { ID } = req.params[0];
      const { reason } = req.data || {};

      try {
        const request = await SELECT.one.from(MDMApprovalRequests).where({ ID });

        if (!request) {
          throw ErrorHandler.notFoundError('BusinessPartnerRequest', ID);
        }

        if (!reason || reason.trim() === '') {
          throw ErrorHandler.createError(
            ErrorHandler.ERROR_CODES.VALIDATION_FAILED,
            'Rejection reason is required',
            'rejectRequest'
          );
        }

        // Update status
        await UPDATE(MDMApprovalRequests).set({
          status: 'Rejected',
          statusCriticality: 3 // Error (Red)
        }).where({ ID });

        // Create approval history entry
        await createApprovalHistoryEntry(
          ID,
          'Reject',
          request.status,
          'Rejected',
          reason,
          ApprovalHistory,
          req.user.id
        );

        // Send notifications
        await notificationService.sendStatusChangeNotification(
          { ...request, status: 'Rejected' },
          'rejected',
          { userId: req.user.id, userDisplayName: req.user.displayName, reason }
        );

        log.info('Request rejected', { requestID: ID, requestNumber: request.requestNumber, reason });

        return `Request ${request.requestNumber} rejected.`;

      } catch (error) {
        log.error('Reject failed', { requestID: ID, error: error.message });
        throw error;
      }
    });

    log.info('Approval handler registered');
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

/**
 * Detect and notify other satellite systems about shared BP
 * Triggered after MDM approval for Update requests
 * @param {String} requestId - Request ID
 * @param {Object} request - Request object
 * @param {Object} log - Logger instance
 * @param {String} userId - User ID who approved
 */
async function detectAndNotifyOtherSystems(requestId, request, log, userId) {
  try {
    log.info(`🔍 Checking for satellite system notifications`, {
      requestID: requestId,
      requestNumber: request.requestNumber,
      sourceSystem: request.sourceSystem,
      requestType: request.requestType,
      sapBpNumber: request.sapBpNumber
    });

    // Check if this BP has a sapBpNumber (required for cross-system detection)
    if (!request.sapBpNumber) {
      log.info(`✅ No sapBpNumber - BP not shared across systems`, {
        requestNumber: request.requestNumber
      });
      return;
    }

    // Find all completed requests with the same sapBpNumber
    // This identifies which satellite systems have this BP in their records
    const relatedRequests = await SELECT.from('mdm.db.BusinessPartnerRequests')
      .where({ sapBpNumber: request.sapBpNumber })
      .and({ ID: { '!=': requestId } })
      .and({ status: 'Completed' });

    log.info(`Found related requests for BP ${request.sapBpNumber}:`, {
      requestNumber: request.requestNumber,
      relatedRequestCount: relatedRequests.length,
      relatedSystems: relatedRequests.map(r => `${r.sourceSystem}(${r.requestNumber})`)
    });

    // Get unique source systems (excluding current request's source)
    const otherSystems = [...new Set(
      relatedRequests
        .map(r => r.sourceSystem)
        .filter(sys => sys !== request.sourceSystem)
    )];

    log.info(`Other systems to notify:`, {
      requestNumber: request.requestNumber,
      sourceSystem: request.sourceSystem,
      otherSystems
    });

    if (otherSystems.length === 0) {
      log.info(`✅ No other systems to notify - BP not shared`, {
        requestNumber: request.requestNumber
      });
      return;
    }

    // Get distribution list helper
    const getDistributionList = (targetSystem) => {
      const distributionLists = {
        'Coupa': 'coupa-team@company.com',
        'Salesforce': 'salesforce-team@company.com',
        'PI': 'pi-team@company.com'
      };
      return distributionLists[targetSystem] || 'mdm-team@company.com';
    };

    // Create acknowledgement entries for each other system
    for (const targetSystem of otherSystems) {
      // targetSystem is already the system name (Coupa, Salesforce, PI)

      // Check if acknowledgement already exists (avoid duplicates)
      const existing = await SELECT.one.from('mdm.db.NotificationAcknowledgments')
        .where({ request_ID: requestId, targetSystem: targetSystem });

      if (existing) {
        log.info(`Acknowledgement already exists for ${targetSystem}`, {
          requestNumber: request.requestNumber
        });
        continue;
      }

      // Create acknowledgement entry
      await INSERT.into('mdm.db.NotificationAcknowledgments').entries({
        ID: uuidv4(),
        request_ID: requestId,
        targetSystem: targetSystem,
        status: 'Pending',
        notificationDate: new Date(),
        partnerName: request.name1 || request.partnerName,
        requestNumber: request.requestNumber,
        sapBpNumber: request.sapBpNumber,
        sourceSystem: request.sourceSystem,
        changeDescription: `Business Partner previously managed by ${targetSystem} is now being updated by ${request.sourceSystem}. Please review and acknowledge this change.`,
        notificationSentBy: userId,
        emailSentTo: getDistributionList(targetSystem),
        createdAt: new Date(),
        createdBy: userId,
        modifiedAt: new Date(),
        modifiedBy: userId
      });

      log.info(`✅ Created acknowledgement entry for ${targetSystem}`, {
        requestNumber: request.requestNumber,
        targetSystem
      });

      // Send email notification
      const notificationService = new NotificationService();
      await notificationService.sendSatelliteAcknowledgementEmail(
        targetSystem,
        request
      );

      log.info(`📧 Email sent to ${targetSystem} team`, {
        requestNumber: request.requestNumber,
        targetSystem,
        emailTo: getDistributionList(targetSystem)
      });
    }

    log.info(`🎉 Satellite system notifications completed`, {
      requestNumber: request.requestNumber,
      notifiedSystems: otherSystems.map(type => {
        const mapping = { 'COUPA': 'Coupa', 'SALESFORCE': 'Salesforce', 'PI': 'PI' };
        return mapping[type];
      })
    });

  } catch (error) {
    log.error(`❌ Error in detectAndNotifyOtherSystems:`, {
      requestID: requestId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = ApprovalHandler;
