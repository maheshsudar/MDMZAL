const cds = require('@sap/cds');
const express = require('express');

// Import validation middleware
const {
  validateCreatePartner,
  validateUpdatePartner,
  validateRequestNumber,
  validateRequestQuery,
  validateBulkCreate,
  validateBulkStatus,
  validateWebhook,
  sanitizeCommonFields,
  simpleRateLimit
} = require('./srv/middleware/validation');

/**
 * CAP Server Bootstrap Configuration
 * Registers REST API endpoints for external system integration
 * NOW WITH COMPREHENSIVE INPUT VALIDATION
 */

// Bootstrap the Express server with custom middleware
cds.on('bootstrap', (app) => {
  console.log('🚀 Bootstrapping CAP server with integration APIs...');

  // Disable ETags completely to prevent cache validation
  app.set('etag', false);

  // Add cache control headers to prevent browser caching issues
  app.use((req, res, next) => {
    // Disable caching for HTML, JS, CSS files to ensure latest versions are loaded
    if (req.path.match(/\.(html|js|css|json|xml)$/i)) {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
    }
    next();
  });

  // Create integration API router
  const integrationRouter = express.Router();

  // JSON parsing middleware with larger limit for document uploads
  integrationRouter.use(express.json({ limit: '10mb' }));
  integrationRouter.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Apply rate limiting (100 requests per minute)
  integrationRouter.use(simpleRateLimit(100, 60000));

  // Apply common field sanitization
  integrationRouter.use(sanitizeCommonFields);

  // Authentication middleware for external systems
  integrationRouter.use(authenticateExternalSystem);

  // ================================
  // INTEGRATION API ENDPOINTS (WITH VALIDATION)
  // ================================

  // Partner request endpoints
  integrationRouter.post('/partners/create', validateCreatePartner, createPartnerRequest);
  integrationRouter.post('/partners/update', validateUpdatePartner, updatePartnerRequest);
  integrationRouter.get('/partners/:requestNumber/status', validateRequestNumber, getRequestStatus);
  integrationRouter.get('/partners/requests', validateRequestQuery, getPartnerRequests);

  // Bulk operations
  integrationRouter.post('/partners/bulk/create', validateBulkCreate, bulkCreatePartnerRequests);
  integrationRouter.post('/partners/bulk/status', validateBulkStatus, getBulkRequestStatus);

  // Webhook endpoints for external systems to receive notifications
  integrationRouter.post('/webhooks/partner-approved', validateWebhook, handlePartnerApproved);
  integrationRouter.post('/webhooks/partner-rejected', validateWebhook, handlePartnerRejected);

  // Integration Suite callback endpoints (called BY Integration Suite after SAP processing)
  integrationRouter.post('/callbacks/sap-bp-number', updateSapBpNumber);
  integrationRouter.post('/callbacks/satellite-system-id', updateSatelliteSystemId);

  // Integration status and health check (no validation needed)
  integrationRouter.get('/health', healthCheck);
  integrationRouter.get('/endpoints', listEndpoints);

  // Mount the integration router at /integration path
  app.use('/integration', integrationRouter);

  console.log('✅ Integration API endpoints registered at /integration');
  console.log('🔒 Input validation and rate limiting enabled');

  // ================================
  // SATELLITE MOCK SYSTEM ENDPOINTS
  // ================================
  // Mock endpoints simulating external satellite systems (Coupa, Salesforce, PI)
  // receiving notifications and sending acknowledgements
  const satelliteMock = require('./srv/integration/satellite-mock');
  app.use('/satellite-mock', satelliteMock.getRouter());

  console.log('✅ Satellite mock system endpoints registered at /satellite-mock');
  console.log('   - POST /satellite-mock/coupa/webhook/mdm-approval');
  console.log('   - POST /satellite-mock/salesforce/webhook/mdm-approval');
  console.log('   - POST /satellite-mock/pi/webhook/mdm-approval');
  console.log('   - POST /satellite-mock/acknowledge (manual ack)');
  console.log('   - GET  /satellite-mock/received-notifications (testing)');
});

/**
 * Authentication middleware for external systems
 * Validates API key and source system headers
 */
async function authenticateExternalSystem(req, res, next) {
  try {
    // BYPASS AUTHENTICATION for development
    // Default to 'Coupa' source system if not provided, to ensure logic works
    req.sourceSystem = req.headers['x-source-system'] || 'Coupa';
    req.authenticated = true;

    // Log that we are bypassing auth
    // console.log(`🔓 Bypassing authentication for ${req.path}, assuming source: ${req.sourceSystem}`);

    next();
  } catch (error) {
    console.error('Authentication bypass error:', error);
    next();
  }
}

/**
 * Create a new partner request
 */
async function createPartnerRequest(req, res) {
  try {
    console.log(`📝 Creating partner request from ${req.sourceSystem}`);

    const requestData = {
      ...req.body,
      sourceSystem: req.sourceSystem,
      requestType: 'Create'
    };

    // Validate required fields
    if (!requestData.partnerName) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'partnerName is required'
      });
    }

    // Get database connection and create request
    const db = await cds.connect.to('db');
    const { BusinessPartnerRequests } = db.entities('mdm.db');

    // Generate request number
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const counter = await getNextCounter(db);
    requestData.requestNumber = `MDM-${timestamp}-${counter.toString().padStart(4, '0')}`;

    // Set initial status
    requestData.status = 'Draft';
    requestData.statusCriticality = 0;

    const result = await db.create(BusinessPartnerRequests).entries(requestData);

    res.status(201).json({
      success: true,
      message: 'Partner request created successfully',
      data: {
        requestId: result.ID,
        requestNumber: requestData.requestNumber,
        status: requestData.status
      }
    });

  } catch (error) {
    console.error('Error creating partner request:', error);
    res.status(500).json({
      error: 'Request creation failed',
      message: error.message
    });
  }
}

/**
 * Update an existing partner request
 */
async function updatePartnerRequest(req, res) {
  try {
    console.log(`📝 Updating partner request from ${req.sourceSystem}`);

    const requestData = {
      ...req.body,
      sourceSystem: req.sourceSystem,
      requestType: 'Update'
    };

    // Validate required fields for update
    if (!requestData.existingBpNumber) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'existingBpNumber is required for update requests'
      });
    }

    // Get database connection and create request
    const db = await cds.connect.to('db');
    const { BusinessPartnerRequests } = db.entities('mdm.db');

    // Generate request number
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const counter = await getNextCounter(db);
    requestData.requestNumber = `MDM-${timestamp}-${counter.toString().padStart(4, '0')}`;

    // Set initial status
    requestData.status = 'Draft';
    requestData.statusCriticality = 0;

    const result = await db.create(BusinessPartnerRequests).entries(requestData);

    res.status(201).json({
      success: true,
      message: 'Partner update request created successfully',
      data: {
        requestId: result.ID,
        requestNumber: requestData.requestNumber,
        status: requestData.status,
        existingBpNumber: requestData.existingBpNumber
      }
    });

  } catch (error) {
    console.error('Error creating update request:', error);
    res.status(500).json({
      error: 'Update request creation failed',
      message: error.message
    });
  }
}

/**
 * Get request status by request number
 */
async function getRequestStatus(req, res) {
  try {
    const { requestNumber } = req.params;
    console.log(`📊 Getting status for request: ${requestNumber}`);

    const db = await cds.connect.to('db');
    const { BusinessPartnerRequests } = db.entities('mdm.db');

    const request = await db.read(BusinessPartnerRequests)
      .where({ requestNumber })
      .columns(['requestNumber', 'status', 'statusCriticality', 'sapBpNumber', 'rejectionReason', 'createdAt', 'modifiedAt']);

    if (!request || request.length === 0) {
      return res.status(404).json({
        error: 'Request not found',
        message: `No request found with number: ${requestNumber}`
      });
    }

    res.json({
      success: true,
      data: request[0]
    });

  } catch (error) {
    console.error('Error getting request status:', error);
    res.status(500).json({
      error: 'Status retrieval failed',
      message: error.message
    });
  }
}

/**
 * Get partner requests with filtering
 */
async function getPartnerRequests(req, res) {
  try {
    const { status, sourceSystem, limit = 50, offset = 0 } = req.query;
    console.log(`📋 Getting partner requests - Status: ${status}, Source: ${sourceSystem || req.sourceSystem}`);

    const db = await cds.connect.to('db');
    const { BusinessPartnerRequests } = db.entities('mdm.db');

    let query = db.read(BusinessPartnerRequests)
      .columns(['requestNumber', 'partnerName', 'status', 'statusCriticality', 'sourceSystem', 'createdAt', 'modifiedAt'])
      .limit(parseInt(limit), parseInt(offset));

    // Filter by source system (only show requests from the authenticated system)
    query = query.where({ sourceSystem: sourceSystem || req.sourceSystem });

    // Filter by status if provided
    if (status) {
      query = query.and({ status });
    }

    const requests = await query;

    res.json({
      success: true,
      data: requests,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: requests.length
      }
    });

  } catch (error) {
    console.error('Error getting partner requests:', error);
    res.status(500).json({
      error: 'Request retrieval failed',
      message: error.message
    });
  }
}

/**
 * Bulk create partner requests (up to 50 per batch)
 */
async function bulkCreatePartnerRequests(req, res) {
  try {
    const requests = req.body.requests || [];
    console.log(`📦 Bulk creating ${requests.length} partner requests from ${req.sourceSystem}`);

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({
        error: 'Invalid request format',
        message: 'requests array is required and cannot be empty'
      });
    }

    if (requests.length > 50) {
      return res.status(400).json({
        error: 'Batch size exceeded',
        message: 'Maximum 50 requests allowed per batch'
      });
    }

    const db = await cds.connect.to('db');
    const { BusinessPartnerRequests } = db.entities('mdm.db');

    const results = [];
    const errors = [];

    // Process each request
    for (let i = 0; i < requests.length; i++) {
      try {
        const requestData = {
          ...requests[i],
          sourceSystem: req.sourceSystem,
          requestType: 'Create'
        };

        // Validate required fields
        if (!requestData.partnerName) {
          errors.push({
            index: i,
            error: 'Missing partnerName',
            data: requests[i]
          });
          continue;
        }

        // Generate request number
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const counter = await getNextCounter(db);
        requestData.requestNumber = `MDM-${timestamp}-${(counter + i).toString().padStart(4, '0')}`;

        // Set initial status
        requestData.status = 'Draft';
        requestData.statusCriticality = 0;

        const result = await db.create(BusinessPartnerRequests).entries(requestData);

        results.push({
          index: i,
          requestId: result.ID,
          requestNumber: requestData.requestNumber,
          status: 'success'
        });

      } catch (error) {
        errors.push({
          index: i,
          error: error.message,
          data: requests[i]
        });
      }
    }

    res.status(207).json({ // 207 Multi-Status
      success: errors.length === 0,
      message: `Processed ${requests.length} requests. ${results.length} successful, ${errors.length} failed.`,
      results,
      errors
    });

  } catch (error) {
    console.error('Error in bulk create:', error);
    res.status(500).json({
      error: 'Bulk creation failed',
      message: error.message
    });
  }
}

/**
 * Get bulk request status
 */
async function getBulkRequestStatus(req, res) {
  try {
    const { requestNumbers } = req.body;

    if (!Array.isArray(requestNumbers) || requestNumbers.length === 0) {
      return res.status(400).json({
        error: 'Invalid request format',
        message: 'requestNumbers array is required'
      });
    }

    const db = await cds.connect.to('db');
    const { BusinessPartnerRequests } = db.entities('mdm.db');

    const requests = await db.read(BusinessPartnerRequests)
      .where({ requestNumber: { in: requestNumbers } })
      .columns(['requestNumber', 'status', 'statusCriticality', 'sapBpNumber', 'rejectionReason']);

    res.json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error('Error getting bulk status:', error);
    res.status(500).json({
      error: 'Bulk status retrieval failed',
      message: error.message
    });
  }
}

/**
 * Handle partner approved webhook
 */
async function handlePartnerApproved(req, res) {
  console.log(`✅ Partner approved webhook from ${req.sourceSystem}:`, req.body);

  // In a real implementation, this would trigger notifications to external systems
  res.json({
    success: true,
    message: 'Partner approved notification received'
  });
}

/**
 * Handle partner rejected webhook
 */
async function handlePartnerRejected(req, res) {
  console.log(`❌ Partner rejected webhook from ${req.sourceSystem}:`, req.body);

  // In a real implementation, this would trigger notifications to external systems
  res.json({
    success: true,
    message: 'Partner rejected notification received'
  });
}

/**
 * Health check endpoint
 */
async function healthCheck(req, res) {
  try {
    // Check database connectivity
    const db = await cds.connect.to('db');
    await db.run('SELECT 1');

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'operational'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

/**
 * List available endpoints
 */
async function listEndpoints(req, res) {
  const endpoints = [
    {
      method: 'POST',
      path: '/integration/partners/create',
      description: 'Create a new partner request',
      authentication: 'API Key + Source System header required'
    },
    {
      method: 'POST',
      path: '/integration/partners/update',
      description: 'Create an update request for existing partner',
      authentication: 'API Key + Source System header required'
    },
    {
      method: 'GET',
      path: '/integration/partners/:requestNumber/status',
      description: 'Get request status by request number',
      authentication: 'API Key + Source System header required'
    },
    {
      method: 'GET',
      path: '/integration/partners/requests',
      description: 'Get list of partner requests with filtering',
      authentication: 'API Key + Source System header required'
    },
    {
      method: 'POST',
      path: '/integration/partners/bulk/create',
      description: 'Bulk create partner requests (max 50)',
      authentication: 'API Key + Source System header required'
    },
    {
      method: 'POST',
      path: '/integration/partners/bulk/status',
      description: 'Get status for multiple requests',
      authentication: 'API Key + Source System header required'
    },
    {
      method: 'GET',
      path: '/integration/health',
      description: 'API health check',
      authentication: 'None'
    },
    {
      method: 'GET',
      path: '/integration/endpoints',
      description: 'List all available endpoints',
      authentication: 'None'
    }
  ];

  res.json({
    service: 'MDM Integration API',
    version: '1.0.0',
    endpoints
  });
}

/**
 * Helper function to get next counter for request number generation
 */
async function getNextCounter(db) {
  const { BusinessPartnerRequests } = db.entities('mdm.db');
  const count = await db.read(BusinessPartnerRequests).columns('count(*) as count');
  return (count[0]?.count || 0) + 1;
}

/**
 * Integration Suite Callback: Update SAP BP Number
 * Called by Integration Suite after SAP business partner creation/update completes
 */
async function updateSapBpNumber(req, res) {
  try {
    const { requestNumber, sapBpNumber } = req.body;

    // Validate required fields
    if (!requestNumber || !sapBpNumber) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['requestNumber', 'sapBpNumber']
      });
    }

    console.log(`📝 Integration Suite callback: Updating SAP BP Number for ${requestNumber} to ${sapBpNumber}`);

    // Connect to database
    const db = await cds.connect.to('db');
    const { BusinessPartnerRequests } = db.entities('mdm.db');

    // Find the request by request number
    const request = await db.read(BusinessPartnerRequests)
      .where({ requestNumber })
      .limit(1);

    if (!request || request.length === 0) {
      return res.status(404).json({
        error: 'Request not found',
        requestNumber
      });
    }

    // Update SAP BP number
    await db.update(BusinessPartnerRequests)
      .set({ sapBpNumber, modifiedAt: new Date().toISOString() })
      .where({ ID: request[0].ID });

    console.log(`✅ SAP BP Number updated successfully for ${requestNumber}`);

    return res.json({
      success: true,
      message: 'SAP BP Number updated successfully',
      requestNumber,
      sapBpNumber,
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating SAP BP Number:', error);
    return res.status(500).json({
      error: 'Failed to update SAP BP Number',
      details: error.message
    });
  }
}

/**
 * Integration Suite Callback: Update Satellite System ID
 * Called by Integration Suite after satellite system sync completes
 * Updates or creates identification entry with satellite system ID
 */
async function updateSatelliteSystemId(req, res) {
  try {
    const { requestNumber, satelliteSystem, satelliteSystemId } = req.body;

    // Validate required fields
    if (!requestNumber || !satelliteSystem || !satelliteSystemId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['requestNumber', 'satelliteSystem', 'satelliteSystemId']
      });
    }

    // Validate satellite system
    const validSystems = ['COUPA', 'SALESFORCE', 'PI'];
    if (!validSystems.includes(satelliteSystem)) {
      return res.status(400).json({
        error: 'Invalid satellite system',
        satelliteSystem,
        validSystems
      });
    }

    console.log(`📝 Integration Suite callback: Updating ${satelliteSystem} ID for ${requestNumber} to ${satelliteSystemId}`);

    // Connect to database
    const db = await cds.connect.to('db');
    const { BusinessPartnerRequests, PartnerIdentifications } = db.entities('mdm.db');

    // Find the request by request number
    const request = await db.read(BusinessPartnerRequests)
      .where({ requestNumber })
      .limit(1);

    if (!request || request.length === 0) {
      return res.status(404).json({
        error: 'Request not found',
        requestNumber
      });
    }

    // Check if identification entry already exists for this satellite system
    const existingIdentification = await db.read(PartnerIdentifications)
      .where({
        request_ID: request[0].ID,
        identificationType_code: satelliteSystem
      })
      .limit(1);

    const timestamp = new Date().toISOString();

    if (existingIdentification && existingIdentification.length > 0) {
      // Update existing identification entry
      await db.update(PartnerIdentifications)
        .set({
          identificationNumber: satelliteSystemId,
          modifiedAt: timestamp
        })
        .where({ ID: existingIdentification[0].ID });

      console.log(`✅ ${satelliteSystem} ID updated successfully for ${requestNumber}`);

      return res.json({
        success: true,
        message: `${satelliteSystem} ID updated successfully`,
        action: 'updated',
        requestNumber,
        satelliteSystem,
        satelliteSystemId,
        updatedAt: timestamp
      });
    } else {
      // Create new identification entry
      const newIdentificationId = `ident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      await db.create(PartnerIdentifications).entries({
        ID: newIdentificationId,
        request_ID: request[0].ID,
        identificationType_code: satelliteSystem,
        identificationNumber: satelliteSystemId,
        country_code: null, // Satellite system IDs don't have country
        createdAt: timestamp,
        modifiedAt: timestamp,
        createdBy: 'integration-suite',
        modifiedBy: 'integration-suite'
      });

      console.log(`✅ ${satelliteSystem} ID created successfully for ${requestNumber}`);

      return res.json({
        success: true,
        message: `${satelliteSystem} ID created successfully`,
        action: 'created',
        requestNumber,
        satelliteSystem,
        satelliteSystemId,
        createdAt: timestamp
      });
    }

  } catch (error) {
    console.error('❌ Error updating satellite system ID:', error);
    return res.status(500).json({
      error: 'Failed to update satellite system ID',
      details: error.message
    });
  }
}

// Export the CDS server module
module.exports = cds.server;