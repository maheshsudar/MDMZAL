const express = require('express');
const cds = require('@sap/cds');

/**
 * Mock Satellite System Service
 * Simulates external satellite systems (Coupa, Salesforce, PI) receiving notifications
 * and sending acknowledgements back to MDM
 */
class SatelliteMockService {
    constructor() {
        this.router = express.Router();
        this.setupRoutes();
        this.receivedNotifications = []; // Store notifications for testing
        this.autoAcknowledge = true; // Auto-acknowledge by default
        this.acknowledgementDelay = 2000; // 2 second delay
    }

    setupRoutes() {
        // ============================================
        // WEBHOOK ENDPOINTS (Receive Notifications)
        // ============================================

        /**
         * Coupa webhook endpoint - Receives MDM approval notifications
         */
        this.router.post('/coupa/webhook/mdm-approval', async (req, res) => {
            await this.handleWebhookNotification('Coupa', req, res);
        });

        /**
         * Salesforce webhook endpoint - Receives MDM approval notifications
         */
        this.router.post('/salesforce/webhook/mdm-approval', async (req, res) => {
            await this.handleWebhookNotification('Salesforce', req, res);
        });

        /**
         * PI webhook endpoint - Receives MDM approval notifications
         */
        this.router.post('/pi/webhook/mdm-approval', async (req, res) => {
            await this.handleWebhookNotification('PI', req, res);
        });

        // ============================================
        // ACKNOWLEDGEMENT ENDPOINTS
        // ============================================

        /**
         * Manual acknowledgement endpoint - Allows manual ack from admin UI
         */
        this.router.post('/acknowledge', async (req, res) => {
            await this.sendAcknowledgement(req.body, res);
        });

        /**
         * Get all received notifications (for testing)
         */
        this.router.get('/received-notifications', (req, res) => {
            res.json({
                count: this.receivedNotifications.length,
                notifications: this.receivedNotifications
            });
        });

        /**
         * Clear received notifications (for testing)
         */
        this.router.delete('/received-notifications', (req, res) => {
            this.receivedNotifications = [];
            res.json({ message: 'Notifications cleared' });
        });

        /**
         * Configure auto-acknowledgement
         */
        this.router.post('/config/auto-acknowledge', (req, res) => {
            this.autoAcknowledge = req.body.enabled !== false;
            this.acknowledgementDelay = req.body.delayMs || 2000;
            res.json({
                autoAcknowledge: this.autoAcknowledge,
                acknowledgementDelay: this.acknowledgementDelay
            });
        });
    }

    /**
     * Handle incoming webhook notification from MDM system
     */
    async handleWebhookNotification(systemName, req, res) {
        try {
            const notification = req.body;

            console.log(`📨 [${systemName}] Received MDM approval notification:`);
            console.log(`   Request: ${notification.requestNumber}`);
            console.log(`   Status: ${notification.status}`);
            console.log(`   SAP BP: ${notification.sapBpNumber}`);

            // Store notification for testing
            const receivedNotification = {
                system: systemName,
                receivedAt: new Date().toISOString(),
                notification: notification
            };
            this.receivedNotifications.push(receivedNotification);

            // Respond immediately to MDM (acknowledge receipt)
            res.status(200).json({
                success: true,
                message: `${systemName} received notification`,
                notificationId: notification.notificationId,
                receivedAt: new Date().toISOString()
            });

            // Auto-acknowledge if enabled
            if (this.autoAcknowledge) {
                console.log(`⏱️  [${systemName}] Auto-acknowledgement scheduled in ${this.acknowledgementDelay}ms`);

                setTimeout(async () => {
                    try {
                        await this.sendAcknowledgement({
                            notificationId: notification.notificationId,
                            requestId: notification.requestId,
                            requestNumber: notification.requestNumber,
                            targetSystem: systemName,
                            status: 'Acknowledged',
                            acknowledgedBy: `${systemName} System (Auto)`,
                            comments: `Automatically acknowledged by ${systemName} system after processing approval`
                        });
                    } catch (error) {
                        console.error(`❌ [${systemName}] Auto-acknowledgement failed:`, error.message);
                    }
                }, this.acknowledgementDelay);
            }

        } catch (error) {
            console.error(`❌ [${systemName}] Error handling webhook:`, error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Send acknowledgement back to MDM system
     */
    async sendAcknowledgement(ackData, res = null) {
        try {
            console.log(`✅ [${ackData.targetSystem}] Sending acknowledgement:`);
            console.log(`   Request: ${ackData.requestNumber}`);
            console.log(`   Acknowledged by: ${ackData.acknowledgedBy}`);

            // Get CAP service
            const db = await cds.connect.to('db');
            const { NotificationAcknowledgments, ChangeNotifications, BusinessPartnerRequests } = db.entities;

            // Find the notification record
            let notification = null;
            if (ackData.notificationId) {
                notification = await SELECT.one.from(ChangeNotifications)
                    .where({ ID: ackData.notificationId });
            }

            // Find the request
            let request = null;
            if (ackData.requestId) {
                request = await SELECT.one.from(BusinessPartnerRequests)
                    .where({ ID: ackData.requestId });
            } else if (ackData.requestNumber) {
                request = await SELECT.one.from(BusinessPartnerRequests)
                    .where({ requestNumber: ackData.requestNumber });
            }

            if (!request) {
                throw new Error(`Request not found: ${ackData.requestNumber || ackData.requestId}`);
            }

            // Create acknowledgement record
            const acknowledgement = {
                notification_ID: notification?.ID || null,
                request_ID: request.ID,
                targetSystem: ackData.targetSystem,
                status: ackData.status || 'Acknowledged',
                notificationDate: notification?.notificationDate || new Date().toISOString(),
                acknowledgedBy: ackData.acknowledgedBy,
                acknowledgedAt: new Date().toISOString(),
                comments: ackData.comments || '',

                // Denormalized fields for quick display
                partnerName: request.name1 || request.partnerName,
                requestNumber: request.requestNumber,
                sapBpNumber: request.sapBpNumber || 'Pending',
                sourceSystem: request.sourceSystem,
                changeDescription: `Approval acknowledged by ${ackData.targetSystem}`,

                // History tracking
                notificationSentBy: notification?.notifiedBy || 'MDM System',
                emailSentTo: notification?.emailRecipients || ''
            };

            // Check if acknowledgement already exists
            const existing = await SELECT.one.from(NotificationAcknowledgments)
                .where({
                    request_ID: request.ID,
                    targetSystem: ackData.targetSystem
                });

            let result;
            if (existing) {
                // Update existing acknowledgement
                result = await UPDATE(NotificationAcknowledgments)
                    .set({
                        status: acknowledgement.status,
                        acknowledgedBy: acknowledgement.acknowledgedBy,
                        acknowledgedAt: acknowledgement.acknowledgedAt,
                        comments: acknowledgement.comments
                    })
                    .where({ ID: existing.ID });

                console.log(`📝 [${ackData.targetSystem}] Updated existing acknowledgement`);
            } else {
                // Insert new acknowledgement
                result = await INSERT.into(NotificationAcknowledgments).entries(acknowledgement);
                console.log(`📝 [${ackData.targetSystem}] Created new acknowledgement`);
            }

            const responseData = {
                success: true,
                message: 'Acknowledgement recorded successfully',
                acknowledgement: {
                    requestNumber: acknowledgement.requestNumber,
                    targetSystem: acknowledgement.targetSystem,
                    acknowledgedBy: acknowledgement.acknowledgedBy,
                    acknowledgedAt: acknowledgement.acknowledgedAt
                }
            };

            if (res) {
                res.status(200).json(responseData);
            }

            return responseData;

        } catch (error) {
            console.error('❌ Error sending acknowledgement:', error.message);

            if (res) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }

            throw error;
        }
    }

    /**
     * Get Express router
     */
    getRouter() {
        return this.router;
    }
}

module.exports = new SatelliteMockService();
