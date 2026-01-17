using mdm.db from '../db/data-model';

/**
 * Admin Service for managing validation rules and code lists
 * Provides comprehensive CRUD operations, testing capabilities, and statistics
 * Restricted to MDMApprover and SystemOwner roles
 *
 * @service AdminService
 * @path /admin
 */
service AdminService @(path:'/admin') {

  // ===== Authorization =====
  @restrict: [
    { grant: ['READ'], to: ['MDMApprover', 'SystemOwner', 'BusinessUser'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['MDMApprover', 'SystemOwner'] }
  ]

  // ===== Admin Menu =====
  @readonly
  entity AdminMenu as projection on db.AdminMenu
    actions {
      action navigateToTable() returns {
        routeName: String;
      };
    };

  // ===== Validation Management =====

  // Draft-enabled: Complex validation rules that need testing before activation
  @odata.draft.enabled
  entity ValidationRules as projection on db.ValidationRules
    excluding { createdBy, modifiedBy }
    actions {
      action toggleActive() returns ValidationRules;
      action duplicate() returns ValidationRules;
    };

  // Draft-enabled: Section validation rules that need testing before activation
  @odata.draft.enabled
  entity SectionValidationRules as projection on db.SectionValidationRules
    excluding { createdBy, modifiedBy }
    actions {
      action toggleActive() returns SectionValidationRules;
    };

  // Simple CRUD: Validator registry, no draft needed
  entity CustomValidators as projection on db.CustomValidators
    excluding { createdBy, modifiedBy };

  // ===== Code List Management (23 Tables) =====
  // All code lists use direct CRUD (no draft workflow needed)

  // Category 1: Simple CodeList entities
  entity AddressTypes as projection on db.AddressTypes;

  entity EmailTypes as projection on db.EmailTypes;

  entity VatTypes as projection on db.VatTypes;

  entity BPTypes as projection on db.BPTypes;

  entity ContactTypes as projection on db.ContactTypes;

  entity DunningStrategies as projection on db.DunningStrategies;

  entity DocumentTypes as projection on db.DocumentTypes;

  // Category 2: Extended with isActive
  entity RequestTypes as projection on db.RequestTypes;

  entity PaymentTerms as projection on db.PaymentTerms;

  entity PaymentMethods as projection on db.PaymentMethods;

  entity SourceSystems as projection on db.SourceSystems;

  entity OverallStatuses as projection on db.OverallStatuses;

  entity VendorClassifications as projection on db.VendorClassifications;

  // Category 3: Salesforce-specific
  entity RevenueStreams as projection on db.RevenueStreams;

  entity BillingCycles as projection on db.BillingCycles;

  // Category 4: Business Master
  entity BusinessChannels as projection on db.BusinessChannels;

  // Category 5: Configuration
  entity SystemConfiguration as projection on db.SystemConfiguration;

  entity StatusTransitions as projection on db.StatusTransitions;

  entity StatusAppConfig as projection on db.StatusAppConfig;

  entity WorkflowSteps as projection on db.WorkflowSteps;

  entity UserRoles as projection on db.UserRoles;

  // ===== Testing and Utilities =====

  /**
   * Test validation rules against sample data
   * Allows testing rules before deploying to production
   */
  type TestValidationResult {
    isValid: Boolean;
    errors: array of {
      field: String;
      entity: String;
      message: String;
      severity: String;
      blockSubmission: Boolean;
      ruleCode: String;
    };
    warnings: array of {
      field: String;
      entity: String;
      message: String;
      severity: String;
      blockSubmission: Boolean;
      ruleCode: String;
    };
    totalRulesExecuted: Integer;
    executionTimeMs: Integer;
  }

  action testValidation(
    requestData: String,     // JSON string of request data
    status: String,
    sourceSystem: String,
    entityType: String,
    requestType: String
  ) returns TestValidationResult;

  /**
   * Get applicable validation rules for UI field indicators (FIORI COMPLIANT)
   * Returns simplified rule list for frontend consumption
   */
  type ApplicableRule {
    targetEntity: String;
    targetField: String;
    isMandatory: Boolean;
    errorMessage: String;
  }

  function getApplicableValidationRules(
    status: String,
    sourceSystem: String,
    entityType: String,
    requestType: String
  ) returns array of ApplicableRule;

  /**
   * Validation statistics for monitoring and dashboards
   */
  type ValidationStatistics {
    totalRules: Integer;
    activeRules: Integer;
    rulesByStatus: array of { status: String; count: Integer };
    rulesBySourceSystem: array of { sourceSystem: String; count: Integer };
    rulesByType: array of { validationType: String; count: Integer };
  }

  function getValidationStatistics() returns ValidationStatistics;

  /**
   * Bulk update rule priorities
   * Allows reordering rules for execution priority
   */
  type PriorityUpdate {
    ruleID: UUID;
    priority: Integer;
  }

  action updateRulePriorities(
    updates: array of PriorityUpdate
  ) returns String;

  /**
   * Clone validation rules from one context to another
   * Useful for copying Coupa rules to Salesforce, etc.
   */
  type CloneResult {
    cloned: Integer;
    message: String;
  }

  action cloneValidationRules(
    fromStatus: String,
    fromSourceSystem: String,
    toStatus: String,
    toSourceSystem: String
  ) returns CloneResult;
}
