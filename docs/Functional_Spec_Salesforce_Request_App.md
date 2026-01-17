# Functional Specification: Salesforce Request App

**Version:** 6.0
**Date:** 2026-01-17
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose

The Salesforce Request App enables Sales Operations users to initiate Business Partner requests directly from their familiar Salesforce environment. Rather than requiring sales teams to learn a separate SAP interface, this application provides a streamlined experience for onboarding new customers and updating existing customer data.

The app serves as a bridge between the CRM world (where customer relationships are managed) and the ERP world (where financial transactions are processed). When a sales representative closes a deal with a new customer, they need that customer to exist in SAP for invoicing, credit management, and financial reporting. This application makes that process quick and compliant.

### 1.2 Target Audience

**Sales Operations Teams** are the primary users. These are the people responsible for the administrative side of customer management - setting up new accounts, maintaining customer data, and ensuring the CRM is synchronized with backend systems.

**Account Managers** may also use this application when they need to update customer information (address changes, new bank accounts, updated tax registrations) as part of ongoing relationship management.

### 1.3 Key Differentiators

The Salesforce Request App has unique characteristics that distinguish it from the Coupa and PI request applications:

| Feature | Salesforce App | Why It Matters |
|:---|:---|:---|
| Default Entity Type | Customer | Sales teams primarily onboard customers |
| Mandatory Email | At least one email required | Customer communication is essential for sales |
| Sub-Accounts | Full sub-account support | Salesforce often tracks multiple billing relationships |
| Revenue Streams | Salesforce-specific code list | Tracks revenue categorization |
| Billing Cycles | Salesforce-specific code list | Manages invoicing frequency |

### 1.4 Cross-References

| Document | Description |
|:---|:---|
| [Common Architecture](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Functional_Spec_Common_Architecture.md) | Shared data model, validation framework, and complete code lists |
| [MDM Approval App](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Functional_Spec_MDM_Approval_App.md) | What happens after you submit a request |
| [Compliance Integration](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Compliance_Integration_Specification.md) | AEB sanctions screening and VIES VAT validation details |

---

## 2. Business Context

### 2.1 The Customer Onboarding Challenge

When a sales team wins a new customer, several things need to happen before the first invoice can be sent:

1. **The customer must exist in SAP** with proper master data (legal name, addresses, tax IDs)
2. **Credit terms must be established** (payment terms, credit limits)
3. **Bank accounts may be needed** for payment processing
4. **Tax compliance must be verified** (valid VAT registrations)
5. **Duplicate prevention** to avoid creating the same customer twice

Without proper tooling, this process often involves:
- Manual forms sent to a central MDM team
- Email chains with incomplete information
- Delays waiting for approvals
- Inconsistent data quality

### 2.2 How This App Solves These Problems

The Salesforce Request App provides:

- **Structured Data Entry**: Guided forms ensure all required information is captured
- **Validation at Entry**: Errors are caught before submission, not during SAP processing
- **Duplicate Detection**: Warning before creating potential duplicates
- **Workflow Integration**: Automatic routing to MDM for approval
- **Status Visibility**: Sales teams can see where their request is in the process
- **Change Tracking**: For updates, clear visibility of what's changing

---

## 3. User Interface Overview

### 3.1 Accessing the Application

The Salesforce Request App is deployed as a Fiori application on SAP BTP. Users access it through:
- Direct URL bookmark
- SAP Fiori Launchpad tile
- Integration link from Salesforce (if configured)

### 3.2 Dashboard (List Report)

The dashboard is the landing page showing all requests the user has access to. It follows the SAP Fiori List Report pattern for familiarity.

**What Users See:**

When a user opens the dashboard, they see a table of their requests with key information at a glance. The filter bar at the top allows them to quickly find specific requests.

| UI Element | Purpose |
|:---|:---|
| **Title** | "Salesforce Requests" - confirms they're in the right app |
| **Create Button** | Prominent button to start a new request |
| **Filter Bar** | Quick filters for status, date range, partner name |
| **Request Table** | List of requests with key columns |
| **Status Badges** | Color-coded indicators (yellow=pending, green=approved, red=rejected) |

**Table Columns:**

| Column | What It Shows | Why It's Important |
|:---|:---|:---|
| Request Number | REQ-2026-00001 format | Unique reference for communication |
| Partner Name | Customer name | Quick identification |
| Request Type | Create or Change | Different workflows |
| Status | Current status | What action is needed |
| Created At | Submission date | SLA tracking |
| Created By | Requester name | Ownership |

### 3.3 Detail Page

Clicking a request row opens the detail page where users can view all information and (if the request is a draft) make changes.

**Page Structure:**

The detail page uses the SAP Fiori Object Page pattern with collapsible sections:

**Header**: Shows the partner name prominently, with the request number and status badge.

---

## 3.4 Object Page Sections

### 3.4.1 General Information Section

Core request and partner information:

| Field | Label | Editable | Notes |
|:---|:---|:---|:---|
| requestType | Request Type | Create only | Create or Change |
| entityType | Entity Type | Yes | Customer (default), Supplier, Both |
| partnerName | Partner Name | Yes | Mandatory |
| name1 | Name 1 | Yes | Mandatory |
| name2 | Name 2 | Yes | Optional |
| name3 | Name 3 | Yes | Optional |
| name4 | Name 4 | Yes | Optional |
| searchTerm | Search Term | Yes | Auto-derived |
| bpType | BP Type | Create only | ORG or PERSON |

**For Change Requests Only:**
| Field | Label | Editable | Notes |
|:---|:---|:---|:---|
| sapBpNumber | SAP BP Number | Display | From import |
| existingBpNumber | Existing BP # | Input | For search |
| existingBpName | Existing BP Name | Display | Verification |

### 3.4.2 Payment Information Section

| Field | Label | Editable | Notes |
|:---|:---|:---|:---|
| paymentTerms_code | Payment Terms | Yes | Mandatory for Customer |
| paymentMethod_code | Payment Method | Yes | Optional |
| currency_code | Currency | Yes | Optional |

### 3.4.3 Addresses Section

Table displaying all partner addresses. At least one address is required.

| Column | Editable | Notes |
|:---|:---|:---|
| Address Type | Yes | Business, Shipping, etc. |
| Street | Yes | Mandatory |
| House Number | Yes | Optional |
| Postal Code | Yes | Mandatory |
| City | Yes | Mandatory |
| Region | Yes | Country-dependent |
| Country | Yes | Mandatory |
| Phone | Yes | Optional |
| Default | Yes | Checkbox |

**Buttons:**
- **Add Address**: Creates new row
- **Delete**: Removes selected address

### 3.4.4 Emails Section (MANDATORY for Salesforce)

**At least one email is REQUIRED for Salesforce requests.**

| Column | Editable | Notes |
|:---|:---|:---|
| Email Type | Yes | General, Invoice, Orders |
| Email Address | Yes | Mandatory, format validated |
| Default | Yes | Checkbox |

### 3.4.5 Bank Accounts Section

| Column | Editable | Notes |
|:---|:---|:---|
| Bank Country | Yes | Mandatory if bank present |
| IBAN | Yes | SEPA countries |
| SWIFT/BIC | Yes | Recommended |
| Account Holder | Yes | Mandatory if bank present |
| Valid From | Yes | Optional |
| Valid To | Yes | Optional |

### 3.4.6 VAT IDs Section

| Column | Editable | Notes |
|:---|:---|:---|
| VAT Type | Yes | From VatTypes list |
| Country | Yes | ISO country code |
| VAT Number | Yes | Country-specific format |

### 3.4.7 Identifications Section

| Column | Editable | Notes |
|:---|:---|:---|
| Type | Yes | DUNS, Tax ID, SALESFORCE, etc. |
| Number | Yes | Mandatory |
| Valid From | Yes | Optional |
| Valid To | Yes | Optional |
| Issuing Authority | Yes | Optional |

**Salesforce ID**: The SALESFORCE identification type links the SAP BP back to the Salesforce Account.

### 3.4.8 Sub-Accounts Section (Salesforce Only)

**Unique to Salesforce** - manages sub-account relationships:

| Column | Editable | Notes |
|:---|:---|:---|
| Sub Account ID | Yes | Salesforce record ID |
| Sub Account Name | Yes | Display name |
| Revenue Stream | Yes | Mandatory if sub-account |
| Billing Cycle | Yes | Mandatory if sub-account |
| Dunning Strategy | Yes | Mandatory if sub-account |
| Payment Terms | Yes | Sub-account specific |
| Currency | Yes | Sub-account currency |

### 3.4.9 Change Log Section (Change Requests Only)

Visible only for Change requests. Shows field-level differences:

| Column | Description |
|:---|:---|
| Field | Which field was modified |
| Entity | Which entity (Address, Bank, etc.) |
| Old Value | Previous value in SAP |
| New Value | Requested new value |
| Change Type | Modified, Created, Deleted |

---

## 4. Request Lifecycle

### 4.1 Creating a New Request

**Step 1: Click "Create Request"**

The user clicks the Create button on the dashboard. A new request form opens with:
- Status set to "New"
- Source System automatically set to "Salesforce"
- Entity Type defaulted to "Customer" (can be changed)
- Request Type needs to be selected (Create or Change)

**Step 2: Enter Partner Information**

For a **Create** request:
- User enters the new customer's information
- Partner Name, Name 1 are mandatory
- At least one Address is typically needed
- At least one Email is MANDATORY for Salesforce

For a **Change** request:
- User searches for the existing SAP customer
- System imports current data from SAP
- User makes modifications
- System tracks all changes for the Change Log

**Step 3: Add Child Entities**

The user adds addresses, emails, bank accounts as needed. Each section has an "Add" button that opens a dialog or inline form.

**Step 4: Save Draft (Optional)**

At any point, the user can click "Save" to store their progress. The request remains in "New" status and can be edited later.

**Step 5: Submit for Approval**

When the user is ready, they click "Submit". The system:
1. Runs all validation rules
2. If errors exist, highlights them and prevents submission
3. If valid, changes status to "Submitted"
4. Sends notification to MDM team
5. Request becomes read-only in Salesforce app

### 4.2 Status Flow (From Salesforce Perspective)

From the Salesforce user's point of view, the request goes through these stages:

```
New → Submitted → [MDM Review] → Approved OR Rejected → Completed
```

| Status | What User Sees | What User Can Do |
|:---|:---|:---|
| New | Draft request | Edit, Save, Submit, Delete |
| Submitted | "Awaiting MDM Approval" | View only |
| Approved | "Approved - Processing" | View only |
| Rejected | "Rejected" with reason | View reason, create new request |
| Completed | "Completed" with SAP BP # | View SAP BP Number |

---

## 5. Validation Rules

### 5.1 When Validation Happens

Validation occurs at two points:

**On Save** (Soft Validation):
- Field format checks (email format, IBAN format)
- Warnings shown but save allowed

**On Submit** (Hard Validation):
- All mandatory field checks
- Section-level rules (min counts)
- Cross-field validation
- Must pass to submit

### 5.2 Create vs Change Request Validation Differences

The validation logic differs between Create and Change requests:

| Validation Aspect | Create Request | Change Request |
|:---|:---|:---|
| **sapBpNumber** | Not required, not editable | Required (from import) |
| **sapAddressId** | Not applicable | **CRITICAL** - must be preserved |
| **sapBankIdentification** | Not applicable | **CRITICAL** - must be preserved |
| **sapOrdinalNumber** | Not applicable | Must be preserved for emails |
| **Change Log** | Not generated | Automatically tracked |
| **Import Step** | Not required | Required before editing |

### 5.3 Section-Level Validations

Section validations ensure minimum data is captured at the section level:

| Section | Rule Code | Validation | Create | Change | Error Message |
|:---|:---|:---|:---|:---|:---|
| Addresses | SEC_ADDR_MIN | MinCount = 1 | ✅ | ✅ | At least one address is required |
| Emails | SF_EMAIL_MIN | **MinCount = 1** | ✅ | ✅ | **At least one email is required (Salesforce)** |
| Banks | SEC_BANK_MIN | MinCount = 0 | Optional | Optional | (Not required) |
| VAT IDs | SEC_VAT_MIN | MinCount = 0 | Optional | Optional | (Not required) |
| Sub-Accounts | SEC_SUBACCT_MIN | MinCount = 0 | Optional | Optional | (Not required) |

### 5.4 Field-Level Validations

| Field | Rule Code | Validation Type | Value | Create | Change | Error Message |
|:---|:---|:---|:---|:---|:---|:---|
| partnerName | REQ_PARTNER_NAME | Required | - | ✅ | ✅ | Partner name is required |
| partnerName | VAL_PARTNER_NAME_LEN | MinLength | 3 | ✅ | ✅ | Partner name must be at least 3 characters |
| name1 | REQ_NAME1 | Required | - | ✅ | ✅ | Name 1 is required |
| entityType | SF_ENTITY_DEFAULT | Default | Customer | ✅ | ✅ | Defaults to Customer |
| paymentTerms_code | SF_PAY_TERMS | Required | (Customer) | ✅ | ✅ | Payment terms required for customers |
| addresses.street | REQ_ADDR_STREET | Required | - | ✅ | ✅ | Street is required |
| addresses.city | REQ_ADDR_CITY | Required | - | ✅ | ✅ | City is required |
| addresses.country_code | REQ_ADDR_COUNTRY | Required | - | ✅ | ✅ | Country is required |
| emails.emailAddress | VAL_EMAIL_FORMAT | Email | - | ✅ | ✅ | Invalid email format |
| banks.iban | VAL_IBAN_FORMAT | IBAN | - | ✅ | ✅ | Invalid IBAN format |
| subAccounts.revenueStream_code | SF_SUBACCT_REV | Required | (if sub-account) | ✅ | ✅ | Revenue stream required |
| subAccounts.billingCycle_code | SF_SUBACCT_BILL | Required | (if sub-account) | ✅ | ✅ | Billing cycle required |

### 5.5 Validation on Submit

When a user submits a request, validation runs in this order:

**Step 1: Field-Level Validations**
- Check all required fields
- Validate format patterns (email, IBAN, SWIFT)
- Check length constraints

**Step 2: Section-Level Validations**
- Verify minimum record counts per section
- For Salesforce: at least 1 address, **at least 1 email**

**Step 3: Cross-Field Validations**
- Conditional requirements (payment terms for Customers)
- Sub-account field completeness
- Date range validations (validFrom ≤ validTo)

**Step 4: Change-Specific Validations (Change Only)**
- Verify SAP BP Number is present
- Verify imported data exists

**Result:**
- If any fail: error highlighted, status remains "New"
- If all pass: status changes to "Submitted"

### 5.6 Validation Error Handling

When validation fails, the system:

1. **Highlights invalid fields** with red borders
2. **Shows error messages** below each field
3. **Displays summary** message box listing all errors
4. **Prevents submission** until fixed

Example error messages:
- "Partner name is required"
- "At least one email is required (Salesforce)"
- "Invalid email format"
- "IBAN format is invalid"

---

## 6. Change Request Workflow

### 6.1 Initiating a Change Request

To update an existing SAP customer:

1. User creates a new request
2. Selects "Change" as Request Type
3. Clicks "Search SAP Partner" button
4. Searches by name, BP number, or VAT ID
5. Selects the correct customer from results
6. System imports current SAP data

### 6.2 Understanding Imported Data

When SAP data is imported, the system brings over:
- All current addresses (with hidden SAP Address IDs)
- All bank accounts (with hidden SAP Bank IDs)
- Tax registrations
- Identifications

The hidden SAP IDs are critical - they tell SAP which records to UPDATE rather than CREATE new ones.

### 6.3 Making and Tracking Changes

The user can now:
- Modify existing records (changes tracked)
- Add new records (tracked as "Created")
- Delete records (tracked as "Deleted")

The Change Log section shows all differences between the original SAP data and the requested changes.

### 6.4 ID Preservation (Critical Technical Detail)

For Change requests, the system preserves SAP internal IDs to prevent duplicate records:

| Entity | Preserved ID | What Happens If Missing |
|:---|:---|:---|
| Address | sapAddressId | SAP creates duplicate address |
| Bank | sapBankIdentification | SAP creates duplicate bank |
| Email | sapOrdinalNumber | SAP creates duplicate email |

These IDs are hidden from the user but included in the API payload when approved.

---

## 7. Code Lists (Salesforce-Specific)

### 7.1 Revenue Streams

These categorize how revenue is generated from the customer:

| Code | Name | Description |
|:---|:---|:---|
| Influencer | Influencer | Revenue from influencer partnerships |
| FBAY | FBAY | FBAY platform transactions |
| Marketplace | Marketplace | Third-party marketplace sales |
| DirectSales | Direct Sales | Direct sales channel |

### 7.2 Billing Cycles

How frequently the customer is invoiced:

| Code | Name | Common Usage |
|:---|:---|:---|
| Monthly | Monthly | Subscription customers |
| Quarterly | Quarterly | Contract customers |
| Annually | Annually | Enterprise agreements |

### 7.3 Dunning Strategies

How overdue payments are handled:

| Code | Name | Description |
|:---|:---|:---|
| Standard | Standard | Normal dunning process |
| Escalated | Escalated | Aggressive collection |
| None | No Dunning | Special terms - no reminders |

---

## 8. System-to-System API Integration

While the primary interface is the Fiori UI, the Salesforce Request App also exposes OData V4 endpoints for system-to-system integration. This enables:

- Automated request creation from Salesforce workflows
- Integration with Salesforce Flows or Apex triggers
- Middleware integration (MuleSoft, Dell Boomi, etc.)

### 8.1 Base URL

```
Production: https://{tenant}.{region}.hana.ondemand.com/odata/v4/salesforce
Development: http://localhost:4004/odata/v4/salesforce
```

### 8.2 Authentication

All API calls require authentication:
- **OAuth 2.0 Bearer Token** (recommended for production)
- **Basic Authentication** (development only)
- **SAP BTP Destination** (when called from BTP services)

### 8.3 Key Endpoints

| Endpoint | Method | Purpose |
|:---|:---|:---|
| `/SalesforceRequests` | POST | Create new request |
| `/SalesforceRequests({ID})` | PUT | Update draft request |
| `/SalesforceRequests({ID})/submit` | POST | Submit for approval |
| `/checkDuplicates` | POST | Check for duplicate partners |
| `/searchSAPPartners` | POST | Search existing SAP BPs |
| `/importSAPPartner` | POST | Import SAP BP data |

### 8.4 Create Request Example

```http
POST /odata/v4/salesforce/SalesforceRequests
Content-Type: application/json
Authorization: Bearer {token}

{
  "requestType": "Create",
  "entityType": "Customer",
  "partnerName": "Acme Corporation",
  "name1": "Acme Corporation",
  "paymentTerms_code": "NET30",
  "addresses": [{
    "addressType_code": "Business",
    "street": "123 Main Street",
    "city": "New York",
    "country_code": "US"
  }],
  "emails": [{
    "emailType_code": "General",
    "emailAddress": "contact@acme.com"
  }]
}
```

**Response (201 Created):**
```json
{
  "ID": "550e8400-e29b-41d4-a716-446655440000",
  "requestNumber": "REQ-2026-00001",
  "status": "New"
}
```

### 8.5 Duplicate Check Example

```http
POST /odata/v4/salesforce/checkDuplicates
Content-Type: application/json

{
  "partnerName": "Acme Corporation",
  "vatIds": [{ "vatNumber": "DE123456789" }]
}
```

**Response:**
```json
{
  "hasDuplicates": true,
  "matches": [{
    "sapBpNumber": "1000001234",
    "partnerName": "ACME Corp",
    "matchType": "VAT",
    "matchScore": 100
  }]
}
```

---

## 9. Field Specifications

This section provides complete field-level details including data types, lengths, SAP mappings, validation rules, and applicability for Create vs Change requests.

### 9.1 Main Request Fields (BusinessPartnerRequests)

| Field | Label | Data Type | Length | UI Control | Mandatory | SAP Mapping | Create | Change | Validation |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| ID | ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | Auto-generated |
| requestNumber | Request Number | String | 20 | Display | Auto | N/A | ✅ | ✅ | Pattern: REQ-YYYY-NNNNN |
| requestType | Request Type | String | 20 | Dropdown | Yes | N/A | ✅ | ✅ | Values: Create, Change |
| entityType | Entity Type | String | 20 | Dropdown | Yes | N/A | ✅ | ✅ | Values: Customer, Supplier, Both |
| sourceSystem | Source System | String | 20 | Hidden | Auto | N/A | ✅ | ✅ | Fixed: Salesforce |
| status | Status | String | 30 | Display | Auto | N/A | ✅ | ✅ | System-managed |
| partnerName | Partner Name | String | 200 | Input | Yes | BusinessPartnerFullName | ✅ | ✅ | MinLength: 3, MaxLength: 200 |
| name1 | Name 1 | String | 100 | Input | Yes | OrganizationBPName1 | ✅ | ✅ | MaxLength: 100 |
| name2 | Name 2 | String | 100 | Input | No | OrganizationBPName2 | ✅ | ✅ | MaxLength: 100 |
| name3 | Name 3 | String | 100 | Input | No | OrganizationBPName3 | ✅ | ✅ | MaxLength: 100 |
| name4 | Name 4 | String | 100 | Input | No | OrganizationBPName4 | ✅ | ✅ | MaxLength: 100 |
| searchTerm | Search Term | String | 20 | Input | Auto | SearchTerm1 | ✅ | ✅ | Auto-derived from name |
| bpType | BP Type | String | 20 | Dropdown | No | BusinessPartnerGrouping | ✅ | ❌ | Values: ORG, PERSON |
| sapBpNumber | SAP BP Number | String | 10 | Display | No | BusinessPartner | ❌ | ✅ | Read-only for Change |
| existingBpNumber | Existing BP # | String | 10 | Input | No | N/A | ❌ | ✅ | For search/import |
| existingBpName | Existing BP Name | String | 200 | Display | No | N/A | ❌ | ✅ | Display after import |
| paymentTerms_code | Payment Terms | String | 10 | Dropdown | Yes* | PaymentTerms | ✅ | ✅ | From PaymentTerms list |
| paymentMethod_code | Payment Method | String | 20 | Dropdown | No | PaymentMethod | ✅ | ✅ | From PaymentMethods list |
| currency_code | Currency | String | 3 | Dropdown | No | Currency | ✅ | ✅ | ISO 4217 code |
| requester | Requester | String | 100 | Display | Auto | N/A | ✅ | ✅ | System-captured |
| requesterEmail | Requester Email | String | 100 | Display | Auto | N/A | ✅ | ✅ | System-captured |
| createdAt | Created At | DateTime | - | Display | Auto | N/A | ✅ | ✅ | System timestamp |
| modifiedAt | Modified At | DateTime | - | Display | Auto | N/A | ✅ | ✅ | System timestamp |

**Notes:**
- *Payment Terms mandatory for Customer entity type
- `sapBpNumber` populated after SAP sync for Create, pre-filled for Change
- Hidden fields are included in API but not shown in UI

### 9.2 Address Fields (PartnerAddresses)

| Field | Label | Data Type | Length | UI Control | Mandatory | SAP Mapping | Create | Change | Validation |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| ID | ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | Auto-generated |
| request_ID | Request ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | FK to parent |
| sapAddressId | SAP Address ID | String | 10 | Hidden | No | AddressID | ❌ | ✅ | **Critical for updates** |
| addressType_code | Address Type | String | 20 | Dropdown | Yes | AddressUsage | ✅ | ✅ | From AddressTypes list |
| name1 | Address Name | String | 100 | Input | No | AddressName | ✅ | ✅ | Address-level name |
| street | Street | String | 100 | Input | Yes | StreetName | ✅ | ✅ | MaxLength: 100 |
| houseNumber | House Number | String | 10 | Input | No | HouseNumber | ✅ | ✅ | MaxLength: 10 |
| postalCode | Postal Code | String | 10 | Input | Yes | PostalCode | ✅ | ✅ | Country-specific format |
| city | City | String | 50 | Input | Yes | CityName | ✅ | ✅ | MaxLength: 50 |
| region | Region/State | String | 10 | Dropdown | No | Region | ✅ | ✅ | Country-dependent |
| country_code | Country | String | 2 | Dropdown | Yes | Country | ✅ | ✅ | ISO 3166-1 alpha-2 |
| phoneNumber | Phone | String | 30 | Input | No | PhoneNumber | ✅ | ✅ | Format validation |
| faxNumber | Fax | String | 30 | Input | No | FaxNumber | ✅ | ✅ | Format validation |
| isDefault | Default Address | Boolean | - | Checkbox | No | N/A | ✅ | ✅ | Only one per type |

**Critical:** For Change requests, `sapAddressId` MUST be preserved to update existing addresses rather than creating duplicates.

### 9.3 Email Fields (PartnerEmails)

| Field | Label | Data Type | Length | UI Control | Mandatory | SAP Mapping | Create | Change | Validation |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| ID | ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | Auto-generated |
| request_ID | Request ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | FK to parent |
| sapOrdinalNumber | SAP Ordinal | Integer | - | Hidden | No | OrdinalNumber | ❌ | ✅ | For updates |
| emailType_code | Email Type | String | 20 | Dropdown | Yes | N/A | ✅ | ✅ | From EmailTypes list |
| emailAddress | Email Address | String | 241 | Input | Yes | EmailAddress | ✅ | ✅ | Email format validation |
| isDefault | Default Email | Boolean | - | Checkbox | No | N/A | ✅ | ✅ | Only one default |

**Salesforce Requirement:** At least ONE email is MANDATORY for Salesforce requests.

### 9.4 Bank Account Fields (PartnerBanks)

| Field | Label | Data Type | Length | UI Control | Mandatory | SAP Mapping | Create | Change | Validation |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| ID | ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | Auto-generated |
| request_ID | Request ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | FK to parent |
| sapBankIdentification | SAP Bank ID | String | 4 | Hidden | No | BankIdentification | ❌ | ✅ | **Critical for updates** |
| bankCountry_code | Bank Country | String | 2 | Dropdown | Yes | BankCountryKey | ✅ | ✅ | ISO country code |
| bankKey | Bank Key | String | 15 | Input | No* | BankNumber | ✅ | ✅ | Country-specific |
| bankAccount | Account Number | String | 18 | Input | No* | BankAccount | ✅ | ✅ | Country-specific |
| iban | IBAN | String | 34 | Input | Yes** | IBAN | ✅ | ✅ | IBAN format validation |
| swiftCode | SWIFT/BIC | String | 11 | Input | Rec | SWIFTCode | ✅ | ✅ | 8 or 11 characters |
| accountHolder | Account Holder | String | 60 | Input | Yes | BankControlKey | ✅ | ✅ | MaxLength: 60 |
| validFrom | Valid From | Date | - | DatePicker | No | ValidityStartDate | ✅ | ✅ | Must be ≤ validTo |
| validTo | Valid To | Date | - | DatePicker | No | ValidityEndDate | ✅ | ✅ | Must be ≥ validFrom |

**Notes:**
- *Bank Key and Account Number required for non-SEPA countries
- **IBAN required for SEPA countries
- `sapBankIdentification` MUST be preserved for Change requests

### 9.5 VAT ID Fields (PartnerVatIds)

| Field | Label | Data Type | Length | UI Control | Mandatory | SAP Mapping | Create | Change | Validation |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| ID | ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | Auto-generated |
| request_ID | Request ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | FK to parent |
| sapTaxNumberId | SAP Tax ID | String | 10 | Hidden | No | TaxNumberID | ❌ | ✅ | For updates |
| vatType_code | VAT Type | String | 20 | Dropdown | Yes | VATRegistrationType | ✅ | ✅ | From VatTypes list |
| country_code | Country | String | 2 | Dropdown | Yes | VATRegistrationCountry | ✅ | ✅ | ISO country |
| vatNumber | VAT Number | String | 20 | Input | Yes | VATRegistrationNumber | ✅ | ✅ | Country-specific format |

### 9.6 Identification Fields (PartnerIdentifications)

| Field | Label | Data Type | Length | UI Control | Mandatory | SAP Mapping | Create | Change | Validation |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| ID | ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | Auto-generated |
| request_ID | Request ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | FK to parent |
| identificationType_code | Type | String | 10 | Dropdown | Yes | BPIdentificationType | ✅ | ✅ | From IdentificationTypes |
| identificationNumber | Number | String | 60 | Input | Yes | BPIdentificationNumber | ✅ | ✅ | MaxLength: 60 |
| validFrom | Valid From | Date | - | DatePicker | No | BPIdnNmbrIssuingDate | ✅ | ✅ | |
| validTo | Valid To | Date | - | DatePicker | No | BPIdnNmbrExpiryDate | ✅ | ✅ | |
| issuingAuthority | Issuing Authority | String | 40 | Input | No | N/A | ✅ | ✅ | MaxLength: 40 |

**Identification Types for Salesforce:**
| Code | Name | Description |
|:---|:---|:---|
| 05 | DUNS | D&B Universal Numbering System |
| 02 | Tax ID | Tax Identification Number |
| 03 | VAT ID | VAT Registration |
| SALESFORCE | Salesforce ID | Salesforce Account Reference |

### 9.7 Sub-Account Fields (SubAccounts) - Salesforce Only

| Field | Label | Data Type | Length | UI Control | Mandatory | SAP Mapping | Create | Change | Validation |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| ID | ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | Auto-generated |
| request_ID | Request ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | FK to parent |
| subAccountId | External ID | String | 50 | Input | Yes | N/A | ✅ | ✅ | Salesforce record ID |
| subAccountName | Name | String | 100 | Input | No | N/A | ✅ | ✅ | Display name |
| revenueStream_code | Revenue Stream | String | 20 | Dropdown | Yes | N/A | ✅ | ✅ | From RevenueStreams |
| billingCycle_code | Billing Cycle | String | 20 | Dropdown | Yes | N/A | ✅ | ✅ | From BillingCycles |
| dunningStrategy_code | Dunning Strategy | String | 20 | Dropdown | Yes | N/A | ✅ | ✅ | From DunningStrategies |
| paymentTerms_code | Payment Terms | String | 10 | Dropdown | No | N/A | ✅ | ✅ | Sub-account specific |
| currency_code | Currency | String | 3 | Dropdown | No | N/A | ✅ | ✅ | Sub-account currency |

---

## 10. Validation Rules Summary

### 10.1 Salesforce-Specific Validations

| Rule Code | Field | Type | Value | Error Message |
|:---|:---|:---|:---|:---|
| SF_EMAIL_MIN | emails | MinCount | 1 | At least one email is required |
| SF_PAY_TERMS | paymentTerms_code | Required | (for Customer) | Payment terms required for customers |
| SF_SUBACCT_REV | revenueStream_code | Required | (if sub-account) | Revenue stream required |
| SF_SUBACCT_BILL | billingCycle_code | Required | (if sub-account) | Billing cycle required |

### 10.2 Universal Validations

| Rule Code | Field | Type | Value | Error Message |
|:---|:---|:---|:---|:---|
| REQ_PARTNER_NAME | partnerName | Required | - | Partner name is required |
| REQ_NAME1 | name1 | Required | - | Name 1 is required |
| REQ_ADDR_STREET | addresses.street | Required | - | Street is required |
| REQ_ADDR_CITY | addresses.city | Required | - | City is required |
| REQ_ADDR_COUNTRY | addresses.country_code | Required | - | Country is required |
| VAL_EMAIL_FORMAT | emails.emailAddress | Email | - | Invalid email format |
| VAL_IBAN_FORMAT | banks.iban | IBAN | - | Invalid IBAN format |

