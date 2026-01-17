const ErrorHandler = require('./error-handler');

/**
 * Comprehensive Input Validation and Sanitization Module
 * Implements security best practices for MDM Business Partner data
 */
class InputValidator {

  /**
   * Regular expressions for various data formats
   */
  static PATTERNS = {
    // Email validation (RFC 5322 compliant)
    EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

    // Partner name (alphanumeric, spaces, common business suffixes)
    PARTNER_NAME: /^[a-zA-Z0-9\s\.\-\&\,\(\)\'\"]+$/,

    // VAT ID patterns by country
    VAT_PATTERNS: {
      'AT': /^ATU[0-9]{8}$/, // Austria
      'BE': /^BE[0-9]{10}$/, // Belgium
      'BG': /^BG[0-9]{9,10}$/, // Bulgaria
      'HR': /^HR[0-9]{11}$/, // Croatia
      'CY': /^CY[0-9]{8}[A-Z]$/, // Cyprus
      'CZ': /^CZ[0-9]{8,10}$/, // Czech Republic
      'DK': /^DK[0-9]{8}$/, // Denmark
      'EE': /^EE[0-9]{9}$/, // Estonia
      'FI': /^FI[0-9]{8}$/, // Finland
      'FR': /^FR[A-HJ-NP-Z0-9]{2}[0-9]{9}$/, // France
      'DE': /^DE[0-9]{9}$/, // Germany
      'GR': /^GR[0-9]{9}$/, // Greece
      'HU': /^HU[0-9]{8}$/, // Hungary
      'IE': /^IE[0-9][A-Z][0-9]{5}[A-Z]|IE[0-9]{7}[A-WY-Z][A-I]$/, // Ireland
      'IT': /^IT[0-9]{11}$/, // Italy
      'LV': /^LV[0-9]{11}$/, // Latvia
      'LT': /^LT([0-9]{9}|[0-9]{12})$/, // Lithuania
      'LU': /^LU[0-9]{8}$/, // Luxembourg
      'MT': /^MT[0-9]{8}$/, // Malta
      'NL': /^NL[0-9]{9}B[0-9]{2}$/, // Netherlands
      'PL': /^PL[0-9]{10}$/, // Poland
      'PT': /^PT[0-9]{9}$/, // Portugal
      'RO': /^RO[0-9]{2,10}$/, // Romania
      'SK': /^SK[0-9]{10}$/, // Slovakia
      'SI': /^SI[0-9]{8}$/, // Slovenia
      'ES': /^ES[A-Z][0-9]{7}[0-9A-Z]$/, // Spain
      'SE': /^SE[0-9]{12}$/, // Sweden
      'US': /^[0-9]{2}-[0-9]{7}$/, // US Tax ID
      'CA': /^[0-9]{9}RT[0-9]{4}$/, // Canada Business Number
      'AU': /^[0-9]{11}$/, // Australia ABN
      'JP': /^[0-9]{13}$/, // Japan Corporate Number
    },

    // IBAN validation
    IBAN: /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/,

    // SWIFT/BIC code
    SWIFT: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,

    // Postal codes by country
    POSTAL_CODES: {
      'US': /^[0-9]{5}(-[0-9]{4})?$/,
      'CA': /^[A-Z][0-9][A-Z] [0-9][A-Z][0-9]$/,
      'GB': /^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][A-Z]{2}$/,
      'DE': /^[0-9]{5}$/,
      'FR': /^[0-9]{5}$/,
      'IT': /^[0-9]{5}$/,
      'ES': /^[0-9]{5}$/,
      'NL': /^[0-9]{4} ?[A-Z]{2}$/,
      'AU': /^[0-9]{4}$/,
      'JP': /^[0-9]{3}-[0-9]{4}$/,
    },

    // Phone number (international format)
    PHONE: /^\+[1-9]\d{1,14}$/,

    // Currency codes (ISO 4217)
    CURRENCY: /^[A-Z]{3}$/,

    // Country codes (ISO 3166-1 alpha-2)
    COUNTRY: /^[A-Z]{2}$/,

    // Alphanumeric with limited special characters
    ALPHANUMERIC_EXTENDED: /^[a-zA-Z0-9\s\.\-\_\&\,\(\)\'\"]+$/,

    // Request number format
    REQUEST_NUMBER: /^MDM-[0-9]{8}-[0-9]{4}$/,

    // SAP BP number format
    SAP_BP_NUMBER: /^BP[0-9]{6}$/,

    // XSS/SQL Injection detection patterns
    SUSPICIOUS_PATTERNS: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /(union|select|insert|update|delete|drop|create|alter|exec|execute)\s+/gi,
      /['"]\s*;\s*(union|select|insert|update|delete|drop|create|alter|exec|execute)/gi
    ]
  };

  /**
   * Validate and sanitize business partner request data
   *
   * @param {Object} data - Business partner request data
   * @param {string} requestType - 'Create' or 'Update'
   * @returns {Object} Validation result with sanitized data
   */
  static validateBusinessPartnerRequest(data, requestType = 'Create') {
    const errors = [];
    const warnings = [];
    const sanitizedData = this.deepClone(data);

    try {
      // 1. Required field validation
      this.validateRequiredFields(sanitizedData, requestType, errors);

      // 2. Format validation and sanitization
      this.validateAndSanitizeBasicFields(sanitizedData, errors, warnings);

      // 3. Business rule validation
      this.validateBusinessRules(sanitizedData, requestType, errors, warnings);

      // 4. Security validation (XSS, SQL injection prevention)
      this.validateSecurity(sanitizedData, errors);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedData
      };

    } catch (error) {
      errors.push({
        field: 'general',
        message: error.message,
        severity: 'Error'
      });

      return {
        isValid: false,
        errors,
        warnings,
        sanitizedData
      };
    }
  }

  /**
   * Validate required fields based on request type
   */
  static validateRequiredFields(data, requestType, errors) {
    const requiredFields = ['partnerName'];

    if (requestType === 'Update') {
      requiredFields.push('existingBpNumber', 'changeDescription');
    }

    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push({
          field,
          message: `${field} is required`,
          severity: 'Error'
        });
      }
    }

    // Partner name minimum length
    if (data.partnerName && data.partnerName.trim().length < 3) {
      errors.push({
        field: 'partnerName',
        message: 'Partner name must be at least 3 characters long',
        severity: 'Error'
      });
    }

    // Partner name maximum length
    if (data.partnerName && data.partnerName.length > 100) {
      errors.push({
        field: 'partnerName',
        message: 'Partner name cannot exceed 100 characters',
        severity: 'Error'
      });
    }
  }

  /**
   * Validate and sanitize basic fields
   */
  static validateAndSanitizeBasicFields(data, errors, warnings) {
    // Partner name validation and sanitization
    if (data.partnerName) {
      data.partnerName = this.sanitizeString(data.partnerName);
      if (!this.PATTERNS.PARTNER_NAME.test(data.partnerName)) {
        errors.push({
          field: 'partnerName',
          message: 'Partner name contains invalid characters',
          severity: 'Error'
        });
      }
    }

    // Search term sanitization
    if (data.searchTerm) {
      data.searchTerm = this.sanitizeString(data.searchTerm).substring(0, 20);
    }

    // Entity type validation
    if (data.entityType && !['Supplier', 'Customer', 'Both'].includes(data.entityType)) {
      errors.push({
        field: 'entityType',
        message: 'Entity type must be one of: Supplier, Customer, Both',
        severity: 'Error'
      });
    }

    // Source system validation
    const validSystems = ['Manual', 'Coupa', 'Salesforce', 'PI'];
    if (data.sourceSystem && !validSystems.includes(data.sourceSystem)) {
      errors.push({
        field: 'sourceSystem',
        message: `Source system must be one of: ${validSystems.join(', ')}`,
        severity: 'Error'
      });
    }

    // Currency code validation
    if (data.currency_code && !this.PATTERNS.CURRENCY.test(data.currency_code)) {
      errors.push({
        field: 'currency_code',
        message: 'Currency code must be a valid 3-letter ISO code (e.g., USD, EUR)',
        severity: 'Error'
      });
    }

    // Communication language validation
    if (data.communicationLanguage && data.communicationLanguage.length !== 2) {
      errors.push({
        field: 'communicationLanguage',
        message: 'Communication language must be a 2-letter language code',
        severity: 'Error'
      });
    }

    // Company code validation (SAP standard)
    if (data.companyCode && !/^[A-Z0-9]{4}$/.test(data.companyCode)) {
      warnings.push({
        field: 'companyCode',
        message: 'Company code should be 4 alphanumeric characters',
        recommendation: 'Verify company code format with SAP standards'
      });
    }

    // Payment terms validation
    if (data.paymentTerms && !/^[A-Z0-9]{1,10}$/.test(data.paymentTerms)) {
      warnings.push({
        field: 'paymentTerms',
        message: 'Payment terms should be alphanumeric (up to 10 characters)',
        recommendation: 'Use standard SAP payment terms codes'
      });
    }
  }

  /**
   * Validate business rules
   */
  static validateBusinessRules(data, requestType, errors, warnings) {
    // Business channels validation
    if (data.businessChannels) {
      const channels = data.businessChannels.split(',').map(c => c.trim());
      const validChannels = ['MERCH', 'NONMERCH', 'SERVICES', 'DIGITAL', 'CONSULTING'];
      const invalidChannels = channels.filter(c => !validChannels.includes(c));

      if (invalidChannels.length > 0) {
        warnings.push({
          field: 'businessChannels',
          message: `Unknown business channels: ${invalidChannels.join(', ')}`,
          recommendation: `Valid channels: ${validChannels.join(', ')}`
        });
      }
    }

    // Entity type and partner role consistency
    if (data.entityType && data.partnerRole && data.entityType !== data.partnerRole) {
      if (data.entityType !== 'Both') {
        warnings.push({
          field: 'partnerRole',
          message: 'Partner role should match entity type',
          recommendation: `Consider setting partner role to ${data.entityType}`
        });
      }
    }

    // Update request validation
    if (requestType === 'Update') {
      if (data.existingBpNumber && !this.PATTERNS.SAP_BP_NUMBER.test(data.existingBpNumber)) {
        errors.push({
          field: 'existingBpNumber',
          message: 'Invalid SAP BP number format (expected: BP######)',
          severity: 'Error'
        });
      }

      if (data.changeDescription && data.changeDescription.length < 10) {
        warnings.push({
          field: 'changeDescription',
          message: 'Change description is very brief',
          recommendation: 'Provide detailed description of changes for audit purposes'
        });
      }
    }
  }

  /**
   * Validate addresses array
   */
  static validateAddresses(addresses, errors, warnings) {
    if (!Array.isArray(addresses) || addresses.length === 0) {
      errors.push({
        field: 'addresses',
        message: 'At least one address is required',
        severity: 'Error'
      });
      return;
    }

    const hasMainAddress = addresses.some(addr => addr.addressType === 'Main');
    if (!hasMainAddress) {
      errors.push({
        field: 'addresses',
        message: 'A Main address (established address) is required',
        severity: 'Error'
      });
    }

    addresses.forEach((address, index) => {
      this.validateSingleAddress(address, index, errors, warnings);
    });
  }

  /**
   * Validate single address
   */
  static validateSingleAddress(address, index, errors, warnings) {
    const prefix = `addresses[${index}]`;

    // Required fields
    const requiredFields = ['name1', 'street', 'city', 'postalCode', 'country_code'];
    for (const field of requiredFields) {
      if (!address[field] || address[field].trim() === '') {
        errors.push({
          field: `${prefix}.${field}`,
          message: `${field} is required for address`,
          severity: 'Error'
        });
      }
    }

    // Country code validation
    if (address.country_code && !this.PATTERNS.COUNTRY.test(address.country_code)) {
      errors.push({
        field: `${prefix}.country_code`,
        message: 'Country code must be a valid 2-letter ISO code',
        severity: 'Error'
      });
    }

    // Postal code validation by country
    if (address.country_code && address.postalCode) {
      const pattern = this.PATTERNS.POSTAL_CODES[address.country_code];
      if (pattern && !pattern.test(address.postalCode)) {
        warnings.push({
          field: `${prefix}.postalCode`,
          message: `Postal code format may be invalid for ${address.country_code}`,
          recommendation: 'Verify postal code format for the specified country'
        });
      }
    }

    // Address type validation
    const validAddressTypes = ['Main', 'Billing', 'Shipping', 'Legal'];
    if (address.addressType && !validAddressTypes.includes(address.addressType)) {
      errors.push({
        field: `${prefix}.addressType`,
        message: `Address type must be one of: ${validAddressTypes.join(', ')}`,
        severity: 'Error'
      });
    }

    // Sanitize string fields
    const stringFields = ['name1', 'name2', 'name3', 'name4', 'street', 'streetNumber', 'city', 'region'];
    stringFields.forEach(field => {
      if (address[field]) {
        address[field] = this.sanitizeString(address[field]);
      }
    });
  }

  /**
   * Validate emails array
   */
  static validateEmails(emails, errors, warnings) {
    if (!Array.isArray(emails) || emails.length === 0) {
      warnings.push({
        field: 'emails',
        message: 'No email addresses provided',
        recommendation: 'Consider adding at least one email address for communication'
      });
      return;
    }

    const primaryEmails = emails.filter(email => email.isDefault);
    if (primaryEmails.length > 1) {
      errors.push({
        field: 'emails',
        message: 'Only one email can be set as default',
        severity: 'Error'
      });
    }

    emails.forEach((email, index) => {
      this.validateSingleEmail(email, index, errors, warnings);
    });
  }

  /**
   * Validate single email
   */
  static validateSingleEmail(email, index, errors, warnings) {
    const prefix = `emails[${index}]`;

    if (!email.emailAddress || !this.PATTERNS.EMAIL.test(email.emailAddress)) {
      errors.push({
        field: `${prefix}.emailAddress`,
        message: 'Valid email address is required',
        severity: 'Error'
      });
    }

    const validEmailTypes = ['Primary', 'Secondary', 'Finance', 'Purchasing'];
    if (email.emailType && !validEmailTypes.includes(email.emailType)) {
      errors.push({
        field: `${prefix}.emailType`,
        message: `Email type must be one of: ${validEmailTypes.join(', ')}`,
        severity: 'Error'
      });
    }

    // Sanitize notes
    if (email.notes) {
      email.notes = this.sanitizeString(email.notes);
    }
  }

  /**
   * Validate VAT IDs array
   */
  static validateVatIds(vatIds, errors, warnings) {
    if (!Array.isArray(vatIds) || vatIds.length === 0) {
      warnings.push({
        field: 'vatIds',
        message: 'No VAT IDs provided',
        recommendation: 'Add VAT ID if business requires tax registration'
      });
      return;
    }

    vatIds.forEach((vatId, index) => {
      this.validateSingleVatId(vatId, index, errors, warnings);
    });
  }

  /**
   * Validate single VAT ID
   */
  static validateSingleVatId(vatId, index, errors, warnings) {
    const prefix = `vatIds[${index}]`;

    if (!vatId.country_code || !this.PATTERNS.COUNTRY.test(vatId.country_code)) {
      errors.push({
        field: `${prefix}.country_code`,
        message: 'Valid country code is required for VAT ID',
        severity: 'Error'
      });
    }

    if (!vatId.vatNumber || vatId.vatNumber.trim() === '') {
      errors.push({
        field: `${prefix}.vatNumber`,
        message: 'VAT number is required',
        severity: 'Error'
      });
    }

    // Country-specific VAT ID format validation
    if (vatId.country_code && vatId.vatNumber) {
      const pattern = this.PATTERNS.VAT_PATTERNS[vatId.country_code];
      if (pattern && !pattern.test(vatId.vatNumber)) {
        warnings.push({
          field: `${prefix}.vatNumber`,
          message: `VAT number format may be invalid for ${vatId.country_code}`,
          recommendation: 'Verify VAT number format with local tax authority'
        });
      }
    }
  }

  /**
   * Validate bank accounts array
   */
  static validateBanks(banks, errors, warnings) {
    if (!Array.isArray(banks) || banks.length === 0) {
      warnings.push({
        field: 'banks',
        message: 'No bank accounts provided',
        recommendation: 'Add bank account information for payment processing'
      });
      return;
    }

    banks.forEach((bank, index) => {
      this.validateSingleBank(bank, index, errors, warnings);
    });
  }

  /**
   * Validate single bank account
   */
  static validateSingleBank(bank, index, errors, warnings) {
    const prefix = `banks[${index}]`;

    const requiredFields = ['bankName', 'accountNumber'];
    for (const field of requiredFields) {
      if (!bank[field] || bank[field].trim() === '') {
        errors.push({
          field: `${prefix}.${field}`,
          message: `${field} is required for bank account`,
          severity: 'Error'
        });
      }
    }

    // Bank country validation
    if (bank.bankCountry_code && !this.PATTERNS.COUNTRY.test(bank.bankCountry_code)) {
      errors.push({
        field: `${prefix}.bankCountry_code`,
        message: 'Bank country code must be a valid 2-letter ISO code',
        severity: 'Error'
      });
    }

    // IBAN validation
    if (bank.iban && !this.PATTERNS.IBAN.test(bank.iban.replace(/\s/g, ''))) {
      warnings.push({
        field: `${prefix}.iban`,
        message: 'IBAN format may be invalid',
        recommendation: 'Verify IBAN format and check digit'
      });
    }

    // SWIFT code validation
    if (bank.swiftCode && !this.PATTERNS.SWIFT.test(bank.swiftCode)) {
      warnings.push({
        field: `${prefix}.swiftCode`,
        message: 'SWIFT/BIC code format may be invalid',
        recommendation: 'Verify SWIFT code with bank'
      });
    }

    // Currency validation
    if (bank.currency_code && !this.PATTERNS.CURRENCY.test(bank.currency_code)) {
      errors.push({
        field: `${prefix}.currency_code`,
        message: 'Currency code must be a valid 3-letter ISO code',
        severity: 'Error'
      });
    }

    // Sanitize string fields
    const stringFields = ['bankName', 'accountHolder', 'bankReference'];
    stringFields.forEach(field => {
      if (bank[field]) {
        bank[field] = this.sanitizeString(bank[field]);
      }
    });
  }

  /**
   * Security validation - check for XSS, SQL injection, etc.
   */
  static validateSecurity(data, errors) {
    const checkField = (fieldName, value) => {
      if (typeof value === 'string') {
        for (const pattern of this.PATTERNS.SUSPICIOUS_PATTERNS) {
          if (pattern.test(value)) {
            errors.push({
              field: fieldName,
              message: 'Field contains potentially unsafe content',
              severity: 'Error'
            });
            break;
          }
        }
      }
    };

    // Check all string fields recursively
    this.recursiveSecurityCheck(data, '', checkField);
  }

  /**
   * Recursively check object for security issues
   */
  static recursiveSecurityCheck(obj, prefix, checkFunction) {
    for (const [key, value] of Object.entries(obj)) {
      const fieldName = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'string') {
        checkFunction(fieldName, value);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            this.recursiveSecurityCheck(item, `${fieldName}[${index}]`, checkFunction);
          } else if (typeof item === 'string') {
            checkFunction(`${fieldName}[${index}]`, item);
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        this.recursiveSecurityCheck(value, fieldName, checkFunction);
      }
    }
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input) {
    if (typeof input !== 'string') return input;

    return input
      .trim()
      .replace(/[<>'"&]/g, (match) => {
        const entityMap = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entityMap[match];
      });
  }

  /**
   * Deep clone object
   */
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Validate complete business partner request with all related data
   */
  static async validateCompleteRequest(requestData) {
    const errors = [];
    const warnings = [];

    // 1. Validate main request data
    const mainValidation = this.validateBusinessPartnerRequest(
      requestData,
      requestData.requestType || 'Create'
    );

    errors.push(...mainValidation.errors);
    warnings.push(...mainValidation.warnings);

    // 2. Validate addresses
    if (requestData.addresses) {
      this.validateAddresses(requestData.addresses, errors, warnings);
    }

    // 3. Validate emails
    if (requestData.emails) {
      this.validateEmails(requestData.emails, errors, warnings);
    }

    // 4. Validate VAT IDs
    if (requestData.vatIds) {
      this.validateVatIds(requestData.vatIds, errors, warnings);
    }

    // 5. Validate banks
    if (requestData.banks) {
      this.validateBanks(requestData.banks, errors, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData: mainValidation.sanitizedData
    };
  }

  /**
   * Instance method: Validate IBAN format
   * Called by ValidationService for individual IBAN validation
   * @param {String} iban - IBAN to validate
   * @throws {Error} If IBAN format is invalid
   */
  validateIBAN(iban) {
    if (!iban) {
      throw new Error('IBAN is required');
    }

    // Remove spaces and convert to uppercase
    const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

    // Check basic format: 2 letters + 2 digits + up to 30 alphanumeric
    const basicFormat = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/;
    if (!basicFormat.test(cleanIBAN)) {
      throw new Error('Invalid IBAN format');
    }

    // Validate IBAN length by country
    const ibanLengths = {
      'AD': 24, 'AE': 23, 'AL': 28, 'AT': 20, 'AZ': 28, 'BA': 20, 'BE': 16,
      'BG': 22, 'BH': 22, 'BR': 29, 'BY': 28, 'CH': 21, 'CR': 22, 'CY': 28,
      'CZ': 24, 'DE': 22, 'DK': 18, 'DO': 28, 'EE': 20, 'EG': 29, 'ES': 24,
      'FI': 18, 'FO': 18, 'FR': 27, 'GB': 22, 'GE': 22, 'GI': 23, 'GL': 18,
      'GR': 27, 'GT': 28, 'HR': 21, 'HU': 28, 'IE': 22, 'IL': 23, 'IS': 26,
      'IT': 27, 'JO': 30, 'KW': 30, 'KZ': 20, 'LB': 28, 'LI': 21, 'LT': 20,
      'LU': 20, 'LV': 21, 'MC': 27, 'MD': 24, 'ME': 22, 'MK': 19, 'MR': 27,
      'MT': 31, 'MU': 30, 'NL': 18, 'NO': 15, 'PK': 24, 'PL': 28, 'PS': 29,
      'PT': 25, 'QA': 29, 'RO': 24, 'RS': 22, 'SA': 24, 'SE': 24, 'SI': 19,
      'SK': 24, 'SM': 27, 'TN': 24, 'TR': 26, 'UA': 29, 'VA': 22, 'VG': 24,
      'XK': 20
    };

    const countryCode = cleanIBAN.substring(0, 2);
    const expectedLength = ibanLengths[countryCode];

    if (expectedLength && cleanIBAN.length !== expectedLength) {
      throw new Error(`IBAN length for ${countryCode} should be ${expectedLength} characters, but got ${cleanIBAN.length}`);
    }

    // Validate check digits using mod-97 algorithm
    const rearranged = cleanIBAN.substring(4) + cleanIBAN.substring(0, 4);
    const numericIBAN = rearranged.replace(/[A-Z]/g, (char) => {
      return (char.charCodeAt(0) - 55).toString();
    });

    // Calculate mod 97 for large numbers
    let remainder = numericIBAN;
    while (remainder.length > 2) {
      const block = remainder.substring(0, 9);
      remainder = (parseInt(block, 10) % 97).toString() + remainder.substring(block.length);
    }

    if (parseInt(remainder, 10) % 97 !== 1) {
      throw new Error('Invalid IBAN check digits');
    }

    // IBAN is valid
    return true;
  }

  /**
   * Instance method: Validate VAT number format
   * Called by ValidationService for individual VAT validation
   * @param {String} vatNumber - VAT number to validate
   * @throws {Error} If VAT format is invalid
   */
  validateVATNumber(vatNumber) {
    if (!vatNumber) {
      throw new Error('VAT number is required');
    }

    // Extract country code (first 2 letters)
    const countryMatch = vatNumber.match(/^([A-Z]{2})/);
    if (!countryMatch) {
      throw new Error('VAT number must start with 2-letter country code');
    }

    const countryCode = countryMatch[1];
    const pattern = InputValidator.PATTERNS.VAT_PATTERNS[countryCode];

    if (!pattern) {
      throw new Error(`VAT validation not supported for country: ${countryCode}`);
    }

    if (!pattern.test(vatNumber)) {
      throw new Error(`Invalid VAT number format for ${countryCode}`);
    }

    // VAT number is valid
    return true;
  }
}

module.exports = InputValidator;