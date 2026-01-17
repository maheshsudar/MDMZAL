/**
 * Custom validation functions for complex business rules
 * Each validator receives: (fieldValue, fullData, rule, db)
 * Each validator returns: { isValid, errorMessage, errorSeverity, blockSubmission }
 *
 * @module custom-validators
 * @author MDM Team
 * @date December 2024
 */

const customValidators = {
  /**
   * Validate street address format
   * Street should not be just numbers - must contain street name
   */
  validateStreetFormat: async (value, data, rule, db) => {
    if (!value) return { isValid: true };

    // Handle array of addresses
    if (Array.isArray(value)) {
      const invalidStreets = value.filter(v => v && /^\d+$/.test(v));
      const isValid = invalidStreets.length === 0;

      return {
        isValid,
        errorMessage: isValid ? null : 'Street address must contain street name, not just house number',
        errorSeverity: 'Error',
        blockSubmission: true
      };
    }

    // Handle single value
    if (/^\d+$/.test(value)) {
      return {
        isValid: false,
        errorMessage: 'Street address must contain street name, not just house number',
        errorSeverity: 'Error',
        blockSubmission: true
      };
    }

    return { isValid: true };
  },

  /**
   * Validate bank account number matches country format
   * Different countries have different account number formats
   */
  validateBankAccountCountry: async (value, data, rule, db) => {
    if (!value) return { isValid: true };

    const banks = data.banks || [];

    // Country-specific account number rules
    const countryRules = {
      'DE': /^\d{10,12}$/, // German account numbers: 10-12 digits
      'US': /^\d{9,12}$/, // US account numbers: 9-12 digits
      'GB': /^\d{8}$/, // UK account numbers: 8 digits
      'FR': /^\d{11}$/, // French account numbers: 11 digits
    };

    const invalidBanks = banks.filter(bank => {
      if (!bank.accountNumber || !bank.bankCountry) return false;

      const rule = countryRules[bank.bankCountry];
      if (!rule) return false; // No rule for this country - skip validation

      return !rule.test(bank.accountNumber);
    });

    if (invalidBanks.length > 0) {
      return {
        isValid: false,
        errorMessage: `Bank account number format does not match country requirements`,
        errorSeverity: 'Warning',
        blockSubmission: false
      };
    }

    return { isValid: true };
  },

  /**
   * Validate at least one primary address exists
   * Business rule: Exactly one address must be marked as primary
   */
  validatePrimaryAddress: async (value, data, rule, db) => {
    const addresses = data.addresses || [];

    if (addresses.length === 0) return { isValid: true }; // Skip if no addresses

    const primaryAddresses = addresses.filter(addr => addr.isPrimary === true);

    // No primary address
    if (primaryAddresses.length === 0) {
      return {
        isValid: false,
        errorMessage: 'At least one address must be marked as primary',
        errorSeverity: 'Error',
        blockSubmission: true
      };
    }

    // Multiple primary addresses
    if (primaryAddresses.length > 1) {
      return {
        isValid: false,
        errorMessage: 'Only one address can be marked as primary',
        errorSeverity: 'Error',
        blockSubmission: true
      };
    }

    return { isValid: true };
  },

  /**
   * Validate established VAT ID consistency
   * Business rule: If address has isEstablished=true, must have corresponding VAT ID for that country
   */
  validateEstablishedVatConsistency: async (value, data, rule, db) => {
    const addresses = data.addresses || [];
    const vatIds = data.vatIds || [];

    // Find all established addresses
    const establishedAddresses = addresses.filter(addr => addr.isEstablished === true);

    if (establishedAddresses.length === 0) return { isValid: true }; // No established addresses

    // Check each established address has corresponding VAT ID
    const missingVatCountries = [];

    for (const address of establishedAddresses) {
      const hasMatchingVat = vatIds.some(vat => vat.country === address.country);

      if (!hasMatchingVat) {
        missingVatCountries.push(address.country);
      }
    }

    if (missingVatCountries.length > 0) {
      return {
        isValid: false,
        errorMessage: `Established address(es) in ${missingVatCountries.join(', ')} require VAT ID for those countries`,
        errorSeverity: 'Warning',
        blockSubmission: false
      };
    }

    return { isValid: true };
  },

  /**
   * Validate supplier has bank account
   * Business rule: Suppliers must have at least one bank account for payment processing
   */
  validateSupplierBankAccount: async (value, data, rule, db) => {
    // Only validate if entity type is Supplier or Both
    if (data.entityType !== 'Supplier' && data.entityType !== 'Both') {
      return { isValid: true };
    }

    const banks = data.banks || [];

    if (banks.length === 0) {
      return {
        isValid: false,
        errorMessage: 'Suppliers must have at least one bank account for payment processing',
        errorSeverity: 'Error',
        blockSubmission: true
      };
    }

    return { isValid: true };
  },

  /**
   * Validate email domain is not disposable/temporary
   * Blocks common disposable email domains
   */
  validateEmailDomain: async (value, data, rule, db) => {
    if (!value) return { isValid: true };

    const disposableDomains = [
      'tempmail.com', 'guerrillamail.com', '10minutemail.com',
      'throwaway.email', 'mailinator.com', 'maildrop.cc'
    ];

    const emails = data.emails || [];

    const hasDisposable = emails.some(email => {
      if (!email.emailAddress) return false;

      const domain = email.emailAddress.split('@')[1]?.toLowerCase();
      return disposableDomains.includes(domain);
    });

    if (hasDisposable) {
      return {
        isValid: false,
        errorMessage: 'Disposable or temporary email addresses are not allowed',
        errorSeverity: 'Warning',
        blockSubmission: false
      };
    }

    return { isValid: true };
  },

  /**
   * Validate IBAN and SWIFT consistency
   * Business rule: If IBAN is provided, SWIFT must be provided (and vice versa)
   */
  validateIbanSwiftConsistency: async (value, data, rule, db) => {
    const banks = data.banks || [];

    const inconsistentBanks = banks.filter(bank => {
      const hasIban = !!bank.iban;
      const hasSwift = !!bank.swiftCode;

      // Both present or both absent is OK
      // Only one present is inconsistent
      return hasIban !== hasSwift;
    });

    if (inconsistentBanks.length > 0) {
      return {
        isValid: false,
        errorMessage: 'Bank accounts with IBAN must also have SWIFT/BIC code (and vice versa)',
        errorSeverity: 'Warning',
        blockSubmission: false
      };
    }

    return { isValid: true };
  },

  /**
   * Validate address completeness score
   * Business rule: Primary address should have all optional fields for better data quality
   */
  validateAddressCompleteness: async (value, data, rule, db) => {
    const addresses = data.addresses || [];
    const primaryAddress = addresses.find(addr => addr.isPrimary === true);

    if (!primaryAddress) return { isValid: true }; // No primary address yet

    // Check optional fields
    const optionalFields = ['name2', 'phoneNumber', 'faxNumber', 'region', 'district'];
    const missingFields = optionalFields.filter(field => !primaryAddress[field]);

    // Calculate completeness score
    const completeness = ((optionalFields.length - missingFields.length) / optionalFields.length) * 100;

    if (completeness < 60) {
      return {
        isValid: false,
        errorMessage: `Primary address is ${Math.round(completeness)}% complete. Consider adding: ${missingFields.join(', ')}`,
        errorSeverity: 'Info',
        blockSubmission: false
      };
    }

    return { isValid: true };
  },

  /**
   * Validate partner name doesn't contain suspicious patterns
   * Security check: Block common test/fake names
   */
  validatePartnerNameLegitimacy: async (value, data, rule, db) => {
    if (!value) return { isValid: true };

    const suspiciousPatterns = [
      /^test/i, /test$/i, /dummy/i, /fake/i, /xxx/i,
      /^aaa+$/i, /^bbb+$/i, /^111+$/, /^000+$/
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(data.partnerName || ''));

    if (isSuspicious) {
      return {
        isValid: false,
        errorMessage: 'Partner name appears to be a test or placeholder name',
        errorSeverity: 'Warning',
        blockSubmission: false
      };
    }

    return { isValid: true };
  },

  /**
   * Validate postal code matches country format
   * Country-specific postal code validation
   */
  validatePostalCodeByCountry: async (value, data, rule, db) => {
    const addresses = data.addresses || [];

    const postalCodeRules = {
      'DE': { pattern: /^[0-9]{5}$/, example: '10115' },
      'US': { pattern: /^[0-9]{5}(-[0-9]{4})?$/, example: '12345 or 12345-6789' },
      'GB': { pattern: /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i, example: 'SW1A 1AA' },
      'FR': { pattern: /^[0-9]{5}$/, example: '75001' },
      'CA': { pattern: /^[A-Z][0-9][A-Z] ?[0-9][A-Z][0-9]$/i, example: 'K1A 0B1' },
      'NL': { pattern: /^[0-9]{4} ?[A-Z]{2}$/i, example: '1012 AB' }
    };

    const invalidAddresses = addresses.filter(addr => {
      if (!addr.postalCode || !addr.country) return false;

      const rule = postalCodeRules[addr.country];
      if (!rule) return false; // No rule for this country - skip validation

      return !rule.pattern.test(addr.postalCode);
    });

    if (invalidAddresses.length > 0) {
      const country = invalidAddresses[0].country;
      const rule = postalCodeRules[country];

      return {
        isValid: false,
        errorMessage: `Postal code format for ${country} is invalid. Expected format: ${rule.example}`,
        errorSeverity: 'Error',
        blockSubmission: true
      };
    }

    return { isValid: true };
  }
};

module.exports = { customValidators };
