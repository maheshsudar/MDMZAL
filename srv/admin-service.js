const cds = require('@sap/cds');
const ValidationService = require('./lib/validation-service');

/**
 * Admin Service Implementation
 * Provides comprehensive CRUD operations for validation rules and code lists
 * Includes testing, statistics, and bulk operations
 *
 * @module admin-service
 * @author MDM Team
 * @date December 2024
 */
module.exports = cds.service.impl(async function() {
  const log = cds.log('admin-service');
  const db = await cds.connect.to('db');
  const validationService = new ValidationService(db);

  const { ValidationRules, SectionValidationRules, CustomValidators } = db.entities('mdm.db');

  log.info('Admin Service initialized');

  // ===== Admin Menu Actions =====

  /**
   * Navigate to configuration table
   * Returns the routeName so client-side JavaScript can handle navigation
   */
  this.on('navigateToTable', 'AdminMenu', async (req) => {
    const ID = req.params[0];
    const { AdminMenu } = db.entities('mdm.db');

    const menuItem = await SELECT.one.from(AdminMenu).where({ code: ID });

    if (!menuItem || !menuItem.routeName) {
      req.error(404, 'Route not found for this menu item');
    }

    return { routeName: menuItem.routeName };
  });

  // ===== Validation Rule Actions =====

  /**
   * Test validation rules against sample data
   * Allows testing rules before production deployment
   */
  this.on('testValidation', async (req) => {
    log.info('Testing validation rules', {
      status: req.data.status,
      sourceSystem: req.data.sourceSystem
    });

    const { requestData, status, sourceSystem, entityType, requestType } = req.data;

    try {
      const data = JSON.parse(requestData);
      const startTime = Date.now();

      const result = await validationService.validateRequest(
        data,
        status,
        sourceSystem,
        entityType,
        requestType
      );

      const executionTimeMs = Date.now() - startTime;

      log.info('Test validation completed', {
        isValid: result.isValid,
        errors: result.errors.length,
        warnings: result.warnings.length,
        executionTimeMs
      });

      return {
        ...result,
        executionTimeMs
      };

    } catch (error) {
      log.error('Test validation failed', { error: error.message });
      req.error(400, `Test validation failed: ${error.message}`);
    }
  });

  /**
   * Get applicable validation rules for UI field indicators (FIORI COMPLIANT)
   * Returns simplified rule list for frontend consumption
   */
  this.on('getApplicableValidationRules', async (req) => {
    log.info('Getting applicable validation rules for UI', {
      status: req.data.status,
      sourceSystem: req.data.sourceSystem
    });

    const { status, sourceSystem, entityType, requestType } = req.data;

    try {
      const rules = await validationService.getApplicableRulesForUI(
        status,
        sourceSystem,
        entityType,
        requestType
      );

      log.info('Retrieved UI validation rules', { count: rules.length });

      return rules;

    } catch (error) {
      log.error('Failed to get validation rules', { error: error.message });
      req.error(500, `Failed to get validation rules: ${error.message}`);
    }
  });

  /**
   * Get validation statistics for monitoring and dashboards
   */
  this.on('getValidationStatistics', async () => {
    log.info('Getting validation statistics');

    try {
      // Total rules count
      const totalRulesResult = await SELECT.from(ValidationRules).columns('count(*) as count');
      const totalRules = totalRulesResult[0]?.count || 0;

      // Active rules count
      const activeRulesResult = await SELECT.from(ValidationRules)
        .where({ isActive: true })
        .columns('count(*) as count');
      const activeRules = activeRulesResult[0]?.count || 0;

      // Rules by status
      const rulesByStatus = await SELECT.from(ValidationRules)
        .columns('status', 'count(*) as count')
        .groupBy('status');

      // Rules by source system
      const rulesBySourceSystem = await SELECT.from(ValidationRules)
        .columns('sourceSystem', 'count(*) as count')
        .groupBy('sourceSystem');

      // Rules by validation type
      const rulesByType = await SELECT.from(ValidationRules)
        .columns('validationType', 'count(*) as count')
        .groupBy('validationType');

      const stats = {
        totalRules,
        activeRules,
        rulesByStatus: rulesByStatus.map(r => ({ status: r.status || 'Default', count: r.count })),
        rulesBySourceSystem: rulesBySourceSystem.map(r => ({ sourceSystem: r.sourceSystem || 'All', count: r.count })),
        rulesByType: rulesByType.map(r => ({ validationType: r.validationType, count: r.count }))
      };

      log.info('Validation statistics retrieved', { totalRules, activeRules });

      return stats;

    } catch (error) {
      log.error('Failed to get statistics', { error: error.message });
      req.error(500, `Failed to get statistics: ${error.message}`);
    }
  });

  /**
   * Toggle rule active status
   * Allows quickly enabling/disabling rules without deleting them
   */
  this.on('toggleActive', 'ValidationRules', async (req) => {
    const { ID } = req.params[0];
    log.info('Toggling rule active status', { ruleID: ID });

    try {
      const rule = await SELECT.one.from(ValidationRules).where({ ID });

      if (!rule) {
        req.error(404, `Validation rule not found: ${ID}`);
      }

      const newStatus = !rule.isActive;

      await UPDATE(ValidationRules)
        .set({ isActive: newStatus })
        .where({ ID });

      // Clear validation cache so new status takes effect immediately
      validationService.clearCache();

      log.info('Rule active status toggled', { ruleID: ID, newStatus });

      return SELECT.one.from(ValidationRules).where({ ID });

    } catch (error) {
      log.error('Failed to toggle rule status', { ruleID: ID, error: error.message });
      req.error(500, `Failed to toggle rule status: ${error.message}`);
    }
  });

  /**
   * Duplicate validation rule
   * Creates a copy of existing rule for modification
   */
  this.on('duplicate', 'ValidationRules', async (req) => {
    const { ID } = req.params[0];
    log.info('Duplicating rule', { ruleID: ID });

    try {
      const rule = await SELECT.one.from(ValidationRules).where({ ID });

      if (!rule) {
        req.error(404, `Validation rule not found: ${ID}`);
      }

      // Remove ID and managed fields
      delete rule.ID;
      delete rule.createdAt;
      delete rule.modifiedAt;
      delete rule.createdBy;
      delete rule.modifiedBy;

      // Modify name and code to indicate copy
      rule.ruleName = `${rule.ruleName} (Copy)`;
      rule.ruleCode = `${rule.ruleCode}_COPY_${Date.now()}`;
      rule.isActive = false; // Inactive by default - must be activated manually

      const newRule = await INSERT.into(ValidationRules).entries(rule);

      log.info('Rule duplicated successfully', { originalID: ID, newID: newRule });

      return SELECT.one.from(ValidationRules).where({ ID: newRule.ID });

    } catch (error) {
      log.error('Failed to duplicate rule', { ruleID: ID, error: error.message });
      req.error(500, `Failed to duplicate rule: ${error.message}`);
    }
  });

  /**
   * Toggle section rule active status
   */
  this.on('toggleActive', 'SectionValidationRules', async (req) => {
    const { ID } = req.params[0];
    log.info('Toggling section rule active status', { ruleID: ID });

    try {
      const rule = await SELECT.one.from(SectionValidationRules).where({ ID });

      if (!rule) {
        req.error(404, `Section validation rule not found: ${ID}`);
      }

      const newStatus = !rule.isActive;

      await UPDATE(SectionValidationRules)
        .set({ isActive: newStatus })
        .where({ ID });

      // Clear validation cache
      validationService.clearCache();

      log.info('Section rule active status toggled', { ruleID: ID, newStatus });

      return SELECT.one.from(SectionValidationRules).where({ ID });

    } catch (error) {
      log.error('Failed to toggle section rule status', { ruleID: ID, error: error.message });
      req.error(500, `Failed to toggle section rule status: ${error.message}`);
    }
  });

  /**
   * Bulk update rule priorities
   * Allows reordering rules for execution priority
   */
  this.on('updateRulePriorities', async (req) => {
    const { updates } = req.data;
    log.info('Updating rule priorities', { count: updates.length });

    if (!updates || updates.length === 0) {
      req.error(400, 'No updates provided');
    }

    try {
      let updated = 0;

      for (const update of updates) {
        await UPDATE(ValidationRules)
          .set({ priority: update.priority })
          .where({ ID: update.ruleID });
        updated++;
      }

      // Clear validation cache so new priorities take effect
      validationService.clearCache();

      log.info('Rule priorities updated', { updated });

      return `Successfully updated ${updated} rule priorities`;

    } catch (error) {
      log.error('Failed to update priorities', { error: error.message });
      req.error(500, `Failed to update priorities: ${error.message}`);
    }
  });

  /**
   * Clone validation rules from one context to another
   * Useful for copying Coupa rules to Salesforce, etc.
   */
  this.on('cloneValidationRules', async (req) => {
    const { fromStatus, fromSourceSystem, toStatus, toSourceSystem } = req.data;
    log.info('Cloning validation rules', {
      from: `${fromStatus}/${fromSourceSystem}`,
      to: `${toStatus}/${toSourceSystem}`
    });

    try {
      // Find rules matching source context
      const rulesToClone = await SELECT.from(ValidationRules)
        .where({
          status: fromStatus || null,
          sourceSystem: fromSourceSystem || null
        });

      if (!rulesToClone || rulesToClone.length === 0) {
        log.warn('No rules found to clone', { fromStatus, fromSourceSystem });
        return {
          cloned: 0,
          message: 'No rules found matching source criteria'
        };
      }

      let cloned = 0;

      for (const rule of rulesToClone) {
        // Remove ID and managed fields
        delete rule.ID;
        delete rule.createdAt;
        delete rule.modifiedAt;
        delete rule.createdBy;
        delete rule.modifiedBy;

        // Update context to target
        rule.status = toStatus || null;
        rule.sourceSystem = toSourceSystem || null;

        // Modify code to indicate cloned rule
        rule.ruleCode = `${rule.ruleCode}_CLONED_${Date.now()}`;
        rule.ruleName = `${rule.ruleName} (Cloned from ${fromStatus || 'Default'}/${fromSourceSystem || 'All'})`;
        rule.isActive = false; // Inactive by default

        await INSERT.into(ValidationRules).entries(rule);
        cloned++;
      }

      // Clear cache
      validationService.clearCache();

      log.info('Rules cloned successfully', { cloned });

      return {
        cloned,
        message: `Successfully cloned ${cloned} validation rules`
      };

    } catch (error) {
      log.error('Failed to clone rules', { error: error.message });
      req.error(500, `Failed to clone rules: ${error.message}`);
    }
  });

  // ===== Cache Management =====

  /**
   * Clear validation cache after rule changes
   * Ensures new rules take effect immediately
   */
  this.after(['CREATE', 'UPDATE', 'DELETE'], 'ValidationRules', () => {
    log.info('ValidationRules modified - clearing cache');
    validationService.clearCache();
  });

  this.after(['CREATE', 'UPDATE', 'DELETE'], 'SectionValidationRules', () => {
    log.info('SectionValidationRules modified - clearing cache');
    validationService.clearCache();
  });

  // ===== Service Initialization Complete =====

  log.info('Admin Service initialization complete');
});
