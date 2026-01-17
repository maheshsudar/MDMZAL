const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  const { NotificationAcknowledgments } = this.entities;
  const log = cds.log('satellite-ack-service');

  /**
   * Compute statusCriticality and remove unwanted fields for all acknowledgement entities
   */
  this.after('READ', ['AllAcknowledgements', 'CoupaAcknowledgements', 'SalesforceAcknowledgements', 'PIAcknowledgements'], (data) => {
    log.info('🔍 after READ handler called', { dataType: Array.isArray(data) ? 'array' : 'object', count: Array.isArray(data) ? data.length : 1 });

    if (!data) return;

    const processItem = (item) => {
      // Compute criticality
      if (item.status === 'Acknowledged') {
        item.statusCriticality = 3; // Green (Success)
      } else if (item.status === 'Pending') {
        item.statusCriticality = 2; // Yellow (Warning)
      } else {
        item.statusCriticality = 0; // Default (Neutral)
      }

      // Remove fields we don't want to expose
      log.info('🗑️  Deleting fields', { ID: item.ID, hasChangeDesc: !!item.changeDescription, hasSystemOwner: !!item.systemOwnerName, hasEmailSentTo: !!item.emailSentTo });
      delete item.changeDescription;
      delete item.systemOwnerName;
      delete item.emailSentTo;
      log.info('✅ Fields deleted', { ID: item.ID, hasChangeDesc: !!item.changeDescription, hasSystemOwner: !!item.systemOwnerName, hasEmailSentTo: !!item.emailSentTo });
    };

    if (Array.isArray(data)) {
      data.forEach(processItem);
    } else {
      processItem(data);
    }
  });

  /**
   * Acknowledge action for All Acknowledgements (Admin view)
   */
  this.on('acknowledge', 'AllAcknowledgements', async (req) => {
    log.info('Admin acknowledging request', { ID: req.params[0].ID });

    // Get the target system from the acknowledgement to determine which system is being acknowledged
    const { ID } = req.params[0];
    const acknowledgement = await SELECT.one
      .from('mdm.db.NotificationAcknowledgments')
      .columns('targetSystem')
      .where({ ID });

    if (!acknowledgement) {
      req.error(404, `Acknowledgement entry not found`);
      return;
    }

    return await acknowledgeEntry(req, acknowledgement.targetSystem, log);
  });

  /**
   * Acknowledge action for Coupa Acknowledgements
   */
  this.on('acknowledge', 'CoupaAcknowledgements', async (req) => {
    log.info('Coupa team acknowledging request', { ID: req.params[0].ID });
    return await acknowledgeEntry(req, 'Coupa', log);
  });

  /**
   * Acknowledge action for Salesforce Acknowledgements
   */
  this.on('acknowledge', 'SalesforceAcknowledgements', async (req) => {
    log.info('Salesforce team acknowledging request', { ID: req.params[0].ID });
    return await acknowledgeEntry(req, 'Salesforce', log);
  });

  /**
   * Acknowledge action for PI Acknowledgements
   */
  this.on('acknowledge', 'PIAcknowledgements', async (req) => {
    log.info('PI team acknowledging request', { ID: req.params[0].ID });
    return await acknowledgeEntry(req, 'PI', log);
  });

  /**
   * Helper function to acknowledge an entry
   * @param {Object} req - Request object
   * @param {String} targetSystem - Target system name
   * @param {Object} log - Logger instance
   */
  async function acknowledgeEntry(req, targetSystem, log) {
    const { ID } = req.params[0];
    const { comments } = req.data || {};
    const user = req.user.id || 'unknown-user';

    try {
      // Get the acknowledgement entry
      const acknowledgement = await SELECT.one
        .from('mdm.db.NotificationAcknowledgments')
        .where({ ID });

      if (!acknowledgement) {
        req.error(404, `Acknowledgement entry not found`);
        return;
      }

      if (acknowledgement.status === 'Acknowledged') {
        req.warn(`This acknowledgement has already been processed by ${acknowledgement.acknowledgedBy}`);
        return {
          success: true,
          message: 'Already acknowledged',
          acknowledgedBy: acknowledgement.acknowledgedBy,
          acknowledgedAt: acknowledgement.acknowledgedAt
        };
      }

      // Update acknowledgement status
      await UPDATE('mdm.db.NotificationAcknowledgments')
        .set({
          status: 'Acknowledged',
          acknowledgedBy: user,
          acknowledgedAt: new Date(),
          comments: comments || '',
          modifiedAt: new Date(),
          modifiedBy: user
        })
        .where({ ID });

      log.info(`✅ Acknowledgement recorded`, {
        ID,
        targetSystem,
        requestNumber: acknowledgement.requestNumber,
        acknowledgedBy: user
      });

      req.notify({
        code: 'SUCCESS',
        message: `Acknowledgement recorded successfully for ${targetSystem} system`,
        target: 'status',
        numericSeverity: 3
      });

      return {
        success: true,
        message: `Acknowledged by ${targetSystem} team`,
        acknowledgedBy: user,
        acknowledgedAt: new Date()
      };

    } catch (error) {
      log.error(`❌ Failed to acknowledge entry`, {
        ID,
        targetSystem,
        error: error.message
      });
      req.error(500, `Failed to acknowledge: ${error.message}`);
    }
  }

  log.info('✅ Satellite Acknowledgement Service handler registered');
});
