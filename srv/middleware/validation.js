const { body, param, query, validationResult } = require('express-validator');

/**
 * REST API Input Validation Middleware
 * Implements comprehensive validation for all integration API endpoints
 * Following SAP CAP and Express.js security best practices
 */

/**
 * Validation error handler middleware
 * Returns standardized error response for validation failures
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    return res.status(400).json({
      error: 'Validation Failed',
      message: 'One or more input fields contain invalid data',
      details: formattedErrors,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Validation rules for creating a partner request
 */
const validateCreatePartner = [
  // Partner Name - mandatory, sanitized
  body('partnerName')
    .trim()
    .notEmpty().withMessage('Partner name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Partner name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&.,()]+$/).withMessage('Partner name contains invalid characters')
    .escape(),

  // Email - optional but must be valid if provided
  body('requesterEmail')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('Email must not exceed 100 characters'),

  // Entity Type - must be from allowed values
  body('entityType')
    .optional()
    .trim()
    .isIn(['Supplier', 'Customer', 'Both']).withMessage('Entity type must be Supplier, Customer, or Both'),

  // Request Type - auto-set but validate if provided
  body('requestType')
    .optional()
    .trim()
    .equals('Create').withMessage('Request type must be Create for this endpoint'),

  // Coupa Internal Number - optional, sanitized
  body('coupaInternalNo')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 }).withMessage('Coupa internal number must not exceed 50 characters')
    .escape(),

  // Salesforce ID - optional, sanitized
  body('salesforceId')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 }).withMessage('Salesforce ID must not exceed 50 characters')
    .escape(),

  // Currency - optional, 3-letter ISO code
  body('currency_code')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 3 }).withMessage('Currency code must be 3 characters')
    .isAlpha().withMessage('Currency code must contain only letters')
    .toUpperCase(),

  // Payment Terms - optional, sanitized
  body('paymentTerms_code')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 10 }).withMessage('Payment terms code must not exceed 10 characters')
    .escape(),

  // Payment Method - optional, sanitized
  body('paymentMethod_code')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Payment method code must not exceed 20 characters')
    .escape(),

  // Search Term - optional, sanitized
  body('searchTerm')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Search term must not exceed 20 characters')
    .escape(),

  // Addresses - optional array validation
  body('addresses')
    .optional()
    .isArray().withMessage('Addresses must be an array'),

  body('addresses.*.street')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 60 }).withMessage('Street must not exceed 60 characters')
    .escape(),

  body('addresses.*.city')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 40 }).withMessage('City must not exceed 40 characters')
    .escape(),

  body('addresses.*.postalCode')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 10 }).withMessage('Postal code must not exceed 10 characters')
    .escape(),

  body('addresses.*.country_code')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 2 }).withMessage('Country code must be 2 characters')
    .isAlpha().withMessage('Country code must contain only letters')
    .toUpperCase(),

  // VAT IDs - optional array validation
  body('vatIds')
    .optional()
    .isArray().withMessage('VAT IDs must be an array'),

  body('vatIds.*.vatNumber')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 }).withMessage('VAT number must not exceed 50 characters')
    .matches(/^[A-Z0-9]+$/).withMessage('VAT number must contain only uppercase letters and numbers'),

  body('vatIds.*.country_code')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 2 }).withMessage('Country code must be 2 characters')
    .isAlpha().withMessage('Country code must contain only letters')
    .toUpperCase(),

  // Banks - optional array validation
  body('banks')
    .optional()
    .isArray().withMessage('Banks must be an array'),

  body('banks.*.iban')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 15, max: 34 }).withMessage('IBAN must be between 15 and 34 characters')
    .matches(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/).withMessage('Invalid IBAN format'),

  body('banks.*.accountNumber')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Account number must not exceed 20 characters')
    .matches(/^[A-Z0-9]+$/).withMessage('Account number must contain only letters and numbers'),

  body('banks.*.swiftCode')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 8, max: 11 }).withMessage('SWIFT code must be between 8 and 11 characters')
    .matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/).withMessage('Invalid SWIFT code format'),

  // Emails - optional array validation
  body('emails')
    .optional()
    .isArray().withMessage('Emails must be an array'),

  body('emails.*.emailAddress')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('Email must not exceed 100 characters'),

  handleValidationErrors
];

/**
 * Validation rules for updating a partner request
 */
const validateUpdatePartner = [
  // Existing BP Number - mandatory for updates
  body('existingBpNumber')
    .trim()
    .notEmpty().withMessage('Existing BP number is required for update requests')
    .isLength({ min: 1, max: 20 }).withMessage('BP number must be between 1 and 20 characters')
    .matches(/^[0-9]+$/).withMessage('BP number must contain only numbers')
    .escape(),

  // Partner Name - optional for updates (may not change)
  body('partnerName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Partner name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-&.,()]+$/).withMessage('Partner name contains invalid characters')
    .escape(),

  // Request Type - must be Update
  body('requestType')
    .optional()
    .trim()
    .equals('Update').withMessage('Request type must be Update for this endpoint'),

  // Change Description - optional but recommended
  body('changeDescription')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Change description must not exceed 500 characters')
    .escape(),

  // Include all other validation rules from create
  ...validateCreatePartner.slice(1, -1), // Exclude partnerName and handleValidationErrors

  handleValidationErrors
];

/**
 * Validation rules for getting request status
 */
const validateRequestNumber = [
  param('requestNumber')
    .trim()
    .notEmpty().withMessage('Request number is required')
    .matches(/^[A-Z]+-[0-9]+-[0-9]+$/).withMessage('Invalid request number format (expected: SYSTEM-YYYYMMDD-NNNN)')
    .escape(),

  handleValidationErrors
];

/**
 * Validation rules for query parameters
 */
const validateRequestQuery = [
  query('status')
    .optional()
    .trim()
    .isIn(['Draft', 'New', 'Submitted', 'Approved', 'Rejected', 'Completed', 'Error'])
    .withMessage('Invalid status value'),

  query('sourceSystem')
    .optional()
    .trim()
    .isIn(['Coupa', 'Salesforce', 'PI', 'Manual'])
    .withMessage('Invalid source system'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('offset')
    .optional()
    .isInt({ min: 0 }).withMessage('Offset must be a positive integer')
    .toInt(),

  handleValidationErrors
];

/**
 * Validation rules for bulk operations
 */
const validateBulkCreate = [
  body('requests')
    .isArray({ min: 1, max: 50 }).withMessage('Requests array must contain 1 to 50 items'),

  body('requests.*.partnerName')
    .trim()
    .notEmpty().withMessage('Partner name is required for all requests')
    .isLength({ min: 2, max: 100 }).withMessage('Partner name must be between 2 and 100 characters')
    .escape(),

  handleValidationErrors
];

/**
 * Validation rules for bulk status check
 */
const validateBulkStatus = [
  body('requestNumbers')
    .isArray({ min: 1, max: 100 }).withMessage('Request numbers array must contain 1 to 100 items'),

  body('requestNumbers.*')
    .trim()
    .matches(/^[A-Z]+-[0-9]+-[0-9]+$/).withMessage('Invalid request number format'),

  handleValidationErrors
];

/**
 * Validation rules for webhook payloads
 */
const validateWebhook = [
  body('requestNumber')
    .trim()
    .notEmpty().withMessage('Request number is required')
    .matches(/^[A-Z]+-[0-9]+-[0-9]+$/).withMessage('Invalid request number format'),

  body('sapBpNumber')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9]+$/).withMessage('SAP BP number must contain only numbers'),

  body('reason')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
    .escape(),

  handleValidationErrors
];

/**
 * Sanitize and validate common fields across all requests
 * This middleware runs before specific validation rules
 */
const sanitizeCommonFields = (req, res, next) => {
  // Remove any potentially harmful HTML/script tags from string fields
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Basic XSS prevention
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
      }
    });
  }

  next();
};

/**
 * Rate limiting helper (can be enhanced with redis)
 * Simple in-memory implementation for demonstration
 */
const rateLimitMap = new Map();

const simpleRateLimit = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const record = rateLimitMap.get(key);

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per minute.`,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    record.count++;
    next();
  };
};

module.exports = {
  validateCreatePartner,
  validateUpdatePartner,
  validateRequestNumber,
  validateRequestQuery,
  validateBulkCreate,
  validateBulkStatus,
  validateWebhook,
  sanitizeCommonFields,
  simpleRateLimit,
  handleValidationErrors
};
