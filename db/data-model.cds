namespace mdm.db;

using { managed, cuid, Country, Currency } from '@sap/cds/common';

aspect CodeList {
  key code : String(20);
  key locale : String(2) @default: 'en'; // en = English (default), de = German
  name : String(100);
  descr : String(1000);
}

// VendorClassifications entity removed

// SAP Business Partner API Aligned Entities
// Following API_BUSINESS_PARTNER specification

// Business Partner Header - Core entity following SAP standard
entity A_BusinessPartner : cuid, managed {
  BusinessPartner       : String(10) @readonly; // SAP BP Number
  Customer              : String(10);
  Supplier              : String(10);
  AcademicTitle         : String(4);
  AuthorizationGroup    : String(4);
  BusinessPartnerCategory : String(1); // 1=Person, 2=Organization, 3=Group
  BusinessPartnerFullName : String(81);
  BusinessPartnerGrouping : String(4);
  BusinessPartnerName   : String(81);
  BusinessPartnerUUID   : UUID;
  CorrespondenceLanguage : String(2);
  CreatedByUser         : String(12);
  CreationDate          : Date;
  CreationTime          : Time;
  FirstName             : String(40);
  FormOfAddress         : String(4);
  Industry              : String(10);
  InternationalLocationNumber1 : String(7);
  InternationalLocationNumber2 : String(5);
  IsFemale              : Boolean;
  IsMale                : Boolean;
  IsNaturalPerson       : String(1);
  IsSexUnknown          : Boolean;
  GenderCodeName        : String(1);
  Language              : String(2);
  LastChangeDate        : Date;
  LastChangeTime        : Time;
  LastChangedByUser     : String(12);
  LastName              : String(40);
  LegalForm             : String(2);
  OrganizationBPName1   : String(40);
  OrganizationBPName2   : String(40);
  OrganizationBPName3   : String(40);
  OrganizationBPName4   : String(40);
  OrganizationFoundationDate : Date;
  OrganizationLiquidationDate : Date;
  SearchTerm1           : String(20);
  SearchTerm2           : String(20);
  AdditionalLastName    : String(40);
  BirthDate             : Date;
  BusinessPartnerBirthplaceName : String(40);
  BusinessPartnerIsBlocked : Boolean;
  BusinessPartnerType   : String(4);
  ETag                  : String;
  GroupBusinessPartnerName1 : String(40);
  GroupBusinessPartnerName2 : String(40);
  IndependentAddressID  : String(10);
  InternationalLocationNumber3 : String(1);
  MiddleName            : String(40);
  NameCountry           : String(3);
  NameFormat            : String(2);
  PersonFullName        : String(80);
  PersonNumber          : String(10);
  IsMarkedForArchiving  : Boolean;
  BusinessPartnerIDByExtSystem : String(20);
  BusinessPartnerPrintFormat : String(1);
  BusinessPartnerOccupation : String(4);
  BusPartMaritalStatus  : String(1);
  BusPartNationality    : String(3);
  BusinessPartnerBirthName : String(40);
  BusinessPartnerSupplementName : String(4);
  NaturalPersonEmployerName : String(35);
  LastNamePrefix        : String(4);
  LastNameSecondPrefix  : String(4);
  Initials              : String(10);
  IsStandardBusinessPartner : Boolean;

  // Associations to other entities
  addresses             : Composition of many A_BusinessPartnerAddress on addresses.BusinessPartner = BusinessPartner;
  roles                 : Composition of many A_BusinessPartnerRole on roles.BusinessPartner = BusinessPartner;
  taxNumbers            : Composition of many A_BusinessPartnerTaxNumber on taxNumbers.BusinessPartner = BusinessPartner;
  banks                 : Composition of many A_BusinessPartnerBank on banks.BusinessPartner = BusinessPartner;
  suppliers             : Composition of many A_Supplier on suppliers.Supplier = Supplier;
  customers             : Composition of many A_Customer on customers.Customer = Customer;
  contacts              : Composition of many A_BusinessPartnerContact on contacts.BusinessPartner = BusinessPartner;
}

// Business Partner Address - following SAP API structure
entity A_BusinessPartnerAddress : cuid {
  BusinessPartner       : String(10);
  AddressID             : String(10);
  ValidityStartDate     : Date;
  ValidityEndDate       : Date;
  AuthorizationGroup    : String(4);
  AddressUUID           : UUID;
  AdditionalStreetPrefixName : String(40);
  AdditionalStreetSuffixName : String(40);
  AddressTimeZone       : String(6);
  CareOfName            : String(40);
  CityCode              : String(12);
  CityName              : String(40);
  CompanyPostalCode     : String(10);
  Country               : String(3);
  County                : String(40);
  DeliveryServiceNumber : String(10);
  DeliveryServiceTypeCode : String(4);
  District              : String(40);
  FormOfAddress         : String(4);
  FullName              : String(80);
  HomeCityName          : String(40);
  HouseNumber           : String(10);
  HouseNumberSupplementText : String(10);
  Language              : String(2);
  POBox                 : String(10);
  POBoxDeviatingCityName : String(40);
  POBoxDeviatingCountry : String(3);
  POBoxDeviatingRegion  : String(3);
  POBoxIsWithoutNumber  : Boolean;
  POBoxLobbyName        : String(40);
  POBoxPostalCode       : String(10);
  Person                : String(10);
  PostalCode            : String(10);
  PrfrdCommMediumType   : String(3);
  Region                : String(3);
  StreetName            : String(60);
  StreetPrefixName      : String(40);
  StreetSuffixName      : String(40);
  TaxJurisdiction       : String(15);
  TransportZone         : String(10);
  AddressIDByExternalSystem : String(20);
  CountyCode            : String(8);
  TownshipCode          : String(8);
  TownshipName          : String(40);
}

// Supplier Entity
entity A_Supplier : cuid {
  Supplier              : String(10);
  AlternativePayeeAccountNumber : String(10);
  AuthorizationGroup    : String(4);
  BusinessPartner       : String(10);
  CreatedByUser         : String(12);
  CreationDate          : Date;
  CustomerIsReleased    : Boolean;
  NaturalPerson         : String(10);
  PaymentIsBlockedForSupplier : Boolean;
  PostingIsBlocked      : Boolean;
  PurchasingIsBlocked   : Boolean;
  SupplierAccountGroup  : String(4);
  SupplierFullName      : String(80);
  SupplierName          : String(35);
  VATRegistration       : String(20);
  BirthDate             : Date;
  ConcatenatedInternationalLocNo : String(20);
  DeletionIndicator     : Boolean;
  FiscalAddress         : String(10);
  Industry              : String(10);
  InternationalLocationNumber1 : String(7);
  InternationalLocationNumber2 : String(5);
  InternationalLocationNumber3 : String(1);
  IsNaturalPerson       : String(1);
  PaymentReason         : String(4);
  ResponsibleType       : String(2);
  SuplrQltyInProcmtCertfnValidTo : Date;
  SuplrQualityManagementSystem : String(4);
  SupplierCorporateGroup : String(10);
  SupplierProcurementBlock : String(2);
  TaxNumber1            : String(16);
  TaxNumber2            : String(11);
  TaxNumber3            : String(18);
  TaxNumber4            : String(18);
  TaxNumber5            : String(60);
  TaxNumberResponsible  : String(18);
  TaxNumberType         : String(2);
  VATLiability          : Boolean;
  VATRegistrationCountry : String(3);
}

// Customer Entity
entity A_Customer : cuid {
  Customer              : String(10);
  AuthorizationGroup    : String(4);
  BillingIsBlockedForCustomer : String(2);
  CreatedByUser         : String(12);
  CreationDate          : Date;
  CustomerAccountGroup  : String(4);
  CustomerClassification : String(2);
  CustomerFullName      : String(80);
  CustomerName          : String(35);
  DeliveryIsBlocked     : String(2);
  NFPartnerIsNaturalPerson : String(1);
  OrderIsBlockedForCustomer : String(2);
  PostingIsBlocked      : Boolean;
  Supplier              : String(10);
  CustomerCorporateGroup : String(10);
  FiscalAddress         : String(10);
  Industry              : String(10);
  TaxNumber1            : String(16);
  TaxNumber2            : String(11);
  TaxNumber3            : String(18);
  TaxNumber4            : String(18);
  TaxNumber5            : String(60);
  TaxNumberType         : String(2);
  VATRegistration       : String(20);
  DeletionIndicator     : Boolean;
  ExpressTrainStationName : String(25);
  TrainStationName      : String(25);
  CityCode              : String(4);
  County                : String(3);
}

// Business Partner Role
entity A_BusinessPartnerRole : cuid {
  BusinessPartner       : String(10);
  BusinessPartnerRole   : String(6);
  ValidFrom             : Date;
  ValidTo               : Date;
  AuthorizationGroup    : String(4);
}

// Business Partner Tax Number
entity A_BusinessPartnerTaxNumber : cuid {
  BusinessPartner       : String(10);
  BPTaxType             : String(4);
  BPTaxNumber           : String(20);
  BPTaxLongNumber       : String(60);
  AuthorizationGroup    : String(4);
}

// Business Partner Bank
entity A_BusinessPartnerBank : cuid {
  BusinessPartner       : String(10);
  BankIdentification    : String(4);
  BankCountryKey        : String(3);
  BankName              : String(60);
  BankNumber            : String(15);
  SWIFTCode             : String(11);
  BankControlKey        : String(2);
  BankAccountHolderName : String(60);
  BankAccountName       : String(40);
  ValidityStartDate     : Date;
  ValidityEndDate       : Date;
  IBAN                  : String(34);
  IBANValidityStartDate : Date;
  BankAccount           : String(18);
  BankAccountReferenceText : String(20);
  CollectionAuthInd     : Boolean;
  CityName              : String(35);
  AuthorizationGroup    : String(4);
}

// Business Partner Contact
entity A_BusinessPartnerContact : cuid {
  BusinessPartner       : String(10); // Added for association
  RelationshipNumber    : String(12);
  BusinessPartnerCompany : String(10);
  BusinessPartnerPerson : String(10);
  newStatus         : String(20);
  comments          : String(500);
  systemGenerated   : Boolean @default: false;
}

/**
 * Business Partner Requests
 * Main entity for capturing MDM requests from satellite systems
 * - Enhanced with value list support
 * - Compliance status tracking
 * - Integration status monitoring
 */
@odata.draft.enabled
entity BusinessPartnerRequests : cuid, managed {
  requestNumber     : String(30) @readonly;

  // Enhanced entity and request types as per requirements
  entityType        : String(20) @default: 'Supplier';
  requestType       : String(20) @default: 'Create';
  sourceSystem      : String(20) @default: 'Manual';

  // Enhanced status including DuplicateReview as per ENHANCED_FEATURES.md
  status            : String(20) @default: 'Draft';
  statusCriticality : Integer @default: 0; // 0=None, 1=Success, 2=Warning, 3=Error
  
  // Integration Status Fields
  integrationSuiteStatus : String(20) @default: 'Pending';
  sapInitialStatus       : String(20) @default: 'Pending';
  satelliteStatus        : String(20) @default: 'Pending';
  sapIdUpdateStatus      : String(20) @default: 'Pending';

  // Link to SAP Business Partner API entities - removed associations to fix column issues
  // businessPartner   : Association to A_BusinessPartner;
  // targetSupplier    : Association to A_Supplier;
  // targetCustomer    : Association to A_Customer;

  // For Update requests - existing partner information (ENHANCED_FEATURES.md requirement)
  existingBpNumber  : String(20); // SAP BP number if updating existing partner
  existingBpName    : String(100); // Name of existing partner for reference
  changeDescription : String(500); // Description of what needs to be updated

  // For AdhocSync requests - new fields
  targetSystem      : String(20);    // Target satellite system for AdhocSync (Coupa, Salesforce, PI)
  adhocReason       : String(1000);  // Mandatory reason for adhoc sync request

  // Requester Information
  requesterId       : String(100);
  requesterName     : String(100);
  requesterEmail    : String(100);

  // Business Partner Basic Info - Enhanced fields as per ENHANCED_FEATURES.md
  // Main fields in the front end (from requirements):
  // 1) System - covered by sourceSystem
  // 2) Internal ID - covered by coupaInternalNo, salesforceId, piId
  // 3) Name
  partnerName       : String(100); // Deprecated - use name1 and name2 instead - validated by ValidationService
  name1             : String(100); // Name 1 (Primary name)
  name2             : String(100); // Name 2 (Secondary name)
  merchantId        : String(30);  // Merchant ID (Salesforce-specific)
  searchTerm        : String(20);
  partnerRole       : String(20) @default: 'Supplier';
  businessChannels  : String(200); // Industry codes for business channels
  communicationLanguage : String(2);
  reconAccount      : String(20);
  currency_code     : String(3);
  paymentMethod_code : String(20);
  paymentMethod      : Association to PaymentMethods on paymentMethod.code = paymentMethod_code;
  paymentTerms_code  : String(10);
  paymentTerms       : Association to PaymentTerms on paymentTerms.code = paymentTerms_code;

  // External System  // Internal and External System Fields
  sapBpNumber           : String(10) @readonly; // System-assigned by SAP, not user-editable
  satelliteSystemID     : String(50);
  coupaInternalNo       : String(50);
  // Salesforce Specific Fields
  salesforceId      : String(50);
  // PI Specific Fields
  piInternalNo      : String(50);
  piId              : String(50);

  // Coupa Specific Fields
  purchaseCategories   : String(500); // Comma-separated list
  spendThreshold       : Decimal(15,2);
  procurementContact   : String(100);

  // Salesforce Specific Fields
  accountType          : String(20); // Customer, Prospect, Partner
  industry             : String(50);
  revenueStream_code   : String(20);
  revenueStream        : Association to RevenueStreams on revenueStream.code = revenueStream_code;
  billingCycle_code    : String(20);
  billingCycle         : Association to BillingCycles on billingCycle.code = billingCycle_code;
  
  // New Salesforce Fields
  bpType_code          : String(4);
  bpType               : Association to BPTypes on bpType.code = bpType_code;
  dunningStrategy_code : String(10);
  dunningStrategy      : Association to DunningStrategies on dunningStrategy.code = dunningStrategy_code;

  // Compliance Check Status Fields
  aebStatus            : String(20) @default: 'NotChecked'; // AEB Trade Compliance Check Status
  aebCheckDate         : DateTime;
  aebCheckDetails      : LargeString; // AEB Check Details (formatted text)
  viesStatus           : String(20) @default: 'NotChecked'; // VIES VAT ID Validation Status
  viesCheckDate        : DateTime;
  viesCheckDetails     : String(500);
  duplicateCheckStatus : String(50) @default: 'NotChecked'; // Duplicate Check Status
  duplicateCheckDate   : DateTime; // Last duplicate check date

  // MDM Approver Comments (editable field for MDM approvers)
  approverComments     : String(1000);

  // Compositions
  addresses         : Composition of many PartnerAddresses on addresses.request = $self;
  vatIds            : Composition of many PartnerVatIds on vatIds.request = $self;
  banks             : Composition of many PartnerBanks on banks.request = $self;
  emails            : Composition of many PartnerEmails on emails.request = $self;
  identifications   : Composition of many PartnerIdentifications on identifications.request = $self;
  attachments       : Composition of many RequestAttachments on attachments.request = $self;
  approvalHistory   : Composition of many ApprovalHistory on approvalHistory.request = $self;
  duplicateChecks   : Composition of many DuplicateChecks on duplicateChecks.request = $self;
  subAccounts       : Composition of many SubAccounts on subAccounts.request = $self;
  changeLogs        : Composition of many ChangeLogs on changeLogs.request = $self;
}

// Partner Address Information (4. address from requirements)
entity PartnerAddresses : cuid, managed {
  request           : Association to BusinessPartnerRequests;
  sapAddressId      : String(10);  // SAP AddressID for updates (e.g., "0001", "0002")
  addressType_code  : String(20);
  addressType       : Association to AddressTypes on addressType.code = addressType_code;
  name1             : String(100);
  name2             : String(100);
  name3             : String(100);
  name4             : String(100);
  street            : String(60) @mandatory;
  streetNumber      : String(10); // Optional as per requirements
  city              : String(40) @mandatory;
  postalCode        : String(10) @mandatory;
  country_code      : String(2) @mandatory;  // Country code
  region            : String(3);   // Region code
  isDefault         : Boolean @default: false;
}

// Partner Bank Information (7. bank details from requirements)
entity PartnerBanks : cuid, managed {
  request              : Association to BusinessPartnerRequests;
  sapBankIdentification : String(4);  // SAP BankIdentification for updates (e.g., "001", "002")
  bankCountry_code     : String(2) @mandatory;  // Bank country code
  bankKey              : String(20);
  bankName             : String(100);
  accountHolder        : String(100);
  accountNumber        : String(50);  // Optional - IBAN or SWIFT is sufficient
  iban                 : String(50);
  swiftCode            : String(20);
  controlKey           : String(10);  // Bank control key
  currency_code        : String(3);  // Currency code
  bankReference        : String(50);
  isDefault            : Boolean @default: false;
}

// Partner VAT ID Information (5. Established VAT ID and 6. List of all VAT ID's from requirements)
entity PartnerVatIds : cuid, managed {
  request           : Association to BusinessPartnerRequests;
  country_code      : String(2) @mandatory;  // Country code
  vatNumber         : String(50) @mandatory;
  vatType_code      : String(20);
  vatType           : Association to VatTypes on vatType.code = vatType_code;
  isEstablished     : Boolean @default: false;
  validationStatus  : String(20) @default: 'NotChecked';
  validationDate    : DateTime;
  validationDetails : String(500);
  isDefault         : Boolean @default: false;
}

// Partner Email Information (8. email contact from requirements)
entity PartnerEmails : cuid, managed {
  request           : Association to BusinessPartnerRequests;
  sapAddressId      : String(10);  // SAP AddressID (e.g., "0001", "0002")
  sapPerson         : String(10);  // SAP Person number (usually blank for org emails)
  sapOrdinalNumber  : String(3);   // SAP OrdinalNumber for email sequence (e.g., "001", "002")
  emailType_code    : String(20);
  emailType         : Association to EmailTypes on emailType.code = emailType_code;
  emailAddress      : String(100) @mandatory;
  notes             : String(200);
  isDefault         : Boolean @default: false;
}

// Partner Identifications (Maps to SAP BP Identifications)
entity PartnerIdentifications : cuid, managed {
  request                  : Association to BusinessPartnerRequests;
  sapBPIdentificationType  : String(6);  // SAP BPIdentificationType (e.g., "FS0001", "FS0002")
  identificationType_code  : String(20);
  identificationType       : Association to IdentificationTypes on identificationType.code = identificationType_code;
  identificationNumber     : String(100) @mandatory;
  country_code             : String(2);  // Maps to BPIdentificationCountry
  issuingAuthority         : String(100); // Custom field - not in SAP standard
  validFrom                : Date;       // Maps to ValidityStartDate
  validTo                  : Date;       // Maps to ValidityEndDate
}

// Request Attachments
entity RequestAttachments : cuid, managed {
  request           : Association to BusinessPartnerRequests;
  fileName          : String(255) @mandatory;
  fileType          : String(50);
  fileSize          : Integer;
  filePath          : String(500);
  documentType_code : String(20);
  documentType      : Association to DocumentTypes on documentType.code = documentType_code;
  description       : String(200);
}

// Sub-Account Information (Salesforce Hierarchy)
entity SubAccounts : cuid, managed {
  request           : Association to BusinessPartnerRequests;
  orderIndex        : Integer;  // Order sequence for webhook callback matching (hidden from UI)
  address           : Association to PartnerAddresses;  // Link to specific address within the request
  subAccountId      : String(50);
  sapFICAContractAccount : String(10);  // SAP FICA Contract Account Number (system-managed via webhook)
  // accountType       : String(20); // Removed as per requirements
  revenueStream_code : String(20);
  revenueStream     : Association to RevenueStreams on revenueStream.code = revenueStream_code;
  billingCycle_code : String(20);
  billingCycle      : Association to BillingCycles on billingCycle.code = billingCycle_code;
  currency_code     : String(3);
  paymentTerms_code : String(10);
  paymentTerms      : Association to PaymentTerms on paymentTerms.code = paymentTerms_code;
  dunningStrategy_code : String(10);
  dunningStrategy      : Association to DunningStrategies on dunningStrategy.code = dunningStrategy_code;

  banks             : Composition of many SubAccountBanks on banks.subAccount = $self;
  emails            : Composition of many SubAccountEmails on emails.subAccount = $self;
}

entity SubAccountBanks : cuid, managed {
  subAccount        : Association to SubAccounts;
  bankCountry_code  : String(2) @mandatory;
  bankKey           : String(20);
  bankName          : String(100);
  accountHolder     : String(100);
  accountNumber     : String(50);
  iban              : String(50);
  swiftCode         : String(20);
  controlKey        : String(10);
  currency_code     : String(3);
  bankReference     : String(50);
  isDefault         : Boolean @default: false;
}

entity SubAccountEmails : cuid, managed {
  subAccount        : Association to SubAccounts;
  emailType_code    : String(20);
  emailType         : Association to EmailTypes on emailType.code = emailType_code;
  contactType_code  : String(20);
  contactType       : Association to ContactTypes on contactType.code = contactType_code;
  emailAddress      : String(100) @mandatory;
  notes             : String(200);
  isDefault         : Boolean @default: false;
}

entity ApprovalHistory : cuid, managed {
  request           : Association to BusinessPartnerRequests;
  approverUserId    : String(100);
  approverName      : String(100);
  action            : String(50);
  previousStatus    : String(20);
  newStatus         : String(20);
  comments          : String(500);
  systemGenerated   : Boolean @default: false;
}

/**
 * Change Log Entity
 * Tracks all field-level changes for Update requests
 * Used for:
 * - Showing detailed change history in all requesting apps (Coupa, Salesforce, MDM)
 * - Future Satellite Acknowledgment App for cross-system change notifications
 */
entity ChangeLogs : cuid, managed {
  request           : Association to BusinessPartnerRequests;
  changeDate        : DateTime @readonly;
  changedBy         : String(100) @readonly;
  changedByName     : String(100) @readonly;

  // Change details
  sectionName       : String(50) @readonly;  // e.g., "Basic Info", "Addresses", "Emails", "Banks", "VAT IDs", "SubAccounts"
  fieldName         : String(100) @readonly; // Technical field name (e.g., "partnerName", "street")
  fieldLabel        : String(100) @readonly; // User-friendly label (e.g., "Partner Name", "Street")
  oldValue          : String(500) @readonly; // Old value (converted to string)
  newValue          : String(500) @readonly; // New value (converted to string)
  changeType        : String(20) @readonly;  // "Created", "Modified", "Deleted"
  recordIdentifier  : String(100) @readonly; // For child records (e.g., "Address #1 (Main)", "Email #2 (Work)")

  // For future Satellite Acknowledgment App
  isAcknowledgedByOtherSystems : Boolean @default: false; // Track if other system owners have acknowledged this change
  acknowledgedBy    : String(500); // JSON array of system owners who acknowledged (e.g., ["Coupa User", "Salesforce User"])
  acknowledgedAt    : DateTime;     // When all systems acknowledged
}

// Enhanced Duplicate Check Results (ENHANCED_FEATURES.md requirements)
entity DuplicateChecks : cuid, managed {
  request           : Association to BusinessPartnerRequests;
  checkDate         : DateTime; // When this duplicate check was performed
  matchType         : String(20);
  matchScore        : Decimal(5,2); // 0-100 percentage
  existingBpNumber  : String(36);
  existingBpName    : String(100);
  matchDetails      : String(500);
  reviewRequired    : Boolean @default: true;

  // Enhanced duplicate information for established VAT ID matching (ENHANCED_FEATURES.md)
  establishedVatId  : String(50); // The established VAT ID that matched
  establishedCountry: String(2);  // Country of established address
  partnerStatus     : String(20); // Status of existing partner (Active, Blocked, etc.)
  lastUpdated       : DateTime;   // When existing partner was last updated
  sourceSystem      : String(20); // Source system of existing partner
  businessChannels  : String(200); // Business channels of existing partner

  // Merge decision tracking (ENHANCED_FEATURES.md)
  mergeDecision     : String(20);
  mergeDecisionBy   : String(100); // User who made the merge decision
  mergeDecisionAt   : DateTime;
  mergeComments     : String(500);
  canMerge          : Boolean @default: true; // Whether merge is technically possible
  mergeRecommendation : String(200); // System recommendation for merge
}

// System Configuration
entity SystemConfiguration : cuid, managed {
  configKey         : String(100) @mandatory;
  configValue       : String(500);
  description       : String(200);
  isActive          : Boolean @default: true;
}

// Notification Management for Satellite Systems
entity ChangeNotifications : cuid, managed {
  bpNumber          : String(20) @mandatory;
  bpName            : String(100);
  changeType        : String(50);
  changedBySystem   : String(20);
  impactedSystems   : String(100); // Comma-separated list
  fieldsChanged     : String(500); // JSON string of changed fields
  changeDetails     : String(1000); // JSON string of before/after values
  notificationSent  : Boolean @default: false;
  notificationSentAt: DateTime;

  // Acknowledgment tracking
  acknowledgments   : Composition of many NotificationAcknowledgments on acknowledgments.notification = $self;
}

// Notification Acknowledgments
entity NotificationAcknowledgments : managed {
  key ID            : String(50);
  notification      : Association to ChangeNotifications;
  request           : Association to BusinessPartnerRequests;  // Link to BP request
  systemOwnerUserId : String(100);
  systemOwnerName   : String(100);
  targetSystem      : String(50);  // 'Coupa' | 'Salesforce' | 'PI'
  status            : String(20) @default: 'Pending';  // 'Pending' | 'Acknowledged'
  notificationDate  : DateTime;
  acknowledgedBy    : String(255);
  acknowledgedAt    : DateTime;
  comments          : String(500);

  // Denormalized fields for quick display
  partnerName       : String(255);
  requestNumber     : String(50);
  sapBpNumber       : String(10);
  sourceSystem      : String(50);  // Which system made the change
  changeDescription : String(1000);

  // History tracking
  notificationSentBy : String(255);
  emailSentTo        : String(500);
}

// Master Data for Business Channels
entity BusinessChannels {
  key channelCode   : String(20) @mandatory;
  key locale        : String(2) @mandatory @default: 'en'; // en = English (default), de = German
  channelName       : String(100) @mandatory;
  description       : String(200);
  isActive          : Boolean @default: true;
}

// Value List Entities for Configuration

// Request Types
entity RequestTypes {
  key code          : String(10) @mandatory;
  key locale        : String(2) @mandatory @default: 'en'; // en = English (default), de = German
  name              : String(50) @mandatory;
  description       : String(200);
  isActive          : Boolean @default: true;
}

// Source Systems
entity SourceSystems {
  key code          : String(20) @mandatory;
  key locale        : String(2) @mandatory @default: 'en'; // en = English (default), de = German
  sapIdentificationNo : String(20); // Mapping to SAP Identification Number
  name              : String(100) @mandatory;
  description       : String(200);
  isActive          : Boolean @default: true;
}

// Overall Status Values
entity OverallStatuses {
  key code          : String(30) @mandatory;
  key locale        : String(2) @mandatory @default: 'en'; // en = English (default), de = German
  name              : String(100) @mandatory;
  description       : String(200);
  criticality       : Integer @default: 0; // For UI coloring
  isActive          : Boolean @default: true;
}

// Vendor Classifications (Coupa-specific)
entity VendorClassifications {
  key code          : String(20) @mandatory;
  key locale        : String(2) @mandatory @default: 'en'; // en = English (default), de = German
  name              : String(100) @mandatory;
  description       : String(200);
  isActive          : Boolean @default: true;
}

// Admin Menu - Navigation menu for admin configuration tables
entity AdminMenu {
  key code          : String(50) @mandatory; // Entity name (e.g., ValidationRules)
  title             : String(100) @mandatory; // Display title (e.g., Validation Rules)
  description       : String(200); // Description text
  category          : String(50); // Category for grouping (e.g., Validation Management)
  sortOrder         : Integer @default: 0; // Sort order within category
  routeName         : String(100); // Target route name for navigation
  entitySet         : String(100); // OData entity set name
}

// Payment Terms
entity PaymentTerms {
  key code          : String(10) @mandatory; // SAP Payment Terms Key
  key locale        : String(2) @mandatory @default: 'en'; // en = English (default), de = German
  name              : String(100) @mandatory;
  description       : String(200);
  isActive          : Boolean @default: true;
}

// Payment Methods
entity PaymentMethods {
  key code          : String(20) @mandatory;
  key locale        : String(2) @mandatory @default: 'en'; // en = English (default), de = German
  name              : String(100) @mandatory;
  description       : String(200);
  isActive          : Boolean @default: true;
}

// Revenue Streams (Salesforce-specific)
entity RevenueStreams {
  key code          : String(20) @mandatory;
  key locale        : String(2) @mandatory @default: 'en'; // en = English (default), de = German
  name              : String(100) @mandatory;
  description       : String(200);
  isActive          : Boolean @default: true;
}

// Billing Cycles (Salesforce-specific)
entity BillingCycles {
  key code          : String(20) @mandatory;
  key locale        : String(2) @mandatory @default: 'en'; // en = English (default), de = German
  name              : String(100) @mandatory;
  description       : String(200);
  isActive          : Boolean @default: true;
}

// Workflow Configuration
entity StatusTransitions : cuid {
  requestType       : String(20) @mandatory; // Create, Change, *
  fromStatus        : String(20) @mandatory;
  toStatus          : String(20) @mandatory;
  action            : String(50) @mandatory; // e.g., submitForApproval
  requiredRole      : String(50) @mandatory; // e.g., BusinessUser
  isActive          : Boolean @default: true;
}

entity StatusAppConfig : cuid {
  status            : String(20) @mandatory;
  app               : String(20) @mandatory; // Coupa, MDM, etc.
  isEditable        : Boolean @default: false;
  isActive          : Boolean @default: true;
}

entity WorkflowSteps : cuid {
  workflowName      : String(50) @mandatory;
  stepNumber        : Integer @mandatory;
  stepName          : String(100) @mandatory;
  approverRole      : String(50);
  isParallel        : Boolean @default: false;
  isMandatory       : Boolean @default: true;
  timeoutDays       : Integer @default: 5;
}

// User Roles and Permissions
entity UserRoles : cuid {
  userId            : String(100) @mandatory;
  userName          : String(100);
  userEmail         : String(100);
  role              : String(50);
  systemAccess      : String(100); // Comma-separated list of systems
  isActive          : Boolean @default: true;
}

// SAP System Integration - Mock existing partners for duplicate checking (ENHANCED_FEATURES.md)
entity ExistingPartners : cuid {
  sapBpNumber       : String(20) @mandatory;
  partnerName       : String(100) @mandatory;
  partnerType       : String(20);
  status            : String(20) @default: 'Active';
  establishedAddress: String(500); // JSON string of established address
  establishedVatId  : String(50);  // Primary/established VAT ID
  establishedCountry: String(2);   // Country of established address
  createdAt         : DateTime;
  lastUpdated       : DateTime;
  sourceSystem      : String(20);  // Original source system

  // Additional partner details for comparison
  searchTerms       : String(200); // Search terms for fuzzy matching
  allVatIds         : String(500);  // JSON array of all VAT IDs
  allAddresses      : String(2000); // JSON array of all addresses
  businessChannels  : String(200);
}
// Additional Value Lists
entity DocumentTypes : CodeList {}

entity AddressTypes : CodeList {}

entity VatTypes : CodeList {}

entity EmailTypes : CodeList {}

entity IdentificationTypes : CodeList {}

entity BPTypes : CodeList {}

entity ContactTypes : CodeList {}

entity DunningStrategies : CodeList {}

// ===== Dynamic Validation System Entities =====
// Added December 2024 - Dynamic validation rules for flexible, database-driven validation

/**
 * Comprehensive validation rules for dynamic field and cross-field validation
 * Supports status-based, source system-specific, and entity type-specific rules
 * Priority-based execution with fallback to default rules
 *
 * Fallback Priority:
 * 1. Exact match: status + sourceSystem + entityType + requestType
 * 2. Status + sourceSystem + entityType
 * 3. Status + sourceSystem
 * 4. Status only
 * 5. Default rules (all filters null)
 */
entity ValidationRules : managed {
  key ID            : Integer;
  // Language Support - en (default), de, etc.
  locale            : String(2) @mandatory @default: 'en' @title: 'Language';
                      // en = English (default for unsupported languages)
                      // de = German

  // Rule Identification
  ruleCode          : String(50) @mandatory @title: 'Rule Code';

  // Context Filters (null = applies to all)
  status            : String(20) @title: 'Status'; // Draft, New, Submitted, null for default
  sourceSystem      : String(20) @title: 'Source System'; // Coupa, Salesforce, Manual, PI, null
  entityType        : String(20) @title: 'Entity Type'; // Supplier, Customer, Both, null
  requestType       : String(20) @title: 'Request Type'; // Create, Update, null

  // Validation Configuration
  validationType    : String(20) @mandatory @title: 'Validation Type';
                      // Values: Field, Section, CrossField, Custom
  targetEntity      : String(100) @title: 'Target Entity';
                      // E.g., BusinessPartnerRequests, PartnerAddresses
  targetField       : String(100) @title: 'Target Field';
                      // E.g., partnerName, street, city
  targetSection     : String(50) @title: 'Target Section';
                      // E.g., addresses, banks, vatIds

  // Validation Rules
  validationRule    : String(100) @mandatory @title: 'Validation Rule';
                      // Required, MinLength, MaxLength, Regex, Email, VAT, IBAN, etc.
  validationValue   : String(500) @title: 'Validation Value';
                      // Numeric thresholds, regex patterns, etc.
  customValidator   : String(100) @title: 'Custom Validator';
                      // Name of custom validation function

  // Localized Text Fields (language-specific content)
  ruleName          : String(100) @mandatory @title: 'Rule Name';
  errorMessage      : String(500) @mandatory @title: 'Error Message';
                      // Supports placeholders: {fieldLabel}, {minLength}, {actualLength}, etc.
  businessRule      : String(1000) @title: 'Business Rule Description';
  examples          : String(1000) @title: 'Examples';

  // Error Configuration
  errorSeverity     : String(20) @default: 'Error' @title: 'Severity';
                      // Error, Warning, Info
  blockSubmission   : Boolean @default: true @title: 'Block Submission';

  // Execution Control
  priority          : Integer @default: 100 @title: 'Priority';
                      // Lower number = higher priority
  isActive          : Boolean @default: true @title: 'Active';

  // Documentation
  category          : String(50) @title: 'Category';
                      // Basic, Compliance, Banking, Address, etc.
}

/**
 * Section-level validation rules for minimum/maximum record counts
 * Only enforced when status = 'Submitted' (configurable)
 * Examples: "At least 1 address required", "Maximum 5 bank accounts"
 */
entity SectionValidationRules : managed {
  key ID            : Integer;
  // Language Support - en (default), de, etc.
  locale            : String(2) @mandatory @default: 'en' @title: 'Language';
                      // en = English (default for unsupported languages)
                      // de = German

  // Context Filters
  status            : String(20) @title: 'Status';
                      // Typically 'Submitted' for section minimums
  sourceSystem      : String(20) @title: 'Source System';
  entityType        : String(20) @title: 'Entity Type';

  // Section Configuration
  sectionName       : String(50) @mandatory @title: 'Section Name';
                      // addresses, emails, banks, vatIds

  // Localized Text Fields (language-specific content)
  sectionLabel      : String(100) @mandatory @title: 'Section Label';
                      // "Addresses", "Email Addresses", etc.
  minErrorMessage   : String(500) @title: 'Min Count Error Message';
                      // Supports placeholders: {sectionLabel}, {minimumCount}, {actualCount}
  maxErrorMessage   : String(500) @title: 'Max Count Error Message';
                      // Supports placeholders: {sectionLabel}, {maximumCount}, {actualCount}

  // Count Validation
  minimumCount      : Integer @default: 0 @title: 'Minimum Count';
  maximumCount      : Integer @title: 'Maximum Count';
                      // null = no maximum

  // Execution Control
  priority          : Integer @default: 100 @title: 'Priority';
  isActive          : Boolean @default: true @title: 'Active';
  blockSubmission   : Boolean @default: true @title: 'Block Submission';

  // Filter Criteria (JSON format)
  filterCriteria    : String(500) @title: 'Filter Criteria';
                      // Optional JSON string to filter records before counting
                      // Example: {"addressType_code":"Established"} to count only Established addresses
}

/**
 * Registry of custom validation functions for complex business rules
 * Maps validator names to implementation functions
 * Allows extensibility beyond standard validation rules
 */
entity CustomValidators : managed {
  key validatorCode : String(50) @mandatory @title: 'Validator Code';
  key locale        : String(2) @mandatory @default: 'en' @title: 'Language'; // en = English (default), de = German

  // Localized Text Fields (language-specific content)
  validatorName     : String(100) @mandatory @title: 'Validator Name';
  description       : String(500) @title: 'Description';

  // Technical fields
  parameters        : String(1000) @title: 'Parameters (JSON)';
  isActive          : Boolean @default: true @title: 'Active';

  // Implementation reference
  implementationFile : String(200) @title: 'Implementation File Path';
  functionName      : String(100) @title: 'Function Name';
}

/**
 * Country-specific IBAN format patterns
 * Provides validation patterns and length requirements for each country
 * Replaces hardcoded patterns in InputValidator with database-driven approach
 */
entity IBANPatterns : managed {
  key countryCode   : String(2) @mandatory @title: 'Country Code'; // ISO 3166-1 alpha-2
  key locale        : String(2) @mandatory @default: 'en' @title: 'Language';

  // Localized Text Fields
  countryName       : String(100) @mandatory @title: 'Country Name';

  // Validation Configuration
  ibanLength        : Integer @mandatory @title: 'IBAN Length';
                      // Total length including country code and check digits
  pattern           : String(500) @title: 'Regex Pattern';
                      // Optional regex for additional format validation
  exampleIBAN       : String(34) @title: 'Example IBAN';
                      // Sample valid IBAN for reference
  notes             : String(500) @title: 'Notes';

  // Control
  isActive          : Boolean @default: true @title: 'Active';
}

/**
 * Country-specific VAT ID format patterns
 * Provides validation patterns for VAT numbers by country
 * Supports EU and non-EU countries
 */
entity VATPatterns : managed {
  key countryCode   : String(2) @mandatory @title: 'Country Code'; // ISO 3166-1 alpha-2
  key locale        : String(2) @mandatory @default: 'en' @title: 'Language';

  // Localized Text Fields
  countryName       : String(100) @mandatory @title: 'Country Name';
  vatLabel          : String(50) @title: 'VAT Label';
                      // E.g., "USt-IdNr." (DE), "Tax ID" (US), "VAT Number" (GB)

  // Validation Configuration
  pattern           : String(500) @mandatory @title: 'Regex Pattern';
                      // Regex pattern for VAT number validation
  minLength         : Integer @title: 'Minimum Length';
  maxLength         : Integer @title: 'Maximum Length';
  exampleVAT        : String(20) @title: 'Example VAT';
                      // Sample valid VAT number
  notes             : String(500) @title: 'Notes';

  // EU VIES Integration
  viesEnabled       : Boolean @default: false @title: 'VIES Validation Enabled';
                      // true for EU countries that support VIES validation

  // Control
  isActive          : Boolean @default: true @title: 'Active';
}

/**
 * Country-specific postal code format patterns
 * Provides validation patterns for postal codes by country
 * Supports various international postal code formats
 */
entity PostalCodePatterns : managed {
  key countryCode   : String(2) @mandatory @title: 'Country Code'; // ISO 3166-1 alpha-2
  key locale        : String(2) @mandatory @default: 'en' @title: 'Language';

  // Localized Text Fields
  countryName       : String(100) @mandatory @title: 'Country Name';
  postalCodeLabel   : String(50) @title: 'Postal Code Label';
                      // E.g., "ZIP Code" (US), "Postleitzahl" (DE), "Code Postal" (FR)
  formatDescription : String(200) @title: 'Format Description';
                      // Human-readable format description

  // Validation Configuration
  pattern           : String(500) @mandatory @title: 'Regex Pattern';
                      // Regex pattern for postal code validation
  minLength         : Integer @title: 'Minimum Length';
  maxLength         : Integer @title: 'Maximum Length';
  examplePostalCode : String(20) @title: 'Example Postal Code';
                      // Sample valid postal code
  notes             : String(500) @title: 'Notes';

  // Control
  isActive          : Boolean @default: true @title: 'Active';
}

