/**
 * Quick script to create a test request and trigger satellite acknowledgement
 * This will populate the Satellite Acknowledgement Admin app with test data
 */

const cds = require('@sap/cds');

async function createTestAcknowledgement() {
    try {
        console.log('🚀 Starting test acknowledgement creation...\n');

        // Connect to database
        const db = await cds.connect.to('db');

        // Create a test request
        console.log('📝 Creating test Coupa request...');
        const testRequest = await INSERT.into('mdm.db.BusinessPartnerRequests').entries({
            requestNumber: `COUPA-TEST-${Date.now()}`,
            name1: 'Test Supplier for Satellite Ack',
            name2: 'Demo Company',
            requestType: 'Create',
            entityType: 'Supplier',
            sourceSystem: 'Coupa',
            status: 'Approved',
            statusCriticality: 3,
            sapBpNumber: `10${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
            approvedBy: 'Alice (MDM Approver)',
            approvedAt: new Date().toISOString(),
            country_code: 'DE',
            paymentTerms_code: 'NT30',
            paymentMethod_code: 'T',
            currency_code: 'EUR'
        });

        const requestId = testRequest.ID;
        const requestNumber = testRequest.requestNumber;
        const sapBpNumber = testRequest.sapBpNumber;

        console.log(`✅ Created request: ${requestNumber}`);
        console.log(`   SAP BP Number: ${sapBpNumber}`);
        console.log(`   Status: Approved\n`);

        // Create notification record
        console.log('📨 Creating notification record...');
        const notification = await INSERT.into('mdm.db.ChangeNotifications').entries({
            request_ID: requestId,
            changeType: 'Approval',
            changeDescription: `Request ${requestNumber} approved with SAP BP Number ${sapBpNumber}`,
            notifiedSystem: 'Coupa',
            notificationDate: new Date().toISOString(),
            notifiedBy: 'MDM System',
            emailRecipients: 'coupa-admin@example.com'
        });

        console.log(`✅ Created notification (ID: ${notification.ID})\n`);

        // Create acknowledgement record directly (simulating satellite ack)
        console.log('✅ Creating acknowledgement record...');
        const acknowledgement = await INSERT.into('mdm.db.NotificationAcknowledgments').entries({
            notification_ID: notification.ID,
            request_ID: requestId,
            targetSystem: 'Coupa',
            status: 'Acknowledged',
            notificationDate: new Date().toISOString(),
            acknowledgedBy: 'Coupa System (Auto)',
            acknowledgedAt: new Date().toISOString(),
            comments: 'Automatically acknowledged by Coupa system after processing approval',

            // Denormalized fields
            partnerName: testRequest.name1,
            requestNumber: requestNumber,
            sapBpNumber: sapBpNumber,
            sourceSystem: 'Coupa',
            changeDescription: `Approval acknowledged by Coupa`,
            notificationSentBy: 'MDM System',
            emailSentTo: 'coupa-admin@example.com'
        });

        console.log(`✅ Created acknowledgement (ID: ${acknowledgement.ID})\n`);

        console.log('════════════════════════════════════════════════════════');
        console.log('✅ TEST DATA CREATED SUCCESSFULLY!');
        console.log('════════════════════════════════════════════════════════\n');
        console.log('View the acknowledgement in the Satellite Acknowledgement Admin app:');
        console.log('   http://localhost:4004/satellite-ack-admin/webapp/index.html\n');
        console.log('Record Details:');
        console.log(`   Request Number: ${requestNumber}`);
        console.log(`   SAP BP Number: ${sapBpNumber}`);
        console.log(`   Target System: Coupa`);
        console.log(`   Status: Acknowledged`);
        console.log(`   Acknowledged By: Coupa System (Auto)`);
        console.log('════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error creating test acknowledgement:', error);
        process.exit(1);
    }
}

// Run the script
cds.test()
    .then(() => createTestAcknowledgement())
    .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
