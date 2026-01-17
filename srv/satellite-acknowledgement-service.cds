using mdm.db as db from '../db/data-model';

service SatelliteAcknowledgementService @(path:'/satellite-ack') {

  // Common view for SystemOwner and MDMApprover (see all systems)
  @readonly
  @restrict: [
    { grant: ['READ'], to: ['SystemOwner', 'MDMApprover'] }
  ]
  entity AllAcknowledgements as select from db.NotificationAcknowledgments {
    key ID,
    notification,
    request,
    systemOwnerUserId,
    targetSystem,
    status,
    notificationDate,
    acknowledgedBy,
    acknowledgedAt,
    comments,
    partnerName,
    requestNumber,
    sapBpNumber,
    sourceSystem,
    notificationSentBy,
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
    request.name1 as requestPartnerName : String
  } actions {
    action acknowledge(comments: String @Core.IsMultiLineText);
  };

  // Coupa Team View
  // NOTE: Restrictions commented out for testing - everyone can see everything
  // Uncomment when ready for production
  // @restrict: [
  //   { grant: ['READ'], to: ['CoupaAcknowledger', 'SystemOwner', 'MDMApprover'] },
  //   { grant: ['UPDATE'], to: ['CoupaAcknowledger'] }
  // ]
  entity CoupaAcknowledgements as select from db.NotificationAcknowledgments {
    key ID,
    notification,
    request,
    systemOwnerUserId,
    targetSystem,
    status,
    notificationDate,
    acknowledgedBy,
    acknowledgedAt,
    comments,
    partnerName,
    requestNumber,
    sapBpNumber,
    sourceSystem,
    notificationSentBy,
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
    request.name1 as requestPartnerName : String
  } where targetSystem = 'Coupa' actions {
    action acknowledge(comments: String @Core.IsMultiLineText);
  };

  // Salesforce Team View
  // NOTE: Restrictions commented out for testing - everyone can see everything
  // Uncomment when ready for production
  // @restrict: [
  //   { grant: ['READ'], to: ['SalesforceAcknowledger', 'SystemOwner', 'MDMApprover'] },
  //   { grant: ['UPDATE'], to: ['SalesforceAcknowledger'] }
  // ]
  entity SalesforceAcknowledgements as select from db.NotificationAcknowledgments {
    key ID,
    notification,
    request,
    systemOwnerUserId,
    targetSystem,
    status,
    notificationDate,
    acknowledgedBy,
    acknowledgedAt,
    comments,
    partnerName,
    requestNumber,
    sapBpNumber,
    sourceSystem,
    notificationSentBy,
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
    request.name1 as requestPartnerName : String
  } where targetSystem = 'Salesforce' actions {
    action acknowledge(comments: String @Core.IsMultiLineText);
  };

  // PI Team View
  // NOTE: Restrictions commented out for testing - everyone can see everything
  // Uncomment when ready for production
  // @restrict: [
  //   { grant: ['READ'], to: ['PIAcknowledger', 'SystemOwner', 'MDMApprover'] },
  //   { grant: ['UPDATE'], to: ['PIAcknowledger'] }
  // ]
  entity PIAcknowledgements as select from db.NotificationAcknowledgments {
    key ID,
    notification,
    request,
    systemOwnerUserId,
    targetSystem,
    status,
    notificationDate,
    acknowledgedBy,
    acknowledgedAt,
    comments,
    partnerName,
    requestNumber,
    sapBpNumber,
    sourceSystem,
    notificationSentBy,
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
    request.name1 as requestPartnerName : String
  } where targetSystem = 'PI' actions {
    action acknowledge(comments: String @Core.IsMultiLineText);
  };

  // Expose BusinessPartnerRequests to enable navigation from acknowledgements
  @readonly
  entity BusinessPartnerRequests as projection on db.BusinessPartnerRequests {
    *,
    addresses : redirected to PartnerAddresses,
    vatIds : redirected to PartnerVatIds,
    banks : redirected to PartnerBanks,
    emails : redirected to PartnerEmails,
    identifications : redirected to PartnerIdentifications,
    changeLogs : redirected to ChangeLogs
  };

  // Expose child entities to enable navigation and UI annotations
  @readonly
  entity PartnerAddresses as projection on db.PartnerAddresses {
    *,
    request : redirected to BusinessPartnerRequests
  };

  @readonly
  entity PartnerVatIds as projection on db.PartnerVatIds {
    *,
    request : redirected to BusinessPartnerRequests
  };

  @readonly
  entity PartnerBanks as projection on db.PartnerBanks {
    *,
    request : redirected to BusinessPartnerRequests
  };

  @readonly
  entity PartnerEmails as projection on db.PartnerEmails {
    *,
    request : redirected to BusinessPartnerRequests
  };

  @readonly
  entity PartnerIdentifications as projection on db.PartnerIdentifications {
    *,
    request : redirected to BusinessPartnerRequests
  };

  @readonly
  entity ChangeLogs as projection on db.ChangeLogs {
    *,
    request : redirected to BusinessPartnerRequests
  };

  @readonly
  entity SubAccounts as projection on db.SubAccounts {
    *,
    request : redirected to BusinessPartnerRequests,
    banks : redirected to SubAccountBanks,
    emails : redirected to SubAccountEmails
  };

  @readonly
  entity SubAccountBanks as projection on db.SubAccountBanks {
    *,
    subAccount : redirected to SubAccounts
  };

  @readonly
  entity SubAccountEmails as projection on db.SubAccountEmails {
    *,
    subAccount : redirected to SubAccounts
  };

}
