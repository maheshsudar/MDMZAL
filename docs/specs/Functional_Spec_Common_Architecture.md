# Functional Specification: Common Architecture and Shared Services

**Version:** 7.0
**Date:** 2026-05-21
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose

This document describes the shared architectural components and services that underpin all applications in the Business Partner Management System. Rather than duplicating functionality in each application, common capabilities are centralized and reused. This approach ensures consistency, reduces maintenance burden, and makes the system more reliable.

Think of this document as the "foundation" specification. Just as a building's foundation supports all floors above it, these shared services support all the applications that end users interact with. Understanding the common architecture is essential for anyone who wants to deeply understand how the system works.

### 1.2 Shared vs Application-Specific

The Business Partner Management System is organized into two layers:

**Common Layer (This Document):**
- Data model entities and relationships
- Validation framework (Dynamic Validation System)
- Status management and transitions
- Notification service
- Code lists and reference data
- ID preservation logic for change requests

**Application Layer:**
- User interfaces (Fiori apps)
- Application-specific workflows
- Source system-specific validation rules
- API endpoints for each satellite system

By separating these concerns, changes to the common layer automatically propagate to all applications. For example, adding a new validation type in the framework makes it immediately available to Salesforce, Coupa, and PI applications.

### 1.3 Cross-References

| Document | Relationship |
|:---|:---|
| [Salesforce Request App](Functional_Spec_Salesforce_Request_App.md) | Uses shared data model, validation |
| [Coupa Request App](Functional_Spec_Coupa_Request_App.md) | Uses shared data model, validation |
| [PI Request App](Functional_Spec_PI_Request_App.md) | Uses shared data model, validation |
| [MDM Approval App](Functional_Spec_MDM_Approval_App.md) | Uses status management, compliance services |
| [Compliance Integration](Compliance_Integration_Specification.md) | Detailed AEB/VIES specifications |

---

## 2. Data Model

### 2.1 Core Entities Overview

The data model is designed around a central **Business Partner Request** entity with multiple child entities for different aspects of the partner data.

**Why This Structure?**

A Business Partner in SAP S/4HANA is a complex object. A single partner can have multiple addresses (headquarters, shipping, billing), multiple contact emails, multiple bank accounts, and multiple tax registrations. Rather than flattening all this into one massive table (which would create normalization problems), the data model uses separate entities linked through foreign keys.

This structure also mirrors the SAP Business Partner API, making the mapping to SAP straightforward during integration.

### 2.2 Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        BusinessPartnerRequests                                │
│  (Main request entity containing header-level partner information)            │
└──────────────────────────────────────────────────────────────────────────────┘
          │ 1:N           │ 1:N           │ 1:N           │ 1:N
          ▼               ▼               ▼               ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐
│ PartnerAddresses│ │PartnerEmails│ │ PartnerBanks│ │  PartnerVatIds  │
│ (Addresses with │ │ (Contact    │ │ (Bank       │ │  (Tax           │
│  type, location)│ │  emails)    │ │  accounts)  │ │   registrations)│
└─────────────────┘ └─────────────┘ └─────────────┘ └─────────────────┘
          │ 1:N                                              │ 1:N
          ▼                                                  ▼
┌─────────────────┐                              ┌─────────────────────┐
│   SubAccounts   │                              │PartnerIdentifications│
│ (Salesforce-    │                              │ (DUNS, Tax ID,       │
│  specific)      │                              │  Satellite IDs)      │
└─────────────────┘                              └─────────────────────┘
          │ 1:N           │ 1:N
          ▼               ▼
┌─────────────────┐ ┌─────────────────┐
│ SubAccountBanks │ │SubAccountEmails │
└─────────────────┘ └─────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                           ChangeLogs                                          │
│  (Tracks field-level changes for Change requests - linked to request)        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 BusinessPartnerRequests (Main Entity)

This is the central entity that represents a request to create or update a Business Partner. It contains header-level information about the partner and request metadata.

**Header Fields (Request Metadata):**
These fields track the request itself:
- **ID**: UUID primary key
- **requestNumber**: Human-readable reference (REQ-2026-00001)
- **requestType**: Create, Change, or AdhocSync
- **sourceSystem**: Salesforce, Coupa, PI, or Manual
- **status**: Current workflow status (Draft, New, Submitted, Approved, etc.)
- **statusCriticality**: UI coloring for status
- **requester information**: ID, name, email of the submitter

**Partner Header Fields:**
Core information about the Business Partner:
- **partnerName**: Full display name
- **name1, name2**: Structured name components
- **searchTerm**: Short search key
- **entityType**: Customer, Supplier, or Both
- **bpType**: Organization or Person (via code)
- **merchantId**: Merchant ID (Salesforce)
- **businessChannels**: Industry codes
- **partnerRole**: Default Supplier

**Payment Fields:**
Financial configuration for the partner:
- **paymentTerms_code**: When payment is due
- **paymentMethod_code**: How payment is made
- **currency_code**: Default transaction currency
- **reconAccount**: Reconciliation Account

**SAP Reference Fields (For Change Requests):**
Links to existing SAP data:
- **sapBpNumber**: The SAP Business Partner number
- **existingBpNumber**: Used during search/lookup
- **existingBpName**: Display value after lookup
- **changeDescription**: Reason for update

**Compliance Fields:**
Results of compliance checks:
- **aebStatus**: Pass, Warning, or Blocked
- **aebCheckDate**: When AEB check was performed
- **viesStatus**: Valid, Invalid, or Error
- **viesCheckDate**: When VIES check was performed
- **duplicateCheckStatus**: Status of duplicate check

**Integration Status Fields:**
- **integrationSuiteStatus**: Overall integration status
- **sapInitialStatus**: SAP Create/Update status
- **satelliteStatus**: Notification to source system status
- **sapIdUpdateStatus**: Writeback of SAP ID status

### 2.4 Child Entities

**PartnerAddresses:**
Stores all addresses associated with the Business Partner. The addressType field indicates the purpose (Business, Shipping, Remit-To). For Change requests, the `sapAddressId` field contains the SAP Address ID which is critical for updating existing addresses rather than creating duplicates.

**PartnerEmails:**
Email contact information. Each email has a type (General, Invoice, Orders) and an optional default flag. Preserves `sapAddressId` and `sapOrdinalNumber` for updates.

**PartnerBanks:**
Bank account information for payments. Includes IBAN, SWIFT, account holder, and for Change requests, the `sapBankIdentification` for update mapping.

**PartnerVatIds:**
Tax registrations by country. The vatNumber format varies by country (German VAT starts with DE, French with FR, etc.). Includes `isEstablished` flag.

**PartnerIdentifications:**
Business identifications such as DUNS, Tax ID, Trade Register numbers, and importantly, **Satellite System IDs** that link back to the source systems.

**SubAccounts:**
Salesforce-specific entity for managing sub-accounts with revenue stream and billing cycle information. Includes its own child entities `SubAccountBanks` and `SubAccountEmails`.

**ChangeLogs:**
For Change requests, this entity records every field-level change compared to the original SAP data. This enables the Change Log view in the UI.

**DuplicateChecks:**
Stores the results of duplicate detection runs, including match scores and details.

**ApprovalHistory:**
Tracks the workflow history (approvals, rejections) with comments and timestamps.

**RequestAttachments:**
Stores metadata for uploaded documents associated with the request.

---

## 3. Status Management

### 3.1 The Status Lifecycle

Every Business Partner request moves through a defined lifecycle. Understanding this lifecycle is crucial because it determines what actions are available and who can perform them.

**The Journey of a Request:**

When a user creates a request, it starts in "New" (or "Draft"). This is the drafting phase - the user can save, edit, and delete their work.

When the user submits, the request moves to "Submitted" and enters the MDM queue. At this point, the user loses the ability to edit - the request is now in the hands of the governance team.

The MDM Steward reviews the request. They might run compliance checks (moving it to ComplianceCheck or DuplicateReview temporarily) before making a decision. Eventually, they either approve or reject.

If approved, the request enters the integration phase. Three separate integrations (SAP create/update, satellite notification, SAP ID writeback) all need to succeed. When they do, the request reaches its final "Completed" status.

### 3.2 Status Values and Meanings

| Status | Who Acts | What Happens | Next Steps |
|:---|:---|:---|:---|
| **Draft/New** | Satellite User | Drafting the request | Submit or Delete |
| **Submitted** | MDM Steward | Awaiting review | Approve, Reject, or Check |
| **ComplianceCheck** | System | Running AEB/VIES | Automatic return to Submitted |
| **DuplicateReview** | MDM Steward | Duplicates found | Approve or Reject |
| **Approved** | System | Integrations running | Automatic on completion |
| **Rejected** | Satellite User | Request declined | Create new or appeal |
| **Completed** | Nobody | All done | Terminal state |
| **Error** | Support Team | Integration failed | Investigate and fix |

### 3.3 Status Criticality

Each status has a criticality value that determines how it's displayed in the UI:

| Criticality | Color | Meaning | Used For |
|:---|:---|:---|:---|
| 1 | Red | Negative/Problem | Rejected, Error |
| 2 | Yellow/Orange | In Progress/Warning | New, Submitted, ComplianceCheck |
| 3 | Green | Positive/Success | Approved, Completed |

---

## 4. Validation Framework (Dynamic Validation System)

### 4.1 How Validation Works

The validation framework is a dynamic, database-driven system that applies business rules to request data. Rather than hardcoding validation logic, rules are stored as data and can be modified through the Admin Config app.

**The Validation Process:**

When validation is triggered (on save, submit, or API call), the system:
1. Identifies the request's context (source system, entity type, request type, status).
2. Loads applicable validation rules from the `ValidationRules` and `SectionValidationRules` tables.
3. For each rule, checks if the condition is met.
4. Collects all violations.
5. Returns formatted error messages.

**Rule Fallback Logic:**

Rules are applied using a fallback mechanism that finds the most specific matching rule:

```
1. Try: SourceSystem + EntityType + RequestType + Field
2. Try: SourceSystem + EntityType + Field
3. Try: SourceSystem + Field
4. Try: Field only (universal rule)
```

This enables powerful configuration. For example:
- A universal rule says "Partner name is required"
- A Coupa-specific rule adds "Partner name minimum 5 characters for Coupa"

### 4.2 Validation Entities

The framework relies on these core entities:

*   **ValidationRules**: Defines field-level and cross-field rules.
    *   Validation Types: Field, Section, CrossField, Custom.
    *   Rules: Required, MinLength, MaxLength, Regex, Email, VAT, IBAN, Custom.
*   **SectionValidationRules**: Defines minimum/maximum record counts for child sections (e.g., "At least 1 address").
*   **CustomValidators**: Registry of custom JavaScript validation functions for complex logic.
*   **Pattern Entities**: `IBANPatterns`, `VATPatterns`, `PostalCodePatterns` store country-specific regex patterns.

### 4.3 Error Handling

When validation fails:

**UI Context:**
- Invalid fields are highlighted with red borders.
- Error messages appear below each field.
- A summary message box lists all errors.
- Submit is blocked until fixed.

**API Context:**
- HTTP 400 response.
- Structured error object with code, target, message.
- Array of all validation failures.

---

## 5. Notification Service

### 5.1 Purpose

The Notification Service handles all outbound communications from the system. When something important happens (request submitted, approved, rejected), the appropriate parties need to be informed.

### 5.2 Change Notifications

The system specifically tracks changes for Satellite System synchronization via the `ChangeNotifications` entity.

**Scenario:**
1. A Business Partner is updated in SAP.
2. The system identifies which Satellite Systems (Coupa, Salesforce, PI) have a reference to this partner.
3. A `ChangeNotification` record is created for each affected system.
4. System Owners acknowledge these notifications via the Satellite Acknowledgement App.

### 5.3 Notification Channels

**Email**: Standard SMTP-based email to user mailboxes (requester, approver).
**Webhook**: HTTP POST to configured endpoints for system notifications (Integration API).

---

## 6. Code Lists Reference

### 6.1 Overview

Code lists provide the values for dropdown fields throughout the application. They are managed centrally in the Admin Config app.

### 6.2 Key Code Lists

| Code List | Entity | Purpose |
|:---|:---|:---|
| Payment Terms | PaymentTerms | When payment is due |
| Payment Methods | PaymentMethods | How payment is made |
| Address Types | AddressTypes | Purpose of address |
| Request Types | RequestTypes | Create, Change |
| Source Systems | SourceSystems | Salesforce, Coupa, PI |
| Overall Statuses | OverallStatuses | Workflow states |
| Identification Types | IdentificationTypes | ID types (DUNS, Tax ID, Satellite IDs) |
| Currencies | Currencies | ISO currency codes |
| Countries | Countries | ISO country codes |
| Revenue Streams | RevenueStreams | Salesforce specific |
| Billing Cycles | BillingCycles | Salesforce specific |
| Dunning Strategies | DunningStrategies | Salesforce specific |
| Business Channels | BusinessChannels | Industry/Channel codes |

---

## 7. ID Preservation for Change Requests

### 7.1 The Duplicate Problem

When updating a Business Partner in SAP, a critical challenge emerges: how do you tell SAP to update an EXISTING address rather than create a NEW one?

SAP uses internal IDs to identify records within a Business Partner:
- Address ID identifies a specific address
- Bank Identification identifies a specific bank account
- Tax Number ID identifies a specific tax registration

If you send an update without these IDs, SAP creates new records, resulting in duplicates.

### 7.2 ID Preservation Mechanism

The Business Partner Management System solves this through ID preservation:

**When a Change request is initiated:**
1. User searches for existing SAP Business Partner.
2. System imports current data including internal SAP IDs.
3. IDs are stored in hidden fields (`sapAddressId`, `sapBankIdentification`, `sapOrdinalNumber`, etc.).
4. User makes modifications (IDs remain unchanged).
5. Upon approval, IDs are included in the SAP API call.
6. SAP correctly updates existing records.

### 7.3 Preserved IDs by Entity

| Entity | Preserved Field | SAP API Field | Impact If Missing |
|:---|:---|:---|:---|
| Address | sapAddressId | AddressID | Duplicate address created |
| Bank | sapBankIdentification | BankIdentification | Duplicate bank created |
| Email | sapOrdinalNumber | OrdinalNumber | Duplicate email created |
| VAT | sapTaxNumberId | TaxID sequence | Duplicate tax ID created |

---

## 8. Environment Configuration

### 8.1 Key Environment Variables

| Variable | Purpose | Default |
|:---|:---|:---|
| NODE_ENV | Environment type | development |
| AEB_API_URL | AEB endpoint | Test URL |
| VIES_ENABLED | Enable real VIES | false |
| SMTP_HOST | Email server | - |

### 8.2 Feature Flags

Certain features can be enabled/disabled:
- Mock compliance services for development
- Email notifications
- Webhook callbacks
- Debug logging
