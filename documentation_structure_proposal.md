# Proposed Documentation Structure

## Overview

This document proposes a reorganized documentation hierarchy that:
- Separates overview content from detailed specifications
- Groups related content into logical folders
- Enables easy navigation through cross-references
- Reduces document length for better readability
- Covers ALL functionality in appropriate detail

---

## Proposed Folder Structure

```
docs/
├── README.md                           # Main entry point with navigation
├── overview/
│   ├── system-overview.md              # High-level system description
│   ├── architecture.md                 # Technical architecture
│   └── glossary.md                     # Terms and definitions
│
├── data-model/
│   ├── README.md                       # Data model overview
│   ├── entities/
│   │   ├── business-partner-request.md # Main entity
│   │   ├── partner-addresses.md        # Address entity
│   │   ├── partner-banks.md            # Bank entity
│   │   ├── partner-emails.md           # Email entity
│   │   ├── partner-vat-ids.md          # VAT entity
│   │   ├── partner-identifications.md  # Identification entity
│   │   ├── sub-accounts.md             # Sub-account entity (Salesforce)
│   │   ├── change-logs.md              # Change tracking entity
│   │   ├── duplicate-checks.md         # Duplicate detection results
│   │   ├── change-notifications.md     # Satellite notifications
│   │   └── notification-acknowledgments.md # Acknowledgment tracking
│   └── code-lists/
│       ├── README.md                   # Code lists overview & purpose
│       │
│       │   # === REQUEST & WORKFLOW ===
│       ├── request-types.md            # Create, Change, AdhocSync
│       ├── source-systems.md           # Salesforce, Coupa, PI
│       ├── overall-statuses.md         # New, Submitted, Approved, etc.
│       ├── status-transitions.md       # Valid state changes
│       ├── workflow-steps.md           # Workflow step definitions
│       │
│       │   # === BUSINESS PARTNER ===
│       ├── bp-types.md                 # ORG, PERSON
│       ├── entity-types.md             # Customer, Supplier, Both
│       │
│       │   # === ADDRESSES ===
│       ├── address-types.md            # Business, Shipping, Remit-To
│       ├── countries.md                # ISO country codes
│       ├── postal-code-patterns.md     # Country-specific postal formats
│       │
│       │   # === PAYMENT & BANKING ===
│       ├── payment-terms.md            # NET30, NET60, etc.
│       ├── payment-methods.md          # Bank Transfer, Check, etc.
│       ├── currencies.md               # EUR, USD, GBP, etc.
│       ├── iban-patterns.md            # Country-specific IBAN formats
│       │
│       │   # === TAX & COMPLIANCE ===
│       ├── vat-types.md                # EU VAT, Local VAT, etc.
│       ├── vat-patterns.md             # Country-specific VAT formats
│       │
│       │   # === IDENTIFICATION ===
│       ├── identification-types.md     # DUNS, TaxID, SALESFORCE, COUPA, PI
│       │
│       │   # === COMMUNICATION ===
│       ├── email-types.md              # General, Invoice, Orders
│       ├── contact-types.md            # Primary, Billing, Shipping
│       │
│       │   # === SALESFORCE SPECIFIC ===
│       ├── revenue-streams.md          # Revenue categorization
│       ├── billing-cycles.md           # Monthly, Quarterly, Annual
│       ├── dunning-strategies.md       # Collection strategies
│       ├── business-channels.md        # Sales channels
│       │
│       │   # === ADMIN & SYSTEM ===
│       ├── admin-menu.md               # Admin navigation items
│       ├── system-configuration.md     # System settings
│       └── status-app-config.md        # Status display configuration
│
├── apps/
│   ├── README.md                       # Applications overview
│   │
│   ├── salesforce/
│   │   ├── README.md                   # Salesforce app overview
│   │   ├── sections/
│   │   │   ├── general-information.md  # General section spec
│   │   │   ├── payment-information.md  # Payment section spec
│   │   │   ├── addresses.md            # Addresses section spec
│   │   │   ├── emails.md               # Emails section (MANDATORY)
│   │   │   ├── bank-accounts.md        # Banks section spec
│   │   │   ├── vat-ids.md              # VAT IDs section spec
│   │   │   ├── identifications.md      # Identifications spec
│   │   │   ├── sub-accounts.md         # Sub-accounts (SF only)
│   │   │   └── change-log.md           # Change log section
│   │   ├── workflows/
│   │   │   ├── create-request.md       # Create workflow
│   │   │   └── change-request.md       # Change workflow
│   │   ├── validation/
│   │   │   ├── README.md               # Validation overview
│   │   │   ├── field-validations.md    # Field-level rules
│   │   │   └── section-validations.md  # Section-level rules
│   │   └── api/
│   │       ├── README.md               # API overview
│   │       ├── endpoints.md            # Endpoint list
│   │       └── examples.md             # Request/response examples
│   │
│   ├── coupa/
│   │   ├── README.md                   # Coupa app overview
│   │   ├── sections/
│   │   │   ├── general-information.md
│   │   │   ├── payment-information.md  # MANDATORY fields
│   │   │   ├── addresses.md
│   │   │   ├── bank-accounts.md        # CRITICAL
│   │   │   ├── vat-ids.md
│   │   │   ├── identifications.md      # MIN 1 required
│   │   │   └── change-log.md
│   │   ├── workflows/
│   │   │   ├── create-request.md
│   │   │   └── change-request.md
│   │   ├── validation/
│   │   │   ├── README.md
│   │   │   ├── field-validations.md
│   │   │   └── section-validations.md
│   │   └── api/
│   │       ├── README.md
│   │       ├── endpoints.md
│   │       └── examples.md
│   │
│   ├── pi/
│   │   ├── README.md                   # PI app overview
│   │   ├── sections/
│   │   │   ├── general-information.md
│   │   │   ├── payment-information.md
│   │   │   ├── addresses.md            # MIN 1 required
│   │   │   ├── bank-accounts.md
│   │   │   ├── vat-ids.md
│   │   │   ├── identifications.md      # MIN 1 required
│   │   │   └── change-log.md
│   │   ├── workflows/
│   │   │   ├── create-request.md
│   │   │   └── change-request.md
│   │   ├── validation/
│   │   │   ├── README.md
│   │   │   ├── field-validations.md
│   │   │   └── section-validations.md
│   │   └── api/
│   │       ├── README.md
│   │       ├── endpoints.md
│   │       └── examples.md
│   │
│   ├── mdm-approval/
│   │   ├── README.md                   # MDM app overview
│   │   ├── sections/
│   │   │   ├── general-information.md
│   │   │   ├── payment-information.md
│   │   │   ├── addresses.md
│   │   │   ├── emails.md
│   │   │   ├── bank-accounts.md
│   │   │   ├── vat-ids.md
│   │   │   ├── identifications.md
│   │   │   ├── aeb-compliance.md       # AEB sanctions screening
│   │   │   ├── vies-validation.md      # VIES VAT check
│   │   │   ├── duplicate-partners.md   # Duplicate detection
│   │   │   ├── change-log.md
│   │   │   └── approval-history.md
│   │   ├── workflows/
│   │   │   ├── approval-workflow.md    # Approve/Reject flow
│   │   │   ├── compliance-checks.md    # AEB/VIES process
│   │   │   └── duplicate-resolution.md # Handling duplicates
│   │   ├── actions/
│   │   │   ├── approve.md              # Approve action
│   │   │   ├── reject.md               # Reject action
│   │   │   ├── check-duplicates.md     # Duplicate check
│   │   │   ├── perform-aeb-check.md    # AEB action
│   │   │   └── perform-vies-check.md   # VIES action
│   │   └── status-transitions.md       # State machine
│   │
│   ├── satellite-acknowledgement/
│   │   ├── README.md                   # Satellite ack overview
│   │   ├── sections/
│   │   │   ├── notification-details.md
│   │   │   ├── payload.md
│   │   │   └── change-log.md
│   │   └── workflows/
│   │       └── acknowledgement.md
│   │
│   └── admin-config/
│       ├── README.md                   # Admin config overview
│       ├── sections/
│       │   ├── validation-rules.md     # Rule management
│       │   ├── code-lists.md           # Code list management
│       │   └── cache-management.md     # Cache operations
│       └── workflows/
│           ├── add-validation-rule.md
│           ├── add-code-list-entry.md
│           └── clear-cache.md
│
├── integration/
│   ├── README.md                       # Integration overview
│   ├── sap-s4hana/
│   │   ├── README.md                   # SAP integration overview
│   │   ├── create-sync.md              # Create BP sync
│   │   ├── change-sync.md              # Change BP sync
│   │   └── id-writeback.md             # SAP ID update
│   ├── satellite-notifications/
│   │   ├── README.md                   # Notification overview
│   │   └── callback-payload.md         # Webhook payload
│   └── compliance/
│       ├── README.md                   # Compliance overview
│       ├── aeb/
│       │   ├── README.md               # AEB overview
│       │   ├── api-specification.md    # API details
│       │   ├── request-schema.md       # Request format
│       │   ├── response-schema.md      # Response format
│       │   └── risk-scoring.md         # Score interpretation
│       └── vies/
│           ├── README.md               # VIES overview
│           ├── api-specification.md    # SOAP API details
│           ├── request-format.md       # Request format
│           └── response-format.md      # Response format
│
├── validation/
│   ├── README.md                       # Validation framework overview
│   ├── validation-types.md             # Required, MinLength, etc.
│   ├── field-level-rules.md            # All field validations
│   ├── section-level-rules.md          # MinCount rules
│   ├── create-vs-change.md             # Differences by request type
│   └── error-messages.md               # Standard error messages
│
├── status-management/
│   ├── README.md                       # Status overview
│   ├── status-values.md                # All status definitions
│   ├── state-machine.md                # Transition diagram
│   └── integration-statuses.md         # SAP sync statuses
│
└── field-mappings/
    ├── README.md                       # Field mapping overview
    ├── business-partner-request.md     # Main entity fields
    ├── addresses.md                    # Address fields
    ├── banks.md                        # Bank fields
    ├── emails.md                       # Email fields
    ├── vat-ids.md                      # VAT ID fields
    └── identifications.md              # Identification fields
```

---

## Document Templates

### Main README (Navigation Hub)

```markdown
# Business Partner Management System - Documentation

## Quick Navigation

### 📋 Overview
- [System Overview](overview/system-overview.md)
- [Architecture](overview/architecture.md)
- [Glossary](overview/glossary.md)

### 🗄️ Data Model
- [Entities](data-model/entities/)
- [Code Lists](data-model/code-lists/)

### 📱 Applications
| App | Description |
|:----|:------------|
| [Salesforce](apps/salesforce/) | Customer onboarding for sales |
| [Coupa](apps/coupa/) | Supplier onboarding for procurement |
| [PI](apps/pi/) | Supplier onboarding for purchasing |
| [MDM Approval](apps/mdm-approval/) | Governance and approval |
| [Satellite Acknowledgement](apps/satellite-acknowledgement/) | Notification handling |
| [Admin Config](apps/admin-config/) | System configuration |

### 🔗 Integration
- [SAP S/4HANA](integration/sap-s4hana/)
- [Compliance (AEB/VIES)](integration/compliance/)

### ✅ Validation & Status
- [Validation Framework](validation/)
- [Status Management](status-management/)
- [Field Mappings](field-mappings/)

### 📊 Project Management
- [📋 Development Task List](project/task-list.md) ← Sprint planning & progress
- [📁 Documentation Structure](project/structure.md) ← This proposal
```

---

## Cross-Reference Strategy

All documents will include appropriate cross-references to related content. Here's the strategy:

### Cross-Reference Types

| Type | When to Use | Example |
|:-----|:------------|:--------|
| **Parent Link** | Every document | `← Back to [App Overview](../README.md)` |
| **Sibling Links** | Related sections | `See also: [Addresses](addresses.md)` |
| **Related Apps** | Similar functionality | `Compare: [Coupa Payment](../../coupa/sections/payment-information.md)` |
| **Validation Links** | Field validation | `Validation: [Required Fields](../validation/field-validations.md#partner-name)` |
| **Field Mapping Links** | SAP mapping | `SAP Mapping: [Field Mappings](../../field-mappings/addresses.md)` |
| **Data Model Links** | Entity reference | `Entity: [PartnerAddresses](../../data-model/entities/partner-addresses.md)` |
| **Code List Links** | Dropdown values | `Values: [Payment Terms](../../data-model/code-lists/payment-terms.md)` |

### Standard Cross-Reference Sections

Each document type will have these standard cross-reference sections:

**Section Documents:**
```markdown
## Related Documentation
- **Entity**: [PartnerAddresses](../../data-model/entities/partner-addresses.md)
- **Validation**: [Address Validations](../validation/field-validations.md#addresses)
- **SAP Mapping**: [Address Fields](../../field-mappings/addresses.md)
- **Compare**: [Coupa Addresses](../../coupa/sections/addresses.md) | [PI Addresses](../../pi/sections/addresses.md)

← Back to [Salesforce App](../README.md)
```

**Workflow Documents:**
```markdown
## Related Documentation
- **Sections Used**: [General](../sections/general-information.md) | [Addresses](../sections/addresses.md)
- **Validations**: [Create Validations](../validation/field-validations.md)
- **Status Flow**: [Status Transitions](../../status-management/state-machine.md)
- **Integration**: [SAP Create Sync](../../integration/sap-s4hana/create-sync.md)

← Back to [Salesforce App](../README.md)
```

**Action Documents:**
```markdown
## Related Documentation
- **API Endpoint**: [Endpoints](../api/endpoints.md#approve-request)
- **Status Change**: [Status Values](../../status-management/status-values.md#approved)
- **Integration**: [SAP Sync](../../integration/sap-s4hana/create-sync.md)

← Back to [MDM Approval App](../README.md)
```

### Cross-Reference Matrix

Documents will be linked based on this relationship matrix:

| From | Links To |
|:-----|:---------|
| App README | All sections, workflows, actions, validation |
| Section | Entity, validation, field mapping, other apps' same section |
| Workflow | Sections used, status transitions, integration |
| Validation | Field mappings, entities, error messages |
| Action | API endpoint, status change, related workflows |
| Entity | All apps using this entity, code lists |
| Integration | Related actions, status transitions |

### App README Template

```markdown
# [App Name] - Functional Specification

## Overview
Brief description of the application purpose.

## Navigation

### Sections
- [General Information](sections/general-information.md)
- [Payment Information](sections/payment-information.md)
- [Addresses](sections/addresses.md)
...

### Workflows
- [Create Request](workflows/create-request.md)
- [Change Request](workflows/change-request.md)

### Validation
- [Field Validations](validation/field-validations.md)
- [Section Validations](validation/section-validations.md)

### API
- [Endpoints](api/endpoints.md)
- [Examples](api/examples.md)

## Key Characteristics
| Characteristic | Value |
|:---------------|:------|
| Entity Type | Customer / Supplier |
| Source System | Salesforce / Coupa / PI |
| ...
```

### Section Template

```markdown
# [Section Name]

## Purpose
Why this section exists.

## Fields

| Field | Label | Type | Mandatory | Create | Change | Notes |
|:------|:------|:-----|:----------|:-------|:-------|:------|
...

## UI Behavior
- Visibility rules
- Editability rules
- Conditional logic

## Validation
Link to [Validation Rules](../validation/field-validations.md#section-name)
## SAP Mapping
Link to [Field Mappings](../../field-mappings/...)
```

---

## Benefits of This Structure

1. **Navigable** - Clear hierarchy with README files as navigation hubs
2. **Focused** - Each document covers one specific topic
3. **Maintainable** - Changes isolated to specific files
4. **Reusable** - Common content (validation, field mappings) shared
5. **Complete** - Every functionality has its own document
6. **Scalable** - Easy to add new apps or sections

---

## Complete Code List Inventory

The system uses 25+ code list tables to provide standardized dropdown values, validation patterns, and configuration. Each code list document will include:
- **Purpose** - Why this code list exists
- **Usage** - Which apps/sections use it
- **Values** - Complete list of valid values with descriptions
- **Maintenance** - How to add/modify values via Admin Config

### Request & Workflow Code Lists

| Code List | Purpose | Values | Used By |
|:----------|:--------|:-------|:--------|
| **RequestTypes** | Defines the type of business partner request being created. Determines workflow behavior and required fields. | `Create` - New BP creation, `Change` - Modify existing BP, `AdhocSync` - Manual sync trigger | All apps |
| **SourceSystems** | Identifies which satellite system originated the request. Controls app-specific validation rules and field visibility. | `Salesforce` - CRM system, `Coupa` - Procurement, `PI` - Purchasing Interface, `MDM` - Direct MDM entry | All apps |
| **OverallStatuses** | Master list of all workflow statuses. Controls UI behavior, button visibility, and editability. | `New`, `Submitted`, `Approved`, `Rejected`, `Completed`, `Error`, `ComplianceReview`, `SAPCreated`, `SAPUpdatePending`, `SAPUpdateComplete`, `SatelliteNotified`, `SatelliteConfirmed` | All apps |
| **StatusTransitions** | Defines valid status changes. Enforces workflow rules and prevents invalid state transitions. | From→To mappings (e.g., New→Submitted, Submitted→Approved) | MDM, Backend |
| **WorkflowSteps** | Defines workflow step sequences and conditions for each request type. | Step definitions with conditions | Backend |

### Business Partner Code Lists

| Code List | Purpose | Values | Used By |
|:----------|:--------|:-------|:--------|
| **BPTypes** | Distinguishes between organization and individual business partners. Affects name structure and required fields. | `ORG` - Organization/Company, `PERSON` - Individual | All apps |
| **EntityTypes** | Defines the business relationship type. Determines SAP customer/vendor role creation. | `Customer` - Sales relationship (default for Salesforce), `Supplier` - Procurement relationship (default for Coupa/PI), `Both` - Dual role | All apps |

### Address Code Lists

| Code List | Purpose | Values | Used By |
|:----------|:--------|:-------|:--------|
| **AddressTypes** | Categorizes addresses by business function. Each type may have different requirements per system. | `Business` - Main office address, `Shipping` - Delivery address, `Remit-To` - Payment remittance (Coupa), `Ordering` - Purchase orders | All apps |
| **Countries** | ISO 3166-1 alpha-2 country codes. Used for addresses, VAT IDs, and banking. Linked to region requirements. | 200+ country codes (DE, US, GB, FR, etc.) | All apps |
| **PostalCodePatterns** | Country-specific postal code validation patterns. Ensures correct format before SAP submission. | Regex patterns per country (e.g., DE: `^\d{5}$`, US: `^\d{5}(-\d{4})?$`) | Validation |

### Payment & Banking Code Lists

| Code List | Purpose | Values | Used By |
|:----------|:--------|:-------|:--------|
| **PaymentTerms** | Standard payment terms defining when invoices are due. **MANDATORY for Coupa and Salesforce Customer.** | `NET30` - Net 30 days, `NET60` - Net 60 days, `2%10NET30` - 2% discount if paid in 10 days, else net 30 | Coupa (required), Salesforce (required for Customer) |
| **PaymentMethods** | How payments are made to/from the business partner. **MANDATORY for Coupa.** | `T` - Bank Transfer, `C` - Check, `D` - Direct Debit, `P` - PayPal | Coupa (required), Salesforce, PI |
| **Currencies** | ISO 4217 currency codes for transactions. | 150+ currencies (EUR, USD, GBP, CHF, JPY, etc.) | All apps |
| **IBANPatterns** | Country-specific IBAN validation patterns. Ensures bank account validity for SEPA countries. | Regex patterns per country (e.g., DE: `^DE\d{2}\d{8}\d{10}$`) | Bank validation |

### Tax & Compliance Code Lists

| Code List | Purpose | Values | Used By |
|:----------|:--------|:-------|:--------|
| **VatTypes** | Categorizes VAT registration types. Determines VIES validation eligibility. | `EU` - EU VAT (VIES-validated), `LOCAL` - Local tax ID, `EXEMPT` - Tax exempt | All apps |
| **VATPatterns** | Country-specific VAT ID validation patterns. Validates format before VIES check. | Regex patterns per EU country (e.g., DE: `^DE\d{9}$`, GB: `^GB\d{9}$`) | VAT validation |

### Identification Code Lists

| Code List | Purpose | Values | Used By |
|:----------|:--------|:-------|:--------|
| **IdentificationTypes** | Types of business identifications that can be stored. Includes satellite system IDs. | `DUNS` - D&B DUNS number, `TAXID` - Tax identification, `REGISTER` - Trade register, `SALESFORCE` - Salesforce Account ID, `COUPA` - Coupa Supplier ID, `PI` - PI Supplier ID | All apps, **MIN 1 required for Coupa/PI** |

### Communication Code Lists

| Code List | Purpose | Values | Used By |
|:----------|:--------|:-------|:--------|
| **EmailTypes** | Categorizes email addresses by purpose. | `GENERAL` - General contact, `INVOICE` - Invoice delivery, `ORDER` - Order confirmations | Salesforce (required), Coupa, PI |
| **ContactTypes** | Types of contacts associated with the business partner. | `PRIMARY` - Main contact, `BILLING` - Billing contact, `SHIPPING` - Shipping contact | All apps |

### Salesforce-Specific Code Lists

| Code List | Purpose | Values | Used By |
|:----------|:--------|:-------|:--------|
| **RevenueStreams** | Categorizes revenue for financial reporting. **Required for Sub-Accounts.** | Business-specific values (e.g., `License`, `Services`, `Support`) | Salesforce Sub-Accounts |
| **BillingCycles** | Defines invoice frequency for sub-accounts. **Required for Sub-Accounts.** | `MONTHLY`, `QUARTERLY`, `ANNUALLY` | Salesforce Sub-Accounts |
| **DunningStrategies** | Collection strategy for overdue payments. **Required for Sub-Accounts.** | Business-specific codes | Salesforce Sub-Accounts |
| **BusinessChannels** | Sales channel classification. | `DIRECT`, `PARTNER`, `ONLINE` | Salesforce |

### Admin & System Code Lists

| Code List | Purpose | Values | Used By |
|:----------|:--------|:-------|:--------|
| **AdminMenu** | Navigation menu items for Admin Config app. | Menu item definitions | Admin Config |
| **SystemConfiguration** | System-wide settings and configuration parameters. | Key-value configuration pairs | Backend |
| **StatusAppConfig** | Per-status UI configuration (colors, labels, visibility). | Status display settings | All apps |

---

## Updated Document Count

| Category | Documents |
|:---------|----------:|
| Overview | 3 |
| Data Model - Entities | 11 |
| Data Model - Code Lists | 26 |
| Apps (6 apps × ~18 docs each) | ~108 |
| Integration | 15 |
| Validation | 6 |
| Status Management | 4 |
| Field Mappings | 7 |
| Shared Services | 12 |
| Project | 2 |
| **Total** | **~194 documents** |

---

## Complete Functionality Inventory

Based on codebase analysis, here is ALL functionality that must be documented:

### MDM Approval App - Actions & Functions

| Feature | Type | Description | Documented? |
|:--------|:-----|:------------|:------------|
| `approveRequest` | Action | Approve a pending request | ✅ |
| `rejectRequest` | Action | Reject with reason | ✅ |
| `checkDuplicates` | Action | Run duplicate detection | ✅ |
| `performAEBCheck` | Action | Run AEB sanctions screening | ✅ |
| `performVIESCheck` | Action | Run VIES VAT validation | ✅ |
| `submit` | Action | Submit draft request | ✅ |
| `updateSAPStatus` | Action | Update SAP integration status | ⚠️ Partial |
| `updateSatelliteStatus` | Action | Update satellite notification status | ⚠️ Partial |
| `updateSAPIdStatus` | Action | Update SAP ID writeback status | ⚠️ Partial |
| **`createAdhocSyncRequest`** | **Action** | **Create adhoc sync request** | ❌ MISSING |
| **`validateAndFetchSAPBP`** | **Function** | **Validate SAP BP for adhoc sync** | ❌ MISSING |
| `getComplianceStatus` | Function | Get compliance check results | ⚠️ Partial |
| `validateBusinessPartner` | Function | Run validation rules | ⚠️ Partial |
| `searchDuplicates` | Function | Search for duplicate BPs | ✅ |
| `getSAPPartnerDetails` | Function | Get SAP BP details | ✅ |
| `getBPDetails` | Function | Get BP full details | ⚠️ Partial |
| `getSubAccountDetails` | Function | Get sub-account details | ⚠️ Partial |
| `updateIntegrationData` | Function | CPI callback endpoint | ⚠️ Partial |

### Satellite Request Apps (Salesforce, Coupa, PI) - Actions & Functions

| Feature | Type | Apps | Description | Documented? |
|:--------|:-----|:-----|:------------|:------------|
| `submit` | Action | All | Submit request for approval | ✅ |
| `checkDuplicates` | Action | All | Run duplicate check | ✅ |
| `checkForDuplicates` | Function | All | Get duplicate results | ✅ |
| `getSAPPartnerDetails` | Function | All | Get SAP BP data | ✅ |
| `importSAPPartner` | Function | All | Import SAP BP for change | ✅ |
| `searchSAPPartners` | Function | All | Search existing SAP BPs | ✅ |
| `createChangeRequestFromSAP` | Function | SF, Coupa, PI | Create change from SAP | ⚠️ Partial |
| `receiveCreateCallback` | Action | Salesforce | CPI create callback | ⚠️ Partial |
| `receiveUpdateCallback` | Action | Salesforce | CPI update callback | ⚠️ Partial |

### Satellite Acknowledgement App

| Feature | Type | Description | Documented? |
|:--------|:-----|:------------|:------------|
| `acknowledge` | Action | Acknowledge notification | ✅ |

### Admin Config App - Actions & Functions

| Feature | Type | Description | Documented? |
|:--------|:-----|:------------|:------------|
| `navigateToTable` | Action | Navigate to code list | ⚠️ Partial |
| `toggleActive` | Action | Enable/disable rule | ⚠️ Partial |
| `duplicate` | Action | Clone validation rule | ⚠️ Partial |
| `testValidation` | Action | Test validation rule | ❌ MISSING |
| `updateRulePriorities` | Action | Reorder rule priorities | ❌ MISSING |
| `cloneValidationRules` | Action | Clone rules to another system | ❌ MISSING |
| `getApplicableValidationRules` | Function | Get rules for context | ⚠️ Partial |
| `getValidationStatistics` | Function | Get validation stats | ❌ MISSING |

### Shared Services (Library)

| Service | File | Description | Documented? |
|:--------|:-----|:------------|:------------|
| AEB Service | `aeb-service.js` | Sanctions screening | ✅ |
| Enhanced AEB | `enhanced-aeb-service.js` | Extended AEB features | ⚠️ Partial |
| VIES Service | `vies-service.js` | VAT validation | ✅ |
| Change Tracker | `change-tracker.js` | Track field changes | ⚠️ Partial |
| Duplicate Checker | `shared/duplicate-checker.js` | Fuzzy matching | ⚠️ Partial |
| SAP Partner Service | `shared/sap-partner-service.js` | SAP BP operations | ⚠️ Partial |
| Validation Service | `validation-service.js` | Run validations | ⚠️ Partial |
| Custom Validators | `custom-validators.js` | IBAN, email, etc. | ⚠️ Partial |
| Input Validator | `input-validator.js` | Sanitization | ❌ MISSING |
| Error Handler | `error-handler.js` | Error formatting | ❌ MISSING |
| Notification Service | `notification-service.js` | Email notifications | ⚠️ Partial |
| Request Number Gen | `request-number-generator.js` | Generate REQ numbers | ⚠️ Partial |
| Field Label Mapper | `field-label-mapper.js` | Field to label mapping | ❌ MISSING |

### Integration Services

| Service | File | Description | Documented? |
|:--------|:-----|:------------|:------------|
| SAP Mock | `integration/sap-mock.js` | Mock SAP responses | ⚠️ Partial |
| Satellite Mock | `integration/satellite-mock.js` | Mock satellite callbacks | ⚠️ Partial |
| Integration API | `integration-api.js` | CPI integration endpoints | ⚠️ Partial |

### MDM Service Handlers (Modular)

| Handler | File | Description | Documented? |
|:--------|:-----|:------------|:------------|
| AEB Compliance | `handlers/aeb-compliance-handler.js` | AEB check handler | ⚠️ Partial |
| Approval Handler | `handlers/approval-handler.js` | Approve/reject logic | ⚠️ Partial |
| Duplicate Check | `handlers/duplicate-check-handler.js` | Duplicate detection | ⚠️ Partial |
| Status Update | `handlers/status-update-handler.js` | Status transitions | ⚠️ Partial |
| VIES Validation | `handlers/vies-validation-handler.js` | VIES check handler | ⚠️ Partial |

---

## Adhoc Sync Request - Missing Documentation

### What is Adhoc Sync?

Adhoc Sync is a special request type where an MDM Steward manually triggers synchronization of an existing SAP Business Partner to a satellite system. This is used when:
- Automated sync failed
- Manual intervention is required
- Data needs to be pushed to a specific satellite

### Adhoc Sync Data

| Field | Type | Description |
|:------|:-----|:------------|
| requestType | String | Fixed: "AdhocSync" |
| sapBpNumber | String | **Required** - The SAP BP to sync |
| existingBpName | String | BP name for display |
| targetSystem | String | **Required** - Salesforce, Coupa, or PI |
| adhocReason | String | **Required** - Why sync is needed |

### Adhoc Sync Workflow

1. MDM Steward opens "Create Adhoc Sync" dialog
2. Enters SAP BP number
3. System validates BP exists via `validateAndFetchSAPBP`
4. User selects target system
5. User enters reason
6. Creates request with ADHOC-XXXX number
7. Request status = "Submitted" (no draft)
8. Triggers sync to satellite system

### Folder Structure Addition

```
apps/
└── mdm-approval/
    ├── ...
    ├── workflows/
    │   ├── approval-workflow.md
    │   ├── compliance-checks.md
    │   ├── duplicate-resolution.md
    │   └── adhoc-sync.md          # ← NEW
    └── actions/
        ├── ...
        ├── create-adhoc-sync.md   # ← NEW
        └── validate-sap-bp.md     # ← NEW
```

---

## Updated Document Count

| Category | Documents |
|:---------|----------:|
| Overview | 3 |
| Data Model | 15 |
| Apps (6 apps × ~18 docs each) | ~108 |
| Integration | 15 |
| Validation | 6 |
| Status Management | 4 |
| Field Mappings | 7 |
| **Shared Services** | **12** |
| **Total** | **~170 documents** |

---

## Next Steps

1. **Confirm structure** - Review and approve the proposed hierarchy
2. **Create folder structure** - Set up all directories
3. **Create READMEs** - Build navigation hubs first
4. **Migrate content** - Move existing content to appropriate locations
5. **Fill gaps** - Create remaining documents (marked ❌ above)
6. **Add cross-references** - Link related documents

Would you like me to proceed with creating this structure?

