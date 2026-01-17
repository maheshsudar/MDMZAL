/**
 * Create comprehensive test data for Coupa, Salesforce, and PI systems
 * - Proper number ranges (COUPA-0000000001, SALESFORCE-0000000001, PI-0000000001)
 * - All mandatory fields filled
 * - Various statuses (New, Submitted, ComplianceCheck, DuplicateReview, Approved, Rejected)
 * - Duplicate scenarios (matching existing partners)
 * - AEB compliance triggers and results
 */

const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

const db = new Database('db.sqlite');

// Helper function to create UUID
function newId() {
  return uuidv4();
}

// Helper function to get ISO timestamp
function now() {
  return new Date().toISOString();
}

console.log('🚀 Creating comprehensive test data for Coupa, Salesforce, and PI...\n');

// Clear existing Coupa, Salesforce, and PI requests
console.log('🗑️  Clearing existing Coupa, Salesforce, and PI requests...');
db.prepare('DELETE FROM mdm_db_DuplicateChecks WHERE request_ID IN (SELECT ID FROM mdm_db_BusinessPartnerRequests WHERE sourceSystem IN (?, ?, ?))').run('Coupa', 'Salesforce', 'PI');
db.prepare('DELETE FROM mdm_db_SubAccountEmails WHERE subAccount_ID IN (SELECT ID FROM mdm_db_SubAccounts WHERE request_ID IN (SELECT ID FROM mdm_db_BusinessPartnerRequests WHERE sourceSystem IN (?, ?, ?)))').run('Coupa', 'Salesforce', 'PI');
db.prepare('DELETE FROM mdm_db_SubAccountBanks WHERE subAccount_ID IN (SELECT ID FROM mdm_db_SubAccounts WHERE request_ID IN (SELECT ID FROM mdm_db_BusinessPartnerRequests WHERE sourceSystem IN (?, ?, ?)))').run('Coupa', 'Salesforce', 'PI');
db.prepare('DELETE FROM mdm_db_SubAccounts WHERE request_ID IN (SELECT ID FROM mdm_db_BusinessPartnerRequests WHERE sourceSystem IN (?, ?, ?))').run('Coupa', 'Salesforce', 'PI');
db.prepare('DELETE FROM mdm_db_PartnerEmails WHERE request_ID IN (SELECT ID FROM mdm_db_BusinessPartnerRequests WHERE sourceSystem IN (?, ?, ?))').run('Coupa', 'Salesforce', 'PI');
db.prepare('DELETE FROM mdm_db_PartnerBanks WHERE request_ID IN (SELECT ID FROM mdm_db_BusinessPartnerRequests WHERE sourceSystem IN (?, ?, ?))').run('Coupa', 'Salesforce', 'PI');
db.prepare('DELETE FROM mdm_db_PartnerVatIds WHERE request_ID IN (SELECT ID FROM mdm_db_BusinessPartnerRequests WHERE sourceSystem IN (?, ?, ?))').run('Coupa', 'Salesforce', 'PI');
db.prepare('DELETE FROM mdm_db_PartnerAddresses WHERE request_ID IN (SELECT ID FROM mdm_db_BusinessPartnerRequests WHERE sourceSystem IN (?, ?, ?))').run('Coupa', 'Salesforce', 'PI');
db.prepare('DELETE FROM mdm_db_ApprovalHistory WHERE request_ID IN (SELECT ID FROM mdm_db_BusinessPartnerRequests WHERE sourceSystem IN (?, ?, ?))').run('Coupa', 'Salesforce', 'PI');
db.prepare('DELETE FROM mdm_db_RequestAttachments WHERE request_ID IN (SELECT ID FROM mdm_db_BusinessPartnerRequests WHERE sourceSystem IN (?, ?, ?))').run('Coupa', 'Salesforce', 'PI');
db.prepare('DELETE FROM mdm_db_BusinessPartnerRequests WHERE sourceSystem IN (?, ?, ?)').run('Coupa', 'Salesforce', 'PI');

// ================================
// COUPA TEST REQUESTS
// ================================

console.log('\n📦 Creating Coupa requests...');

const coupaRequests = [
  {
    requestNumber: 'COUPA-0000000001',
    partnerName: 'Acme Corporation',
    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'Coupa',
    status: 'New',
    statusCriticality: 0,
    coupaInternalNo: 'COUPA-SUP-001',
    searchTerm: 'ACME',
    communicationLanguage: 'EN',
    currency_code: 'EUR',
    paymentTerms_code: 'Z030',
    paymentMethod_code: 'T',
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Acme Corporation HQ',
        street: 'Hauptstrasse',
        streetNumber: '15',
        city: 'Berlin',
        postalCode: '10115',
        country_code: 'DE',
        region: 'BE',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'DE',
        vatNumber: 'DE123456789',
        vatType_code: 'MWST',
        isEstablished: true,
        isDefault: true
      }
    ],
    banks: [
      {
        bankCountry_code: 'DE',
        bankName: 'Deutsche Bank',
        accountHolder: 'Acme Corporation',
        iban: 'DE89370400440532013000',
        swiftCode: 'DEUTDEFF',
        currency_code: 'EUR',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'PRIMARY',
        emailAddress: 'finance@acme.de',
        isDefault: true
      }
    ],
    identifications: [
      {
        identificationType_code: 'COUPA',
        identificationNumber: 'COUPA-SUP-001',
        country_code: 'DE'
      },
      {
        identificationType_code: '05',
        identificationNumber: '123456789',
        country_code: 'DE'
      }
    ],
    duplicateCheck: true,
    description: 'New request - Duplicate VAT ID'
  },
  {
    requestNumber: 'COUPA-0000000002',
    partnerName: 'Tech Solutions LLC',
    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'Coupa',
    status: 'Submitted',
    statusCriticality: 2,
    coupaInternalNo: 'COUPA-SUP-002',
    searchTerm: 'TECHSOL',
    communicationLanguage: 'EN',
    currency_code: 'GBP',
    paymentTerms_code: 'Z014',
    paymentMethod_code: 'C',
    aebStatus: 'NotChecked',
    viesStatus: 'NotChecked',
    duplicateCheckStatus: 'NotChecked',
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Tech Solutions Office',
        street: 'High Street',
        streetNumber: '42',
        city: 'London',
        postalCode: 'EC2A 3LT',
        country_code: 'GB',
        region: 'LND',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'GB',
        vatNumber: 'GB987654321',
        vatType_code: 'MWST',
        isEstablished: true,
        isDefault: true
      }
    ],
    banks: [
      {
        bankCountry_code: 'GB',
        bankName: 'Barclays Bank',
        accountHolder: 'Tech Solutions LLC',
        iban: 'GB29NWBK60161331926819',
        swiftCode: 'BARCGB22',
        currency_code: 'GBP',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'PRIMARY',
        emailAddress: 'accounts@techsolutions.co.uk',
        isDefault: true
      }
    ],
    identifications: [
      {
        identificationType_code: 'COUPA',
        identificationNumber: 'COUPA-TECH-002',
        country_code: 'GB'
      }
    ],
    description: 'Submitted - Awaiting compliance check'
  },
  {
    requestNumber: 'COUPA-0000000003',
    partnerName: 'Tehran Trading Company',
    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'Coupa',
    status: 'Completed',
    statusCriticality: 3,
    coupaInternalNo: 'COUPA-SUP-003',
    searchTerm: 'TEHRAN',
    communicationLanguage: 'EN',
    currency_code: 'EUR',
    paymentTerms_code: 'Z030',
    paymentMethod_code: 'T',
    aebStatus: 'Failed',
    aebRiskScore: 95,
    aebRiskLevel: 'Very High',
    aebCheckDetails: 'Sanctioned country - Iran. Multiple sanctions list matches.',
    viesStatus: 'NotApplicable',
    duplicateCheckStatus: 'NoDuplicates',
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Tehran Trading HQ',
        street: 'Valiasr Street',
        streetNumber: '100',
        city: 'Tehran',
        postalCode: '11369',
        country_code: 'IR',
        region: 'TH',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'IR',
        vatNumber: 'IR1234567890',
        vatType_code: 'MWST',
        isEstablished: true,
        isDefault: true,
        validationStatus: 'NotApplicable'
      }
    ],
    banks: [
      {
        bankCountry_code: 'DE',
        bankName: 'Commerzbank',
        accountHolder: 'Tehran Trading Company',
        iban: 'DE89370800400532013000',
        swiftCode: 'COBADEFF',
        currency_code: 'EUR',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'PRIMARY',
        emailAddress: 'info@tehrancorp.ir',
        isDefault: true
      }
    ],
    aebCheck: true,
    description: 'Compliance check - AEB sanctions failure'
  },
  {
    requestNumber: 'COUPA-0000000004',
    partnerName: 'Damascus Industrial Group',
    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'Coupa',
    status: 'Error',
    statusCriticality: 1,
    coupaInternalNo: 'COUPA-SUP-004',
    searchTerm: 'DAMASCUS',
    communicationLanguage: 'EN',
    currency_code: 'EUR',
    paymentTerms_code: 'Z030',
    paymentMethod_code: 'T',
    aebStatus: 'Failed',
    aebRiskScore: 88,
    aebRiskLevel: 'Very High',
    aebCheckDetails: 'Sanctioned country - Syria. Entity List match.',
    viesStatus: 'NotApplicable',
    duplicateCheckStatus: 'DuplicatesFound',
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Damascus Industrial',
        street: 'Al Midan Street',
        streetNumber: '25',
        city: 'Damascus',
        postalCode: '12345',
        country_code: 'SY',
        region: 'DM',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'SY',
        vatNumber: 'SY9876543210',
        vatType_code: 'MWST',
        isEstablished: true,
        isDefault: true,
        validationStatus: 'NotApplicable'
      }
    ],
    banks: [
      {
        bankCountry_code: 'DE',
        bankName: 'Deutsche Bank',
        accountHolder: 'Damascus Industrial Group',
        iban: 'DE89370400440532099999',
        swiftCode: 'DEUTDEFF',
        currency_code: 'EUR',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'PRIMARY',
        emailAddress: 'contact@damascusindustrial.sy',
        isDefault: true
      }
    ],
    duplicateCheck: true,
    aebCheck: true,
    description: 'Duplicate review - AEB failure + name match'
  },
  {
    requestNumber: 'COUPA-0000000005',
    partnerName: 'Global Trade Partners',
    entityType: 'Both',
    requestType: 'Create',
    sourceSystem: 'Coupa',
    status: 'Approved',
    statusCriticality: 1,
    coupaInternalNo: 'COUPA-SUP-005',
    searchTerm: 'GLOBAL',
    communicationLanguage: 'EN',
    currency_code: 'USD',
    paymentTerms_code: 'Z030',
    paymentMethod_code: 'C',
    aebStatus: 'Passed',
    aebRiskScore: 15,
    aebRiskLevel: 'Clean',
    aebCheckDetails: 'No sanctions matches. Clean compliance record.',
    viesStatus: 'NotApplicable',
    duplicateCheckStatus: 'NoDuplicates',
    approvedBy: 'alice',
    approvedAt: now(),
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Global Trade HQ',
        street: 'Wall Street',
        streetNumber: '123',
        city: 'New York',
        postalCode: '10005',
        country_code: 'US',
        region: 'NY',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'US',
        vatNumber: '98-7654321',
        vatType_code: 'FEIN',
        isEstablished: true,
        isDefault: true,
        validationStatus: 'NotApplicable'
      }
    ],
    banks: [
      {
        bankCountry_code: 'US',
        bankName: 'JPMorgan Chase',
        accountHolder: 'Global Trade Partners',
        accountNumber: '123456789012',
        swiftCode: 'CHASUS33',
        currency_code: 'USD',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'PRIMARY',
        emailAddress: 'finance@globaltrade.com',
        isDefault: true
      }
    ],
    aebCheck: true,
    description: 'Approved - Clean compliance'
  },
  {
    requestNumber: 'COUPA-0000000006',
    partnerName: 'European Manufacturing Ltd',
    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'Coupa',
    status: 'Rejected',
    statusCriticality: 3,
    coupaInternalNo: 'COUPA-SUP-006',
    searchTerm: 'EUROMFG',
    communicationLanguage: 'EN',
    currency_code: 'EUR',
    paymentTerms_code: 'Z030',
    paymentMethod_code: 'T',
    aebStatus: 'Failed',
    aebRiskScore: 75,
    aebRiskLevel: 'High',
    aebCheckDetails: 'PEP match identified. Senior political figure association.',
    viesStatus: 'Valid',
    duplicateCheckStatus: 'NoDuplicates',
    rejectedBy: 'alice',
    rejectedAt: now(),
    rejectionReason: 'Failed AEB compliance check - PEP association identified',
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'European Manufacturing',
        street: 'Rue de la Loi',
        streetNumber: '200',
        city: 'Brussels',
        postalCode: '1000',
        country_code: 'BE',
        region: 'BRU',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'BE',
        vatNumber: 'BE0123456789',
        vatType_code: 'MWST',
        isEstablished: true,
        isDefault: true,
        validationStatus: 'Valid'
      }
    ],
    banks: [
      {
        bankCountry_code: 'BE',
        bankName: 'KBC Bank',
        accountHolder: 'European Manufacturing Ltd',
        iban: 'BE68539007547034',
        swiftCode: 'KREDBEBB',
        currency_code: 'EUR',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'PRIMARY',
        emailAddress: 'contact@euromfg.be',
        isDefault: true
      }
    ],
    aebCheck: true,
    description: 'Rejected - PEP match'
  },
  {
    requestNumber: 'COUPA-0000000007',
    partnerName: 'Nordic Supplies AB',
    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'Coupa',
    status: 'New',
    statusCriticality: 2,
    coupaInternalNo: 'COUPA-SUP-007',
    searchTerm: 'NORDIC',
    communicationLanguage: 'EN',
    currency_code: 'SEK',
    paymentTerms_code: 'Z014',
    paymentMethod_code: 'T',
    aebStatus: 'Passed',
    aebRiskScore: 10,
    aebRiskLevel: 'Clean',
    aebCheckDetails: 'No issues identified. Clean record.',
    viesStatus: 'Pending',
    duplicateCheckStatus: 'Checking',
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Nordic Supplies',
        street: 'Drottninggatan',
        streetNumber: '88',
        city: 'Stockholm',
        postalCode: '111 60',
        country_code: 'SE',
        region: 'AB',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'SE',
        vatNumber: 'SE123456789001',
        vatType_code: 'MWST',
        isEstablished: true,
        isDefault: true,
        validationStatus: 'Pending'
      }
    ],
    banks: [
      {
        bankCountry_code: 'SE',
        bankName: 'Swedbank',
        accountHolder: 'Nordic Supplies AB',
        iban: 'SE4550000000058398257466',
        swiftCode: 'SWEDSESS',
        currency_code: 'SEK',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'PRIMARY',
        emailAddress: 'info@nordicsupplies.se',
        isDefault: true
      }
    ],
    aebCheck: true,
    description: 'Compliance check - VIES pending'
  },
  {
    requestNumber: 'COUPA-0000000008',
    partnerName: 'Alpine Industries GmbH',
    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'Coupa',
    status: 'New',
    statusCriticality: 2,
    coupaInternalNo: 'COUPA-SUP-008',
    searchTerm: 'ALPINE',
    communicationLanguage: 'DE',
    currency_code: 'EUR',
    paymentTerms_code: 'Z030',
    paymentMethod_code: 'T',
    aebStatus: 'Passed',
    aebRiskScore: 12,
    aebRiskLevel: 'Clean',
    aebCheckDetails: 'Clean compliance screening.',
    viesStatus: 'Valid',
    duplicateCheckStatus: 'DuplicatesFound',
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Alpine Industries',
        street: 'Bergstrasse',
        streetNumber: '42',
        city: 'Munich',
        postalCode: '80331',
        country_code: 'DE',
        region: 'BY',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'DE',
        vatNumber: 'DE789012345',
        vatType_code: 'MWST',
        isEstablished: true,
        isDefault: true,
        validationStatus: 'Valid'
      }
    ],
    banks: [
      {
        bankCountry_code: 'DE',
        bankName: 'Commerzbank',
        accountHolder: 'Alpine Industries GmbH',
        iban: 'DE89500800000999999999',
        swiftCode: 'DRESDEFF',
        currency_code: 'EUR',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'PRIMARY',
        emailAddress: 'info@alpine-industries.de',
        isDefault: true
      }
    ],
    duplicateCheck: true,
    aebCheck: true,
    description: 'Duplicate review - VAT ID matches Soylent'
  },
  {
    requestNumber: 'COUPA-0000000009',
    partnerName: 'Mediterranean Trading Co',
    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'Coupa',
    status: 'Submitted',
    statusCriticality: 0,
    coupaInternalNo: 'COUPA-SUP-009',
    searchTerm: 'MEDTRADE',
    communicationLanguage: 'EN',
    currency_code: 'EUR',
    paymentTerms_code: 'Z030',
    paymentMethod_code: 'C',
    aebStatus: 'NotChecked',
    viesStatus: 'NotChecked',
    duplicateCheckStatus: 'NotChecked',
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Mediterranean Trading',
        street: 'Via Roma',
        streetNumber: '156',
        city: 'Rome',
        postalCode: '00184',
        country_code: 'IT',
        region: 'RM',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'IT',
        vatNumber: 'IT12345678901',
        vatType_code: 'MWST',
        isEstablished: true,
        isDefault: true,
        validationStatus: 'NotChecked'
      }
    ],
    banks: [
      {
        bankCountry_code: 'IT',
        bankName: 'UniCredit',
        accountHolder: 'Mediterranean Trading Co',
        iban: 'IT60X0542811101000000123456',
        swiftCode: 'UNCRITMM',
        currency_code: 'EUR',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'PRIMARY',
        emailAddress: 'office@medtrade.it',
        isDefault: true
      }
    ],
    description: 'Submitted - Awaiting processing'
  },
  {
    requestNumber: 'COUPA-0000000010',
    partnerName: 'Iberian Logistics SA',
    entityType: 'Supplier',
    requestType: 'Create',
    sourceSystem: 'Coupa',
    status: 'New',
    statusCriticality: 0,
    coupaInternalNo: 'COUPA-SUP-010',
    searchTerm: 'IBERIAN',
    communicationLanguage: 'ES',
    currency_code: 'EUR',
    paymentTerms_code: 'Z014',
    paymentMethod_code: 'T',
    aebStatus: 'NotChecked',
    viesStatus: 'NotChecked',
    duplicateCheckStatus: 'NotChecked',
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Iberian Logistics',
        street: 'Calle Mayor',
        streetNumber: '28',
        city: 'Madrid',
        postalCode: '28013',
        country_code: 'ES',
        region: 'M',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'ES',
        vatNumber: 'ESB12345678',
        vatType_code: 'MWST',
        isEstablished: true,
        isDefault: true,
        validationStatus: 'NotChecked'
      }
    ],
    banks: [
      {
        bankCountry_code: 'ES',
        bankName: 'Banco Santander',
        accountHolder: 'Iberian Logistics SA',
        iban: 'ES9121000418450200051332',
        swiftCode: 'BSCHESMM',
        currency_code: 'EUR',
        isDefault: true
      }
    ],
    emails: [
      {
        emailType_code: 'PRIMARY',
        emailAddress: 'contact@iberianlog.es',
        isDefault: true
      }
    ],
    description: 'New request - Spanish supplier'
  }
];

// Insert Coupa requests
for (const req of coupaRequests) {
  const reqId = newId();
  const timestamp = now();

  // Insert main request
  db.prepare(`
    INSERT INTO mdm_db_BusinessPartnerRequests
    (ID, createdAt, createdBy, modifiedAt, modifiedBy, requestNumber, partnerName, name1, name2, entityType,
     requestType, sourceSystem, status, statusCriticality, searchTerm,
     communicationLanguage, currency_code, paymentTerms_code, paymentMethod_code,
     aebStatus, aebCheckDetails, viesStatus, duplicateCheckStatus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    reqId, timestamp, 'system', timestamp, 'system', req.requestNumber, req.partnerName, req.partnerName, null,
    req.entityType, req.requestType, req.sourceSystem, req.status, req.statusCriticality,
    req.searchTerm, req.communicationLanguage, req.currency_code,
    req.paymentTerms_code, req.paymentMethod_code,
    req.aebStatus || 'NotChecked', req.aebCheckDetails || null,
    req.viesStatus || 'NotChecked', req.duplicateCheckStatus || 'NotChecked'
  );

  // Insert addresses and store IDs for SubAccount linkage
  const addressIds = [];
  for (const addr of req.addresses) {
    const addressId = newId();
    addressIds.push(addressId);

    db.prepare(`
      INSERT INTO mdm_db_PartnerAddresses
      (ID, createdAt, createdBy, modifiedAt, modifiedBy, request_ID, addressType_code, name1,
       street, streetNumber, city, postalCode, country_code, region, isDefault)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      addressId, timestamp, 'system', timestamp, 'system', reqId, addr.addressType_code, addr.name1,
      addr.street, addr.streetNumber, addr.city, addr.postalCode, addr.country_code, addr.region,
      addr.isDefault ? 1 : 0
    );
  }

  // Insert VAT IDs
  for (const vat of req.vatIds) {
    db.prepare(`
      INSERT INTO mdm_db_PartnerVatIds
      (ID, createdAt, createdBy, modifiedAt, modifiedBy, request_ID, country_code, vatNumber,
       vatType_code, isEstablished, isDefault, validationStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId(), timestamp, 'system', timestamp, 'system', reqId, vat.country_code, vat.vatNumber,
      vat.vatType_code, vat.isEstablished ? 1 : 0, vat.isDefault ? 1 : 0, vat.validationStatus || 'NotChecked'
    );
  }

  // Insert banks
  for (const bank of req.banks) {
    db.prepare(`
      INSERT INTO mdm_db_PartnerBanks
      (ID, createdAt, createdBy, modifiedAt, modifiedBy, request_ID, bankCountry_code, bankName,
       accountHolder, accountNumber, iban, swiftCode, currency_code, isDefault)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId(), timestamp, 'system', timestamp, 'system', reqId, bank.bankCountry_code, bank.bankName,
      bank.accountHolder, bank.accountNumber || null, bank.iban || null, bank.swiftCode,
      bank.currency_code, bank.isDefault ? 1 : 0
    );
  }

  // Insert emails
  for (const email of req.emails) {
    db.prepare(`
      INSERT INTO mdm_db_PartnerEmails
      (ID, createdAt, createdBy, modifiedAt, modifiedBy, request_ID, emailType_code,
       emailAddress, isDefault)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId(), timestamp, 'system', timestamp, 'system', reqId, email.emailType_code,
      email.emailAddress, email.isDefault ? 1 : 0
    );
  }

  // Insert identifications if available
  if (req.identifications) {
    for (const identification of req.identifications) {
      db.prepare(`
        INSERT INTO mdm_db_PartnerIdentifications
        (ID, createdAt, createdBy, modifiedAt, modifiedBy, request_ID, identificationType_code,
         identificationNumber, country_code, issuingAuthority, validFrom, validTo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newId(), timestamp, 'system', timestamp, 'system', reqId, identification.identificationType_code,
        identification.identificationNumber, identification.country_code || null,
        identification.issuingAuthority || null, identification.validFrom || null, identification.validTo || null
      );
    }
  }

  // Insert duplicate checks if applicable
  if (req.duplicateCheck) {
    // Get existing partner from the existing partners table
    const existingPartner = db.prepare('SELECT sapBpNumber, partnerName FROM mdm_db_ExistingPartners WHERE partnerName LIKE ? LIMIT 1').get(`%${req.partnerName.split(' ')[0]}%`);

    if (existingPartner) {
      db.prepare(`
        INSERT INTO mdm_db_DuplicateChecks
        (ID, createdAt, createdBy, modifiedAt, modifiedBy, request_ID,
         matchType, matchScore, existingBpNumber, existingBpName, matchDetails, reviewRequired,
         mergeDecision, mergeComments)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newId(), timestamp, 'system', timestamp, 'system', reqId,
        'EstablishedVAT', 100, existingPartner.sapBpNumber, existingPartner.partnerName,
        'Exact VAT ID match found', req.status === 'DuplicateReview' ? 1 : 0,
        req.status === 'Approved' ? 'CreateNew' : null,
        req.status === 'Approved' ? 'Approved to create new partner despite duplicate' : null
      );
    }
  }

  console.log(`  ✅ ${req.requestNumber}: ${req.partnerName} [${req.status}] (${req.description})`);
}

// ================================
// SALESFORCE TEST REQUESTS
// ================================

console.log('\n📦 Creating Salesforce requests...');

const salesforceRequests = [
  {
    requestNumber: 'SALESFORCE-0000000001',
    partnerName: 'Acme Corporation',
    entityType: 'Customer',
    requestType: 'Create',
    sourceSystem: 'Salesforce',
    status: 'New',
    statusCriticality: 0,
    salesforceId: 'SF-ACC-001',
    searchTerm: 'ACME',
    accountType: 'Customer',
    industry: 'Manufacturing',
    communicationLanguage: 'EN',
    currency_code: 'EUR',
    revenueStream_code: 'SUBSCRIPTION',
    billingCycle_code: 'MONTHLY',
    bpType_code: 'Z001',
    dunningStrategy_code: 'DP01',
    identifications: [
      {
        identificationType_code: 'COUPA',
        identificationNumber: 'COUPA-ACME-SF-001',
        country_code: 'DE'
      },
      {
        identificationType_code: '03',
        identificationNumber: 'DE123456789',
        country_code: 'DE'
      }
    ],
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Acme Corporation',
        street: 'Hauptstrasse',
        streetNumber: '15',
        city: 'Berlin',
        postalCode: '10115',
        country_code: 'DE',
        region: 'BE',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'DE',
        vatNumber: 'DE123456789',
        vatType_code: 'MWST',
        isEstablished: true,
        isDefault: true
      }
    ],
    subAccounts: [
      {
        subAccountId: 'SUB-001',
        revenueStream_code: 'SUBSCRIPTION',
        billingCycle_code: 'MONTHLY',
        currency_code: 'EUR',
        paymentTerms_code: 'Z030',
        dunningStrategy_code: 'DP01',
        banks: [
          {
            bankCountry_code: 'DE',
            bankName: 'Deutsche Bank',
            accountHolder: 'Acme Corporation',
            accountNumber: '1234567890',
            iban: 'DE89370400440532013000',
            swiftCode: 'DEUTDEFF',
            currency_code: 'EUR',
            isDefault: true
          }
        ],
        emails: [
          {
            emailType_code: 'PRIMARY',
            contactType_code: 'BILLING',
            emailAddress: 'billing@acme.de',
            isDefault: true
          }
        ]
      }
    ],
    duplicateCheck: true,
    description: 'New request - Duplicate VAT ID'
  },
  {
    requestNumber: 'SALESFORCE-0000000002',
    partnerName: 'Tech Solutions Inc',
    entityType: 'Customer',
    requestType: 'Create',
    sourceSystem: 'Salesforce',
    status: 'Submitted',
    statusCriticality: 0,
    salesforceId: 'SF-ACC-002',
    searchTerm: 'TECHSOL',
    accountType: 'Customer',
    industry: 'Technology',
    communicationLanguage: 'EN',
    currency_code: 'GBP',
    revenueStream_code: 'LICENSE',
    billingCycle_code: 'ANNUAL',
    bpType_code: 'Z002',
    dunningStrategy_code: 'DP02',
    aebStatus: 'NotChecked',
    viesStatus: 'NotChecked',
    duplicateCheckStatus: 'NotChecked',
    identifications: [
      {
        identificationType_code: 'COUPA',
        identificationNumber: 'COUPA-TECH-SF-002',
        country_code: 'GB'
      },
      {
        identificationType_code: '05',
        identificationNumber: '987654321',
        country_code: 'GB'
      }
    ],
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Tech Solutions Office',
        street: 'High Street',
        streetNumber: '42',
        city: 'London',
        postalCode: 'EC2A 3LT',
        country_code: 'GB',
        region: 'LND',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'GB',
        vatNumber: 'GB987654321',
        vatType_code: 'MWST',
        isEstablished: true,
        isDefault: true
      }
    ],
    subAccounts: [
      {
        subAccountId: 'SUB-002',
        revenueStream_code: 'LICENSE',
        billingCycle_code: 'ANNUAL',
        currency_code: 'GBP',
        paymentTerms_code: 'Z014',
        dunningStrategy_code: 'DP02',
        banks: [
          {
            bankCountry_code: 'GB',
            bankName: 'Barclays Bank',
            accountHolder: 'Tech Solutions Inc',
            accountNumber: '98765432',
            iban: 'GB29NWBK60161331926819',
            swiftCode: 'BARCGB22',
            currency_code: 'GBP',
            isDefault: true
          }
        ],
        emails: [
          {
            emailType_code: 'PRIMARY',
            contactType_code: 'FINANCE',
            emailAddress: 'finance@techsolutions.co.uk',
            isDefault: true
          }
        ]
      }
    ],
    description: 'Submitted - Awaiting compliance'
  },
  {
    requestNumber: 'SALESFORCE-0000000003',
    partnerName: 'Pyongyang Electronics Corp',
    entityType: 'Customer',
    requestType: 'Create',
    sourceSystem: 'Salesforce',
    status: 'Error',
    statusCriticality: 1,
    salesforceId: 'SF-ACC-003',
    searchTerm: 'PYONGYANG',
    accountType: 'Prospect',
    industry: 'Electronics',
    communicationLanguage: 'EN',
    currency_code: 'EUR',
    revenueStream_code: 'HARDWARE',
    billingCycle_code: 'QUARTERLY',
    bpType_code: 'Z001',
    dunningStrategy_code: 'DP01',
    aebStatus: 'Failed',
    aebRiskScore: 100,
    aebRiskLevel: 'Sanctions',
    aebCheckDetails: 'Critical sanctions match - North Korea. Multiple SDN List entries.',
    viesStatus: 'NotApplicable',
    duplicateCheckStatus: 'NoDuplicates',
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Pyongyang Electronics',
        street: 'Ryomyong Street',
        streetNumber: '88',
        city: 'Pyongyang',
        postalCode: '999093',
        country_code: 'KP',
        region: 'PY',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'KP',
        vatNumber: 'KP8888888888',
        vatType_code: 'MWST',
        isEstablished: true,
        isDefault: true,
        validationStatus: 'NotApplicable'
      }
    ],
    subAccounts: [
      {
        subAccountId: 'SUB-003',
        revenueStream_code: 'HARDWARE',
        billingCycle_code: 'QUARTERLY',
        currency_code: 'EUR',
        paymentTerms_code: 'Z030',
        dunningStrategy_code: 'DP01',
        banks: [
          {
            bankCountry_code: 'CN',
            bankName: 'Bank of China',
            accountHolder: 'Pyongyang Electronics Corp',
            accountNumber: '88888888',
            swiftCode: 'BKCHCNBJ',
            currency_code: 'EUR',
            isDefault: true
          }
        ],
        emails: [
          {
            emailType_code: 'PRIMARY',
            contactType_code: 'SALES',
            emailAddress: 'contact@pyelec.kp',
            isDefault: true
          }
        ]
      }
    ],
    aebCheck: true,
    description: 'Compliance check - North Korea sanctions'
  },
  {
    requestNumber: 'SALESFORCE-0000000004',
    partnerName: 'Cuban Trade Solutions',
    entityType: 'Customer',
    requestType: 'Create',
    sourceSystem: 'Salesforce',
    status: 'Rejected',
    statusCriticality: 1,
    salesforceId: 'SF-ACC-004',
    searchTerm: 'CUBAN',
    accountType: 'Prospect',
    industry: 'Trading',
    communicationLanguage: 'ES',
    currency_code: 'EUR',
    revenueStream_code: 'SERVICES',
    billingCycle_code: 'MONTHLY',
    bpType_code: 'Z003',
    dunningStrategy_code: 'DP03',
    aebStatus: 'Failed',
    aebRiskScore: 82,
    aebRiskLevel: 'Very High',
    aebCheckDetails: 'Sanctioned country - Cuba. US embargo restrictions apply.',
    viesStatus: 'NotApplicable',
    duplicateCheckStatus: 'DuplicatesFound',
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Cuban Trade Solutions',
        street: 'Calle 23',
        streetNumber: '456',
        city: 'Havana',
        postalCode: '10400',
        country_code: 'CU',
        region: 'HAV',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'CU',
        vatNumber: 'CU1234567890',
        vatType_code: 'MWST',
        isEstablished: true,
        isDefault: true,
        validationStatus: 'NotApplicable'
      }
    ],
    subAccounts: [
      {
        subAccountId: 'SUB-004',
        revenueStream_code: 'SERVICES',
        billingCycle_code: 'MONTHLY',
        currency_code: 'EUR',
        paymentTerms_code: 'Z030',
        dunningStrategy_code: 'DP03',
        banks: [
          {
            bankCountry_code: 'ES',
            bankName: 'Banco Santander',
            accountHolder: 'Cuban Trade Solutions',
            accountNumber: '77777777',
            iban: 'ES9121000418450200051332',
            swiftCode: 'BSCHESMM',
            currency_code: 'EUR',
            isDefault: true
          }
        ],
        emails: [
          {
            emailType_code: 'PRIMARY',
            contactType_code: 'GENERAL',
            emailAddress: 'info@cubantrade.cu',
            isDefault: true
          }
        ]
      }
    ],
    duplicateCheck: true,
    aebCheck: true,
    description: 'Duplicate review - Cuba sanctions + name match'
  },
  {
    requestNumber: 'SALESFORCE-0000000005',
    partnerName: 'Soylent Industries GmbH',
    entityType: 'Customer',
    requestType: 'Create',
    sourceSystem: 'Salesforce',
    status: 'Approved',
    statusCriticality: 1,
    salesforceId: 'SF-ACC-005',
    searchTerm: 'SOYLENT',
    accountType: 'Customer',
    industry: 'Food & Beverage',
    communicationLanguage: 'EN',
    currency_code: 'EUR',
    revenueStream_code: 'SUBSCRIPTION',
    billingCycle_code: 'ANNUAL',
    bpType_code: 'Z001',
    dunningStrategy_code: 'DP01',
    aebStatus: 'Passed',
    aebRiskScore: 8,
    aebRiskLevel: 'Clean',
    aebCheckDetails: 'No issues identified.',
    viesStatus: 'Valid',
    duplicateCheckStatus: 'NoDuplicates',
    approvedBy: 'alice',
    approvedAt: now(),
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Soylent Industries',
        street: 'Industriestrasse',
        streetNumber: '77',
        city: 'Munich',
        postalCode: '80331',
        country_code: 'DE',
        region: 'BY',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'DE',
        vatNumber: 'DE555666777',
        vatType_code: 'MWST',
        isEstablished: true,
        isDefault: true,
        validationStatus: 'Valid'
      }
    ],
    subAccounts: [
      {
        subAccountId: 'SUB-005',
        revenueStream_code: 'SUBSCRIPTION',
        billingCycle_code: 'ANNUAL',
        currency_code: 'EUR',
        paymentTerms_code: 'Z030',
        dunningStrategy_code: 'DP01',
        banks: [
          {
            bankCountry_code: 'DE',
            bankName: 'Commerzbank',
            accountHolder: 'Soylent Industries GmbH',
            accountNumber: '9999999999',
            iban: 'DE89500800000999999999',
            swiftCode: 'DRESDEFF',
            currency_code: 'EUR',
            isDefault: true
          }
        ],
        emails: [
          {
            emailType_code: 'PRIMARY',
            contactType_code: 'BILLING',
            emailAddress: 'billing@soylent.de',
            isDefault: true
          }
        ]
      }
    ],
    aebCheck: true,
    description: 'Approved - Clean compliance'
  },
  {
    requestNumber: 'SALESFORCE-0000000006',
    partnerName: 'Pacific Rim Ventures',
    entityType: 'Customer',
    requestType: 'Create',
    sourceSystem: 'Salesforce',
    status: 'Rejected',
    statusCriticality: 3,
    salesforceId: 'SF-ACC-006',
    searchTerm: 'PACIFIC',
    accountType: 'Prospect',
    industry: 'Financial Services',
    communicationLanguage: 'EN',
    currency_code: 'USD',
    revenueStream_code: 'SERVICES',
    billingCycle_code: 'MONTHLY',
    bpType_code: 'Z002',
    dunningStrategy_code: 'DP02',
    aebStatus: 'Failed',
    aebRiskScore: 68,
    aebRiskLevel: 'High',
    aebCheckDetails: 'Adverse media found - legal proceedings related to financial irregularities.',
    viesStatus: 'NotApplicable',
    duplicateCheckStatus: 'NoDuplicates',
    rejectedBy: 'alice',
    rejectedAt: now(),
    rejectionReason: 'Failed AEB compliance - Adverse media and legal risk',
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Pacific Rim Ventures',
        street: 'Market Street',
        streetNumber: '500',
        city: 'San Francisco',
        postalCode: '94102',
        country_code: 'US',
        region: 'CA',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'US',
        vatNumber: '77-8899001',
        vatType_code: 'FEIN',
        isEstablished: true,
        isDefault: true,
        validationStatus: 'NotApplicable'
      }
    ],
    subAccounts: [
      {
        subAccountId: 'SUB-006',
        revenueStream_code: 'SERVICES',
        billingCycle_code: 'MONTHLY',
        currency_code: 'USD',
        paymentTerms_code: 'Z014',
        dunningStrategy_code: 'DP02',
        banks: [
          {
            bankCountry_code: 'US',
            bankName: 'Wells Fargo',
            accountHolder: 'Pacific Rim Ventures',
            accountNumber: '555666777888',
            swiftCode: 'WFBIUS6S',
            currency_code: 'USD',
            isDefault: true
          }
        ],
        emails: [
          {
            emailType_code: 'PRIMARY',
            contactType_code: 'FINANCE',
            emailAddress: 'finance@pacificrim.com',
            isDefault: true
          }
        ]
      }
    ],
    aebCheck: true,
    description: 'Rejected - Adverse media'
  },
  {
    requestNumber: 'SALESFORCE-0000000007',
    partnerName: 'Nordic Enterprise Solutions',
    entityType: 'Customer',
    requestType: 'Create',
    sourceSystem: 'Salesforce',
    status: 'Completed',
    statusCriticality: 3,
    salesforceId: 'SF-ACC-007',
    searchTerm: 'NORDIC',
    accountType: 'Customer',
    industry: 'Software',
    communicationLanguage: 'EN',
    currency_code: 'SEK',
    revenueStream_code: 'LICENSE',
    billingCycle_code: 'ANNUAL',
    bpType_code: 'Z001',
    dunningStrategy_code: 'DP01',
    aebStatus: 'Passed',
    aebRiskScore: 5,
    aebRiskLevel: 'Clean',
    aebCheckDetails: 'Clean screening results.',
    viesStatus: 'Pending',
    duplicateCheckStatus: 'Checking',
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Nordic Enterprise',
        street: 'Kungsgatan',
        streetNumber: '45',
        city: 'Stockholm',
        postalCode: '111 56',
        country_code: 'SE',
        region: 'AB',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'SE',
        vatNumber: 'SE556677889901',
        vatType_code: 'MWST',
        isEstablished: true,
        isDefault: true,
        validationStatus: 'Pending'
      }
    ],
    subAccounts: [
      {
        subAccountId: 'SUB-007',
        revenueStream_code: 'LICENSE',
        billingCycle_code: 'ANNUAL',
        currency_code: 'SEK',
        paymentTerms_code: 'Z030',
        dunningStrategy_code: 'DP01',
        banks: [
          {
            bankCountry_code: 'SE',
            bankName: 'Nordea',
            accountHolder: 'Nordic Enterprise Solutions',
            iban: 'SE4550000000058398257466',
            swiftCode: 'NDEASESS',
            currency_code: 'SEK',
            isDefault: true
          }
        ],
        emails: [
          {
            emailType_code: 'PRIMARY',
            contactType_code: 'BILLING',
            emailAddress: 'billing@nordicent.se',
            isDefault: true
          }
        ]
      }
    ],
    aebCheck: true,
    description: 'Compliance check - VIES pending'
  },
  {
    requestNumber: 'SALESFORCE-0000000008',
    partnerName: 'Alpine Technologies AG',
    entityType: 'Customer',
    requestType: 'Create',
    sourceSystem: 'Salesforce',
    status: 'New',
    statusCriticality: 2,
    salesforceId: 'SF-ACC-008',
    searchTerm: 'ALPINE',
    accountType: 'Customer',
    industry: 'Manufacturing',
    communicationLanguage: 'DE',
    currency_code: 'CHF',
    revenueStream_code: 'HARDWARE',
    billingCycle_code: 'QUARTERLY',
    bpType_code: 'Z001',
    dunningStrategy_code: 'DP01',
    aebStatus: 'Passed',
    aebRiskScore: 7,
    aebRiskLevel: 'Clean',
    aebCheckDetails: 'No compliance issues.',
    viesStatus: 'NotApplicable',
    duplicateCheckStatus: 'DuplicatesFound',
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Alpine Technologies',
        street: 'Bahnhofstrasse',
        streetNumber: '12',
        city: 'Zurich',
        postalCode: '8001',
        country_code: 'CH',
        region: 'ZH',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'CH',
        vatNumber: 'CHE123456789',
        vatType_code: 'MWST',
        isEstablished: true,
        isDefault: true,
        validationStatus: 'NotApplicable'
      }
    ],
    subAccounts: [
      {
        subAccountId: 'SUB-008',
        revenueStream_code: 'HARDWARE',
        billingCycle_code: 'QUARTERLY',
        currency_code: 'CHF',
        paymentTerms_code: 'Z030',
        dunningStrategy_code: 'DP01',
        banks: [
          {
            bankCountry_code: 'CH',
            bankName: 'UBS Switzerland',
            accountHolder: 'Alpine Technologies AG',
            iban: 'CH9300762011623852957',
            swiftCode: 'UBSWCHZH80A',
            currency_code: 'CHF',
            isDefault: true
          }
        ],
        emails: [
          {
            emailType_code: 'PRIMARY',
            contactType_code: 'FINANCE',
            emailAddress: 'finance@alpinetech.ch',
            isDefault: true
          }
        ]
      }
    ],
    duplicateCheck: true,
    aebCheck: true,
    description: 'Duplicate review - Similar name to existing'
  },
  {
    requestNumber: 'SALESFORCE-0000000009',
    partnerName: 'Mediterranean Solutions Ltd',
    entityType: 'Customer',
    requestType: 'Create',
    sourceSystem: 'Salesforce',
    status: 'Submitted',
    statusCriticality: 0,
    salesforceId: 'SF-ACC-009',
    searchTerm: 'MEDSOL',
    accountType: 'Customer',
    industry: 'Consulting',
    communicationLanguage: 'EN',
    currency_code: 'EUR',
    revenueStream_code: 'SERVICES',
    billingCycle_code: 'MONTHLY',
    bpType_code: 'Z003',
    dunningStrategy_code: 'DP03',
    aebStatus: 'NotChecked',
    viesStatus: 'NotChecked',
    duplicateCheckStatus: 'NotChecked',
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Mediterranean Solutions',
        street: 'Voulis Street',
        streetNumber: '89',
        city: 'Athens',
        postalCode: '10563',
        country_code: 'GR',
        region: 'AT',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'GR',
        vatNumber: 'EL123456789',
        vatType_code: 'MWST',
        isEstablished: true,
        isDefault: true,
        validationStatus: 'NotChecked'
      }
    ],
    subAccounts: [
      {
        subAccountId: 'SUB-009',
        revenueStream_code: 'SERVICES',
        billingCycle_code: 'MONTHLY',
        currency_code: 'EUR',
        paymentTerms_code: 'Z030',
        dunningStrategy_code: 'DP03',
        banks: [
          {
            bankCountry_code: 'GR',
            bankName: 'National Bank of Greece',
            accountHolder: 'Mediterranean Solutions Ltd',
            iban: 'GR1601101250000000012300695',
            swiftCode: 'ETHNGRAA',
            currency_code: 'EUR',
            isDefault: true
          }
        ],
        emails: [
          {
            emailType_code: 'PRIMARY',
            contactType_code: 'GENERAL',
            emailAddress: 'info@medsolutions.gr',
            isDefault: true
          }
        ]
      }
    ],
    description: 'Submitted - Awaiting processing'
  },
  {
    requestNumber: 'SALESFORCE-0000000010',
    partnerName: 'Baltic Trading House',
    entityType: 'Customer',
    requestType: 'Create',
    sourceSystem: 'Salesforce',
    status: 'New',
    statusCriticality: 0,
    salesforceId: 'SF-ACC-010',
    searchTerm: 'BALTIC',
    accountType: 'Prospect',
    industry: 'Trading',
    communicationLanguage: 'EN',
    currency_code: 'EUR',
    revenueStream_code: 'SUBSCRIPTION',
    billingCycle_code: 'ANNUAL',
    bpType_code: 'Z001',
    dunningStrategy_code: 'DP01',
    aebStatus: 'NotChecked',
    viesStatus: 'NotChecked',
    duplicateCheckStatus: 'NotChecked',
    addresses: [
      {
        addressType_code: 'MAIN',
        name1: 'Baltic Trading House',
        street: 'Gedimino Avenue',
        streetNumber: '33',
        city: 'Vilnius',
        postalCode: '01109',
        country_code: 'LT',
        region: 'VL',
        isDefault: true
      }
    ],
    vatIds: [
      {
        country_code: 'LT',
        vatNumber: 'LT123456789',
        vatType_code: 'MWST',
        isEstablished: true,
        isDefault: true,
        validationStatus: 'NotChecked'
      }
    ],
    subAccounts: [
      {
        subAccountId: 'SUB-010',
        revenueStream_code: 'SUBSCRIPTION',
        billingCycle_code: 'ANNUAL',
        currency_code: 'EUR',
        paymentTerms_code: 'Z014',
        dunningStrategy_code: 'DP01',
        banks: [
          {
            bankCountry_code: 'LT',
            bankName: 'Swedbank Lithuania',
            accountHolder: 'Baltic Trading House',
            iban: 'LT121000011101001000',
            swiftCode: 'HABALT22',
            currency_code: 'EUR',
            isDefault: true
          }
        ],
        emails: [
          {
            emailType_code: 'PRIMARY',
            contactType_code: 'SALES',
            emailAddress: 'sales@baltictrading.lt',
            isDefault: true
          }
        ]
      }
    ],
    description: 'New request - Lithuanian customer'
  }
];

// Insert Salesforce requests
for (const req of salesforceRequests) {
  const reqId = newId();
  const timestamp = now();

  // Insert main request
  db.prepare(`
    INSERT INTO mdm_db_BusinessPartnerRequests
    (ID, createdAt, createdBy, modifiedAt, modifiedBy, requestNumber, partnerName, name1, name2, entityType,
     requestType, sourceSystem, status, statusCriticality, salesforceId, searchTerm, accountType,
     industry, communicationLanguage, currency_code, revenueStream_code, billingCycle_code,
     bpType_code, dunningStrategy_code,
     aebStatus, aebCheckDetails, viesStatus, duplicateCheckStatus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    reqId, timestamp, 'system', timestamp, 'system', req.requestNumber, req.partnerName, req.partnerName, null,
    req.entityType, req.requestType, req.sourceSystem, req.status, req.statusCriticality,
    req.salesforceId, req.searchTerm, req.accountType, req.industry, req.communicationLanguage,
    req.currency_code, req.revenueStream_code, req.billingCycle_code, req.bpType_code,
    req.dunningStrategy_code,
    req.aebStatus || 'NotChecked', req.aebCheckDetails || null,
    req.viesStatus || 'NotChecked', req.duplicateCheckStatus || 'NotChecked'
  );

  // Insert identifications if available
  if (req.identifications) {
    for (const identification of req.identifications) {
      db.prepare(`
        INSERT INTO mdm_db_PartnerIdentifications
        (ID, createdAt, createdBy, modifiedAt, modifiedBy, request_ID, identificationType_code,
         identificationNumber, country_code, issuingAuthority, validFrom, validTo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newId(), timestamp, 'system', timestamp, 'system', reqId, identification.identificationType_code,
        identification.identificationNumber, identification.country_code || null,
        identification.issuingAuthority || null, identification.validFrom || null, identification.validTo || null
      );
    }
  }

  // Insert addresses and store IDs for SubAccount linkage
  const addressIds = [];
  for (const addr of req.addresses) {
    const addressId = newId();
    addressIds.push(addressId);

    db.prepare(`
      INSERT INTO mdm_db_PartnerAddresses
      (ID, createdAt, createdBy, modifiedAt, modifiedBy, request_ID, addressType_code, name1,
       street, streetNumber, city, postalCode, country_code, region, isDefault)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      addressId, timestamp, 'system', timestamp, 'system', reqId, addr.addressType_code, addr.name1,
      addr.street, addr.streetNumber, addr.city, addr.postalCode, addr.country_code, addr.region,
      addr.isDefault ? 1 : 0
    );
  }

  // Insert VAT IDs
  for (const vat of req.vatIds) {
    db.prepare(`
      INSERT INTO mdm_db_PartnerVatIds
      (ID, createdAt, createdBy, modifiedAt, modifiedBy, request_ID, country_code, vatNumber,
       vatType_code, isEstablished, isDefault, validationStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId(), timestamp, 'system', timestamp, 'system', reqId, vat.country_code, vat.vatNumber,
      vat.vatType_code, vat.isEstablished ? 1 : 0, vat.isDefault ? 1 : 0, vat.validationStatus || 'NotChecked'
    );
  }

  // Insert sub-accounts with address linkage
  for (const sub of req.subAccounts) {
    const subId = newId();
    // Link to first address (default address) if available
    const linkedAddressId = addressIds.length > 0 ? addressIds[0] : null;

    db.prepare(`
      INSERT INTO mdm_db_SubAccounts
      (ID, createdAt, createdBy, modifiedAt, modifiedBy, request_ID, address_ID, subAccountId,
       revenueStream_code, billingCycle_code, currency_code, paymentTerms_code, dunningStrategy_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      subId, timestamp, 'system', timestamp, 'system', reqId, linkedAddressId, sub.subAccountId,
      sub.revenueStream_code, sub.billingCycle_code, sub.currency_code,
      sub.paymentTerms_code, sub.dunningStrategy_code
    );

    // Insert sub-account banks
    for (const bank of sub.banks) {
      db.prepare(`
        INSERT INTO mdm_db_SubAccountBanks
        (ID, createdAt, createdBy, modifiedAt, modifiedBy, subAccount_ID, bankCountry_code,
         bankName, accountHolder, accountNumber, iban, swiftCode, currency_code, isDefault)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newId(), timestamp, 'system', timestamp, 'system', subId, bank.bankCountry_code,
        bank.bankName, bank.accountHolder, bank.accountNumber, bank.iban || null,
        bank.swiftCode, bank.currency_code, bank.isDefault ? 1 : 0
      );
    }

    // Insert sub-account emails
    for (const email of sub.emails) {
      db.prepare(`
        INSERT INTO mdm_db_SubAccountEmails
        (ID, createdAt, createdBy, modifiedAt, modifiedBy, subAccount_ID, emailType_code,
         contactType_code, emailAddress, isDefault)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newId(), timestamp, 'system', timestamp, 'system', subId, email.emailType_code,
        email.contactType_code, email.emailAddress, email.isDefault ? 1 : 0
      );
    }
  }

  // Insert duplicate checks if applicable
  if (req.duplicateCheck) {
    // Get existing partner from the existing partners table
    const existingPartner = db.prepare('SELECT sapBpNumber, partnerName FROM mdm_db_ExistingPartners WHERE partnerName LIKE ? LIMIT 1').get(`%${req.partnerName.split(' ')[0]}%`);

    if (existingPartner) {
      db.prepare(`
        INSERT INTO mdm_db_DuplicateChecks
        (ID, createdAt, createdBy, modifiedAt, modifiedBy, request_ID,
         matchType, matchScore, existingBpNumber, existingBpName, matchDetails, reviewRequired,
         mergeDecision, mergeComments)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newId(), timestamp, 'system', timestamp, 'system', reqId,
        'EstablishedVAT', 100, existingPartner.sapBpNumber, existingPartner.partnerName,
        'Exact VAT ID match found', req.status === 'DuplicateReview' ? 1 : 0,
        req.status === 'Approved' ? 'CreateNew' : null,
        req.status === 'Approved' ? 'Approved to create new partner despite duplicate' : null
      );
    }
  }

  console.log(`  ✅ ${req.requestNumber}: ${req.partnerName} [${req.status}] (${req.description})`);
}

// ================================
// PI TEST REQUESTS
// ================================

console.log('\n📦 Creating PI requests...');

const piRequests = [...Array(10)].map((_, i) => ({
  requestNumber: `PI-${String(i + 1).padStart(10, '0')}`,
  partnerName: [
    'Manufacturing Solutions Inc',
    'Industrial Components Ltd',
    'European Auto Parts GmbH',
    'Asian Electronics Co Ltd',
    'French Materials SARL',
    'Canadian Resources Corp',
    'Italian Design House SRL',
    'Nordic Machinery AB',
    'Spanish Textiles SA',
    'Dutch Logistics BV'
  ][i],
  entityType: 'Supplier',
  requestType: 'Create',
  sourceSystem: 'PI',
  status: ['New', 'Submitted', 'Approved', 'New', 'Submitted', 'New', 'Approved', 'New', 'Submitted', 'New'][i],
  statusCriticality: [0, 2, 1, 0, 2, 0, 1, 0, 2, 0][i],
  piInternalNo: `PI-SUP-${String(i + 1).padStart(3, '0')}`,
  searchTerm: ['MANSOL', 'INDCOMP', 'EUAUTO', 'ASELEC', 'FRMAT', 'CANRES', 'ITDES', 'NORMACH', 'SPTEX', 'DLOG'][i],
  communicationLanguage: ['EN', 'EN', 'DE', 'EN', 'FR', 'EN', 'IT', 'SV', 'ES', 'NL'][i],
  currency_code: ['USD', 'GBP', 'EUR', 'JPY', 'EUR', 'CAD', 'EUR', 'SEK', 'EUR', 'EUR'][i],
  paymentTerms_code: 'Z030',
  paymentMethod_code: 'T',
  addresses: [{
    addressType_code: 'MAIN',
    name1: [
      'Manufacturing Solutions Inc',
      'Industrial Components Ltd',
      'European Auto Parts GmbH',
      'Asian Electronics Co Ltd',
      'French Materials SARL',
      'Canadian Resources Corp',
      'Italian Design House SRL',
      'Nordic Machinery AB',
      'Spanish Textiles SA',
      'Dutch Logistics BV'
    ][i],
    street: ['Industrial Park', 'Factory Road', 'Industriestrasse', 'Electronics District', 'Rue de Commerce', 'Bay Street', 'Via della Moda', 'Industrigatan', 'Calle Industrial', 'Havenstraat'][i],
    streetNumber: ['100', '55', '88', '12-3', '45', '200', '77', '33', '99', '155'][i],
    city: ['Detroit', 'Manchester', 'Stuttgart', 'Tokyo', 'Paris', 'Toronto', 'Milan', 'Stockholm', 'Barcelona', 'Rotterdam'][i],
    postalCode: ['48201', 'M1 5GD', '70173', '100-0001', '75001', 'M5H 2Y4', '20121', '111 22', '08001', '3011 AA'][i],
    country_code: ['US', 'GB', 'DE', 'JP', 'FR', 'CA', 'IT', 'SE', 'ES', 'NL'][i],
    region: ['MI', 'MAN', 'BW', '13', '75', 'ON', 'MI', 'AB', 'CT', 'ZH'][i],
    isDefault: true
  }],
  vatIds: [{
    country_code: ['US', 'GB', 'DE', 'JP', 'FR', 'CA', 'IT', 'SE', 'ES', 'NL'][i],
    vatNumber: ['US111222333', 'GB444555666', 'DE777888999', 'JP1234567890', 'FR11222333444', 'CA123456789RT0001', 'IT55667788990', 'SE123456789001', 'ESA12345678', 'NL123456789B01'][i],
    vatType_code: 'MWST',
    isEstablished: [true, true, true, false, true, false, true, false, true, false][i],
    isDefault: true
  }],
  banks: [{
    bankCountry_code: ['US', 'GB', 'DE', 'JP', 'FR', 'CA', 'IT', 'SE', 'ES', 'NL'][i],
    bankName: ['Chase Bank', 'HSBC Bank', 'Commerzbank', 'Mitsubishi UFJ Bank', 'BNP Paribas', 'Royal Bank of Canada', 'UniCredit', 'Swedbank', 'Banco Santander', 'ING Bank'][i],
    accountHolder: [
      'Manufacturing Solutions Inc',
      'Industrial Components Ltd',
      'European Auto Parts GmbH',
      'Asian Electronics Co Ltd',
      'French Materials SARL',
      'Canadian Resources Corp',
      'Italian Design House SRL',
      'Nordic Machinery AB',
      'Spanish Textiles SA',
      'Dutch Logistics BV'
    ][i],
    accountNumber: [i < 3 || [3, 5, 7].includes(i) ? ['1234567890', null, null, '0012345678', null, '1001234567', null, '8327-9,123456789', null, null][i] : null][0],
    iban: [i < 3 || [3, 5, 7].includes(i) ? null : [null, 'GB82WEST12345698765432', 'DE89370400440532013001', null, 'FR1420041010050500013M02606', null, 'IT60X0542811101000000123456', null, 'ES9121000418450200051332', 'NL91ABNA0417164300'][i]][0],
    swiftCode: [null, 'HSBCGB2L', 'COBADEFF', null, 'BNPAFRPP', null, 'UNCRITMM', null, 'BSCHESMMXXX', 'INGBNL2A'][i],
    currency_code: ['USD', 'GBP', 'EUR', 'JPY', 'EUR', 'CAD', 'EUR', 'SEK', 'EUR', 'EUR'][i],
    isDefault: true
  }],
  emails: [{
    emailType_code: 'PRIMARY',
    emailAddress: ['ap@mansol.com', 'finance@indcomp.co.uk', 'buchhaltung@euauto.de', 'export@aselec.co.jp', 'comptabilite@frmat.fr', 'payables@canres.ca', 'amministrazione@itdes.it', 'ekonomi@normach.se', 'contabilidad@sptex.es', 'administratie@dlog.nl'][i],
    isDefault: true
  }],
  identifications: [{
    identificationType_code: 'PI',
    identificationNumber: `PI-SUP-${String(i + 1).padStart(3, '0')}`,
    country_code: ['US', 'GB', 'DE', 'JP', 'FR', 'CA', 'IT', 'SE', 'ES', 'NL'][i]
  }],
  description: [
    'New request - US manufacturing supplier',
    'Submitted - UK components supplier',
    'Approved - German auto parts',
    'New request - Japanese electronics',
    'Submitted - French materials',
    'New request - Canadian resources',
    'Approved - Italian design',
    'New request - Swedish machinery',
    'Submitted - Spanish textiles',
    'New request - Dutch logistics'
  ][i]
}));

// Insert PI requests (same logic as Coupa)
for (const req of piRequests) {
  const reqId = newId();
  const timestamp = now();

  db.prepare(`
    INSERT INTO mdm_db_BusinessPartnerRequests
    (ID, createdAt, createdBy, modifiedAt, modifiedBy, requestNumber, partnerName, name1, entityType,
     requestType, sourceSystem, status, statusCriticality, searchTerm,
     communicationLanguage, currency_code, paymentTerms_code, paymentMethod_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    reqId, timestamp, 'system', timestamp, 'system',
    req.requestNumber, req.partnerName, req.partnerName, req.entityType,
    req.requestType, req.sourceSystem, req.status, req.statusCriticality,
    req.searchTerm, req.communicationLanguage,
    req.currency_code, req.paymentTerms_code, req.paymentMethod_code
  );

  if (req.addresses) {
    for (const addr of req.addresses) {
      db.prepare(`
        INSERT INTO mdm_db_PartnerAddresses
        (ID, createdAt, createdBy, modifiedAt, modifiedBy, request_ID, addressType_code, name1,
         street, streetNumber, city, postalCode, country_code, region, isDefault)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newId(), timestamp, 'system', timestamp, 'system', reqId,
        addr.addressType_code, addr.name1, addr.street, addr.streetNumber,
        addr.city, addr.postalCode, addr.country_code, addr.region,
        addr.isDefault ? 1 : 0
      );
    }
  }

  if (req.vatIds) {
    for (const vat of req.vatIds) {
      db.prepare(`
        INSERT INTO mdm_db_PartnerVatIds
        (ID, createdAt, createdBy, modifiedAt, modifiedBy, request_ID, country_code, vatNumber,
         vatType_code, isEstablished, isDefault)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newId(), timestamp, 'system', timestamp, 'system', reqId,
        vat.country_code, vat.vatNumber, vat.vatType_code,
        vat.isEstablished ? 1 : 0, vat.isDefault ? 1 : 0
      );
    }
  }

  if (req.banks) {
    for (const bank of req.banks) {
      db.prepare(`
        INSERT INTO mdm_db_PartnerBanks
        (ID, createdAt, createdBy, modifiedAt, modifiedBy, request_ID, bankCountry_code, bankName,
         accountHolder, accountNumber, iban, swiftCode, currency_code, isDefault)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newId(), timestamp, 'system', timestamp, 'system', reqId,
        bank.bankCountry_code, bank.bankName, bank.accountHolder,
        bank.accountNumber || null, bank.iban || null, bank.swiftCode || null,
        bank.currency_code, bank.isDefault ? 1 : 0
      );
    }
  }

  if (req.emails) {
    for (const email of req.emails) {
      db.prepare(`
        INSERT INTO mdm_db_PartnerEmails
        (ID, createdAt, createdBy, modifiedAt, modifiedBy, request_ID, emailType_code,
         emailAddress, isDefault)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newId(), timestamp, 'system', timestamp, 'system', reqId,
        email.emailType_code, email.emailAddress, email.isDefault ? 1 : 0
      );
    }
  }

  if (req.identifications) {
    for (const id of req.identifications) {
      db.prepare(`
        INSERT INTO mdm_db_PartnerIdentifications
        (ID, createdAt, createdBy, modifiedAt, modifiedBy, request_ID, identificationType_code,
         identificationNumber, country_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newId(), timestamp, 'system', timestamp, 'system', reqId,
        id.identificationType_code, id.identificationNumber, id.country_code
      );
    }
  }

  console.log(`  ✅ ${req.requestNumber}: ${req.partnerName} [${req.status}] (${req.description})`);
}

db.close();

console.log('\n✅ Test data creation completed!\n');
console.log('Summary:');
console.log(`  📦 Coupa: ${coupaRequests.length} requests created`);
console.log(`  📦 Salesforce: ${salesforceRequests.length} requests created`);
console.log(`  📦 PI: ${piRequests.length} requests created`);
console.log(`  ✨ Status distribution:`);

const allRequests = [...coupaRequests, ...salesforceRequests, ...piRequests];
const statusCounts = {};
allRequests.forEach(r => {
  statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
});
Object.keys(statusCounts).forEach(status => {
  console.log(`     - ${status}: ${statusCounts[status]}`);
});

console.log(`  🔍 With duplicate checks: ${allRequests.filter(r => r.duplicateCheck).length}`);
console.log(`  ⚠️  With AEB checks: ${allRequests.filter(r => r.aebCheck).length}`);
console.log('\n🚀 Ready for testing!');
