const cds = require('@sap/cds');

/**
 * Shared Duplicate Checker Service
 * Consolidates duplicate detection logic used across MDM, Coupa, and Salesforce services
 *
 * @module duplicate-checker
 */

/**
 * Check for duplicate partners using VAT ID and name matching
 *
 * @param {String} requestID - UUID of the business partner request
 * @param {Object} serviceContext - CDS service context (this)
 * @param {Boolean} isDraft - Whether to check draft or active entity
 * @param {String} serviceName - Name of the calling service ('MDMService', 'CoupaService', 'SalesforceService')
 * @returns {Promise<Array>} Array of duplicate match objects
 */
async function checkDuplicates(requestID, serviceContext, isDraft = false, serviceName = 'CoupaService') {
    const log = cds.log('duplicate-checker');
    log.info('Checking for duplicates', { requestID, serviceName, isDraft });

    try {
        const db = await cds.connect.to('db');
        const { ExistingPartners, BusinessPartnerRequests } = db.entities('mdm.db');

        // Load request and VAT IDs using entity loader
        const { request, vatIds } = await loadRequestData(requestID, serviceName, isDraft);

        if (!request) {
            throw new Error('Request not found');
        }

        log.debug('Found request', { partnerName: request.partnerName, vatCount: vatIds.length });

        const duplicates = [];

        // 1. VAT ID Matching (Exact Match)
        if (vatIds && vatIds.length > 0) {
            const vatDuplicates = await findVatDuplicates(vatIds, ExistingPartners, db);
            duplicates.push(...vatDuplicates);
            log.debug('VAT duplicates found', { count: vatDuplicates.length });
        }

        // 2. Name Matching (Fuzzy Match)
        if (request.partnerName) {
            const nameDuplicates = await findNameDuplicates(request.partnerName, ExistingPartners, db, duplicates);
            duplicates.push(...nameDuplicates);
            log.debug('Name duplicates found', { count: nameDuplicates.length });
        }

        // 3. Persist results to DuplicateChecks
        await persistDuplicateResults(requestID, duplicates, db);

        // 4. Update request header with duplicate check status
        const duplicateCheckStatus = duplicates.length === 0
            ? 'No Duplicates'
            : `${duplicates.length} Duplicate${duplicates.length > 1 ? 's' : ''} Found`;

        await UPDATE(BusinessPartnerRequests).set({
            duplicateCheckStatus: duplicateCheckStatus,
            duplicateCheckDate: new Date().toISOString()
        }).where({ ID: requestID });

        log.info('Duplicate check completed', { requestID, totalDuplicates: duplicates.length, status: duplicateCheckStatus });

        return duplicates;

    } catch (error) {
        log.error('Error checking duplicates', { requestID, error: error.message });
        throw error;
    }
}

/**
 * Load request data and VAT IDs from draft or active entity
 *
 * @private
 */
async function loadRequestData(requestID, serviceName, isDraft) {
    const draftSuffix = isDraft ? '.drafts' : '';
    const requestEntity = `${serviceName}.${getRequestEntityName(serviceName)}${draftSuffix}`;
    const vatEntity = isDraft ? `${serviceName}.PartnerVatIds.drafts` : 'mdm.db.PartnerVatIds';

    let request = await SELECT.one.from(requestEntity)
        .where({ ID: requestID })
        .columns('ID', 'partnerName');

    let vatIds = [];

    if (request) {
        vatIds = await SELECT.from(vatEntity)
            .where({ request_ID: requestID });
    } else if (isDraft) {
        // Fallback to active entity
        request = await SELECT.one.from('mdm.db.BusinessPartnerRequests')
            .where({ ID: requestID })
            .columns('ID', 'partnerName');

        if (request) {
            vatIds = await SELECT.from('mdm.db.PartnerVatIds')
                .where({ request_ID: requestID });
        }
    }

    return { request, vatIds };
}

/**
 * Get request entity name based on service
 *
 * @private
 */
function getRequestEntityName(serviceName) {
    switch (serviceName) {
        case 'MDMService':
            return 'MDMApprovalRequests';
        case 'CoupaService':
            return 'CoupaRequests';
        case 'SalesforceService':
            return 'SalesforceRequests';
        default:
            return 'CoupaRequests';
    }
}

/**
 * Find duplicates by VAT ID (exact match)
 *
 * @private
 */
async function findVatDuplicates(vatIds, ExistingPartners, db) {
    const duplicates = [];

    for (const vat of vatIds) {
        if (!vat.vatNumber) continue;

        const matches = await db.read(ExistingPartners)
            .columns('sapBpNumber', 'partnerName', 'establishedAddress', 'establishedCountry', 'establishedVatId')
            .where({ establishedVatId: vat.vatNumber });

        for (const match of matches) {
            duplicates.push({
                sapBpNumber: truncateString(match.sapBpNumber, 20),
                partnerName: match.partnerName,
                vatId: vat.vatNumber,
                street: parseAddressStreet(match.establishedAddress),
                city: 'Unknown',
                country: match.establishedCountry || '',
                matchScore: 100,
                matchType: 'VAT'
            });
        }
    }

    return duplicates;
}

/**
 * Find duplicates by name (fuzzy match)
 *
 * @private
 */
async function findNameDuplicates(partnerName, ExistingPartners, db, existingDuplicates) {
    const duplicates = [];

    const nameMatches = await db.read(ExistingPartners)
        .columns('sapBpNumber', 'partnerName', 'establishedAddress', 'establishedCountry', 'establishedVatId')
        .where({ partnerName: { like: `%${partnerName}%` } })
        .limit(10);

    for (const match of nameMatches) {
        const bpNum = truncateString(match.sapBpNumber, 20);

        // Avoid adding if already found by VAT
        if (!existingDuplicates.some(d => d.sapBpNumber === bpNum)) {
            duplicates.push({
                sapBpNumber: bpNum,
                partnerName: match.partnerName,
                vatId: match.establishedVatId || '',
                street: parseAddressStreet(match.establishedAddress),
                city: 'Unknown',
                country: match.establishedCountry || '',
                matchScore: 80,
                matchType: 'Name'
            });
        }
    }

    return duplicates;
}

/**
 * Persist duplicate check results to database
 * NOTE: Does NOT delete old results - keeps history of all duplicate checks
 *
 * @private
 */
async function persistDuplicateResults(requestID, duplicates, db) {
    const { DuplicateChecks } = db.entities('mdm.db');

    // DO NOT delete existing checks - keep history
    // This allows MDM to see duplicate check results over time

    // Insert new checks with timestamp
    if (duplicates.length > 0) {
        const checkTimestamp = new Date().toISOString();
        const entries = duplicates.map(d => ({
            request_ID: requestID,
            checkDate: checkTimestamp,
            matchType: d.matchType,
            matchScore: d.matchScore,
            existingBpNumber: d.sapBpNumber,
            existingBpName: d.partnerName,
            matchDetails: `Matched by ${d.matchType}: ${d.matchType === 'VAT' ? d.vatId : d.partnerName}`,
            establishedVatId: d.vatId,
            establishedCountry: d.country,
            reviewRequired: true
        }));

        await INSERT.into(DuplicateChecks).entries(entries);
    }
}

/**
 * Truncate string to specified length
 *
 * @private
 */
function truncateString(str, maxLength) {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength) : str;
}

/**
 * Parse street from address string
 *
 * @private
 */
function parseAddressStreet(address) {
    if (!address) return '';
    return address.includes(',') ? address.split(',')[0].trim() : address;
}

module.exports = {
    checkDuplicates
};
