# Functional Specification: Common Architecture and Shared Services

**Version:** 6.0
**Date:** 2026-01-17
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
- Validation framework
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
| [Salesforce Request App](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Functional_Spec_Salesforce_Request_App.md) | Uses shared data model, validation |
| [Coupa Request App](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Functional_Spec_Coupa_Request_App.md) | Uses shared data model, validation |
| [MDM Approval App](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Functional_Spec_MDM_Approval_App.md) | Uses status management, compliance services |
| [Compliance Integration](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Compliance_Integration_Specification.md) | Detailed AEB/VIES specifications |

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
- **requestType**: Create or Change
- **sourceSystem**: Salesforce, Coupa, or PI
- **status**: Current workflow status
- **requester information**: ID, name, email of the submitter

**Partner Header Fields:**
Core information about the Business Partner:
- **partnerName**: Full display name
- **name1, name2**: Structured name components
- **searchTerm**: Short search key
- **entityType**: Customer, Supplier, or Both
- **bpType**: Organization or Person

**Payment Fields:**
Financial configuration for the partner:
- **paymentTerms_code**: When payment is due
- **paymentMethod_code**: How payment is made
- **currency_code**: Default transaction currency

**SAP Reference Fields (For Change Requests):**
Links to existing SAP data:
- **sapBpNumber**: The SAP Business Partner number
- **existingBpNumber**: Used during search/lookup
- **existingBpName**: Display value after lookup

**Compliance Fields:**
Results of compliance checks:
- **aebStatus**: Pass, Warning, or Blocked
- **aebCheckDate**: When AEB check was performed
- **viesStatus**: Valid, Invalid, or Error
- **viesCheckDate**: When VIES check was performed

### 2.4 Child Entities

**PartnerAddresses:**
Stores all addresses associated with the Business Partner. The addressType field indicates the purpose (Business, Shipping, Remit-To). For Change requests, the sapAddressId field contains the SAP Address ID which is critical for updating existing addresses rather than creating duplicates.

**PartnerEmails:**
Email contact information. Each email has a type (General, Invoice, Orders) and an optional default flag.

**PartnerBanks:**
Bank account information for payments. Includes IBAN, SWIFT, account holder, and for Change requests, the sapBankIdentification for update mapping.

**PartnerVatIds:**
Tax registrations by country. The vatNumber format varies by country (German VAT starts with DE, French with FR, etc.).

**PartnerIdentifications:**
Business identifications such as DUNS, Tax ID, Trade Register numbers, and importantly, **Satellite System IDs** that link back to the source systems.

**SubAccounts:**
Salesforce-specific entity for managing sub-accounts with revenue stream and billing cycle information.

**ChangeLogs:**
For Change requests, this entity records every field-level change compared to the original SAP data. This enables the Change Log view in the UI.

---

## 3. Status Management

### 3.1 The Status Lifecycle

Every Business Partner request moves through a defined lifecycle. Understanding this lifecycle is crucial because it determines what actions are available and who can perform them.

**The Journey of a Request:**

When a user creates a request, it starts in "New" status. This is the drafting phase - the user can save, edit, and delete their work. If they decide to abandon it, the request stays in New and eventually can be deleted.

When the user submits, the request moves to "Submitted" and enters the MDM queue. At this point, the user loses the ability to edit - the request is now in the hands of the governance team.

The MDM Steward reviews the request. They might run compliance checks (moving it to ComplianceCheck or DuplicateReview temporarily) before making a decision. Eventually, they either approve or reject.

If approved, the request enters the integration phase. Three separate integrations (SAP create/update, satellite notification, SAP ID writeback) all need to succeed. When they do, the request reaches its final "Completed" status.

### 3.2 Status Values and Meanings

| Status | Who Acts | What Happens | Next Steps |
|:---|:---|:---|:---|
| **New** | Satellite User | Drafting the request | Submit or Delete |
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

### 3.4 Field Editability by Status

The status determines what can be edited:

| Status | User Editing | MDM Editing | Integrations |
|:---|:---|:---|:---|
| New | ✅ Full access | ❌ Not visible | ❌ Not running |
| Submitted | ❌ Read-only | ✅ Can enrich | ❌ Not running |
| Approved | ❌ Read-only | ❌ Read-only | ✅ Running |
| Completed | ❌ Read-only | ❌ Read-only | ✅ Complete |

---

## 4. Validation Framework

### 4.1 How Validation Works

The validation framework is a dynamic, database-driven system that applies business rules to request data. Rather than hardcoding validation logic, rules are stored as data and can be modified through the Admin Config app.

**The Validation Process:**

When validation is triggered (on save, submit, or API call), the system:
1. Identifies the request's context (source system, entity type, request type)
2. Loads applicable validation rules from the database
3. For each rule, checks if the condition is met
4. Collects all violations
5. Returns formatted error messages

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
- The Coupa rule overrides the universal rule for Coupa requests

### 4.2 Validation Types

The framework supports various validation types:

**Required:** Field must have a value
**MinLength:** String must be at least N characters
**MaxLength:** String must be at most N characters
**Regex:** Value must match a regular expression pattern
**Email:** Must be a valid email format
**VAT:** Must be a valid country-specific VAT format
**IBAN:** Must be a valid IBAN with check digit
**MinCount:** Child entity must have at least N records
**Custom:** Calls a custom JavaScript function for complex logic

### 4.3 Error Handling

When validation fails:

**UI Context:**
- Invalid fields are highlighted with red borders
- Error messages appear below each field
- A summary message box lists all errors
- Submit is blocked until fixed

**API Context:**
- HTTP 400 response
- Structured error object with code, target, message
- Array of all validation failures
- Calling system can parse and display appropriately

---

## 5. Notification Service

### 5.1 Purpose

The Notification Service handles all outbound communications from the system. When something important happens (request submitted, approved, rejected), the appropriate parties need to be informed.

**Types of Notifications:**

| Type | Trigger | Recipients | Content |
|:---|:---|:---|:---|
| **Submit Confirmation** | User submits | Requester | "Your request was submitted" |
| **MDM Alert** | Request arrives | MDM team | "New request to review" |
| **Approval Notice** | MDM approves | Requester | "Your request was approved" |
| **Rejection Notice** | MDM rejects | Requester | "Your request was rejected" + reason |
| **Satellite Sync** | SAP completed | System owners | BP data for their system |

### 5.2 Notification Channels

The service supports multiple channels:

**Email:** Standard SMTP-based email to user mailboxes
**Webhook:** HTTP POST to configured endpoints for system notifications
**In-App:** Notifications displayed in the Fiori Launchpad (future)

### 5.3 Asynchronous Processing

Notifications are processed asynchronously to avoid blocking the main workflow:

```
User Action → Queue Notification → Return Immediately
                   │
                   ▼
           Background Process → Send Email/Webhook
                   │
                   ▼
           Retry on Failure (exponential backoff)
```

---

## 6. Code Lists Reference

### 6.1 Overview

Code lists provide the values for dropdown fields throughout the application. They are managed centrally in the Admin Config app.

### 6.2 Identification Types

One of the most important code lists is Identification Types, which includes **Satellite System IDs**:

| Code | Name | Category | Purpose |
|:---|:---|:---|:---|
| 01 | Passport | Personal | Individual identification |
| 02 | Tax ID | Tax | Tax identification number |
| 03 | VAT ID | Tax | VAT registration |
| 04 | Trade Register | Business | Commercial register |
| 05 | DUNS | Business | D&B identifier |
| 06 | LEI | Business | Legal Entity Identifier |
| **SALESFORCE** | Salesforce Account | **Satellite** | Salesforce system ID |
| **COUPA** | Coupa Supplier | **Satellite** | Coupa system ID |
| **PI** | PI Reference | **Satellite** | PI system ID |

**Satellite System IDs are critical** because they link the Business Partner back to the source system. When a Salesforce request is approved, the Salesforce Account ID is stored as an identification. This enables:
- Traceability (which Salesforce record is this BP?)
- Duplicate detection (does this Salesforce ID already exist?)
- Callback routing (which system to notify?)

### 6.3 Other Key Code Lists

| Code List | Purpose | Examples |
|:---|:---|:---|
| Payment Terms | When payment is due | NET30, NET60, IMMEDIATE |
| Payment Methods | How payment is made | BANK_TRANSFER, CHECK |
| Address Types | Purpose of address | Business, Shipping, Remit-To |
| Request Types | Nature of request | Create, Change |
| Source Systems | Origin of request | Salesforce, Coupa, PI |
| Overall Statuses | Workflow states | New, Submitted, Approved |

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
1. User searches for existing SAP Business Partner
2. System imports current data including internal SAP IDs
3. IDs are stored in hidden fields (sapAddressId, sapBankIdentification, etc.)
4. User makes modifications (IDs remain unchanged)
5. Upon approval, IDs are included in the SAP API call
6. SAP correctly updates existing records

### 7.3 Preserved IDs by Entity

| Entity | Preserved Field | SAP API Field | Impact If Missing |
|:---|:---|:---|:---|
| Address | sapAddressId | AddressID | Duplicate address created |
| Bank | sapBankIdentification | BankIdentification | Duplicate bank created |
| Email | sapOrdinalNumber | OrdinalNumber | Duplicate email created |
| VAT | sapTaxNumberId | TaxID sequence | Duplicate tax ID created |

### 7.4 User Visibility

These SAP IDs are hidden from users in the UI because:
- They are technical identifiers with no business meaning
- Users might accidentally modify them
- They add complexity without adding value for the user

However, they are included in the API payloads and can be seen in technical logs.

---

## 8. Environment Configuration

### 8.1 Key Environment Variables

| Variable | Purpose | Default |
|:---|:---|:---|
| NODE_ENV | Environment type | development |
| AEB_USE_MOCK | Use mock AEB service | true |
| AEB_API_URL | AEB endpoint | Test URL |
| VIES_ENABLED | Enable real VIES | false |
| SMTP_HOST | Email server | - |

### 8.2 Feature Flags

Certain features can be enabled/disabled:
- Mock compliance services for development
- Email notifications
- Webhook callbacks
- Debug logging
