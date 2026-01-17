const fs = require('fs');
const path = require('path');

/**
 * Mock SAP Business Partner API Service
 * Simulates API_BUSINESS_PARTNER OData service for development/testing
 */
class SAPMockService {
    constructor() {
        // Load mock data
        const dataPath = path.join(__dirname, '../../db/data/mock-sap-partners.json');
        this.partners = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        console.log(`📦 Loaded ${this.partners.length} mock SAP partners`);
    }

    /**
     * Search for Business Partners
     * @param {Object} criteria - Search criteria
     * @param {string} criteria.sapBpNumber - SAP BP Number (exact match)
     * @param {string} criteria.partnerName - Partner name (wildcard support with *)
     * @param {string} criteria.vatId - VAT Registration Number
     * @param {string} criteria.satelliteSystemId - External system ID
     * @returns {Promise<Array>} Matching partners
     */
    async searchPartners(criteria) {
        console.log('🔍 SAP Mock: Searching partners with criteria:', criteria);

        // Simulate network latency
        await this._simulateDelay();

        let results = [...this.partners];

        // Filter by SAP BP Number (exact match)
        if (criteria.sapBpNumber) {
            results = results.filter(p =>
                p.BusinessPartner === criteria.sapBpNumber
            );
        }

        // Filter by Partner Name (supports wildcards)
        if (criteria.partnerName) {
            const namePattern = criteria.partnerName
                .replace(/\*/g, '.*')
                .toLowerCase();
            const regex = new RegExp(namePattern);

            results = results.filter(p =>
                regex.test(p.OrganizationBPName1.toLowerCase()) ||
                regex.test(p.BusinessPartnerFullName.toLowerCase())
            );
        }

        // Filter by VAT ID
        if (criteria.vatId) {
            results = results.filter(p =>
                p.to_BusinessPartnerTaxNumber?.some(tax =>
                    tax.TaxNumber === criteria.vatId
                )
            );
        }

        // Filter by Satellite System ID
        if (criteria.satelliteSystemId) {
            results = results.filter(p =>
                p.YY1_ExternalSystemID === criteria.satelliteSystemId
            );
        }

        console.log(`✅ SAP Mock: Found ${results.length} matching partners`);
        return results;
    }

    /**
     * Get single Business Partner by ID
     * @param {string} sapBpNumber - SAP BP Number
     * @returns {Promise<Object|null>} Partner data or null
     */
    async getPartner(sapBpNumber) {
        console.log(`🔍 SAP Mock: Fetching partner ${sapBpNumber}`);

        await this._simulateDelay();

        const partner = this.partners.find(p =>
            p.BusinessPartner === sapBpNumber
        );

        if (partner) {
            console.log(`✅ SAP Mock: Found partner ${partner.OrganizationBPName1}`);
        } else {
            console.log(`❌ SAP Mock: Partner ${sapBpNumber} not found`);
        }

        return partner || null;
    }

    /**
     * Simulate network delay (500ms - 1s)
     * @private
     */
    async _simulateDelay() {
        const delay = 500 + Math.random() * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Find duplicate Business Partners
     * @param {Object} criteria - Duplcate check criteria
     * @param {string} criteria.name - Partner name to match
     * @param {string} criteria.vatId - VAT ID to match
     * @returns {Promise<Array>} Potential duplicates with match scores
     */
    async findDuplicates(criteria) {
        console.log('🔍 SAP Mock: Finding duplicates with criteria:', criteria);

        await this._simulateDelay();

        const duplicates = [];

        for (const partner of this.partners) {
            let matchScore = 0;

            // Name matching (fuzzy)
            if (criteria.name) {
                const nameSimilarity = this._calculateStringSimilarity(
                    criteria.name.toLowerCase(),
                    partner.OrganizationBPName1.toLowerCase()
                );
                matchScore += nameSimilarity * 60; // Name worth 60% of score
            }

            // VAT ID matching (exact)
            if (criteria.vatId) {
                const hasMatchingVAT = partner.to_BusinessPartnerTaxNumber?.some(tax =>
                    tax.TaxNumber === criteria.vatId
                );
                if (hasMatchingVAT) {
                    matchScore += 100; // VAT match guarantees inclusion
                }
            }

            // Only include if match score is above threshold
            if (matchScore >= 50) {
                duplicates.push({
                    sapBpNumber: partner.BusinessPartner,
                    partnerName: partner.OrganizationBPName1,
                    vatId: partner.to_BusinessPartnerTaxNumber?.[0]?.TaxNumber || null,
                    street: partner.to_BusinessPartnerAddress?.[0]?.StreetName || null,
                    city: partner.to_BusinessPartnerAddress?.[0]?.CityName || null,
                    country: partner.to_BusinessPartnerAddress?.[0]?.Country || null,
                    matchScore: Math.min(100, Math.round(matchScore))
                });
            }
        }

        // Sort by match score descending
        duplicates.sort((a, b) => b.matchScore - a.matchScore);

        console.log(`✅ SAP Mock: Found ${duplicates.length} potential duplicates`);
        return duplicates;
    }

    /**
     * Calculate string similarity (simple Levenshtein-based)
     * @private
     */
    _calculateStringSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        const editDistance = this._levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    /**
     * Levenshtein distance calculation
     * @private
     */
    _levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }
}

module.exports = new SAPMockService();
