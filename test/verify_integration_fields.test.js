const axios = require('axios');
const assert = require('assert');

const BASE_URL = 'http://localhost:4004/mdm';
const AUTH = {
    username: 'alice',
    password: 'secret'
};

describe('Integration Fields Verification (HTTP)', () => {

    it('should have integration fields', async () => {
        try {
            const response = await axios.get(`${BASE_URL}/MDMApprovalRequests`, {
                auth: AUTH
            });

            const requests = response.data.value;
            assert.ok(requests.length > 0, 'No requests found');
            const request = requests[0];

            assert.ok('integrationSuiteStatus' in request, 'integrationSuiteStatus missing');
            assert.ok('sapInitialStatus' in request, 'sapInitialStatus missing');
            assert.ok('satelliteStatus' in request, 'satelliteStatus missing');
            assert.ok('sapIdUpdateStatus' in request, 'sapIdUpdateStatus missing');
            assert.strictEqual(request.integrationSuiteStatus, 'Pending');
        } catch (error) {
            console.error('Error in GET:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
            throw error;
        }
    });

    it('should update SAP status', async () => {
        try {
            // Get ID first
            const getResponse = await axios.get(`${BASE_URL}/MDMApprovalRequests`, {
                auth: AUTH
            });
            const request = getResponse.data.value[0];
            const ID = request.ID;
            const IsActiveEntity = request.IsActiveEntity;

            // Call action
            const actionUrl = `${BASE_URL}/MDMApprovalRequests(ID=${ID},IsActiveEntity=${IsActiveEntity})/MDMService.updateSAPStatus`;

            await axios.post(actionUrl, { status: 'Success' }, { auth: AUTH });

            // Verify update
            const verifyResponse = await axios.get(`${BASE_URL}/MDMApprovalRequests(ID=${ID},IsActiveEntity=${IsActiveEntity})`, { auth: AUTH });
            assert.strictEqual(verifyResponse.data.sapInitialStatus, 'Success');

        } catch (error) {
            console.error('Error in Action:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
            throw error;
        }
    });
});
