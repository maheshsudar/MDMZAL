/**
 * Mock AEB (Trade Compliance) Service
 * Simulates the trade compliance screening API
 * Real API: @api/trade-compliance
 */

class AEBService {
  constructor() {
    // Mock blocked entities/addresses
    this.blockedPatterns = [
      { name: /iran/i, reason: 'OFAC Sanctions - Iran' },
      { name: /syria/i, reason: 'EU Sanctions - Syria' },
      { name: /north korea/i, reason: 'UN Security Council - DPRK' },
      { name: /crimea/i, reason: 'EU Sanctions - Crimea' },
      { country: 'IR', reason: 'OFAC Sanctions - Iran' },
      { country: 'SY', reason: 'EU Sanctions - Syria' },
      { country: 'KP', reason: 'UN Security Council - North Korea' }
    ];

    // Mock Good Guy definitions (whitelisted entities)
    this.goodGuys = [
      { name: /SAP SE/i },
      { name: /Microsoft/i },
      { name: /Google/i }
    ];
  }

  /**
   * Screen addresses for trade compliance
   * @param {Object} payload - Request payload containing addresses and parameters
   * @returns {Promise<Array>} Screening results
   */
  async screenAddresses(payload) {
    console.log('🛡️ AEB: Screening addresses for trade compliance');

    // Extract data from payload
    const addresses = payload.addresses || [];
    const screeningParameters = payload.screeningParameters || {};

    console.log('Addresses to screen:', addresses.length);
    console.log('Parameters:', screeningParameters);

    // Simulate API processing time
    await this._delay(300 + Math.random() * 700);

    const results = addresses.map((address, index) => {
      const result = {
        matchFound: false,
        wasGoodGuy: false,
        referenceId: address.referenceId || `ADDR_${index}`,
        referenceComment: address.referenceComment || '',
        // Additional fields for debugging
        screenedName: address.name,
        screenedCountry: address.countryISO
      };

      // Check if it's a Good Guy (if considerGoodGuys is enabled)
      if (screeningParameters.considerGoodGuys === 'true' || screeningParameters.considerGoodGuys === true) {
        const isGoodGuy = this.goodGuys.some(gg => {
          if (gg.name && gg.name.test(address.name)) return true;
          return false;
        });

        if (isGoodGuy) {
          result.wasGoodGuy = true;
          result.matchFound = false; // Good guys are not flagged as matches
          return result;
        }
      }

      // Check for blocked entities/addresses
      for (const blocked of this.blockedPatterns) {
        let isMatch = false;

        // Check name pattern
        if (blocked.name && address.name && blocked.name.test(address.name)) {
          isMatch = true;
        }

        // Check country
        if (blocked.country && address.countryISO === blocked.country) {
          isMatch = true;
        }

        if (isMatch) {
          result.matchFound = true;
          break;
        }
      }

      return result;
    });

    console.log(`✅ AEB: Screening completed. ${results.filter(r => r.matchFound).length}/${results.length} matches found`);
    return results;
  }

  /**
   * Calculate risk score based on screening results
   * @param {Array} screeningResults - Results from screenAddresses
   * @returns {Object} Risk assessment
   */
  calculateRiskScore(screeningResults) {
    const totalAddresses = screeningResults.length;
    const matchesFound = screeningResults.filter(r => r.matchFound).length;
    const goodGuys = screeningResults.filter(r => r.wasGoodGuy).length;

    let riskScore = 0;
    let status = 'Clear';

    if (goodGuys > 0) {
      // Good guys reduce risk
      riskScore = Math.max(0, riskScore - (goodGuys * 20));
    }

    if (matchesFound > 0) {
      // Each match adds significant risk
      riskScore += matchesFound * 40;
      status = matchesFound >= totalAddresses ? 'Blocked' : 'Warning';
    }

    // Ensure score is between 0-100
    riskScore = Math.min(100, Math.max(0, riskScore));

    return {
      status,
      riskScore,
      totalAddresses,
      matchesFound,
      goodGuysFound: goodGuys,
      pepsCheck: matchesFound > 0 ? 'Found' : 'Clear',
      exportControl: matchesFound > 0 ? 'Restricted' : 'Allowed',
      sanctionsLists: ['OFAC', 'EU Sanctions', 'UN Security Council'],
      checkTimestamp: new Date().toISOString()
    };
  }

  /**
   * Delay helper
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = AEBService;