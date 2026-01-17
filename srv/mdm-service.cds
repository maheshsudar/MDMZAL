using mdm.db as db from '../db/data-model';
using { sap } from '@sap/cds/common';
using { DuplicateResult, PartnerDetails } from './common';

service MDMService @(path:'/mdm') {

  // Main Entity for MDM Approvals
  // NOTE: MDM approvers can UPDATE to edit approverComments field
  // All other fields are read-only via field-level annotations
  // CREATE permission added for AdhocSync requests
  @restrict: [
    { grant: ['READ'], to: ['BusinessUser', 'MDMApprover', 'SystemOwner'] },
    { grant: ['UPDATE'], to: ['MDMApprover'] },
    { grant: ['CREATE'], to: ['MDMApprover', 'SystemOwner'] }  // Allow create for AdhocSync
  ]
  entity MDMApprovalRequests as projection on db.BusinessPartnerRequests {
    key ID,
    requestNumber,
    partnerName,
    name1,
    name2,
    merchantId,
    bpType_code,
    bpType,
    requestType,
    status,
    sourceSystem,
    // For Update requests
    existingBpNumber,
    existingBpName,
    changeDescription,
    // For AdhocSync requests
    targetSystem,
    adhocReason,
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
    integrationSuiteStatus,
    sapInitialStatus,
    satelliteStatus,
    sapIdUpdateStatus,
    // Coupa Fields
    coupaInternalNo,
    paymentTerms_code,
    paymentTerms,
    paymentMethod_code,
    paymentMethod,
    currency_code,
    // Salesforce Fields
    salesforceId,
    accountType,
    revenueStream_code,
    revenueStream,
    billingCycle_code,
    billingCycle,
    // MDM Fields
    sapBpNumber,
    reconAccount,
    aebStatus,
    aebCheckDate,
    aebCheckDetails,
    viesStatus,
    viesCheckDate,
    viesCheckDetails,
    duplicateCheckStatus,
    duplicateCheckDate,
    // MDM Approver Comments
    approverComments,
    // Children
    addresses,
    vatIds,
    banks,
    emails,
    identifications,
    subAccounts,
    attachments,
    approvalHistory,
    duplicateChecks,
    changeLogs,
    virtual true as isEditable : Boolean,
    virtual null as aebStatusCriticality : Integer,
    virtual null as viesStatusCriticality : Integer,
    virtual null as hideSubAccountSection : Boolean
  } where status in ('New', 'Submitted', 'Approved', 'Rejected', 'Completed', 'Error') actions {
    action checkDuplicates();
    action performAEBCheck();
    action performVIESCheck();
    action submit();
    action updateSAPStatus(status: String) returns String;
    action updateSatelliteStatus(status: String) returns String;
    action updateSAPIdStatus(status: String) returns String;
    action approveRequest();
    action rejectRequest(reason: String);
  };

  entity RequestAttachments as projection on db.RequestAttachments;

  // Uses $user.locale for dynamic language switching based on Accept-Language header
  entity RequestTypes as projection on db.RequestTypes {
    key code, name, description, isActive
  } where locale = $user.locale;
  annotate RequestTypes with @(
    UI.LineItem: [
      { $Type: 'UI.DataField', Value: code, Label: 'Code' },
      { $Type: 'UI.DataField', Value: name, Label: 'Name' },
      { $Type: 'UI.DataField', Value: description, Label: 'Description' }
    ],
    UI.HeaderInfo: { TypeName: 'Request Type', TypeNamePlural: 'Request Types', Title: { Value: name } }
  );

  entity SourceSystems as projection on db.SourceSystems {
    key code, key locale, name, description, isActive
  };
  annotate SourceSystems with @(
    UI.LineItem: [
      { $Type: 'UI.DataField', Value: code, Label: 'Code' },
      { $Type: 'UI.DataField', Value: name, Label: 'Name' },
      { $Type: 'UI.DataField', Value: description, Label: 'Description' }
    ],
    UI.HeaderInfo: { TypeName: 'Source System', TypeNamePlural: 'Source Systems', Title: { Value: name } }
  );

  @restrict: [
    { grant: ['READ'], to: ['BusinessUser', 'MDMApprover', 'SystemOwner'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['MDMApprover'] }
  ]
  entity OverallStatuses as projection on db.OverallStatuses {
    key code, name, description, criticality, isActive
  } where locale = $user.locale;

  @restrict: [
    { grant: ['READ'], to: ['BusinessUser', 'MDMApprover', 'SystemOwner'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['MDMApprover'] }
  ]
  entity PaymentTerms as projection on db.PaymentTerms {
    key code, name, description, isActive
  } where locale = $user.locale;

  @restrict: [
    { grant: ['READ'], to: ['BusinessUser', 'MDMApprover', 'SystemOwner'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['MDMApprover'] }
  ]
  entity PaymentMethods as projection on db.PaymentMethods {
    key code, name, description, isActive
  } where locale = $user.locale;

  @readonly
  entity RevenueStreams as projection on db.RevenueStreams {
    key code, name, description, isActive
  } where locale = $user.locale;

  @readonly
  entity BillingCycles as projection on db.BillingCycles {
    key code, name, description, isActive
  } where locale = $user.locale;

  @readonly
  entity Currencies as projection on sap.common.Currencies;

  @readonly
  entity Countries as projection on sap.common.Countries;

  @readonly
  entity AddressTypes as projection on db.AddressTypes {
    key code, name, descr
  } where locale = $user.locale;

  @readonly
  entity EmailTypes as projection on db.EmailTypes {
    key code, name, descr
  } where locale = $user.locale;

  @readonly
  entity VatTypes as projection on db.VatTypes {
    key code, name, descr
  } where locale = $user.locale;

  @restrict: [
    { grant: ['READ'], to: ['BusinessUser', 'MDMApprover', 'SystemOwner'] }
  ]
  entity ApprovalHistory as projection on db.ApprovalHistory;

  // Change Logs for tracking field-level changes
  @readonly
  @restrict: [
    { grant: ['READ'], to: ['BusinessUser', 'MDMApprover', 'SystemOwner'] }
  ]
  entity ChangeLogs as projection on db.ChangeLogs {
    *,
    request : redirected to MDMApprovalRequests
  };

  // Duplicate Check Results
  @readonly
  @restrict: [
    { grant: ['READ'], to: ['MDMApprover', 'SystemOwner'] }
  ]
  entity DuplicateChecks as projection on db.DuplicateChecks;

  // Partner Details - Child Entities
  // NOTE: MDMApprover has READ-ONLY access for approval view
  // BusinessUser can CREATE/UPDATE/DELETE for request creation apps (Coupa/Salesforce/PI)
  @restrict: [
    { grant: ['READ'], to: ['BusinessUser', 'MDMApprover', 'SystemOwner'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['BusinessUser'] }
  ]
  entity PartnerAddresses as projection on db.PartnerAddresses;

  @restrict: [
    { grant: ['READ'], to: ['BusinessUser', 'MDMApprover', 'SystemOwner'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['BusinessUser'] }
  ]
  entity PartnerVatIds as projection on db.PartnerVatIds;

  @restrict: [
    { grant: ['READ'], to: ['BusinessUser', 'MDMApprover', 'SystemOwner'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['BusinessUser'] }
  ]
  entity PartnerEmails as projection on db.PartnerEmails;

  @restrict: [
    { grant: ['READ'], to: ['BusinessUser', 'MDMApprover', 'SystemOwner'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['BusinessUser'] }
  ]
  entity PartnerBanks as projection on db.PartnerBanks;

  @restrict: [
    { grant: ['READ'], to: ['BusinessUser', 'MDMApprover', 'SystemOwner'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['BusinessUser'] }
  ]
  entity PartnerIdentifications as projection on db.PartnerIdentifications;

  @restrict: [
    { grant: ['READ'], to: ['BusinessUser', 'MDMApprover', 'SystemOwner'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['BusinessUser'] }
  ]
  entity SubAccounts as projection on db.SubAccounts {
    key ID,
    *,
    address : redirected to PartnerAddresses,  // 🔗 Expose address association for approval view
    banks : redirected to SubAccountBanks,
    emails : redirected to SubAccountEmails
  };

  @restrict: [
    { grant: ['READ'], to: ['BusinessUser', 'MDMApprover', 'SystemOwner'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['BusinessUser'] }
  ]
  entity SubAccountBanks as projection on db.SubAccountBanks;

  @restrict: [
    { grant: ['READ'], to: ['BusinessUser', 'MDMApprover', 'SystemOwner'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['BusinessUser'] }
  ]
  entity SubAccountEmails as projection on db.SubAccountEmails;

  entity NotificationAcknowledgments as projection on db.NotificationAcknowledgments;

  // Configuration and Master Data
  @restrict: [
    { grant: ['READ'], to: ['BusinessUser', 'MDMApprover', 'SystemOwner'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['MDMApprover'] }
  ]
  entity BusinessChannels as projection on db.BusinessChannels;

  @restrict: [
    { grant: ['READ'], to: ['MDMApprover', 'SystemOwner'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['MDMApprover'] }
  ]
  entity SystemConfiguration as projection on db.SystemConfiguration;
  annotate SystemConfiguration with @(
    UI.LineItem: [
      { $Type: 'UI.DataField', Value: configKey, Label: 'Key' },
      { $Type: 'UI.DataField', Value: configValue, Label: 'Value' },
      { $Type: 'UI.DataField', Value: description, Label: 'Description' },
      { $Type: 'UI.DataField', Value: isActive, Label: 'Active' }
    ],
    UI.HeaderInfo: { TypeName: 'System Configuration', TypeNamePlural: 'System Configurations', Title: { Value: configKey } }
  );

  @restrict: [
    { grant: ['READ'], to: ['MDMApprover', 'SystemOwner'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['MDMApprover'] }
  ]
  entity StatusTransitions as projection on db.StatusTransitions;

  @restrict: [
    { grant: ['READ'], to: ['MDMApprover', 'SystemOwner'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['MDMApprover'] }
  ]
  entity StatusAppConfig as projection on db.StatusAppConfig;

  @restrict: [
    { grant: ['READ'], to: ['MDMApprover', 'SystemOwner'] },
    { grant: ['CREATE', 'UPDATE', 'DELETE'], to: ['MDMApprover'] }
  ]
  entity A_BusinessPartner as projection on db.A_BusinessPartner {
    *,
    addresses : redirected to A_BusinessPartnerAddress,
    roles : redirected to A_BusinessPartnerRole,
    taxNumbers : redirected to A_BusinessPartnerTaxNumber,
    banks : redirected to A_BusinessPartnerBank,
    suppliers : redirected to A_Supplier,
    customers : redirected to A_Customer,
    contacts : redirected to A_BusinessPartnerContact
  };

  @readonly
  @restrict: [
    { grant: ['READ'], to: ['MDMApprover', 'SystemOwner'] }
  ]
  entity A_BusinessPartnerAddress as projection on db.A_BusinessPartnerAddress;

  @readonly
  @restrict: [
    { grant: ['READ'], to: ['MDMApprover', 'SystemOwner'] }
  ]
  entity A_BusinessPartnerRole as projection on db.A_BusinessPartnerRole;

  @readonly
  @restrict: [
    { grant: ['READ'], to: ['MDMApprover', 'SystemOwner'] }
  ]
  entity A_BusinessPartnerTaxNumber as projection on db.A_BusinessPartnerTaxNumber;

  @readonly
  @restrict: [
    { grant: ['READ'], to: ['MDMApprover', 'SystemOwner'] }
  ]
  entity A_BusinessPartnerBank as projection on db.A_BusinessPartnerBank;

  @readonly
  @restrict: [
    { grant: ['READ'], to: ['MDMApprover', 'SystemOwner'] }
  ]
  entity A_BusinessPartnerContact as projection on db.A_BusinessPartnerContact;

  @readonly
  @restrict: [
    { grant: ['READ'], to: ['MDMApprover', 'SystemOwner'] }
  ]
  entity A_Supplier as projection on db.A_Supplier;

  @readonly
  @restrict: [
    { grant: ['READ'], to: ['MDMApprover', 'SystemOwner'] }
  ]
  entity A_Customer as projection on db.A_Customer;

  // Integration Endpoints for External Systems
  @readonly
  entity IntegrationEndpoints {
    key endpoint : String(100);
    method : String(10);
    description : String(200);
    samplePayload : String(2000);
  };

  // Functions for business logic
  function getComplianceStatus(requestId: UUID) returns ComplianceCheckResult;
  function validateBusinessPartner(requestId: UUID) returns ValidationResult;
  function searchDuplicates(
    partnerName: String,
    vatIds: array of String,
    threshold: Decimal
  ) returns array of DuplicateResult;
  function getSAPPartnerDetails(sapBpNumber: String) returns PartnerDetails;
  function getBPDetails(bpNumber: String) returns BPDetailsResult;
  function getSubAccountDetails(subAccountId: String, requestId: UUID) returns SubAccountDetailsResult;

  // Function for AdhocSync - validate and fetch SAP BP data
  function validateAndFetchSAPBP(sapBpNumber: String) returns SAPBpDetails;

  // Action for creating AdhocSync request
  @restrict: [
    { grant: ['*'], to: ['MDMApprover', 'SystemOwner'] }
  ]
  action createAdhocSyncRequest(
    sapBpNumber: String,
    existingBpName: String,
    targetSystem: String,
    adhocReason: String
  ) returns MDMApprovalRequests;

  // Integration Suite callback function
  function updateIntegrationData(
    requestId: UUID,
    sapBpNumber: String,
    satelliteSystemId: String
  ) returns IntegrationUpdateResult;

  // Types for structured returns
  type ComplianceCheckResult {
    aebStatus: String;
    aebDetails: String;
    viesStatus: String;
    viesDetails: String;
    overallStatus: String;
    checkTimestamp: DateTime;
  };

  type VatValidationResult {
    isValid: Boolean;
    vatNumber: String;
    country: String;
    companyName: String;
    companyAddress: String;
    validationDate: DateTime;
    errorMessage: String;
  };

  type DuplicateResult {
    bpNumber: String;
    bpName: String;
    matchScore: Integer;
    matchType: String;
    matchDetails: String;
    bpId: UUID;
  };

  type EstablishedVatDuplicateResult {
    bpNumber: String;
    bpName: String;
    partnerType: String;
    status: String;
    establishedVatId: String;
    establishedCountry: String;
    establishedAddress: String;
    lastUpdated: DateTime;
    sourceSystem: String;
    businessChannels: String;
    canMerge: Boolean;
    mergeRecommendation: String;
  };

  type ValidationResult {
    isValid: Boolean;
    errors: array of ValidationError;
    warnings: array of ValidationWarning;
  };

  type ValidationError {
    field: String;
    message: String;
    severity: String;
    };

  type ValidationWarning {
    field: String;
    message: String;
    recommendation: String;
  };

  type BPDetailsResult {
    bpNumber: String;
    bpName: String;
    partnerType: String;
    status: String;
    addresses: array of AddressInfo;
    vatIds: array of VatInfo;
    banks: array of BankInfo;
    emails: array of EmailInfo;
    sourceSystem: String;
    businessChannels: String;
    lastUpdated: DateTime;
  };

  type AddressInfo {
    street: String;
    city: String;
    postalCode: String;
    country: String;
  };

  type VatInfo {
    country: String;
    vatNumber: String;
    isEstablished: Boolean;
  };

  type BankInfo {
    bankName: String;
    accountNumber: String;
    iban: String;
    swiftCode: String;
  };

  type EmailInfo {
    emailAddress: String;
  };

  type SubAccountDetailsResult {
    subAccountId: String;
    revenueStream: String;
    billingCycle: String;
    currency: String;
    paymentTerms: String;
    dunningProcedure: String;
    banks: array of SubAccountBankInfo;
    emails: array of SubAccountEmailInfo;
  };

  type SubAccountBankInfo {
    bankCountry: String;
    bankKey: String;
    bankName: String;
    accountHolder: String;
    accountNumber: String;
    iban: String;
    swiftCode: String;
    currency: String;
    isDefault: Boolean;
  };

  type SubAccountEmailInfo {
    emailType: String;
    contactType: String;
    emailAddress: String;
  };

  type IntegrationUpdateResult {
    success: Boolean;
    requestId: UUID;
    sapBpNumberUpdated: Boolean;
    identificationUpdated: Boolean;
    identificationId: UUID;
    message: String;
  };

  type SAPBpDetails {
    isValid: Boolean;
    bpNumber: String;
    bpName: String;
    bpType: String;
    addresses: array of AddressInfo;
    banks: array of BankInfo;
    vatIds: array of VatInfo;
    emails: array of EmailInfo;
    identifications: array of IdentificationInfo;
    errorMessage: String;
  };

  type IdentificationInfo {
    idType: String;
    idNumber: String;
    country: String;
  };
}
