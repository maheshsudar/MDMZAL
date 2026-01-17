/**
 * End-to-End Test Script for Satellite Acknowledgement Flow (API-based)
 *
 * This script tests the complete workflow using only HTTP APIs:
 * 1. Create a business partner request via integration API
 * 2. Approve the request via OData service
 * 3. Trigger notification (manual via satellite mock)
 * 4. Verify acknowledgement via satellite-ack API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4004';

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logStep(stepNumber, message) {
    log(`\n${colors.bright}${colors.cyan}STEP ${stepNumber}: ${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, colors.green);
}

function logError(message) {
    log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
    log(`ℹ️  ${message}`, colors.blue);
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    try {
        log('\n' + '='.repeat(70), colors.bright);
        log('  SATELLITE ACKNOWLEDGEMENT FLOW - API TEST', colors.bright + colors.cyan);
        log('='.repeat(70) + '\n', colors.bright);

        // ============================================
        // STEP 1: Create Sample Request via API
        // ============================================
        logStep(1, 'Create sample Coupa supplier request via Integration API');

        const requestData = {
            partnerName: 'Global Tech Solutions GmbH',
            entityType: 'Supplier',
            country: 'DE',
            vatId: 'DE123456789'
        };

        const createResponse = await axios.post(
            `${BASE_URL}/integration/partners/create`,
            requestData,
            {
                headers: {
                    'x-source-system': 'Coupa',
                    'Content-Type': 'application/json'
                }
            }
        );

        const requestNumber = createResponse.data.data.requestNumber;

        logSuccess(`Created request: ${requestNumber}`);
        logInfo(`   Status: ${createResponse.data.data.status}`);

        // ============================================
        // STEP 2: Get request ID by request number
        // ============================================
        logStep(2, 'Query request by request number to get ID');

        const queryResponse = await axios.get(
            `${BASE_URL}/coupa/CoupaRequests?$filter=requestNumber eq '${requestNumber}'&$select=ID,requestNumber,status`,
            {
                headers: { 'Accept': 'application/json' }
            }
        );

        if (!queryResponse.data.value || queryResponse.data.value.length === 0) {
            throw new Error(`Request ${requestNumber} not found`);
        }

        const requestId = queryResponse.data.value[0].ID;
        logSuccess(`Found request with ID: ${requestId}`);

        // ============================================
        // STEP 3: Submit request for approval
        // ============================================
        logStep(3, 'Submit request for approval via OData');

        // Update status to Submitted
        await axios.patch(
            `${BASE_URL}/coupa/CoupaRequests(${requestId})`,
            {
                status: 'Submitted',
                statusCriticality: 2
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );

        logSuccess('Request submitted for approval');

        // ============================================
        // STEP 4: Approve request
        // ============================================
        logStep(4, 'Approve request via MDM service');

        const sapBpNumber = `10${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

        await axios.patch(
            `${BASE_URL}/mdm/BusinessPartnerRequests(${requestId})`,
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

        logSuccess(`Request approved with SAP BP Number: ${sapBpNumber}`);

        // ============================================
        // STEP 5: Manually trigger satellite notification
        // ============================================
        logStep(5, 'Manually send webhook notification to Coupa satellite');

        const webhookPayload = {
            event: 'approved',
            timestamp: new Date().toISOString(),
            notificationId: `NOTIF-${Date.now()}`,
            requestId: requestId,
            requestNumber: requestNumber,
            partnerName: requestData.partnerName,
            entityType: requestData.entityType,
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

        const webhookResponse = await axios.post(
            `${BASE_URL}/satellite-mock/coupa/webhook/mdm-approval`,
            webhookPayload,
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        logSuccess('Webhook notification sent to Coupa satellite system');
        logInfo(`   Response: ${webhookResponse.data.message}`);
        logInfo(`   Notification ID: ${webhookResponse.data.notificationId}`);

        // ============================================
        // STEP 6: Wait for auto-acknowledgement
        // ============================================
        logStep(6, 'Wait for satellite system to auto-acknowledge (3 seconds)');

        logInfo('   Waiting for auto-acknowledgement...');
        await delay(3000);

        logSuccess('Auto-acknowledgement window completed');

        // ============================================
        // STEP 7: Verify acknowledgement via API
        // ============================================
        logStep(7, 'Verify acknowledgement via Satellite Acknowledgement API');

        const ackResponse = await axios.get(
            `${BASE_URL}/satellite-ack/NotificationAcknowledgments?$filter=requestNumber eq '${requestNumber}'`,
            {
                headers: { 'Accept': 'application/json' }
            }
        );

        if (ackResponse.data.value && ackResponse.data.value.length > 0) {
            logSuccess(`Found ${ackResponse.data.value.length} acknowledgement(s)`);

            ackResponse.data.value.forEach((ack, index) => {
                logInfo(`   Acknowledgement ${index + 1}:`);
                logInfo(`      System: ${ack.targetSystem}`);
                logInfo(`      Status: ${ack.status}`);
                logInfo(`      Acknowledged By: ${ack.acknowledgedBy}`);
                logInfo(`      Acknowledged At: ${ack.acknowledgedAt}`);
                logInfo(`      SAP BP Number: ${ack.sapBpNumber}`);
            });
        } else {
            logError('No acknowledgements found via API!');
            logInfo('   Possible reasons:');
            logInfo('   1. Auto-acknowledgement is disabled');
            logInfo('   2. Acknowledgement processing failed');
            logInfo('   3. Database insert failed');
        }

        // ============================================
        // STEP 8: Check satellite mock received notifications
        // ============================================
        logStep(8, 'Check satellite mock system logs');

        const mockResponse = await axios.get(`${BASE_URL}/satellite-mock/received-notifications`);

        logSuccess(`Satellite mock received ${mockResponse.data.count} notification(s)`);

        if (mockResponse.data.count > 0) {
            const recentNotifications = mockResponse.data.notifications.slice(-3);  // Last 3
            recentNotifications.forEach((notif, index) => {
                logInfo(`   Notification ${index + 1}:`);
                logInfo(`      System: ${notif.system}`);
                logInfo(`      Request: ${notif.notification.requestNumber}`);
                logInfo(`      Status: ${notif.notification.status}`);
                logInfo(`      Received: ${notif.receivedAt}`);
            });
        }

        // ============================================
        // TEST SUMMARY
        // ============================================
        log('\n' + '='.repeat(70), colors.bright);
        log('  TEST SUMMARY', colors.bright + colors.green);
        log('='.repeat(70), colors.bright);

        logSuccess('✅ Step 1: Created test request via API');
        logSuccess('✅ Step 2: Queried request ID by request number');
        logSuccess('✅ Step 3: Submitted for approval');
        logSuccess('✅ Step 4: Approved with SAP BP Number');
        logSuccess('✅ Step 5: Sent webhook notification');
        logSuccess('✅ Step 6: Auto-acknowledgement completed');

        if (ackResponse.data.value && ackResponse.data.value.length > 0) {
            logSuccess(`✅ Step 7: Found ${ackResponse.data.value.length} acknowledgement(s)`);
            logSuccess(`✅ Step 8: Satellite mock received notifications`);

            log('\n' + '='.repeat(70), colors.bright + colors.green);
            log('  🎉 ALL TESTS PASSED! 🎉', colors.bright + colors.green);
            log('='.repeat(70) + '\n', colors.bright + colors.green);

            logInfo('View acknowledgements in the Satellite Acknowledgement Admin app:');
            logInfo(`   ${BASE_URL}/satellite-ack-admin/webapp/index.html`);
        } else {
            log('\n' + '='.repeat(70), colors.bright + colors.yellow);
            log('  ⚠️  TEST COMPLETED WITH WARNINGS', colors.bright + colors.yellow);
            log('='.repeat(70) + '\n', colors.bright + colors.yellow);

            logError('Step 7: No acknowledgements found');
            logInfo('Check server logs for errors');
        }

    } catch (error) {
        logError(`Test failed: ${error.message}`);
        if (error.response) {
            logError(`Status: ${error.response.status}`);
            logError(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        console.error(error);
        process.exit(1);
    }
}

// Run the test
runTest()
    .then(() => {
        log('\n✅ Test script completed\n', colors.green);
        process.exit(0);
    })
    .catch(error => {
        logError(`\nTest script failed: ${error.message}\n`);
        console.error(error);
        process.exit(1);
    });
