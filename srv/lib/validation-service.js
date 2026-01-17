const cds = require('@sap/cds');

/**
 * Dynamic validation service that executes database-driven validation rules
 * Supports status-based, source system-specific, and entity type-specific validation
 * Implements fallback logic: Status+Source+Entity → Status+Source → Status → Default
 *
 * @class ValidationService
 * @author MDM Team
 * @date December 2024
 */
class ValidationService {
  /**
   * Initialize ValidationService with database connection
   * @param {Object} db - CAP database connection
   */
  constructor(db) {
    this.db = db;
    this.log = cds.log('validation-service');
    this.validationCache = new Map(); // Cache for performance
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Main validation entry point
   * @param {Object} data - Complete request data with all child entities
   * @param {String} status - Target status (Draft, New, Submitted)
   * @param {String} sourceSystem - Coupa, Salesforce, Manual, PI
   * @param {String} entityType - Supplier, Customer, Both
   * @param {String} requestType - Create, Update
   * @param {String} locale - User's language (en, de, etc.) for localized error messages
   * @returns {Object} { isValid, errors, warnings, totalRulesExecuted, context }
   */
  async validateRequest(data, status, sourceSystem, entityType, requestType, locale = 'en') {
    this.log.info('=== ValidationService.validateRequest START ===');
    this.log.info(`Status: ${status}, Source: ${sourceSystem}, Type: ${entityType}, RequestType: ${requestType}, Locale: ${locale}`);

    const errors = [];
    const warnings = [];
    const context = { status, sourceSystem, entityType, requestType, locale };

    try {
      // 1. Get applicable field-level rules with fallback logic
      const fieldRules = await this.getApplicableRules(context, locale);
      this.log.info(`Found ${fieldRules.length} field-level rules`);

      // 2. Execute field-level validations
      for (const rule of fieldRules) {
        // Skip PartnerEmails and PartnerBanks validation for Salesforce
        // (Salesforce has emails/banks nested in SubAccounts, not at main level)
        if (sourceSystem === 'Salesforce' &&
            (rule.targetEntity === 'PartnerEmails' || rule.targetEntity === 'PartnerBanks')) {
          this.log.info(`Skipping ${rule.targetEntity} validation for Salesforce (nested in SubAccounts)`);
          continue;
        }

        const result = await this.executeFieldValidation(rule, data);
        if (!result.isValid) {
          this.addValidationMessage(result, rule, errors, warnings);
        }
      }

      // 3. Get applicable section-level rules
      const sectionRules = await this.getSectionRules(context, locale);
      this.log.info(`Found ${sectionRules.length} section-level rules`);

      // 4. Execute section-level validations
      for (const rule of sectionRules) {
        // Skip emails and banks section validation for Salesforce
        // (Salesforce has emails/banks nested in SubAccounts, not at main level)
        if (sourceSystem === 'Salesforce' &&
            (rule.sectionName === 'emails' || rule.sectionName === 'banks')) {
          this.log.info(`Skipping ${rule.sectionName} section validation for Salesforce (nested in SubAccounts)`);
          continue;
        }

        const result = await this.executeSectionValidation(rule, data);
        if (!result.isValid) {
          this.addValidationMessage(result, rule, errors, warnings);
        }
      }

      // 5. Execute custom bank account validation (either IBAN or accountNumber required)
      // Skip for Salesforce - banks are nested in SubAccounts
      if (sourceSystem !== 'Salesforce' && data.banks && Array.isArray(data.banks) && data.banks.length > 0) {
        const bankValidationResults = await this.validateBankAccounts(data.banks, locale);
        bankValidationResults.forEach(result => {
          if (!result.isValid) {
            if (result.errorSeverity === 'Error') {
              errors.push(result.errorMessage);
            } else {
              warnings.push(result.errorMessage);
            }
          }
        });
      }

      // 6. Summary
      const totalRules = fieldRules.length + sectionRules.length;
      this.log.info(`Validation complete: ${errors.length} errors, ${warnings.length} warnings, ${totalRules} rules executed`);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        totalRulesExecuted: totalRules,
        context
      };

    } catch (error) {
      this.log.error('Validation service error:', error);
      throw error;
    }
  }

  /**
   * Get applicable validation rules with priority fallback
   * Priority order:
   * 1. Exact match: status + sourceSystem + entityType + requestType
   * 2. Status + sourceSystem + entityType
   * 3. Status + sourceSystem
   * 4. Status only
   * 5. Default rules (all filters null)
   *
   * Language fallback: If requested locale not found, fallback to 'en' (English)
   *
   * @param {Object} context - Validation context including locale
   * @param {String} locale - User's language (en, de, etc.) - defaults to 'en' for unsupported languages
   */
  async getApplicableRules(context, locale = 'en') {
    const { status, sourceSystem, entityType, requestType } = context;
    const cacheKey = `${status}-${sourceSystem}-${entityType}-${requestType}-${locale}`;

    // Check cache first
    if (this.validationCache.has(cacheKey)) {
      this.log.info('Using cached validation rules');
      return this.validationCache.get(cacheKey);
    }

    const { ValidationRules } = this.db.entities('mdm.db');

    // Normalize locale: Only 'en' and 'de' are supported, fallback to 'en' for others
    const effectiveLocale = (locale === 'de') ? 'de' : 'en';
    this.log.info(`Effective locale: ${effectiveLocale} (requested: ${locale})`);

    // Get all active rules filtered by locale
    // Single table approach: filter by locale field with fallback to 'en'
    let allRules = await SELECT.from(ValidationRules).where({
      isActive: true,
      locale: effectiveLocale
    });

    // If no rules found for locale and locale is not 'en', fallback to English
    if (allRules.length === 0 && effectiveLocale !== 'en') {
      this.log.warn(`No rules found for locale '${effectiveLocale}', falling back to English`);
      allRules = await SELECT.from(ValidationRules).where({
        isActive: true,
        locale: 'en'
      });
    }

    // Filter rules that match the context (field is null OR equals context value)
    const matchingRules = allRules.filter(rule => {
      const statusMatches = rule.status === null || rule.status === status;
      const sourceMatches = rule.sourceSystem === null || rule.sourceSystem === sourceSystem;
      const entityMatches = rule.entityType === null || rule.entityType === entityType;
      const requestMatches = rule.requestType === null || rule.requestType === requestType;

      return statusMatches && sourceMatches && entityMatches && requestMatches;
    });

    // Sort by priority and specificity
    matchingRules.sort((a, b) => {
      // First sort by priority (lower number = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      // Then by specificity (more specific = higher priority)
      const aSpec = (a.status ? 1000 : 0) + (a.sourceSystem ? 100 : 0) + (a.entityType ? 10 : 0) + (a.requestType ? 1 : 0);
      const bSpec = (b.status ? 1000 : 0) + (b.sourceSystem ? 100 : 0) + (b.entityType ? 10 : 0) + (b.requestType ? 1 : 0);

      return bSpec - aSpec; // Higher specificity first
    });

    // Deduplicate rules (most specific wins)
    const deduplicatedRules = this.deduplicateRules(matchingRules);

    // Cache for performance
    this.validationCache.set(cacheKey, deduplicatedRules);
    setTimeout(() => this.validationCache.delete(cacheKey), this.cacheTimeout);

    return deduplicatedRules;
  }

  /**
   * Deduplicate rules - when same targetField has multiple rules, keep highest priority
   * Priority is determined by specificity: more specific context = higher priority
   */
  deduplicateRules(rules) {
    const ruleMap = new Map();

    for (const rule of rules) {
      const key = `${rule.targetEntity}-${rule.targetField}-${rule.validationRule}`;

      // Calculate specificity score (higher = more specific)
      const specificity =
        (rule.status ? 1000 : 0) +
        (rule.sourceSystem ? 100 : 0) +
        (rule.entityType ? 10 : 0) +
        (rule.requestType ? 1 : 0);

      if (!ruleMap.has(key) || specificity > ruleMap.get(key).specificity) {
        ruleMap.set(key, { ...rule, specificity });
      }
    }

    return Array.from(ruleMap.values());
  }

  /**
   * Execute field-level validation
   * Dispatches to specific validation methods based on validationRule type
   */
  async executeFieldValidation(rule, data) {
    const { validationType, targetEntity, targetField, validationRule, validationValue } = rule;

    // Get field value from data
    const fieldValue = this.getFieldValue(data, targetEntity, targetField);

    // For country-specific postal code validations, pass full address records
    if (validationRule === 'Regex' && targetEntity === 'PartnerAddresses' && targetField === 'postalCode') {
      const countryCode = this.extractCountryFromRuleCode(rule.ruleCode);
      if (countryCode) {
        return this.validateCountrySpecificPostalCode(data, validationValue, countryCode, rule);
      }
    }

    // Execute validation based on rule type
    switch (validationRule) {
      case 'Required':
        return this.validateRequired(fieldValue, rule);

      case 'MinLength':
        return this.validateMinLength(fieldValue, parseInt(validationValue), rule);

      case 'MaxLength':
        return this.validateMaxLength(fieldValue, parseInt(validationValue), rule);

      case 'Regex':
        return this.validateRegex(fieldValue, validationValue, rule);

      case 'Email':
        return this.validateEmail(fieldValue, rule);

      case 'VAT':
        return this.validateVAT(fieldValue, rule);

      case 'IBAN':
        return this.validateIBAN(fieldValue, rule);

      case 'Custom':
        return this.executeCustomValidator(rule.customValidator, fieldValue, data, rule);

      default:
        this.log.warn(`Unknown validation rule: ${validationRule}`);
        return { isValid: true };
    }
  }

  /**
   * Execute section-level validation (min/max count) with dynamic error messages
   * Checks if child entity array meets minimum/maximum count requirements
   * Supports filterCriteria to check for specific record types (e.g., "Established" addresses)
   */
  async executeSectionValidation(rule, data) {
    const { sectionName, sectionLabel, minimumCount, maximumCount, filterCriteria } = rule;

    // Get section data (array of child records)
    let sectionData = data[sectionName] || [];
    const totalCount = Array.isArray(sectionData) ? sectionData.length : 0;

    // Apply filter criteria if specified (e.g., filter for "Established" addresses)
    if (filterCriteria) {
      try {
        let filters;

        // Try to parse as JSON first
        try {
          filters = JSON.parse(filterCriteria);
        } catch (jsonErr) {
          // If JSON parsing fails, try to parse as simple key=value format
          if (filterCriteria.includes('=')) {
            filters = {};
            const pairs = filterCriteria.split(',').map(p => p.trim());
            pairs.forEach(pair => {
              const [key, value] = pair.split('=').map(s => s.trim());
              if (key && value) {
                filters[key] = value;
              }
            });
            this.log.info(`Parsed plain string filterCriteria to JSON: ${JSON.stringify(filters)}`);
          } else {
            throw new Error('Invalid filterCriteria format');
          }
        }

        const originalCount = sectionData.length;

        // Filter array to only include records matching all filter conditions
        sectionData = sectionData.filter(record => {
          return Object.entries(filters).every(([field, value]) =>
            record[field] === value
          );
        });

        this.log.info(`Applied filter to ${sectionName}: ${JSON.stringify(filters)}, matched ${sectionData.length}/${originalCount} records`);
      } catch (err) {
        this.log.error(`Failed to parse filterCriteria for ${sectionName}: ${filterCriteria}`, err);
        // Continue with unfiltered data if parsing fails
      }
    }

    const actualCount = sectionData.length;

    // Check minimum count (on filtered data if filter was applied)
    if (minimumCount > 0 && actualCount < minimumCount) {
      return {
        isValid: false,
        errorMessage: this.replacePlaceholders(
          rule.minErrorMessage || '{sectionLabel} requires at least {minimumCount} record(s), but has {actualCount}',
          {
            sectionLabel,
            minimumCount,
            actualCount,
            totalCount // Include total count for better error messages
          }
        ),
        errorSeverity: rule.blockSubmission ? 'Error' : 'Warning',
        blockSubmission: rule.blockSubmission
      };
    }

    // Check maximum count
    if (maximumCount && actualCount > maximumCount) {
      return {
        isValid: false,
        errorMessage: this.replacePlaceholders(
          rule.maxErrorMessage || '{sectionLabel} allows maximum {maximumCount} record(s), but has {actualCount}',
          {
            sectionLabel,
            maximumCount,
            actualCount
          }
        ),
        errorSeverity: 'Error',
        blockSubmission: rule.blockSubmission
      };
    }

    return { isValid: true };
  }

  /**
   * Replace placeholders in error message with dynamic values
   * Supports both positional {0}, {1} and named {fieldLabel}, {minLength} placeholders
   *
   * @param {String} message - Error message template with placeholders
   * @param {Object|Array} values - Object with named placeholders or array for positional
   * @returns {String} - Message with placeholders replaced
   *
   * Examples:
   *   replacePlaceholders('{fieldLabel} is required', { fieldLabel: 'Partner Name' })
   *   => "Partner Name is required"
   *
   *   replacePlaceholders('{fieldLabel} must be at least {minLength} characters (current: {actualLength})',
   *     { fieldLabel: 'Partner Name', minLength: 3, actualLength: 2 })
   *   => "Partner Name must be at least 3 characters (current: 2)"
   */
  replacePlaceholders(message, values) {
    if (!message || !values) return message;

    let result = message;

    // Replace named placeholders: {fieldLabel}, {minLength}, etc.
    if (typeof values === 'object' && !Array.isArray(values)) {
      Object.keys(values).forEach(key => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        result = result.replace(regex, values[key]);
      });
    }

    // Replace positional placeholders: {0}, {1}, {2}
    if (Array.isArray(values)) {
      values.forEach((value, index) => {
        const regex = new RegExp(`\\{${index}\\}`, 'g');
        result = result.replace(regex, value);
      });
    }

    return result;
  }

  /**
   * Get localized field label for dynamic error messages
   * Falls back to humanized technical field name if label not found
   *
   * @param {String} targetEntity - Entity name
   * @param {String} targetField - Field name
   * @returns {String} - Localized or humanized field label
   */
  getFieldLabel(targetEntity, targetField) {
    if (!targetField) return 'Field';

    // Map of technical field names to human-readable labels
    // TODO: In future, load from i18n bundle for full localization
    const fieldLabels = {
      'partnerName': 'Partner Name',
      'street': 'Street',
      'city': 'City',
      'postalCode': 'Postal Code',
      'country': 'Country',
      'emailAddress': 'Email Address',
      'accountNumber': 'Account Number',
      'iban': 'IBAN',
      'vatNumber': 'VAT Number',
      'bankName': 'Bank Name',
      'paymentTerms': 'Payment Terms',
      'paymentMethod': 'Payment Method'
    };

    // Return mapped label if exists
    if (fieldLabels[targetField]) {
      return fieldLabels[targetField];
    }

    // Fallback: humanize technical name
    // Convert camelCase to Title Case: partnerName -> Partner Name
    return targetField
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Execute custom validator function
   * Loads custom validators from custom-validators.js library
   */
  async executeCustomValidator(validatorName, fieldValue, data, rule) {
    if (!validatorName) {
      this.log.warn('Custom validator name not specified');
      return { isValid: true };
    }

    try {
      const { customValidators } = require('./custom-validators');
      const validator = customValidators[validatorName];

      if (!validator) {
        this.log.error(`Custom validator not found: ${validatorName}`);
        return { isValid: true }; // Fail open - don't block user
      }

      return await validator(fieldValue, data, rule, this.db);
    } catch (error) {
      this.log.error(`Custom validator error (${validatorName}):`, error);
      return { isValid: true }; // Fail open - don't block user
    }
  }

  // ===== Validation Methods =====

  /**
   * Validate required field - checks for null, undefined, or empty string
   */
  validateRequired(value, rule) {
    // For arrays (child entity fields), check if any record has the field populated
    if (Array.isArray(value)) {
      const isValid = value.some(v => v !== null && v !== undefined && v !== '');
      return {
        isValid,
        errorMessage: isValid ? null : rule.errorMessage,
        errorSeverity: rule.errorSeverity,
        blockSubmission: rule.blockSubmission
      };
    }

    // For single values
    const isValid = value !== null && value !== undefined && value !== '';
    return {
      isValid,
      errorMessage: isValid ? null : rule.errorMessage,
      errorSeverity: rule.errorSeverity,
      blockSubmission: rule.blockSubmission
    };
  }

  /**
   * Validate minimum length with dynamic error messages
   */
  validateMinLength(value, minLength, rule) {
    if (!value) return { isValid: true }; // Skip if empty (handle by Required rule)

    const fieldLabel = this.getFieldLabel(rule.targetEntity, rule.targetField);

    // Handle arrays
    if (Array.isArray(value)) {
      const invalidValues = value.filter(v => v && String(v).length < minLength);
      const isValid = invalidValues.length === 0;

      // Get actual length of first invalid value for error message
      const actualLength = invalidValues.length > 0 ? String(invalidValues[0]).length : 0;

      return {
        isValid,
        errorMessage: isValid ? null : this.replacePlaceholders(rule.errorMessage, {
          fieldLabel,
          minLength,
          actualLength
        }),
        errorSeverity: rule.errorSeverity,
        blockSubmission: rule.blockSubmission
      };
    }

    // Handle single value
    const actualLength = String(value).length;
    const isValid = actualLength >= minLength;

    return {
      isValid,
      errorMessage: isValid ? null : this.replacePlaceholders(rule.errorMessage, {
        fieldLabel,
        minLength,
        actualLength
      }),
      errorSeverity: rule.errorSeverity,
      blockSubmission: rule.blockSubmission
    };
  }

  /**
   * Validate maximum length with dynamic error messages
   */
  validateMaxLength(value, maxLength, rule) {
    if (!value) return { isValid: true };

    const fieldLabel = this.getFieldLabel(rule.targetEntity, rule.targetField);

    // Handle arrays
    if (Array.isArray(value)) {
      const invalidValues = value.filter(v => v && String(v).length > maxLength);
      const isValid = invalidValues.length === 0;

      // Get actual length of first invalid value for error message
      const actualLength = invalidValues.length > 0 ? String(invalidValues[0]).length : 0;

      return {
        isValid,
        errorMessage: isValid ? null : this.replacePlaceholders(rule.errorMessage, {
          fieldLabel,
          maxLength,
          actualLength
        }),
        errorSeverity: rule.errorSeverity,
        blockSubmission: rule.blockSubmission
      };
    }

    // Handle single value
    const actualLength = String(value).length;
    const isValid = actualLength <= maxLength;

    return {
      isValid,
      errorMessage: isValid ? null : this.replacePlaceholders(rule.errorMessage, {
        fieldLabel,
        maxLength,
        actualLength
      }),
      errorSeverity: rule.errorSeverity,
      blockSubmission: rule.blockSubmission
    };
  }

  /**
   * Validate using regex pattern
   */
  validateRegex(value, pattern, rule) {
    if (!value) return { isValid: true };

    try {
      const regex = new RegExp(pattern);

      // Handle arrays
      if (Array.isArray(value)) {
        const invalidValues = value.filter(v => v && !regex.test(String(v)));
        const isValid = invalidValues.length === 0;
        return {
          isValid,
          errorMessage: isValid ? null : rule.errorMessage,
          errorSeverity: rule.errorSeverity,
          blockSubmission: rule.blockSubmission
        };
      }

      // Handle single value
      const isValid = regex.test(String(value));
      return {
        isValid,
        errorMessage: isValid ? null : rule.errorMessage,
        errorSeverity: rule.errorSeverity,
        blockSubmission: rule.blockSubmission
      };
    } catch (error) {
      this.log.error(`Invalid regex pattern: ${pattern}`, error);
      return { isValid: true }; // Fail open
    }
  }

  /**
   * Validate email format
   */
  validateEmail(value, rule) {
    if (!value) return { isValid: true };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Handle arrays
    if (Array.isArray(value)) {
      const invalidValues = value.filter(v => v && !emailRegex.test(String(v)));
      const isValid = invalidValues.length === 0;
      return {
        isValid,
        errorMessage: isValid ? null : rule.errorMessage,
        errorSeverity: rule.errorSeverity,
        blockSubmission: rule.blockSubmission
      };
    }

    // Handle single value
    const isValid = emailRegex.test(String(value));
    return {
      isValid,
      errorMessage: isValid ? null : rule.errorMessage,
      errorSeverity: rule.errorSeverity,
      blockSubmission: rule.blockSubmission
    };
  }

  /**
   * Validate VAT number using existing InputValidator
   */
  validateVAT(value, rule) {
    if (!value) return { isValid: true };

    try {
      const InputValidator = require('./input-validator');
      const validator = new InputValidator();

      // Handle arrays
      if (Array.isArray(value)) {
        const errors = [];
        for (const val of value) {
          if (val) {
            try {
              validator.validateVATNumber(val);
            } catch (error) {
              errors.push(val);
            }
          }
        }

        const isValid = errors.length === 0;
        return {
          isValid,
          errorMessage: isValid ? null : rule.errorMessage,
          errorSeverity: rule.errorSeverity,
          blockSubmission: rule.blockSubmission
        };
      }

      // Handle single value
      validator.validateVATNumber(value);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        errorMessage: rule.errorMessage || error.message,
        errorSeverity: rule.errorSeverity,
        blockSubmission: rule.blockSubmission
      };
    }
  }

  /**
   * Validate IBAN using existing InputValidator
   */
  validateIBAN(value, rule) {
    if (!value) return { isValid: true };

    try {
      const InputValidator = require('./input-validator');
      const validator = new InputValidator();

      // Handle arrays
      if (Array.isArray(value)) {
        const errors = [];
        for (const val of value) {
          if (val) {
            try {
              validator.validateIBAN(val);
            } catch (error) {
              errors.push(val);
            }
          }
        }

        const isValid = errors.length === 0;
        return {
          isValid,
          errorMessage: isValid ? null : rule.errorMessage,
          errorSeverity: rule.errorSeverity,
          blockSubmission: rule.blockSubmission
        };
      }

      // Handle single value
      validator.validateIBAN(value);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        errorMessage: rule.errorMessage || error.message,
        errorSeverity: rule.errorSeverity,
        blockSubmission: rule.blockSubmission
      };
    }
  }

  /**
   * Extract country code from rule code (e.g., VAL_POSTAL_DE => DE, VAL_POSTAL_US => US)
   * @param {String} ruleCode - Rule code to extract country from
   * @returns {String|null} - Country code or null if not country-specific
   */
  extractCountryFromRuleCode(ruleCode) {
    if (!ruleCode) return null;

    // Match pattern: VAL_POSTAL_XX where XX is 2-letter country code
    const match = ruleCode.match(/VAL_POSTAL_([A-Z]{2})$/);
    return match ? match[1] : null;
  }

  /**
   * Validate country-specific postal code
   * Only validates addresses that match the specified country
   * @param {Object} data - Full request data
   * @param {String} pattern - Regex pattern for postal code
   * @param {String} countryCode - Country code to filter by (e.g., 'DE', 'US')
   * @param {Object} rule - Validation rule
   * @returns {Object} - Validation result
   */
  validateCountrySpecificPostalCode(data, pattern, countryCode, rule) {
    const addresses = data.addresses || [];

    // Filter addresses matching the country
    const matchingAddresses = addresses.filter(addr => addr.country_code === countryCode);

    // If no addresses match this country, skip validation (rule doesn't apply)
    if (matchingAddresses.length === 0) {
      return { isValid: true };
    }

    // Validate postal codes for matching addresses
    try {
      const regex = new RegExp(pattern);
      const invalidPostalCodes = matchingAddresses.filter(addr => {
        return addr.postalCode && !regex.test(String(addr.postalCode));
      });

      const isValid = invalidPostalCodes.length === 0;

      return {
        isValid,
        errorMessage: isValid ? null : rule.errorMessage,
        errorSeverity: rule.errorSeverity,
        blockSubmission: rule.blockSubmission
      };
    } catch (error) {
      this.log.error(`Invalid regex pattern: ${pattern}`, error);
      return { isValid: true }; // Fail open
    }
  }

  // ===== Helper Methods =====

  /**
   * Get field value from request data
   * Handles both main entity fields and child entity fields
   * Also handles doubly-nested entities (e.g., SubAccountEmails inside SubAccounts)
   */
  getFieldValue(data, targetEntity, targetField) {
    if (!targetField) return null;

    // Handle doubly-nested entities (SubAccountEmails, SubAccountBanks inside SubAccounts)
    if (targetEntity === 'SubAccountEmails' || targetEntity === 'SubAccountBanks') {
      const subAccounts = data['subAccounts'] || [];
      if (!Array.isArray(subAccounts)) return null;

      const childArrayName = targetEntity === 'SubAccountEmails' ? 'emails' : 'banks';
      const allValues = [];

      // Flatten nested arrays: subAccounts[].emails[] or subAccounts[].banks[]
      subAccounts.forEach(subAccount => {
        const childArray = subAccount[childArrayName] || [];
        if (Array.isArray(childArray)) {
          childArray.forEach(child => {
            if (child[targetField] !== undefined && child[targetField] !== null) {
              allValues.push(child[targetField]);
            }
          });
        }
      });

      return allValues.length > 0 ? allValues : null;
    }

    // Handle regular nested entities (e.g., "PartnerAddresses.street")
    if (targetEntity && targetEntity !== 'BusinessPartnerRequests') {
      const sectionName = this.entityToSectionName(targetEntity);
      const section = data[sectionName];

      if (Array.isArray(section)) {
        // Return array of field values from all records
        return section.map(record => record[targetField]);
      }

      return null;
    }

    // Direct field on main entity
    return data[targetField];
  }

  /**
   * Convert entity name to section name (child entity property name)
   */
  entityToSectionName(entityName) {
    const map = {
      'PartnerAddresses': 'addresses',
      'PartnerEmails': 'emails',
      'PartnerBanks': 'banks',
      'PartnerVatIds': 'vatIds',
      'PartnerIdentifications': 'identifications',
      'SubAccounts': 'subAccounts'
    };
    return map[entityName] || entityName.toLowerCase();
  }

  /**
   * Add validation message to errors or warnings array
   */
  addValidationMessage(result, rule, errors, warnings) {
    const message = {
      field: rule.targetField || rule.sectionName,
      entity: rule.targetEntity || rule.sectionLabel,
      message: result.errorMessage,
      severity: result.errorSeverity || rule.errorSeverity,
      blockSubmission: result.blockSubmission !== undefined ? result.blockSubmission : rule.blockSubmission,
      ruleCode: rule.ruleCode,
      category: rule.category
    };

    if (result.errorSeverity === 'Warning' || rule.errorSeverity === 'Warning') {
      warnings.push(message);
    } else {
      errors.push(message);
    }
  }

  /**
   * Get section validation rules with language fallback
   * @param {Object} context - Validation context including locale
   * @param {String} locale - User's language (en, de, etc.) - defaults to 'en' for unsupported languages
   */
  async getSectionRules(context, locale = 'en') {
    const { status, sourceSystem, entityType } = context;
    const { SectionValidationRules } = this.db.entities('mdm.db');

    // Normalize locale: Only 'en' and 'de' are supported, fallback to 'en' for others
    const effectiveLocale = (locale === 'de') ? 'de' : 'en';

    // Get all active rules filtered by locale
    let allRules = await SELECT.from(SectionValidationRules).where({
      isActive: true,
      locale: effectiveLocale
    });

    // If no rules found for locale and locale is not 'en', fallback to English
    if (allRules.length === 0 && effectiveLocale !== 'en') {
      this.log.warn(`No section rules found for locale '${effectiveLocale}', falling back to English`);
      allRules = await SELECT.from(SectionValidationRules).where({
        isActive: true,
        locale: 'en'
      });
    }

    // Filter rules that match the context
    const matchingRules = allRules.filter(rule => {
      const statusMatches = rule.status === null || rule.status === status;
      const sourceMatches = rule.sourceSystem === null || rule.sourceSystem === sourceSystem;
      const entityMatches = rule.entityType === null || rule.entityType === entityType;

      return statusMatches && sourceMatches && entityMatches;
    });

    // Sort by priority
    matchingRules.sort((a, b) => a.priority - b.priority);

    return matchingRules;
  }

  /**
   * Get applicable validation rules for UI field indicators
   * Returns simplified rule list for frontend consumption
   * @param {String} locale - User's language (en, de, etc.)
   */
  async getApplicableRulesForUI(status, sourceSystem, entityType, requestType, locale = 'en') {
    const rules = await this.getApplicableRules({ status, sourceSystem, entityType, requestType, locale }, locale);

    // Return only mandatory field information for UI
    return rules
      .filter(r => r.validationRule === 'Required' && r.blockSubmission)
      .map(r => ({
        targetEntity: r.targetEntity,
        targetField: r.targetField,
        isMandatory: true,
        errorMessage: r.errorMessage
      }));
  }

  /**
   * Validate bank accounts - ensure each bank record has either IBAN or accountNumber
   * Business rule: For payment processing, either IBAN or account number must be provided
   *
   * @param {Array} banks - Array of bank account records
   * @param {String} locale - User's language (en, de, etc.)
   * @returns {Array} Array of validation results for each bank record
   */
  async validateBankAccounts(banks, locale = 'en') {
    const results = [];

    if (!banks || !Array.isArray(banks)) {
      return results;
    }

    // Error messages by locale
    const errorMessages = {
      en: 'Either IBAN or Account Number must be provided for bank account',
      de: 'Entweder IBAN oder Kontonummer muss für das Bankkonto angegeben werden'
    };

    const effectiveLocale = (locale === 'de') ? 'de' : 'en';
    const errorMessage = errorMessages[effectiveLocale];

    // Validate each bank record
    banks.forEach((bank, index) => {
      const hasIBAN = bank.iban && bank.iban.trim().length > 0;
      const hasAccountNumber = bank.accountNumber && bank.accountNumber.trim().length > 0;

      // Either IBAN or accountNumber must be present
      if (!hasIBAN && !hasAccountNumber) {
        const bankIdentifier = bank.bankName || `Bank #${index + 1}`;
        results.push({
          isValid: false,
          errorMessage: `${errorMessage} (${bankIdentifier})`,
          errorSeverity: 'Error',
          blockSubmission: true,
          field: 'iban_or_accountNumber',
          entity: 'PartnerBanks',
          recordIndex: index
        });
      } else {
        results.push({
          isValid: true
        });
      }
    });

    this.log.info(`Validated ${banks.length} bank accounts, found ${results.filter(r => !r.isValid).length} errors`);

    return results;
  }

  /**
   * Clear validation cache (useful for testing or when rules change)
   */
  clearCache() {
    this.validationCache.clear();
    this.log.info('Validation cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.validationCache.size,
      keys: Array.from(this.validationCache.keys())
    };
  }
}

module.exports = ValidationService;
