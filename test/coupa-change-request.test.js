const cds = require('@sap/cds');
const { expect } = require('chai');

describe('Coupa Service - Change Request Logic', () => {
    let CoupaService;
    let db;

    before(async () => {
        // Bootstrap CDS test environment
        await cds.test(__dirname + '/../');

        // Connect to the service
        db = await cds.connect.to('db');
        CoupaService = await cds.connect.to('CoupaService');
    });

    it('should import SAP partner and map to CoupaRequest structure', async () => {
        // 1. Insert a mock partner into ExistingPartners
        const { ExistingPartners } = db.entities('mdm.db');
        const mockPartner = {
            sapBpNumber: '9999999999',
            partnerName: 'Test Partner for Change',
            establishedAddress: 'Test Street 1, 12345 Test City',
            establishedVatId: 'DE999999999',
            establishedCountry: 'DE',
            status: 'Active'
        };

        await db.run(INSERT.into(ExistingPartners).entries(mockPartner));

        // 2. Call importSAPPartner action
        const result = await CoupaService.importSAPPartner('9999999999');

        // 3. Verify response
        expect(result).to.be.a('string');
        const parsed = JSON.parse(result);

        expect(parsed.success).to.be.true;
        expect(parsed.data).to.exist;
        expect(parsed.data.requestType).to.equal('Change');
        expect(parsed.data.sapBpNumber).to.equal('9999999999');
        expect(parsed.data.partnerName).to.equal('Test Partner for Change');

        // Verify Address Mapping
        expect(parsed.data.addresses).to.be.an('array').that.is.not.empty;
        expect(parsed.data.addresses[0].street).to.equal('Test Street 1');
        expect(parsed.data.addresses[0].city).to.equal('Test City');
        expect(parsed.data.addresses[0].postalCode).to.equal('12345');
        expect(parsed.data.addresses[0].country_code).to.equal('DE');

        // Verify VAT Mapping
        expect(parsed.data.vatIds).to.be.an('array').that.is.not.empty;
        expect(parsed.data.vatIds[0].vatNumber).to.equal('DE999999999');
        expect(parsed.data.vatIds[0].isEstablished).to.be.true;

        // Cleanup
        await db.run(DELETE.from(ExistingPartners).where({ sapBpNumber: '9999999999' }));
    });

    it('should return error for non-existent partner', async () => {
        const result = await CoupaService.importSAPPartner('0000000000');
        const parsed = JSON.parse(result);
        expect(parsed.success).to.be.false;
        expect(parsed.message).to.include('not found');
    });
});
