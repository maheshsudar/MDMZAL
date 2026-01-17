using mdm.db as db from '../db/data-model';
using { sap } from '@sap/cds/common';
using { DuplicateResult, PartnerDetails } from './common';

service PIService @(path:'/pi') {

  // Main Entity for Coupa Requests - Draft Enabled
  @odata.draft.enabled
  @Capabilities.UpdateRestrictions : { Updatable : isEditable }
  @Capabilities.DeleteRestrictions : { Deletable : isEditable }
  @UI.UpdateHidden : isReadOnly
  @restrict: [
    { grant: ['READ', 'CREATE', 'UPDATE'], to: ['BusinessUser', 'SystemOwner'] }
  ]
  entity PIRequests as projection on db.BusinessPartnerRequests {
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
    businessChannels,
    communicationLanguage,
    reconAccount,
    currency_code,
    paymentMethod_code,
    paymentMethod,
    paymentTerms_code,
    paymentTerms,
    piInternalNo,
    aebStatus,
    aebCheckDate,
    aebCheckDetails,
    viesStatus,
    viesCheckDate,
    viesCheckDetails,
    approverComments,
    addresses,
    vatIds,
    identifications,
    banks,
    emails,
    attachments,
    approvalHistory,
    duplicateChecks,
    changeLogs,
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
  entity AddressTypes as projection on db.AddressTypes {
    key code, key locale, name, descr
  };

  @readonly
  entity VatTypes as projection on db.VatTypes {
    key code, key locale, name, descr
  };

  @readonly
  entity IdentificationTypes as projection on db.IdentificationTypes {
    key code, key locale, name, descr
  };

  @readonly
  entity Countries as projection on sap.common.Countries;

  @readonly
  entity Currencies as projection on sap.common.Currencies;

  // Child entities
  @Capabilities.UpdateRestrictions : { Updatable : request.isChildEditable }
  @Capabilities.DeleteRestrictions : { Deletable : request.isChildEditable }
  @Capabilities.InsertRestrictions : { Insertable : request.isChildEditable }
  entity PartnerAddresses as projection on db.PartnerAddresses {
    *,
    request : redirected to PIRequests,
    virtual null as fieldControl : UInt8
  };

  @Capabilities.UpdateRestrictions : { Updatable : request.isChildEditable }
  @Capabilities.DeleteRestrictions : { Deletable : request.isChildEditable }
  @Capabilities.InsertRestrictions : { Insertable : request.isChildEditable }
  entity PartnerVatIds as projection on db.PartnerVatIds {
    // Exclude validation fields (validationStatus, validationDate, validationDetails) - only for MDM app
    ID, createdAt, createdBy, modifiedAt, modifiedBy,
    request : redirected to PIRequests,
    country_code, vatNumber, vatType_code, vatType, isEstablished, isDefault,
    virtual null as fieldControl : UInt8
  };

  @Capabilities.UpdateRestrictions : { Updatable : request.isChildEditable }
  @Capabilities.DeleteRestrictions : { Deletable : request.isChildEditable }
  @Capabilities.InsertRestrictions : { Insertable : request.isChildEditable }
  entity PartnerIdentifications as projection on db.PartnerIdentifications {
    *,
    request : redirected to PIRequests,
    virtual null as fieldControl : UInt8
  };

  @Capabilities.UpdateRestrictions : { Updatable : request.isChildEditable }
  @Capabilities.DeleteRestrictions : { Deletable : request.isChildEditable }
  @Capabilities.InsertRestrictions : { Insertable : request.isChildEditable }
  entity PartnerBanks as projection on db.PartnerBanks {
    *,
    request : redirected to PIRequests,
    virtual null as fieldControl : UInt8
  };

  @Capabilities.UpdateRestrictions : { Updatable : request.isChildEditable }
  @Capabilities.DeleteRestrictions : { Deletable : request.isChildEditable }
  @Capabilities.InsertRestrictions : { Insertable : request.isChildEditable }
  entity PartnerEmails as projection on db.PartnerEmails {
    *,
    request : redirected to PIRequests,
    virtual null as fieldControl : UInt8
  };

  entity RequestAttachments as projection on db.RequestAttachments;

  // Change Logs for tracking field-level changes
  @readonly
  entity ChangeLogs as projection on db.ChangeLogs {
    *,
    request : redirected to PIRequests
  };

  // Custom Actions
  function checkForDuplicates(requestID: UUID) returns many DuplicateResult;
  function getSAPPartnerDetails(sapBpNumber: String) returns PartnerDetails;
  function importSAPPartner(sapBpNumber: String) returns String;
  function createChangeRequestFromSAP(sapBpNumber: String) returns String;
  function searchSAPPartners(partnerName: String, sapBpNumber: String, vatId: String, satelliteSystemId: String) returns many DuplicateResult;
}

annotate PIService.PIRequests with actions { submit @Core.OperationAvailable: isSubmittable };
