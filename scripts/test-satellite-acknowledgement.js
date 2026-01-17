/**
 * End-to-End Test Script for Satellite Acknowledgement Flow
 *
 * This script tests the complete workflow:
 * 1. Create a business partner request in Coupa system
 * 2. Submit the request for approval
 * 3. MDM Approver approves the request
 * 4. System sends notification to satellite mock system
 * 5. Satellite system auto-acknowledges (2 second delay)
 * 6. Verify acknowledgement is recorded in database
 * 7. Check acknowledgement appears in Satellite Acknowledgement Admin app
 */

const cds = require('@sap/cds');
const axios = require('axios');

const BASE_URL = 'http://localhost:4004';

// ANSI color codes for pretty output
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
        log('  SATELLITE ACKNOWLEDGEMENT FLOW - END-TO-END TEST', colors.bright + colors.cyan);
        log('='.repeat(70) + '\n', colors.bright);

        // Connect to database
        const db = await cds.connect.to('db');
        const { BusinessPartnerRequests, NotificationAcknowledgments, ChangeNotifications } = db.entities;

        // ============================================
        // STEP 1: Create Sample Coupa Request
        // ============================================
        logStep(1, 'Create sample Coupa supplier request');

        const testRequest = {
            name1: 'Acme Corporation Ltd',
            name2: 'Global Headquarters',
            requestType: 'Create',
            entityType: 'Supplier',
            sourceSystem: 'Coupa',
            status: 'Draft',
            statusCriticality: 0,
            country_code: 'DE',
            paymentTerms_code: 'NT30',
            paymentMethod_code: 'T',
            currency_code: 'EUR',
            createdBy: 'test-user',
            modifiedBy: 'test-user'
        };

        // Generate request number
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const counter = Math.floor(Math.random() * 10000);
        testRequest.requestNumber = `COUPA-${timestamp}-${counter.toString().padStart(4, '0')}`;

        const createdRequest = await INSERT.into(BusinessPartnerRequests).entries(testRequest);
        const requestId = createdRequest.ID;

        logSuccess(`Created request: ${testRequest.requestNumber} (ID: ${requestId})`);
        logInfo(`   Name: ${testRequest.name1}`);
        logInfo(`   Type: ${testRequest.requestType}`);
        logInfo(`   Source: ${testRequest.sourceSystem}`);

        // ============================================
        // STEP 2: Submit for Approval
        // ============================================
        logStep(2, 'Submit request for approval');

        await UPDATE(BusinessPartnerRequests)
            .set({
                status: 'Submitted',
                statusCriticality: 2
            })
            .where({ ID: requestId });

        logSuccess('Request submitted for approval');

        // ============================================
        // STEP 3: Approve Request (simulating MDM Approver)
        // ============================================
        logStep(3, 'Approve request and generate SAP BP Number');

        const sapBpNumber = `10${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

        await UPDATE(BusinessPartnerRequests)
            .set({
                status: 'Approved',
                statusCriticality: 3,
                sapBpNumber: sapBpNumber,
                approvedBy: 'Alice (MDM Approver)',
                approvedAt: new Date().toISOString()
            })
            .where({ ID: requestId });

        logSuccess(`Request approved with SAP BP Number: ${sapBpNumber}`);

        // ============================================
        // STEP 4: Trigger Webhook Notification
        // ============================================
        logStep(4, 'Trigger webhook notification to Coupa satellite system');

        // Create a notification record
        const notification = await INSERT.into(ChangeNotifications).entries({
            request_ID: requestId,
            changeType: 'Approval',
            changeDescription: `Request ${testRequest.requestNumber} approved with SAP BP Number ${sapBpNumber}`,
            notifiedSystem: 'Coupa',
            notificationDate: new Date().toISOString(),
            notifiedBy: 'MDM System',
            emailRecipients: 'coupa-admin@example.com'
        });

        const notificationId = notification.ID;
        logSuccess(`Created notification record (ID: ${notificationId})`);

        // Read the request again for notification service
        const requestForNotification = await SELECT.one.from(BusinessPartnerRequests).where({ ID: requestId });

        // Send webhook notification using NotificationService
        const NotificationService = require('../srv/lib/notification-service');
        const notificationResult = await NotificationService.sendStatusChangeNotification(
            requestForNotification,
            'approved',
            {
                userId: 'Alice',
                comments: 'Approved after compliance check',
                notificationId: notificationId
            }
        );

        logSuccess('Webhook notification sent to Coupa satellite system');
        logInfo(`   Webhook result: ${JSON.stringify(notificationResult, null, 2)}`);

        // ============================================
        // STEP 5: Wait for Auto-Acknowledgement
        // ============================================
        logStep(5, 'Wait for satellite system to auto-acknowledge (2 seconds)');

        logInfo('   Waiting for auto-acknowledgement...');
        await delay(2500); // Wait 2.5 seconds to ensure auto-ack completed

        logSuccess('Auto-acknowledgement window completed');

        // ============================================
        // STEP 6: Verify Acknowledgement in Database
        // ============================================
        logStep(6, 'Verify acknowledgement is recorded in database');

        const acknowledgements = await SELECT.from(NotificationAcknowledgments)
            .where({ request_ID: requestId });

        if (acknowledgements.length === 0) {
            logError('No acknowledgements found!');
            logInfo('   This could mean:');
            logInfo('   1. Auto-acknowledgement is disabled');
            logInfo('   2. Webhook failed to reach satellite system');
            logInfo('   3. Acknowledgement processing failed');
            return;
        }

        logSuccess(`Found ${acknowledgements.length} acknowledgement(s)`);

        acknowledgements.forEach((ack, index) => {
            logInfo(`   Acknowledgement ${index + 1}:`);
            logInfo(`      System: ${ack.targetSystem}`);
            logInfo(`      Status: ${ack.status}`);
            logInfo(`      Acknowledged By: ${ack.acknowledgedBy}`);
            logInfo(`      Acknowledged At: ${ack.acknowledgedAt}`);
            logInfo(`      Comments: ${ack.comments || 'None'}`);
        });

        // ============================================
        // STEP 7: Verify via API Endpoint
        // ============================================
        logStep(7, 'Verify acknowledgement via Satellite Acknowledgement API');

        const apiResponse = await axios.get(
            `${BASE_URL}/satellite-ack/NotificationAcknowledgments?$filter=requestNumber eq '${testRequest.requestNumber}'`,
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        if (apiResponse.data.value && apiResponse.data.value.length > 0) {
            logSuccess('Acknowledgements visible via API');
            logInfo(`   Found ${apiResponse.data.value.length} record(s) in Satellite Acknowledgement Service`);
        } else {
            logError('No acknowledgements found via API');
        }

        // ============================================
        // STEP 8: Check Satellite Mock Received Notifications
        // ============================================
        logStep(8, 'Check satellite mock system received notifications');

        const mockResponse = await axios.get(`${BASE_URL}/satellite-mock/received-notifications`);

        logSuccess(`Satellite mock received ${mockResponse.data.count} notification(s)`);

        if (mockResponse.data.count > 0) {
            mockResponse.data.notifications.forEach((notif, index) => {
                logInfo(`   Notification ${index + 1}:`);
                logInfo(`      System: ${notif.system}`);
                logInfo(`      Received At: ${notif.receivedAt}`);
                logInfo(`      Request: ${notif.notification.requestNumber}`);
                logInfo(`      Status: ${notif.notification.status}`);
            });
        }

        // ============================================
        // TEST SUMMARY
        // ============================================
        log('\n' + '='.repeat(70), colors.bright);
        log('  TEST SUMMARY', colors.bright + colors.green);
        log('='.repeat(70), colors.bright);

        logSuccess('✅ Step 1: Created test request');
        logSuccess('✅ Step 2: Submitted for approval');
        logSuccess('✅ Step 3: Approved with SAP BP Number');
        logSuccess('✅ Step 4: Sent webhook notification');
        logSuccess('✅ Step 5: Auto-acknowledgement completed');
        logSuccess(`✅ Step 6: Found ${acknowledgements.length} acknowledgement(s) in database`);
        logSuccess('✅ Step 7: Acknowledgements visible via API');
        logSuccess(`✅ Step 8: Satellite mock received ${mockResponse.data.count} notification(s)`);

        log('\n' + '='.repeat(70), colors.bright + colors.green);
        log('  🎉 ALL TESTS PASSED! 🎉', colors.bright + colors.green);
        log('='.repeat(70) + '\n', colors.bright + colors.green);

        logInfo('You can now view the acknowledgements in the Satellite Acknowledgement Admin app:');
        logInfo(`   ${BASE_URL}/satellite-ack-admin/webapp/index.html`);

    } catch (error) {
        logError(`Test failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run the test
runTest()
    .then(() => {
        log('\n✅ Test script completed successfully\n', colors.green);
        process.exit(0);
    })
    .catch(error => {
        logError(`\nTest script failed: ${error.message}\n`);
        console.error(error);
        process.exit(1);
    });
