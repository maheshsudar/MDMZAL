const cds = require('@sap/cds');

/**
 * Shared SAP Partner Service
 * Consolidates SAP partner lookup, import, and search functions
 * Used by Coupa and Salesforce services
 *
 * @module sap-partner-service
 */

/**
 * Get SAP Partner Details by BP Number
 *
 * @param {String} sapBpNumber - SAP Business Partner Number
 * @param {Object} db - CDS database connection
 * @returns {Promise<Object>} Partner details object
 */
async function getSAPPartnerDetails(sapBpNumber, db) {
    const log = cds.log('sap-partner');
    log.info('Fetching SAP Partner Details', { sapBpNumber });

    try {
        // Use SELECT API for better compatibility
        const partners = await SELECT.from('mdm.db.ExistingPartners')
            .where({ sapBpNumber })
            .limit(1);

        if (!partners || partners.length === 0) {
            // Return mock response for demo
            log.warn('Partner not found, returning mock data', { sapBpNumber });
            return createMockPartner(sapBpNumber);
        }

        const partner = partners[0];
        return mapPartnerToDetails(partner);

    } catch (error) {
        log.error('Error fetching partner details', { sapBpNumber, error: error.message });
        throw error;
    }
}

/**
 * Import SAP Partner for Change Request
 *
 * @param {String} sapBpNumber - SAP Business Partner Number
 * @param {String} sourceSystem - 'Coupa', 'Salesforce', 'PI'
 * @param {Object} db - CDS database connection
 * @returns {Promise<String>} JSON string with success flag and data
 */
async function importSAPPartner(sapBpNumber, sourceSystem, db) {
    const log = cds.log('sap-partner');
    log.info('Importing SAP Partner', { sapBpNumber, sourceSystem });

    try {
        const { ExistingPartners } = db.entities('mdm.db');

        const partners = await db.read(ExistingPartners).where({ sapBpNumber }).limit(1);

        if (!partners || partners.length === 0) {
            return JSON.stringify({
                success: false,
                message: `Partner ${sapBpNumber} not found`
            });
        }

        const partner = partners[0];
        const requestData = mapPartnerToRequestData(partner, sourceSystem);

        return JSON.stringify({
            success: true,
            data: requestData
        });

    } catch (error) {
        log.error('Error importing partner', { sapBpNumber, error: error.message });
        return JSON.stringify({
            success: false,
            message: error.message
        });
    }
}

/**
 * Search SAP Partners by criteria
 *
 * @param {Object} criteria - Search criteria { partnerName, sapBpNumber, vatId, satelliteSystemId }
 * @param {Object} db - CDS database connection
 * @returns {Promise<Array>} Array of matching partners
 */
async function searchSAPPartners(criteria, db) {
    const log = cds.log('sap-partner');
    log.info('Searching SAP Partners', { criteria });

    try {
        const { ExistingPartners } = db.entities('mdm.db');
        const { partnerName, sapBpNumber, vatId, satelliteSystemId } = criteria;

        let query = SELECT.from(ExistingPartners);

        if (sapBpNumber) {
            query.where({ sapBpNumber });
        } else if (vatId) {
            query.where({ establishedVatId: vatId });
        } else if (partnerName) {
            query.where({ partnerName: { like: `%${partnerName}%` } });
        } else {
            return [];
        }

        query.limit(20);

        const partners = await db.run(query);

        const results = partners.map(p => ({
            sapBpNumber: p.sapBpNumber,
            partnerName: p.partnerName,
            vatId: p.establishedVatId || '',
            street: p.establishedAddress ? p.establishedAddress.split(',')[0] : '',
            city: 'Unknown',
            country: p.establishedCountry || '',
            matchScore: 100
        }));

        log.info('Search completed', { resultCount: results.length });
        return results;

    } catch (error) {
        log.error('Error searching partners', { criteria, error: error.message });
        throw error;
    }
}

/**
 * Create mock partner for demo purposes
 *
 * @private
 */
function createMockPartner(sapBpNumber) {
    return {
        bpNumber: sapBpNumber,          // Changed from sapBpNumber
        sapBpNumber,                      // Keep for compatibility
        bpName: 'Mock Partner',          // Changed from partnerName
        partnerName: 'Mock Partner',      // Keep for compatibility
        bpType: 'Supplier',              // Changed from partnerRole
        partnerRole: 'Supplier',          // Keep for compatibility
        status: 'Active',
        satelliteSystemId: 'S4HANA',
        addresses: [{
            addressType: 'Business',
            street: 'Mock Street 123',
            city: 'Walldorf',
            postalCode: '69190',
            country: 'DE'
        }],
        taxNumbers: [{
            country: 'DE',
            taxType: 'VAT',
            taxNumber: 'DE123456789'
        }],
        bankAccounts: [],
        contacts: {
            email: 'mock@sap.com',
            phone: '+49 123 456 789',
            fax: ''
        }
    };
}

/**
 * Map ExistingPartner to detailed partner object
 *
 * @private
 */
function mapPartnerToDetails(partner) {
    // Parse address
    const address = parseAddress(partner.establishedAddress, partner.establishedCountry);

    // Build tax numbers
    const taxNumbers = [];
    if (partner.establishedVatId) {
        taxNumbers.push({
            country: partner.establishedCountry || '',
            taxType: 'VAT',
            taxNumber: partner.establishedVatId
        });
    }

    // Generate mock bank account
    const bankAccounts = [];
    if (partner.establishedCountry) {
        bankAccounts.push({
            bankName: 'Demo Bank ' + partner.establishedCountry,
            bankCountry: partner.establishedCountry,
            iban: partner.establishedCountry + '99' + partner.sapBpNumber + '00',
            accountNumber: partner.sapBpNumber,
            swiftCode: 'DEMO' + partner.establishedCountry + '22'
        });
    }

    return {
        bpNumber: partner.sapBpNumber,          // Changed to bpNumber for validator
        sapBpNumber: partner.sapBpNumber,        // Keep for compatibility
        bpName: partner.partnerName,            // Changed to bpName for validator
        partnerName: partner.partnerName,        // Keep for compatibility
        bpType: partner.partnerType || 'Supplier', // Changed to bpType for validator
        partnerRole: partner.partnerType || 'Supplier', // Keep for compatibility
        status: partner.status,
        satelliteSystemId: 'S4HANA',
        addresses: [address],
        taxNumbers,
        bankAccounts,
        contacts: {
            email: 'info@' + partner.partnerName.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '') + '.com',
            phone: '+1 555 0100',
            fax: ''
        }
    };
}

/**
 * Map ExistingPartner to request data structure
 *
 * @private
 */
function mapPartnerToRequestData(partner, sourceSystem) {
    const data = {
        requestType: 'Change',
        status: 'Draft',
        sourceSystem,
        name1: partner.partnerName, // Use name1 instead of deprecated partnerName field
        partnerName: partner.partnerName, // Keep for backward compatibility
        existingBpNumber: partner.sapBpNumber,
        existingBpName: partner.partnerName
    };

    // Parse and add address with SAP ID (for Change requests, addresses must have SAP IDs)
    if (partner.establishedAddress) {
        const parts = partner.establishedAddress.split(',');
        data.addresses = [{
            sapAddressId: '0001', // Mock SAP Address ID for existing partner (Change requests need this)
            addressType_code: 'Business',
            street: parts[0] ? parts[0].trim() : '',
            city: parts[1] ? parts[1].trim() : '',
            postalCode: '',
            country_code: partner.establishedCountry || ''
        }];

        // Try to extract zip/city
        if (parts.length > 1) {
            const cityPart = parts[1].trim();
            const zipMatch = cityPart.match(/^(\w+)\s+(.+)$/);
            if (zipMatch) {
                data.addresses[0].postalCode = zipMatch[1];
                data.addresses[0].city = zipMatch[2];
            }
        }
    }

    // Add VAT ID
    if (partner.establishedVatId) {
        data.vatIds = [{
            country_code: partner.establishedCountry || '',
            vatNumber: partner.establishedVatId,
            vatType_code: 'VAT',
            isEstablished: true
        }];
    }

    // Add mock bank account with SAP ID (for Change requests)
    if (partner.establishedCountry) {
        data.banks = [{
            sapBankIdentification: '001', // Mock SAP Bank ID for existing partner
            bankCountry_code: partner.establishedCountry,
            bankKey: '12345678',
            accountHolder: partner.partnerName,
            accountNumber: partner.sapBpNumber + '0001',
            iban: partner.establishedCountry + '99' + partner.sapBpNumber.padStart(18, '0'),
            controlKey: '00',
            swiftCode: 'DEMO' + partner.establishedCountry + '22'
        }];
    }

    // Add mock email with SAP IDs (for Change requests)
    if (partner.establishedAddress) {
        const emailDomain = partner.partnerName.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '') + '.com';
        data.emails = [{
            sapAddressId: '0001', // Mock SAP Address ID
            sapOrdinalNumber: '001', // Mock SAP Ordinal Number
            emailType_code: 'Work',
            emailAddress: 'info@' + emailDomain,
            notes: 'Main contact email',
            isDefault: true
        }];
    }

    return data;
}

/**
 * Parse address string to structured address object
 *
 * @private
 */
function parseAddress(addressString, country) {
    const address = {
        addressType: 'Business',
        street: '',
        city: '',
        postalCode: '',
        country: country || ''
    };

    if (!addressString) return address;

    if (addressString.includes(',')) {
        const parts = addressString.split(',');
        address.street = parts[0].trim();

        if (parts.length > 1) {
            const cityPart = parts[1].trim();
            const zipMatch = cityPart.match(/^(\w+)\s+(.+)$/);
            if (zipMatch) {
                address.postalCode = zipMatch[1];
                address.city = zipMatch[2];
            } else {
                address.city = cityPart;
            }
        }
    } else {
        address.street = addressString;
    }

    return address;
}

module.exports = {
    getSAPPartnerDetails,
    importSAPPartner,
    searchSAPPartners
};
