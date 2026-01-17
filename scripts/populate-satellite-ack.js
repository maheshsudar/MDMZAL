/**
 * Populate Satellite Acknowledgement Admin app with test data
 * Uses HTTP APIs to create request and trigger acknowledgement
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4004';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function populateTestData() {
    try {
        console.log('🚀 Creating test data for Satellite Acknowledgement Admin app\n');

        // Step 1: Create a Coupa request
        console.log('📝 Step 1: Creating Coupa supplier request...');
        const createResponse = await axios.post(
            `${BASE_URL}/integration/partners/create`,
            {
                partnerName: 'Satellite Test Supplier GmbH',
                entityType: 'Supplier',
                country: 'DE',
                vatId: 'DE999888777'
            },
            {
                headers: {
                    'x-source-system': 'Coupa',
                    'Content-Type': 'application/json'
                }
            }
        );

        const requestNumber = createResponse.data.data.requestNumber;
        console.log(`   ✅ Created: ${requestNumber}\n`);

        // Step 2: Get request ID
        console.log('📋 Step 2: Getting request ID...');
        const queryResponse = await axios.get(
            `${BASE_URL}/coupa/CoupaRequests?$filter=requestNumber eq '${requestNumber}'&$select=ID,requestNumber`,
            { headers: { 'Accept': 'application/json' } }
        );

        const requestId = queryResponse.data.value[0].ID;
        console.log(`   ✅ Request ID: ${requestId}\n`);

        // Step 3: Approve via raw SQL (easier than dealing with draft)
        console.log('✅ Step 3: Approving request...');
        const sapBpNumber = `10${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

        // Use MDM service to update (entity is called MDMApprovalRequests in MDM service)
        await axios.patch(
            `${BASE_URL}/mdm/MDMApprovalRequests(${requestId})`,
            {
                status: 'Approved',
                statusCriticality: 3,
                sapBpNumber: sapBpNumber,
                approvedBy: 'Alice (MDM Approver)',
                approvedAt: new Date().toISOString()
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );

        console.log(`   ✅ Approved with SAP BP: ${sapBpNumber}\n`);

        // Step 4: Manually trigger satellite webhook
        console.log('📨 Step 4: Sending webhook notification to Coupa satellite...');
        const webhookPayload = {
            event: 'approved',
            timestamp: new Date().toISOString(),
            notificationId: `NOTIF-${Date.now()}`,
            requestId: requestId,
            requestNumber: requestNumber,
            partnerName: 'Satellite Test Supplier GmbH',
            entityType: 'Supplier',
            requestType: 'Create',
            status: 'Approved',
            sourceSystem: 'Coupa',
            sapBpNumber: sapBpNumber,
            data: {
                sapBpNumber: sapBpNumber,
                approvedBy: 'Alice (MDM Approver)',
                approvedAt: new Date().toISOString()
            }
        };

        await axios.post(
            `${BASE_URL}/satellite-mock/coupa/webhook/mdm-approval`,
            webhookPayload,
            { headers: { 'Content-Type': 'application/json' } }
        );

        console.log('   ✅ Webhook sent\n');

        // Step 5: Wait for auto-acknowledgement
        console.log('⏳ Step 5: Waiting for auto-acknowledgement (3 seconds)...');
        await delay(3000);
        console.log('   ✅ Auto-ack window completed\n');

        // Step 6: Verify acknowledgement
        console.log('🔍 Step 6: Verifying acknowledgement...');
        const ackResponse = await axios.get(
            `${BASE_URL}/satellite-ack/NotificationAcknowledgments?$filter=requestNumber eq '${requestNumber}'`,
            { headers: { 'Accept': 'application/json' } }
        );

        if (ackResponse.data.value && ackResponse.data.value.length > 0) {
            const ack = ackResponse.data.value[0];
            console.log('   ✅ Acknowledgement found!\n');

            console.log('════════════════════════════════════════════════════════');
            console.log('✅ TEST DATA CREATED SUCCESSFULLY!');
            console.log('════════════════════════════════════════════════════════\n');
            console.log('View in Satellite Acknowledgement Admin app:');
            console.log('   http://localhost:4004/satellite-ack-admin/webapp/index.html\n');
            console.log('Record Details:');
            console.log(`   Request Number: ${ack.requestNumber}`);
            console.log(`   Partner Name: ${ack.partnerName}`);
            console.log(`   SAP BP Number: ${ack.sapBpNumber}`);
            console.log(`   Target System: ${ack.targetSystem}`);
            console.log(`   Status: ${ack.status}`);
            console.log(`   Acknowledged By: ${ack.acknowledgedBy}`);
            console.log(`   Acknowledged At: ${ack.acknowledgedAt}`);
            console.log('════════════════════════════════════════════════════════\n');
        } else {
            console.log('   ⚠️  No acknowledgement found');
            console.log('   Check server logs for errors\n');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

// Run the script
populateTestData()
    .then(() => {
        console.log('✅ Script completed successfully\n');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Script failed:', error.message);
        process.exit(1);
    });
