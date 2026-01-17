using mdm.db as db from '../db/data-model';
using { sap } from '@sap/cds/common';
using { DuplicateResult, PartnerDetails } from './common';

service SalesforceService @(path:'/salesforce') {

  // Main Entity for Salesforce Requests - Draft Enabled
  @odata.draft.enabled
  @Capabilities.UpdateRestrictions : { Updatable : isEditable }
  @Capabilities.DeleteRestrictions : { Deletable : isEditable }
  @UI.UpdateHidden : isReadOnly
  @restrict: [
    { grant: ['READ', 'CREATE', 'UPDATE'], to: ['BusinessUser', 'SystemOwner'] }
  ]
  entity SalesforceRequests as projection on db.BusinessPartnerRequests {
    key ID,
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
    requestNumber,
    requestType,
    entityType,
    sourceSystem,
    status,
    statusCriticality,
    existingBpNumber,
    existingBpName,
    changeDescription,
    requesterId,
    requesterName,
    requesterEmail,
    partnerName,
    name1,
    name2,
    merchantId,
    businessChannels,
    communicationLanguage,
    reconAccount,
    currency_code,
    paymentMethod_code,
    paymentMethod,
    paymentTerms_code,
    paymentTerms,
    sapBpNumber,
    salesforceId,
    accountType,
    industry,
    revenueStream_code,
    revenueStream,
    billingCycle_code,

    billingCycle,
    bpType_code,
    bpType,
    dunningStrategy_code,
    dunningStrategy,
    addresses : redirected to PartnerAddresses,
    vatIds : redirected to PartnerVatIds,
    identifications : redirected to PartnerIdentifications,
    // banks, // Removed as per new hierarchy
    // emails, // Removed as per new hierarchy
    attachments : redirected to RequestAttachments,
    approvalHistory,
    duplicateChecks,
    changeLogs : redirected to ChangeLogs,
    approverComments,
    subAccounts : redirected to SubAccounts,
    virtual false as isEditable : Boolean,
    virtual true as isReadOnly : Boolean,
    virtual null as fieldControl : UInt8,
    virtual false as isSubmittable : Boolean,
    virtual null as isChildEditable : Boolean
  } actions {
    action checkDuplicates();
    action submit();
  };

  // Value Lists (Configuration Tables) - Readonly
  // Locale filtering handled by JavaScript after handler in salesforce-service.js
  @readonly
  entity RequestTypes as projection on db.RequestTypes {
    key code, key locale, name, description, isActive
  };

  @readonly
  entity SourceSystems as projection on db.SourceSystems {
    key code, key locale, name, description, isActive
  };

  @readonly
  entity OverallStatuses as projection on db.OverallStatuses {
    key code, key locale, name, description, criticality, isActive
  };

  @readonly
  entity PaymentTerms as projection on db.PaymentTerms {
    key code, key locale, name, description, isActive
  };

  @readonly
  entity PaymentMethods as projection on db.PaymentMethods {
    key code, key locale, name, description, isActive
  };

  @readonly
  entity RevenueStreams as projection on db.RevenueStreams {
    key code, key locale, name, description, isActive
  };

  @readonly
  entity BillingCycles as projection on db.BillingCycles {
    key code, key locale, name, description, isActive
  };

  @readonly
  entity AddressTypes as projection on db.AddressTypes {
    key code, key locale, name, descr
  };

  @readonly
  entity EmailTypes as projection on db.EmailTypes {
    key code, key locale, name, descr
  };

  @readonly
  entity IdentificationTypes as projection on db.IdentificationTypes {
    key code, key locale, name, descr
  };

  @readonly
  entity VatTypes as projection on db.VatTypes {
    key code, key locale, name, descr
  };

  @readonly
  entity DocumentTypes as projection on db.DocumentTypes {
    key code, key locale, name, descr
  };

  @readonly
  entity BPTypes as projection on db.BPTypes {
    key code, key locale, name, descr
  };

  @readonly
  entity ContactTypes as projection on db.ContactTypes {
    key code, key locale, name, descr
  };

  @readonly
  entity DunningStrategies as projection on db.DunningStrategies {
    key code, key locale, name, descr
  };

  @readonly
  entity Countries as projection on sap.common.Countries;

  @readonly
  entity Currencies as projection on sap.common.Currencies;

  // Child Entities - Managed via Composition
  @Capabilities.UpdateRestrictions : { Updatable : request.isChildEditable }
  @Capabilities.DeleteRestrictions : { Deletable : request.isChildEditable }
  @Capabilities.InsertRestrictions : { Insertable : request.isChildEditable }
  entity PartnerAddresses as projection on db.PartnerAddresses {
    *,
    request : redirected to SalesforceRequests,
    virtual null as fieldControl : UInt8
  };

  @Capabilities.UpdateRestrictions : { Updatable : request.isChildEditable }
  @Capabilities.DeleteRestrictions : { Deletable : request.isChildEditable }
  @Capabilities.InsertRestrictions : { Insertable : request.isChildEditable }
  entity PartnerEmails as projection on db.PartnerEmails {
    *,
    request : redirected to SalesforceRequests,
    virtual null as fieldControl : UInt8
  };

  @Capabilities.UpdateRestrictions : { Updatable : request.isChildEditable }
  @Capabilities.DeleteRestrictions : { Deletable : request.isChildEditable }
  @Capabilities.InsertRestrictions : { Insertable : request.isChildEditable }
  entity PartnerBanks as projection on db.PartnerBanks {
    *,
    request : redirected to SalesforceRequests,
    virtual null as fieldControl : UInt8
  };

  @Capabilities.UpdateRestrictions : { Updatable : request.isChildEditable }
  @Capabilities.DeleteRestrictions : { Deletable : request.isChildEditable }
  @Capabilities.InsertRestrictions : { Insertable : request.isChildEditable }
  entity PartnerVatIds as projection on db.PartnerVatIds {
    // Exclude validation fields (validationStatus, validationDate, validationDetails) - only for MDM app
    ID, createdAt, createdBy, modifiedAt, modifiedBy,
    request : redirected to SalesforceRequests,
    country_code, vatNumber, vatType_code, vatType, isEstablished, isDefault,
    virtual null as fieldControl : UInt8
  };

  @readonly
  entity PartnerIdentifications as projection on db.PartnerIdentifications {
    *,
    request : redirected to SalesforceRequests,
    virtual null as fieldControl : UInt8
  };

  entity RequestAttachments as projection on db.RequestAttachments;
  
  // Sub-Account Entities
  @Capabilities.UpdateRestrictions : { Updatable : request.isChildEditable }
  @Capabilities.DeleteRestrictions : { Deletable : request.isChildEditable }
  @Capabilities.InsertRestrictions : { Insertable : request.isChildEditable }
  @Common.Label: 'Sub Account'
  entity SubAccounts as projection on db.SubAccounts {
    *,
    request : redirected to SalesforceRequests,
    address : redirected to PartnerAddresses,  // 🔗 Expose address association
    paymentTerms,
    dunningStrategy,
    banks : redirected to SubAccountBanks,
    emails : redirected to SubAccountEmails,
    virtual null as fieldControl : UInt8
  };

  @Common.Label: 'Sub Account Bank'
  entity SubAccountBanks as projection on db.SubAccountBanks {
    *,
    virtual null as fieldControl : UInt8
  };

  @Common.Label: 'Sub Account Email'
  entity SubAccountEmails as projection on db.SubAccountEmails {
    *,
    virtual null as fieldControl : UInt8
  };

  // Change Logs for tracking field-level changes
  @readonly
  entity ChangeLogs as projection on db.ChangeLogs {
    *,
    request : redirected to SalesforceRequests
  };

  // Custom Actions
  function checkForDuplicates(requestID: UUID) returns many DuplicateResult;
  function getSAPPartnerDetails(sapBpNumber: String) returns PartnerDetails;
  function importSAPPartner(sapBpNumber: String) returns String;
  function searchSAPPartners(partnerName: String, sapBpNumber: String, vatId: String, satelliteSystemId: String) returns many DuplicateResult;
  action createChangeRequestFromSAP(sapBpNumber: String) returns String;

  // Webhook Callbacks for Integration Suite
  type SubAccountCallbackData {
    orderIndex: Integer;
    salesforceSubAccountID: String(18);
    sapFICAContractAccount: String(10);
  }

  action receiveCreateCallback(
    requestID: String,
    salesforceMainAccountID: String(18),
    sapBusinessPartnerNumber: String(10),
    subAccounts: array of SubAccountCallbackData
  ) returns String;

  action receiveUpdateCallback(
    requestID: String,
    salesforceMainAccountID: String(18),
    sapBusinessPartnerNumber: String(10),
    subAccounts: array of SubAccountCallbackData
  ) returns String;
}

annotate SalesforceService.SalesforceRequests with actions { submit @Core.OperationAvailable: isSubmittable };
