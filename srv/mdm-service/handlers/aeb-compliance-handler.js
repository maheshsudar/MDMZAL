const cds = require('@sap/cds');
const { v4: uuidv4 } = require('uuid');
const enhancedAEBService = require('../../lib/enhanced-aeb-service');
const ErrorHandler = require('../../lib/error-handler');

/**
 * AEB Compliance Handler
 * Handles all AEB Trade Compliance screening logic for MDM approval requests
 */
class AEBComplianceHandler {
  /**
   * Register handler with CAP service
   * @param {Object} service - CAP service instance
   * @param {Object} entities - Service entities
   * @param {Object} log - Logger instance
   */
  static register(service, entities, log) {
    const { MDMApprovalRequests, PartnerAddresses, ApprovalHistory } = entities;

    /**
     * Perform AEB Trade Compliance screening
     */
    service.on('performAEBCheck', MDMApprovalRequests, async (req) => {
      log.info('Performing AEB Check', { requestID: req.params[0].ID });
      const { ID } = req.params[0];

      try {
        // Get request and addresses
        const request = await SELECT.one.from(MDMApprovalRequests).where({ ID });

        if (!request) {
          throw ErrorHandler.notFoundError('BusinessPartnerRequest', ID);
        }

        const addresses = await SELECT.from(PartnerAddresses).where({ request_ID: ID });

        // Perform AEB screening using enhanced service
        const screeningData = {
          name: request.partnerName,
          addresses: addresses.map(a => ({
            ID: a.ID,
            name1: a.name1,
            street: a.street,
            city: a.city,
            postalCode: a.postalCode,
            country_code: a.country_code,
            region: a.region,
            addressType_code: a.addressType_code,
            isMainAddress: a.isMainAddress
          }))
        };

        log.debug('Calling enhanced AEB screening service', {
          partnerName: request.partnerName,
          addressCount: addresses.length
        });
        const aebResult = await enhancedAEBService.performScreening(screeningData);

        // Determine status criticality
        let statusCriticality = 1; // Success (Green)
        if (aebResult.riskScore > 80) statusCriticality = 3; // Error (Red)
        else if (aebResult.riskScore > 50) statusCriticality = 2; // Warning (Yellow)

        // Format AEB check details as readable text
        const formattedDetails = formatAEBCheckDetails(aebResult);

        // Update request with AEB results
        await UPDATE(MDMApprovalRequests).set({
          aebStatus: aebResult.status,
          aebCheckDate: new Date().toISOString(),
          aebCheckDetails: formattedDetails,
          statusCriticality
        }).where({ ID });

        // Create approval history entry
        await createApprovalHistoryEntry(
          ID,
          'AEB Check',
          null,
          null,
          `AEB screening completed. Risk Score: ${aebResult.riskScore}. Status: ${aebResult.status}. Screening ID: ${aebResult.screeningId || 'N/A'}`,
          ApprovalHistory
        );

        log.info('AEB Check completed', {
          requestID: ID,
          status: aebResult.status,
          riskScore: aebResult.riskScore,
          screeningId: aebResult.screeningId
        });

        return {
          status: aebResult.status,
          riskScore: aebResult.riskScore,
          screeningId: aebResult.screeningId,
          summary: aebResult.summary,
          message: `AEB screening completed. Risk Level: ${aebResult.status} (Score: ${aebResult.riskScore}/100)`
        };

      } catch (error) {
        log.error('AEB Check failed', { requestID: ID, error: error.message });

        // Update request with error status
        await UPDATE(MDMApprovalRequests).set({
          aebStatus: 'Error',
          aebCheckDate: new Date().toISOString(),
          aebCheckDetails: `AEB screening failed: ${error.message}`
        }).where({ ID });

        throw ErrorHandler.createError(
          ErrorHandler.ERROR_CODES.EXTERNAL_SERVICE_ERROR,
          `AEB screening failed: ${error.message}`,
          'performAEBCheck'
        );
      }
    });

    log.info('AEB compliance handler registered');
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
 * Format AEB check details from API response (simplified summary)
 * Shows concise summary instead of detailed breakdown
 */
function formatAEBCheckDetails(aebResult) {
  if (!aebResult) return '';

  const lines = [];
  const MAX_LENGTH = 2000;

  // Simplified summary line
  lines.push(`Status: ${aebResult.status} (Risk Score: ${aebResult.riskScore}/100)`);

  // Check if there are matches
  const matchesFound = aebResult.summary?.matchesFound || 0;

  if (matchesFound > 0) {
    // Show matches summary
    lines.push(`${matchesFound} sanction/watchlist match(es) found - Manual review required`);

    // Show which lists matched if available
    if (aebResult.results && aebResult.results.length > 0) {
      const matchedLists = [];
      aebResult.results.forEach(result => {
        if (result.matchFound && result.hits) {
          result.hits.forEach(hit => {
            if (hit.listName && !matchedLists.includes(hit.listName)) {
              matchedLists.push(hit.listName);
            }
          });
        }
      });

      if (matchedLists.length > 0) {
        lines.push(`Matched Lists: ${matchedLists.join(', ')}`);
      }
    }
  } else {
    lines.push('No sanctions or watchlist matches found');
  }

  // Add recommendation if available
  if (aebResult.recommendation) {
    lines.push(`Recommendation: ${aebResult.recommendation}`);
  }

  // Add screening ID if available
  if (aebResult.screeningId) {
    lines.push(`Screening ID: ${aebResult.screeningId}`);
  }

  // Join all lines and truncate if needed
  let result = lines.join('\n');
  if (result.length > MAX_LENGTH) {
    result = result.substring(0, MAX_LENGTH - 3) + '...';
  }

  return result;
}

module.exports = AEBComplianceHandler;
