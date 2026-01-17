/**
 * Unified Request Number Generator
 *
 * Provides consistent request number generation across all services:
 * - Salesforce
 * - Coupa
 * - PI (Purchasing Interface)
 * - MDM
 * - ADHOC (Adhoc Sync requests)
 *
 * Format: {PREFIX}-{NNNNNNNNNN} (10-digit sequential number, zero-padded)
 * Examples:
 *   - SALESFORCE-0000000001
 *   - COUPA-0000000001
 *   - PI-0000000001
 *   - MDM-0000000001
 *   - ADHOC-0000000001
 *
 * Works consistently for:
 * - Draft entities
 * - Active entities
 * - Create requests
 * - Change/Update requests
 * - AdhocSync requests
 */

const cds = require('@sap/cds');

class RequestNumberGenerator {
    /**
     * Generate next request number for given prefix
     * @param {string} prefix - Service prefix (SALESFORCE, COUPA, MDM)
     * @param {object} db - Database connection (optional, will connect if not provided)
     * @returns {Promise<string>} - Formatted request number
     */
    async getNextNumber(prefix, db = null) {
        // Connect to database if not provided
        if (!db) {
            db = await cds.connect.to('db');
        }

        const { BusinessPartnerRequests } = db.entities;

        try {
            let lastRequest;

            // For ADHOC prefix, query by requestType instead of sourceSystem
            if (prefix === 'ADHOC') {
                lastRequest = await db.read(BusinessPartnerRequests)
                    .where({ requestType: 'AdhocSync' })
                    .orderBy({ requestNumber: 'desc' })
                    .limit(1);
            } else {
                // Query for the last request number with this prefix by sourceSystem
                lastRequest = await db.read(BusinessPartnerRequests)
                    .where({ sourceSystem: this._prefixToSourceSystem(prefix) })
                    .orderBy({ requestNumber: 'desc' })
                    .limit(1);
            }

            let nextNumber = 1;

            // Extract the current highest number if exists
            if (lastRequest && lastRequest.length > 0 && lastRequest[0].requestNumber) {
                const requestNumber = lastRequest[0].requestNumber;

                // Extract numeric part: PREFIX-NNNNNNNNNN
                const regex = new RegExp(`${prefix}-(\\d+)`);
                const match = requestNumber.match(regex);

                if (match && match[1]) {
                    nextNumber = parseInt(match[1], 10) + 1;
                }
            }

            // Format with 10-digit padding
            const formattedNumber = nextNumber.toString().padStart(10, '0');
            return `${prefix}-${formattedNumber}`;

        } catch (error) {
            console.error(`[RequestNumberGenerator] Error generating number for ${prefix}:`, error);
            throw new Error(`Failed to generate request number: ${error.message}`);
        }
    }

    /**
     * Map prefix to source system name
     * @param {string} prefix - Service prefix
     * @returns {string} - Source system name
     * @private
     */
    _prefixToSourceSystem(prefix) {
        const mapping = {
            'SALESFORCE': 'Salesforce',
            'COUPA': 'Coupa',
            'PI': 'PI',
            'MDM': 'MDM',
            'ADHOC': null  // ADHOC doesn't map to sourceSystem, uses requestType instead
        };

        if (!(prefix in mapping)) {
            throw new Error(`Unknown prefix: ${prefix}. Valid prefixes: SALESFORCE, COUPA, PI, MDM, ADHOC`);
        }

        return mapping[prefix];
    }

    /**
     * Validate request number format
     * @param {string} requestNumber - Request number to validate
     * @returns {boolean} - True if valid format
     */
    isValidFormat(requestNumber) {
        if (!requestNumber || typeof requestNumber !== 'string') {
            return false;
        }

        // Format: PREFIX-NNNNNNNNNN (10 digits)
        const validPrefixes = ['SALESFORCE', 'COUPA', 'PI', 'MDM', 'ADHOC'];
        const regex = /^([A-Z]+)-(\d{10})$/;
        const match = requestNumber.match(regex);

        if (!match) {
            return false;
        }

        const [, prefix] = match;
        return validPrefixes.includes(prefix);
    }

    /**
     * Extract prefix from request number
     * @param {string} requestNumber - Request number
     * @returns {string|null} - Prefix or null if invalid
     */
    extractPrefix(requestNumber) {
        if (!requestNumber || typeof requestNumber !== 'string') {
            return null;
        }

        const match = requestNumber.match(/^([A-Z]+)-/);
        return match ? match[1] : null;
    }

    /**
     * Extract sequence number from request number
     * @param {string} requestNumber - Request number
     * @returns {number|null} - Sequence number or null if invalid
     */
    extractSequenceNumber(requestNumber) {
        if (!requestNumber || typeof requestNumber !== 'string') {
            return null;
        }

        const match = requestNumber.match(/-(\d{10})$/);
        return match ? parseInt(match[1], 10) : null;
    }
}

// Export singleton instance
module.exports = new RequestNumberGenerator();
