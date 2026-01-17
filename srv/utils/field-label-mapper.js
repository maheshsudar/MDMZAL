/**
 * Field Label Mapper
 *
 * Maps technical field names and paths to user-friendly labels
 * for better error messages in validation
 */

class FieldLabelMapper {
    constructor() {
        // Map of field paths to user-friendly labels
        this.labelMap = {
            // Main entity fields
            'partnerName': 'Partner Name',
            'name1': 'Name 1',
            'name2': 'Name 2',
            'entityType': 'Entity Type',
            'country_code': 'Country',
            'currency_code': 'Currency',
            'paymentTerms_code': 'Payment Terms',
            'paymentMethod_code': 'Payment Method',
            'bpType_code': 'Business Partner Type',
            'salesforceId': 'Salesforce ID',
            'coupaInternalNo': 'Coupa Internal Number',
            'existingBpNumber': 'Existing BP Number',
            'changeDescription': 'Change Description',

            // Address fields
            'addresses/street': 'Street',
            'addresses/streetNumber': 'Street Number',
            'addresses/city': 'City',
            'addresses/postalCode': 'Postal Code',
            'addresses/country_code': 'Country',
            'addresses/region': 'Region',
            'addresses/addressType_code': 'Address Type',

            // Email fields
            'emails/emailAddress': 'Email Address',
            'emails/emailType_code': 'Email Type',

            // Bank fields
            'banks/bankCountry_code': 'Bank Country',
            'banks/bankName': 'Bank Name',
            'banks/accountNumber': 'Account Number',
            'banks/swift': 'SWIFT/BIC Code',
            'banks/iban': 'IBAN',

            // VAT ID fields
            'vatIds/country_code': 'VAT Country',
            'vatIds/vatNumber': 'VAT Number',
            'vatIds/vatType_code': 'VAT Type',

            // SubAccount fields
            'subAccounts/subAccountId': 'Sub-Account ID',
            'subAccounts/revenueStream_code': 'Revenue Stream',
            'subAccounts/billingCycle_code': 'Billing Cycle',
            'subAccounts/currency_code': 'Currency',
            'subAccounts/paymentTerms_code': 'Payment Terms',
            'subAccounts/dunningProcedure_code': 'Dunning Procedure',
            'subAccounts/address_ID': 'Address'
        };
    }

    /**
     * Get user-friendly label for a field path
     * @param {string} fieldPath - Technical field path (e.g., 'in/partnerName' or 'in/addresses(...)/city')
     * @returns {string} - User-friendly label
     */
    getLabel(fieldPath) {
        if (!fieldPath) return 'Unknown Field';

        // Remove 'in/' prefix if present
        let path = fieldPath.replace(/^in\//, '');

        // Remove array indices like (ID=...) or (...)
        path = path.replace(/\([^)]*\)/g, '');

        // Remove trailing slashes
        path = path.replace(/\/$/, '');

        // Check if we have a direct mapping
        if (this.labelMap[path]) {
            return this.labelMap[path];
        }

        // Try to find a partial match (e.g., 'addresses/city' matches 'city')
        const pathParts = path.split('/');
        if (pathParts.length > 1) {
            const navigationProp = pathParts[0];
            const fieldName = pathParts[pathParts.length - 1];
            const combinedPath = `${navigationProp}/${fieldName}`;

            if (this.labelMap[combinedPath]) {
                return this.labelMap[combinedPath];
            }
        }

        // Fallback: Convert field name to title case
        const fieldName = pathParts[pathParts.length - 1];
        return this.toTitleCase(fieldName);
    }

    /**
     * Convert field name to title case
     * @param {string} fieldName - Field name (e.g., 'partnerName', 'country_code')
     * @returns {string} - Title case label (e.g., 'Partner Name', 'Country Code')
     */
    toTitleCase(fieldName) {
        if (!fieldName) return 'Unknown Field';

        // Handle field_code pattern
        fieldName = fieldName.replace(/_code$/, '');
        fieldName = fieldName.replace(/_/g, ' ');

        // Convert camelCase to space-separated
        fieldName = fieldName.replace(/([A-Z])/g, ' $1').trim();

        // Capitalize first letter of each word
        return fieldName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Enhance generic error message with field label
     * @param {string} message - Original error message (e.g., 'Provide the missing value.')
     * @param {string} fieldPath - Field path (e.g., 'in/partnerName')
     * @returns {string} - Enhanced message (e.g., 'Partner Name is required')
     */
    enhanceMessage(message, fieldPath) {
        const label = this.getLabel(fieldPath);

        // Map generic messages to field-specific messages
        if (message.includes('missing value') || message.includes('required')) {
            return `${label} is required`;
        }

        if (message.includes('invalid')) {
            return `${label} is invalid`;
        }

        // If message already contains the label or is specific, return as-is
        if (message.includes(label)) {
            return message;
        }

        // Prepend label to generic message
        return `${label}: ${message}`;
    }
}

// Export singleton instance
module.exports = new FieldLabelMapper();
