const cds = require('@sap/cds');
const { v4: uuidv4 } = require('uuid');

/**
 * Change Tracker Service
 * Captures field-level changes for Update requests
 * Used for:
 * - Showing detailed change history in all requesting apps (Coupa, Salesforce, MDM)
 * - Future Satellite Acknowledgment App for cross-system change notifications
 */
class ChangeTracker {
  constructor() {
    this.log = cds.log('change-tracker');
  }

  /**
   * Track changes between old and new request data
   * @param {String} requestId - Request UUID
   * @param {Object} oldData - Old request data (before update)
   * @param {Object} newData - New request data (after update)
   * @param {String} userId - User ID making the change
   * @param {String} userDisplayName - User display name
   * @returns {Array} Array of change log entries
   */
  async trackChanges(requestId, oldData, newData, userId = 'system', userDisplayName = 'System') {
    const changeLogs = [];
    const changeDate = new Date().toISOString();

    try {
      // Track main entity field changes
      const mainFieldChanges = this._compareMainFields(oldData, newData);
      mainFieldChanges.forEach(change => {
        changeLogs.push({
          ID: uuidv4(),
          request_ID: requestId,
          changeDate,
          changedBy: userId,
          changedByName: userDisplayName,
          ...change,
          createdAt: changeDate,
          createdBy: userId,
          modifiedAt: changeDate,
          modifiedBy: userId
        });
      });

      // Track child entity changes (addresses, emails, banks, vatIds)
      if (oldData.addresses || newData.addresses) {
        const addressChanges = this._compareChildEntities(
          oldData.addresses || [],
          newData.addresses || [],
          'Addresses',
          this._getAddressIdentifier.bind(this)
        );
        addressChanges.forEach(change => {
          changeLogs.push({
            ID: uuidv4(),
            request_ID: requestId,
            changeDate,
            changedBy: userId,
            changedByName: userDisplayName,
            ...change,
            createdAt: changeDate,
            createdBy: userId,
            modifiedAt: changeDate,
            modifiedBy: userId
          });
        });
      }

      if (oldData.emails || newData.emails) {
        const emailChanges = this._compareChildEntities(
          oldData.emails || [],
          newData.emails || [],
          'Email Contacts',
          this._getEmailIdentifier.bind(this)
        );
        emailChanges.forEach(change => {
          changeLogs.push({
            ID: uuidv4(),
            request_ID: requestId,
            changeDate,
            changedBy: userId,
            changedByName: userDisplayName,
            ...change,
            createdAt: changeDate,
            createdBy: userId,
            modifiedAt: changeDate,
            modifiedBy: userId
          });
        });
      }

      if (oldData.banks || newData.banks) {
        const bankChanges = this._compareChildEntities(
          oldData.banks || [],
          newData.banks || [],
          'Banking Details',
          this._getBankIdentifier.bind(this)
        );
        bankChanges.forEach(change => {
          changeLogs.push({
            ID: uuidv4(),
            request_ID: requestId,
            changeDate,
            changedBy: userId,
            changedByName: userDisplayName,
            ...change,
            createdAt: changeDate,
            createdBy: userId,
            modifiedAt: changeDate,
            modifiedBy: userId
          });
        });
      }

      if (oldData.vatIds || newData.vatIds) {
        const vatChanges = this._compareChildEntities(
          oldData.vatIds || [],
          newData.vatIds || [],
          'VAT IDs',
          this._getVatIdentifier.bind(this)
        );
        vatChanges.forEach(change => {
          changeLogs.push({
            ID: uuidv4(),
            request_ID: requestId,
            changeDate,
            changedBy: userId,
            changedByName: userDisplayName,
            ...change,
            createdAt: changeDate,
            createdBy: userId,
            modifiedAt: changeDate,
            modifiedBy: userId
          });
        });
      }

      // Track SubAccounts changes (Salesforce only)
      if (oldData.subAccounts || newData.subAccounts) {
        const subAccountChanges = this._compareSubAccounts(
          oldData.subAccounts || [],
          newData.subAccounts || []
        );
        subAccountChanges.forEach(change => {
          changeLogs.push({
            ID: uuidv4(),
            request_ID: requestId,
            changeDate,
            changedBy: userId,
            changedByName: userDisplayName,
            ...change,
            createdAt: changeDate,
            createdBy: userId,
            modifiedAt: changeDate,
            modifiedBy: userId
          });
        });
      }

      this.log.info('Changes tracked', {
        requestId,
        changeCount: changeLogs.length,
        userId
      });

      return changeLogs;

    } catch (error) {
      this.log.error('Error tracking changes', {
        requestId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Compare main entity fields and return changes
   * @private
   */
  _compareMainFields(oldData, newData) {
    const changes = [];

    // Define main fields to track (excluding child entities and system fields)
    const fieldsToTrack = {
      // Basic Information
      partnerName: { section: 'Basic Information', label: 'Partner Name' },
      entityType: { section: 'Basic Information', label: 'Entity Type' },
      requestType: { section: 'Basic Information', label: 'Request Type' },
      existingBpNumber: { section: 'Basic Information', label: 'Existing BP Number' },
      existingBpName: { section: 'Basic Information', label: 'Existing BP Name' },
      changeDescription: { section: 'Basic Information', label: 'Change Description' },

      // Business Details
      businessChannels: { section: 'Basic Information', label: 'Business Channels' },
      communicationLanguage: { section: 'Basic Information', label: 'Communication Language' },
      reconAccount: { section: 'Basic Information', label: 'Recon Account' },

      // Payment Details
      currency_code: { section: 'Payment Details', label: 'Currency' },
      paymentMethod_code: { section: 'Payment Details', label: 'Payment Method' },
      paymentTerms_code: { section: 'Payment Details', label: 'Payment Terms' },

      // Coupa Specific
      coupaInternalNo: { section: 'Coupa Details', label: 'Coupa Internal Number' },

      // Salesforce Specific
      salesforceId: { section: 'Salesforce Details', label: 'Salesforce ID' },
      accountType: { section: 'Salesforce Details', label: 'Account Type' },
      industry: { section: 'Salesforce Details', label: 'Industry' },
      revenueStream_code: { section: 'Salesforce Details', label: 'Revenue Stream' },
      billingCycle_code: { section: 'Salesforce Details', label: 'Billing Cycle' },
      bpType_code: { section: 'Salesforce Details', label: 'BP Type' },
      dunningProcedure_code: { section: 'Salesforce Details', label: 'Dunning Procedure' }
    };

    Object.keys(fieldsToTrack).forEach(fieldName => {
      const oldValue = oldData[fieldName];
      const newValue = newData[fieldName];

      // Only track if value actually changed (handle null/undefined as empty string)
      const oldStr = oldValue !== null && oldValue !== undefined ? String(oldValue) : '';
      const newStr = newValue !== null && newValue !== undefined ? String(newValue) : '';

      if (oldStr !== newStr) {
        const fieldConfig = fieldsToTrack[fieldName];
        changes.push({
          sectionName: fieldConfig.section,
          fieldName: fieldName,
          fieldLabel: fieldConfig.label,
          oldValue: oldStr,
          newValue: newStr,
          changeType: oldStr === '' ? 'Created' : (newStr === '' ? 'Deleted' : 'Modified'),
          recordIdentifier: null // Main entity, no child identifier needed
        });
      }
    });

    return changes;
  }

  /**
   * Compare child entity arrays and return changes
   * @private
   */
  _compareChildEntities(oldEntities, newEntities, sectionName, identifierFn) {
    const changes = [];

    // Select appropriate formatter based on section name
    const getFormatter = (sectionName) => {
      switch(sectionName) {
        case 'Addresses':
          return this._formatAddress.bind(this);
        case 'Email Contacts':
          return this._formatEmail.bind(this);
        case 'Banking Details':
          return this._formatBank.bind(this);
        case 'VAT IDs':
          return this._formatVatId.bind(this);
        case 'SubAccount Banks':
          return this._formatBank.bind(this);
        case 'SubAccount Emails':
          return this._formatEmail.bind(this);
        default:
          return (obj) => JSON.stringify(obj); // Fallback to JSON
      }
    };

    const formatter = getFormatter(sectionName);

    // Track deleted entities
    oldEntities.forEach((oldEntity, index) => {
      const matchingNew = newEntities.find(ne => ne.ID === oldEntity.ID);
      if (!matchingNew) {
        const identifier = identifierFn(oldEntity, index + 1);
        changes.push({
          sectionName,
          fieldName: 'record',
          fieldLabel: 'Record',
          oldValue: formatter(oldEntity),
          newValue: '',
          changeType: 'Deleted',
          recordIdentifier: identifier
        });
      }
    });

    // Track new and modified entities
    newEntities.forEach((newEntity, index) => {
      const matchingOld = oldEntities.find(oe => oe.ID === newEntity.ID);
      const identifier = identifierFn(newEntity, index + 1);

      if (!matchingOld) {
        // New entity
        changes.push({
          sectionName,
          fieldName: 'record',
          fieldLabel: 'Record',
          oldValue: '',
          newValue: formatter(newEntity),
          changeType: 'Created',
          recordIdentifier: identifier
        });
      } else {
        // Modified entity - track field-level changes
        Object.keys(newEntity).forEach(fieldName => {
          // Skip system fields and ID
          if (fieldName.startsWith('_') || fieldName === 'ID' ||
              fieldName === 'createdAt' || fieldName === 'createdBy' ||
              fieldName === 'modifiedAt' || fieldName === 'modifiedBy' ||
              fieldName === 'request_ID') {
            return;
          }

          const oldValue = matchingOld[fieldName];
          const newValue = newEntity[fieldName];

          const oldStr = oldValue !== null && oldValue !== undefined ? String(oldValue) : '';
          const newStr = newValue !== null && newValue !== undefined ? String(newValue) : '';

          if (oldStr !== newStr) {
            changes.push({
              sectionName,
              fieldName: fieldName,
              fieldLabel: this._humanizeFieldName(fieldName),
              oldValue: oldStr,
              newValue: newStr,
              changeType: 'Modified',
              recordIdentifier: identifier
            });
          }
        });
      }
    });

    return changes;
  }

  /**
   * Compare SubAccounts with their nested banks and emails
   * @private
   */
  _compareSubAccounts(oldSubAccounts, newSubAccounts) {
    const changes = [];

    // Track deleted subAccounts
    oldSubAccounts.forEach((oldSub, index) => {
      const matchingNew = newSubAccounts.find(ns => ns.ID === oldSub.ID);
      if (!matchingNew) {
        const identifier = `SubAccount #${index + 1} (${oldSub.subAccountId || 'N/A'})`;
        changes.push({
          sectionName: 'SubAccounts',
          fieldName: 'record',
          fieldLabel: 'SubAccount',
          oldValue: this._formatSubAccount(oldSub),
          newValue: '',
          changeType: 'Deleted',
          recordIdentifier: identifier
        });
      }
    });

    // Track new and modified subAccounts
    newSubAccounts.forEach((newSub, index) => {
      const matchingOld = oldSubAccounts.find(os => os.ID === newSub.ID);
      const identifier = `SubAccount #${index + 1} (${newSub.subAccountId || 'N/A'})`;

      if (!matchingOld) {
        // New subAccount
        changes.push({
          sectionName: 'SubAccounts',
          fieldName: 'record',
          fieldLabel: 'SubAccount',
          oldValue: '',
          newValue: this._formatSubAccount(newSub),
          changeType: 'Created',
          recordIdentifier: identifier
        });
      } else {
        // Modified subAccount - track field-level changes
        const subAccountFields = [
          'subAccountId', 'revenueStream_code', 'billingCycle_code',
          'currency_code', 'paymentTerms_code', 'dunningProcedure_code'
        ];

        subAccountFields.forEach(fieldName => {
          const oldValue = matchingOld[fieldName];
          const newValue = newSub[fieldName];

          const oldStr = oldValue !== null && oldValue !== undefined ? String(oldValue) : '';
          const newStr = newValue !== null && newValue !== undefined ? String(newValue) : '';

          if (oldStr !== newStr) {
            changes.push({
              sectionName: 'SubAccounts',
              fieldName: fieldName,
              fieldLabel: this._humanizeFieldName(fieldName),
              oldValue: oldStr,
              newValue: newStr,
              changeType: 'Modified',
              recordIdentifier: identifier
            });
          }
        });

        // Track SubAccount banks
        if (oldSub.banks || newSub.banks) {
          const bankChanges = this._compareChildEntities(
            oldSub.banks || [],
            newSub.banks || [],
            'SubAccount Banks',
            (bank, idx) => `${identifier} - Bank #${idx}`
          );
          changes.push(...bankChanges);
        }

        // Track SubAccount emails
        if (oldSub.emails || newSub.emails) {
          const emailChanges = this._compareChildEntities(
            oldSub.emails || [],
            newSub.emails || [],
            'SubAccount Emails',
            (email, idx) => `${identifier} - Email #${idx}`
          );
          changes.push(...emailChanges);
        }
      }
    });

    return changes;
  }

  /**
   * Get address identifier for display
   * @private
   */
  _getAddressIdentifier(address, index) {
    const type = address.addressType_code || 'Unknown';
    const city = address.city || '';
    return `Address #${index} (${type}${city ? ' - ' + city : ''})`;
  }

  /**
   * Get email identifier for display
   * @private
   */
  _getEmailIdentifier(email, index) {
    const type = email.emailType_code || 'Unknown';
    const addr = email.emailAddress || '';
    return `Email #${index} (${type}${addr ? ' - ' + addr : ''})`;
  }

  /**
   * Get bank identifier for display
   * @private
   */
  _getBankIdentifier(bank, index) {
    const country = bank.bankCountry_code || '';
    const name = bank.bankName || '';
    return `Bank #${index} (${country}${name ? ' - ' + name : ''})`;
  }

  /**
   * Get VAT ID identifier for display
   * @private
   */
  _getVatIdentifier(vat, index) {
    const country = vat.country_code || '';
    const vatId = vat.vatId || '';
    return `VAT #${index} (${country}${vatId ? ' - ' + vatId : ''})`;
  }

  /**
   * Convert field name to human-readable label
   * @private
   */
  _humanizeFieldName(fieldName) {
    // Remove _code suffix
    let label = fieldName.replace(/_code$/, '');

    // Split by underscore or camelCase
    label = label.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');

    // Capitalize first letter of each word
    label = label.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();

    return label;
  }

  /**
   * Format address object to human-readable string
   * @private
   */
  _formatAddress(address) {
    const parts = [];

    if (address.addressType_code) parts.push(`Type: ${address.addressType_code}`);
    if (address.street) parts.push(`Street: ${address.street}`);
    if (address.streetNumber) parts.push(`No: ${address.streetNumber}`);
    if (address.city) parts.push(`City: ${address.city}`);
    if (address.postalCode) parts.push(`Postal Code: ${address.postalCode}`);
    if (address.country_code) parts.push(`Country: ${address.country_code}`);
    if (address.sapAddressId) parts.push(`SAP Address ID: ${address.sapAddressId}`);

    return parts.length > 0 ? parts.join(', ') : 'No data';
  }

  /**
   * Format email object to human-readable string
   * @private
   */
  _formatEmail(email) {
    const parts = [];

    if (email.emailAddress) parts.push(`Email: ${email.emailAddress}`);
    if (email.sapAddressId) parts.push(`SAP Address ID: ${email.sapAddressId}`);
    if (email.sapOrdinalNumber) parts.push(`SAP Email ID: ${email.sapOrdinalNumber}`);
    if (email.notes) parts.push(`Notes: ${email.notes}`);

    return parts.length > 0 ? parts.join(', ') : 'No data';
  }

  /**
   * Format bank object to human-readable string
   * @private
   */
  _formatBank(bank) {
    const parts = [];

    if (bank.bankCountry_code) parts.push(`Country: ${bank.bankCountry_code}`);
    if (bank.bankKey) parts.push(`Bank Key: ${bank.bankKey}`);
    if (bank.accountHolder) parts.push(`Account Holder: ${bank.accountHolder}`);
    if (bank.accountNumber) parts.push(`Account: ${bank.accountNumber}`);
    if (bank.iban) parts.push(`IBAN: ${bank.iban}`);
    if (bank.swiftCode) parts.push(`SWIFT: ${bank.swiftCode}`);
    if (bank.sapBankIdentification) parts.push(`SAP Bank ID: ${bank.sapBankIdentification}`);

    return parts.length > 0 ? parts.join(', ') : 'No data';
  }

  /**
   * Format VAT ID object to human-readable string
   * @private
   */
  _formatVatId(vat) {
    const parts = [];

    if (vat.country_code) parts.push(`Country: ${vat.country_code}`);
    if (vat.vatNumber) parts.push(`VAT Number: ${vat.vatNumber}`);
    if (vat.vatType_code) parts.push(`Type: ${vat.vatType_code}`);
    if (vat.isEstablished !== null && vat.isEstablished !== undefined) {
      parts.push(`Established: ${vat.isEstablished ? 'Yes' : 'No'}`);
    }
    if (vat.validationStatus) parts.push(`Status: ${vat.validationStatus}`);

    return parts.length > 0 ? parts.join(', ') : 'No data';
  }

  /**
   * Format SubAccount object to human-readable string
   * @private
   */
  _formatSubAccount(subAccount) {
    const parts = [];

    if (subAccount.subAccountId) parts.push(`SubAccount ID: ${subAccount.subAccountId}`);
    if (subAccount.revenueStream_code) parts.push(`Revenue Stream: ${subAccount.revenueStream_code}`);
    if (subAccount.billingCycle_code) parts.push(`Billing Cycle: ${subAccount.billingCycle_code}`);
    if (subAccount.currency_code) parts.push(`Currency: ${subAccount.currency_code}`);
    if (subAccount.paymentTerms_code) parts.push(`Payment Terms: ${subAccount.paymentTerms_code}`);
    if (subAccount.dunningProcedure_code) parts.push(`Dunning: ${subAccount.dunningProcedure_code}`);

    // Add counts for nested collections
    if (subAccount.emails && subAccount.emails.length > 0) {
      parts.push(`Emails: ${subAccount.emails.length}`);
    }
    if (subAccount.banks && subAccount.banks.length > 0) {
      parts.push(`Banks: ${subAccount.banks.length}`);
    }

    return parts.length > 0 ? parts.join(', ') : 'No data';
  }

  /**
   * Save change logs to database
   * @param {Array} changeLogs - Array of change log entries
   */
  async saveChangeLogs(changeLogs) {
    if (changeLogs.length === 0) {
      return;
    }

    try {
      const db = await cds.connect.to('db');
      const { ChangeLogs } = db.entities('mdm.db');

      await INSERT.into(ChangeLogs).entries(changeLogs);

      this.log.info('Change logs saved', { count: changeLogs.length });
    } catch (error) {
      this.log.error('Error saving change logs', { error: error.message });
      throw error;
    }
  }
}

module.exports = ChangeTracker;
