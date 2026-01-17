# Functional Specification: Coupa Request App

**Version:** 6.0
**Date:** 2026-01-17
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose

The Coupa Request App serves the Procurement organization's need to onboard new suppliers and maintain existing supplier data in SAP S/4HANA. Coupa is a leading cloud-based procurement platform that handles the day-to-day purchase-to-pay process, but it requires accurate supplier master data in the ERP system for financial processing, compliance, and reporting.

This application bridges the gap between procurement operations (in Coupa) and master data management (in SAP). When a buyer identifies a new supplier or needs to update supplier banking information, they use this application to submit a request that flows through MDM governance before being synchronized to SAP.

The importance of accurate supplier data cannot be overstated. Incorrect bank details lead to failed payments. Missing tax registrations cause compliance issues. Duplicate suppliers result in fragmented spend analytics. This application ensures that every supplier entering the SAP system has been validated, verified, and approved by qualified MDM professionals.

### 1.2 Target Audience

**Procurement Specialists** are the primary users of this application. These are professionals who source goods and services, negotiate contracts, and manage supplier relationships. They understand supplier data requirements from a procurement perspective but may not be familiar with SAP master data structures.

**Accounts Payable Teams** may also use this application when they need to update supplier banking information for payment processing. When a supplier sends updated bank details, AP teams initiate change requests through this application.

**Category Managers** occasionally use the app when onboarding strategic suppliers who require special payment terms or compliance considerations.

### 1.3 Key Differentiators from Salesforce

The Coupa Request App differs from the Salesforce Request App in several important ways that reflect the different needs of procurement versus sales:

| Characteristic | Coupa Focus | Salesforce Focus |
|:---|:---|:---|
| Default Entity Type | **Supplier** | Customer |
| Primary Concern | Payment accuracy | Revenue capture |
| Critical Data | Banking, Tax IDs | Email, Sub-Accounts |
| Compliance Priority | VAT verification, Sanctions | Customer screening |
| Validation Emphasis | IBAN, Identifications | Email addresses |

Understanding these differences is crucial because they drive the validation rules and mandatory fields that are enforced by the application.

### 1.4 Cross-References

| Document | Description |
|:---|:---|
| [Common Architecture](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Functional_Spec_Common_Architecture.md) | Shared data model, validation framework, and complete code lists |
| [MDM Approval App](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Functional_Spec_MDM_Approval_App.md) | What happens after you submit a supplier request |
| [Compliance Integration](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Compliance_Integration_Specification.md) | Detailed AEB sanctions screening and VIES VAT validation |

---

## 2. Business Context

### 2.1 The Supplier Onboarding Challenge

Supplier onboarding in a global enterprise is complex. Consider what needs to happen before you can pay a new supplier:

**Legal and Compliance Requirements:**
- The supplier must have valid business registrations (DUNS, Tax ID)
- For European suppliers, VAT numbers must be verified with VIES
- Sanctions screening must confirm the supplier is not on restricted party lists
- Tax information must be correctly captured for withholding and reporting

**Financial Setup Requirements:**
- Bank account details must be captured accurately (IBAN, SWIFT)
- Payment terms must be agreed and configured
- Payment method must be determined (bank transfer, check, etc.)
- Currency must be specified for transactions

**Master Data Quality Requirements:**
- The supplier name must match legal documents
- Addresses must be complete for correspondence and payments
- Duplicate suppliers must be prevented
- Data must be consistent with existing SAP records

Without a structured process, organizations face:
- Payment delays due to incorrect bank details
- Compliance violations from unverified suppliers
- Duplicate spend across multiple supplier records
- Audit findings from incomplete documentation

### 2.2 How This Application Addresses These Challenges

The Coupa Request App provides a structured, validated workflow:

1. **Guided Data Entry**: Forms enforce complete data capture with real-time validation
2. **Mandatory Identifications**: At least one business identification is required (DUNS, Tax ID)
3. **Banking Validation**: IBAN and SWIFT codes are validated for format
4. **Payment Information**: Payment terms and method are mandatory for supplier setup
5. **Duplicate Prevention**: Integration with duplicate detection before approval
6. **Audit Trail**: Complete history of who created, modified, and approved each supplier

---

## 3. User Interface Overview

### 3.1 Accessing the Application

Procurement users access the Coupa Request App through the SAP Fiori Launchpad. The application tile shows the count of requests in "New" status, giving users immediate visibility into their draft requests.

### 3.2 Dashboard (Worklist)

When users open the application, they see a list of all supplier requests they have created or have access to view. The dashboard follows the familiar SAP Fiori List Report pattern.

**Understanding the Dashboard:**

The filter bar at the top allows users to narrow down the list. Most commonly, users filter by status to see either their drafts (New) or track requests they've submitted (Submitted, Approved, etc.).

The table shows essential information at a glance:
- **Request Number**: The unique identifier for reference and communication
- **Partner Name**: The supplier's name for quick identification
- **Request Type**: Whether this is a new supplier (Create) or an update (Change)
- **Status**: Where the request is in the workflow
- **Created Date**: When the request was initiated

The "Create Request" button is prominently displayed in the header area, making it easy to start a new supplier request.

### 3.3 Detail Page

Clicking on a request row opens the detail page where users can view all supplier information and (for draft requests) make modifications.

**Page Layout:**

The detail page uses an Object Page layout with collapsible sections.

**Header Section:**
The header prominently displays the supplier name, request number, and current status.

---

## 3.4 Object Page Sections

### 3.4.1 General Information Section

Core request and partner information:

| Field | Label | Editable | Notes |
|:---|:---|:---|:---|
| requestType | Request Type | Create only | Create or Change |
| entityType | Entity Type | Hidden | **Auto-set to Supplier** |
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

### 3.4.2 Payment Information Section (MANDATORY for Coupa)

**Both Payment Terms and Payment Method are MANDATORY for Coupa.**

| Field | Label | Editable | Notes |
|:---|:---|:---|:---|
| paymentTerms_code | Payment Terms | Yes | **MANDATORY** |
| paymentMethod_code | Payment Method | Yes | **MANDATORY** |
| currency_code | Currency | Yes | Optional |

### 3.4.3 Addresses Section

Table displaying all supplier addresses. At least one address is required.

| Column | Editable | Notes |
|:---|:---|:---|
| Address Type | Yes | Business, Remit-To, Ordering, Shipping |
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

### 3.4.4 Bank Accounts Section (CRITICAL for Coupa)

**Banking information is CRITICAL for supplier payments.**

| Column | Editable | Notes |
|:---|:---|:---|
| Bank Country | Yes | **MANDATORY if bank present** |
| IBAN | Yes | **MANDATORY for SEPA countries** |
| Bank Key | Yes | Non-SEPA countries |
| Account Number | Yes | Non-SEPA countries |
| SWIFT/BIC | Yes | Recommended |
| Account Holder | Yes | Mandatory if bank present |
| Valid From | Yes | Optional |
| Valid To | Yes | Optional |

### 3.4.5 VAT IDs Section

| Column | Editable | Notes |
|:---|:---|:---|
| VAT Type | Yes | From VatTypes list |
| Country | Yes | ISO country code |
| VAT Number | Yes | Country-specific format |

EU VAT numbers are verified against VIES during MDM approval.

### 3.4.6 Identifications Section (MIN 1 REQUIRED)

**At least one identification is MANDATORY for Coupa requests.**

| Column | Editable | Notes |
|:---|:---|:---|
| Type | Yes | DUNS, Tax ID, COUPA, etc. |
| Number | Yes | Mandatory |
| Valid From | Yes | Optional |
| Valid To | Yes | Optional |
| Issuing Authority | Yes | Optional |

**Coupa ID**: The COUPA identification type links the SAP BP back to the Coupa Supplier record.

### 3.4.7 Change Log Section (Change Requests Only)

Visible only for Change requests. Shows field-level differences:

| Column | Description |
|:---|:---|
| Field | Which field was modified |
| Entity | Which entity (Address, Bank, etc.) |
| Old Value | Previous value in SAP |
| New Value | Requested new value |
| Change Type | Modified, Created, Deleted |

---

## 4. Request Workflow

### 4.1 Creating a New Supplier Request

The process of creating a new supplier request follows these steps:

**Step 1: Initiate Request**
The procurement user clicks "Create Request" from the dashboard. A new form opens with:
- Status automatically set to "New"
- Source System automatically set to "Coupa"
- Entity Type defaulted to "Supplier"
- Request Type needs to be selected

**Step 2: Enter Supplier Header Data**
The user enters the supplier's name information:
- **Partner Name**: The full legal name of the supplier
- **Name 1**: Official company name (first 100 characters)
- **Name 2**: Additional name information if needed
- **Search Term**: Short search key (auto-derived if not entered)

**Step 3: Configure Payment Settings**
Because Coupa is a procurement system focused on paying suppliers, payment configuration is mandatory:
- **Payment Terms**: When payment is due (NET30, NET60, etc.)
- **Payment Method**: How payment will be made (Bank Transfer, Check, etc.)
- **Currency**: Transaction currency

**Step 4: Add Addresses**
The user adds at least one address. For each address:
- Select address type (Business, Remit-To, etc.)
- Enter street, city, postal code, country
- Add phone number if needed

**Step 5: Add Bank Accounts**
For suppliers receiving electronic payments, bank details are critical:
- Select bank country
- Enter IBAN (for supported countries)
- Enter SWIFT/BIC code
- Provide account holder name

**Step 6: Add Identifications (MANDATORY)**
At least one identification is required:
- DUNS number (D&B identifier)
- Tax ID
- VAT registration
- Trade register number

**Step 7: Review and Submit**
Before submission, the user reviews all entered data. Clicking "Submit" triggers:
1. Comprehensive validation
2. If errors, red highlighting on invalid fields
3. If valid, status changes to "Submitted"
4. Request enters MDM approval queue

### 4.2 Creating a Change Request

To update an existing SAP supplier:

**Step 1: Select Change Request Type**
When initiating, the user selects "Change" as the request type.

**Step 2: Search for Existing Supplier**
A search dialog appears where the user can find the SAP supplier by:
- Supplier name (partial match)
- SAP BP Number (exact match)
- VAT ID (exact match)

**Step 3: Import Current Data**
Selecting a supplier imports all current data from SAP:
- Header information
- All addresses (with hidden SAP Address IDs)
- All bank accounts (with hidden SAP Bank IDs)
- VAT registrations
- Identifications

This import is critical because it includes the internal SAP IDs that tell the system to UPDATE existing records rather than CREATE duplicates.

**Step 4: Make Modifications**
The user can now:
- Edit existing records (tracked as "Modified")
- Add new records (tracked as "Created")
- Delete records (tracked as "Deleted")

**Step 5: Review Change Log**
A Change Log section appears showing exactly what's different. The user should review this to ensure changes are correct.

**Step 6: Submit**
Same flow as create - validation runs, then status changes to Submitted.

---

## 5. Validation Rules

### 5.1 Create vs Change Request Validation Differences

The validation logic differs between Create and Change requests:

| Validation Aspect | Create Request | Change Request |
|:---|:---|:---|
| **sapBpNumber** | Not required, not editable | Required (from import) |
| **sapAddressId** | Not applicable | **CRITICAL** - must be preserved |
| **sapBankIdentification** | Not applicable | **CRITICAL** - must be preserved |
| **Change Log** | Not generated | Automatically tracked |
| **Import Step** | Not required | Required before editing |

### 5.2 Section-Level Validations

Section validations ensure minimum data is captured at the section level:

| Section | Rule Code | Validation | Create | Change | Error Message |
|:---|:---|:---|:---|:---|:---|
| Addresses | SEC_ADDR_MIN | MinCount = 1 | ✅ | ✅ | At least one address is required |
| Identifications | CP_IDENT_MIN | **MinCount = 1** | ✅ | ✅ | **At least one identification is required** |
| Banks | SEC_BANK_MIN | MinCount = 0 | Optional | Optional | (Recommended but not required) |
| Emails | SEC_EMAIL_MIN | MinCount = 0 | Optional | Optional | (Not required for Coupa) |
| VAT IDs | SEC_VAT_MIN | MinCount = 0 | Optional | Optional | (Not required) |

### 5.3 Field-Level Validations

| Field | Rule Code | Validation Type | Value | Create | Change | Error Message |
|:---|:---|:---|:---|:---|:---|:---|
| partnerName | REQ_PARTNER_NAME | Required | - | ✅ | ✅ | Partner name is required |
| partnerName | VAL_PARTNER_NAME_LEN | MinLength | 3 | ✅ | ✅ | Partner name must be at least 3 characters |
| name1 | REQ_NAME1 | Required | - | ✅ | ✅ | Name 1 is required |
| entityType | CP_ENTITY_DEFAULT | Default | Supplier | ✅ | ✅ | **Defaults to Supplier (auto)** |
| paymentTerms_code | CP_PAY_TERMS | **Required** | - | ✅ | ✅ | **Payment terms are required** |
| paymentMethod_code | CP_PAY_METHOD | **Required** | - | ✅ | ✅ | **Payment method is required** |
| addresses.street | REQ_ADDR_STREET | Required | - | ✅ | ✅ | Street is required |
| addresses.city | REQ_ADDR_CITY | Required | - | ✅ | ✅ | City is required |
| addresses.country_code | REQ_ADDR_COUNTRY | Required | - | ✅ | ✅ | Country is required |
| banks.bankCountry_code | CP_BANK_COUNTRY | Required | (if bank) | ✅ | ✅ | Bank country is required |
| banks.iban | VAL_IBAN_FORMAT | IBAN | - | ✅ | ✅ | Invalid IBAN format |
| banks.iban | CP_IBAN_SEPA | Required | (SEPA countries) | ✅ | ✅ | IBAN required for SEPA countries |
| banks.swiftCode | VAL_SWIFT_FORMAT | Regex | 8-11 chars | ✅ | ✅ | Invalid SWIFT/BIC format |
| identifications.identificationNumber | REQ_IDENT_NUMBER | Required | - | ✅ | ✅ | Identification number is required |

### 5.4 Coupa-Specific Mandatory Requirements

Coupa requests have stricter requirements than some other source systems because of procurement's focus on payment accuracy:

| Requirement | Why It Matters |
|:---|:---|
| Payment Terms must be set | Cannot process invoices without payment terms |
| Payment Method must be set | Determines how supplier gets paid |
| At least one Identification | Business verification for compliance |
| Bank country on bank accounts | Required for payment routing |
| IBAN for SEPA countries | Required for SEPA payment processing |

### 5.5 Banking Validation Details

Bank account validation is particularly important for Coupa:

**IBAN Validation:**
- Format must match ISO 13616 standard
- Country code validated against registered IBAN countries
- Check digits verified mathematically
- Length validated per country rules

**SWIFT Validation:**
- Must be 8 or 11 characters
- First 4: Bank code (letters)
- Characters 5-6: Country code (letters)
- Characters 7-8: Location code (alphanumeric)
- Characters 9-11: Branch code (optional)

**Conditional Rules:**
- SEPA countries require IBAN
- Non-SEPA countries can use local bank codes + account numbers

### 5.6 Validation on Submit

When a user submits a request, validation runs in this order:

**Step 1: Field-Level Validations**
- Check all required fields
- Validate format patterns (IBAN, SWIFT)
- Check length constraints

**Step 2: Section-Level Validations**
- Verify minimum record counts per section
- For Coupa: at least 1 address, **at least 1 identification**

**Step 3: Cross-Field Validations**
- Bank IBAN required for SEPA countries
- Date range validations (validFrom ≤ validTo)

**Step 4: Change-Specific Validations (Change Only)**
- Verify SAP BP Number is present
- Verify imported data exists

**Result:**
- If any fail: error highlighted, status remains "New"
- If all pass: status changes to "Submitted"

### 5.7 Error Messages

When validation fails, clear error messages guide the user:

| Error | Message |
|:---|:---|
| Missing payment terms | "Payment terms are required for suppliers" |
| Missing payment method | "Payment method is required" |
| No identification | "At least one identification is required" |
| Invalid IBAN | "IBAN format is invalid. Please check the number." |
| Invalid SWIFT | "SWIFT/BIC code format is invalid" |

---

## 6. System-to-System API Integration

The Coupa Request App exposes OData V4 endpoints for system-to-system integration. This enables:
- Automated supplier creation from Coupa Supplier Information Management (SIM)
- Integration with middleware platforms
- Bulk supplier onboarding via APIs

### 6.1 Base URL

```
Production: https://{tenant}.{region}.hana.ondemand.com/odata/v4/coupa
Development: http://localhost:4004/odata/v4/coupa
```

### 6.2 Authentication

All API calls require authentication via:
- **OAuth 2.0 Bearer Token** (recommended)
- **Basic Authentication** (development only)
- **SAP BTP Destination** (BTP services)

### 6.3 Key Endpoints

| Endpoint | Method | Description |
|:---|:---|:---|
| `/CoupaRequests` | POST | Create new supplier request |
| `/CoupaRequests({ID})` | PUT | Update draft request |
| `/CoupaRequests({ID})` | DELETE | Delete draft request |
| `/CoupaRequests({ID})/submit` | POST | Submit for approval |
| `/checkDuplicates` | POST | Check for duplicate suppliers |
| `/searchSAPPartners` | POST | Search existing SAP suppliers |
| `/importSAPPartner` | POST | Import SAP supplier for change |

### 6.4 Create Supplier Request Example

```http
POST /odata/v4/coupa/CoupaRequests
Content-Type: application/json
Authorization: Bearer {token}

{
  "requestType": "Create",
  "entityType": "Supplier",
  "partnerName": "Industrial Supplies GmbH",
  "name1": "Industrial Supplies GmbH",
  "paymentTerms_code": "NET60",
  "paymentMethod_code": "BANK_TRANSFER",
  "currency_code": "EUR",
  "addresses": [{
    "addressType_code": "Business",
    "street": "Industriestrasse 42",
    "city": "Berlin",
    "postalCode": "10115",
    "country_code": "DE"
  }],
  "banks": [{
    "bankCountry_code": "DE",
    "iban": "DE89370400440532013000",
    "swiftCode": "COBADEFFXXX",
    "accountHolder": "Industrial Supplies GmbH"
  }],
  "identifications": [{
    "identificationType_code": "05",
    "identificationNumber": "987654321"
  }]
}
```

### 6.5 Duplicate Check Example

```http
POST /odata/v4/coupa/checkDuplicates
Content-Type: application/json

{
  "partnerName": "Industrial Supplies",
  "vatIds": [{ "vatNumber": "DE123456789" }]
}
```

**Response:**
```json
{
  "hasDuplicates": true,
  "matches": [{
    "sapBpNumber": "1000001234",
    "partnerName": "Industrial Supplies GmbH",
    "matchType": "VAT",
    "matchScore": 100
  }]
}
```

### 6.6 Error Handling

| HTTP Code | Meaning | Action |
|:---|:---|:---|
| 400 | Validation failed | Check error details, fix data |
| 401 | Authentication failed | Verify credentials |
| 404 | Request/Supplier not found | Check ID |
| 409 | Status conflict | Request already submitted |

---

## 7. Code Lists

### 7.1 Payment Methods

| Code | Name | Description |
|:---|:---|:---|
| BANK_TRANSFER | Bank Transfer | Standard SEPA/Wire transfer |
| CHECK | Check | Paper check payment |
| WIRE | Wire Transfer | International wire transfer |
| CREDIT_CARD | Credit Card | Credit card payment |

### 7.2 Address Types

| Code | Name | Usage |
|:---|:---|:---|
| Business | Business Address | Main company address |
| Remit-To | Remit-To Address | Where payments should be sent |
| Ordering | Ordering Address | Where purchase orders go |
| Shipping | Shipping Address | Delivery address |

### 7.3 Identification Types (Min 1 Required)

| Code | Name | Description |
|:---|:---|:---|
| 05 | DUNS | Dun & Bradstreet number |
| 02 | Tax ID | Tax identification number |
| 03 | VAT ID | VAT registration number |
| 04 | Trade Register | Trade/Commercial register |
| COUPA | Coupa Supplier # | Coupa system ID |

---

## 8. Coupa vs Salesforce Comparison

| Aspect | Coupa | Salesforce |
|:---|:---|:---|
| Default Entity | Supplier | Customer |
| Payment Terms | Mandatory | Mandatory for customers |
| Payment Method | Mandatory | Not required |
| Identifications | Mandatory (min 1) | Optional |
| Emails | Optional | Mandatory (min 1) |
| Sub-Accounts | Not available | Available |
| Banking | Critical | Optional |
| Primary Use Case | Pay suppliers | Invoice customers |

---

## 9. Field Specifications

This section provides complete field-level details including data types, lengths, SAP mappings, validation rules, and applicability for Create vs Change requests.

### 9.1 Main Request Fields (BusinessPartnerRequests)

| Field | Label | Data Type | Length | UI Control | Mandatory | SAP Mapping | Create | Change | Validation |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| ID | ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | Auto-generated |
| requestNumber | Request Number | String | 20 | Display | Auto | N/A | ✅ | ✅ | Pattern: REQ-YYYY-NNNNN |
| requestType | Request Type | String | 20 | Dropdown | Yes | N/A | ✅ | ✅ | Values: Create, Change |
| entityType | Entity Type | String | 20 | Hidden | Auto | N/A | ✅ | ✅ | **Default: Supplier** (auto) |
| sourceSystem | Source System | String | 20 | Hidden | Auto | N/A | ✅ | ✅ | Fixed: Coupa |
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
| paymentTerms_code | Payment Terms | String | 10 | Dropdown | **Yes** | PaymentTerms | ✅ | ✅ | **MANDATORY for Coupa** |
| paymentMethod_code | Payment Method | String | 20 | Dropdown | **Yes** | PaymentMethod | ✅ | ✅ | **MANDATORY for Coupa** |
| currency_code | Currency | String | 3 | Dropdown | No | Currency | ✅ | ✅ | ISO 4217 code |
| requester | Requester | String | 100 | Display | Auto | N/A | ✅ | ✅ | System-captured |
| requesterEmail | Requester Email | String | 100 | Display | Auto | N/A | ✅ | ✅ | System-captured |
| createdAt | Created At | DateTime | - | Display | Auto | N/A | ✅ | ✅ | System timestamp |
| modifiedAt | Modified At | DateTime | - | Display | Auto | N/A | ✅ | ✅ | System timestamp |

**Coupa-Specific Notes:**
- `entityType` is automatically set to "Supplier" - users do not select this
- `paymentTerms_code` and `paymentMethod_code` are MANDATORY for Coupa
- At least ONE identification is MANDATORY

### 9.2 Address Fields (PartnerAddresses)

| Field | Label | Data Type | Length | UI Control | Mandatory | SAP Mapping | Create | Change | Validation |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| ID | ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | Auto-generated |
| request_ID | Request ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | FK to parent |
| sapAddressId | SAP Address ID | String | 10 | Hidden | No | AddressID | ❌ | ✅ | **Critical for updates** |
| addressType_code | Address Type | String | 20 | Dropdown | Yes | AddressUsage | ✅ | ✅ | Business, Remit-To, etc. |
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

### 9.3 Bank Account Fields (PartnerBanks) - CRITICAL for Coupa

| Field | Label | Data Type | Length | UI Control | Mandatory | SAP Mapping | Create | Change | Validation |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| ID | ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | Auto-generated |
| request_ID | Request ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | FK to parent |
| sapBankIdentification | SAP Bank ID | String | 4 | Hidden | No | BankIdentification | ❌ | ✅ | **Critical for updates** |
| bankCountry_code | Bank Country | String | 2 | Dropdown | **Yes** | BankCountryKey | ✅ | ✅ | **Required for Coupa** |
| bankKey | Bank Key | String | 15 | Input | Cond* | BankNumber | ✅ | ✅ | Non-SEPA countries |
| bankAccount | Account Number | String | 18 | Input | Cond* | BankAccount | ✅ | ✅ | Non-SEPA countries |
| iban | IBAN | String | 34 | Input | **Yes** | IBAN | ✅ | ✅ | **SEPA countries** |
| swiftCode | SWIFT/BIC | String | 11 | Input | Rec | SWIFTCode | ✅ | ✅ | 8 or 11 characters |
| accountHolder | Account Holder | String | 60 | Input | Yes | BankControlKey | ✅ | ✅ | MaxLength: 60 |
| validFrom | Valid From | Date | - | DatePicker | No | ValidityStartDate | ✅ | ✅ | Must be ≤ validTo |
| validTo | Valid To | Date | - | DatePicker | No | ValidityEndDate | ✅ | ✅ | Must be ≥ validFrom |

**Banking is critical for Coupa** - suppliers need accurate bank details for payment processing.

### 9.4 VAT ID Fields (PartnerVatIds)

| Field | Label | Data Type | Length | UI Control | Mandatory | SAP Mapping | Create | Change | Validation |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| ID | ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | Auto-generated |
| request_ID | Request ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | FK to parent |
| sapTaxNumberId | SAP Tax ID | String | 10 | Hidden | No | TaxNumberID | ❌ | ✅ | For updates |
| vatType_code | VAT Type | String | 20 | Dropdown | Yes | VATRegistrationType | ✅ | ✅ | From VatTypes list |
| country_code | Country | String | 2 | Dropdown | Yes | VATRegistrationCountry | ✅ | ✅ | ISO country |
| vatNumber | VAT Number | String | 20 | Input | Yes | VATRegistrationNumber | ✅ | ✅ | Country-specific format |

### 9.5 Identification Fields (PartnerIdentifications) - MIN 1 REQUIRED

| Field | Label | Data Type | Length | UI Control | Mandatory | SAP Mapping | Create | Change | Validation |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| ID | ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | Auto-generated |
| request_ID | Request ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | FK to parent |
| identificationType_code | Type | String | 10 | Dropdown | Yes | BPIdentificationType | ✅ | ✅ | From IdentificationTypes |
| identificationNumber | Number | String | 60 | Input | Yes | BPIdentificationNumber | ✅ | ✅ | MaxLength: 60 |
| validFrom | Valid From | Date | - | DatePicker | No | BPIdnNmbrIssuingDate | ✅ | ✅ | |
| validTo | Valid To | Date | - | DatePicker | No | BPIdnNmbrExpiryDate | ✅ | ✅ | |
| issuingAuthority | Issuing Authority | String | 40 | Input | No | N/A | ✅ | ✅ | MaxLength: 40 |

**Identification Types for Coupa:**
| Code | Name | Description |
|:---|:---|:---|
| 05 | DUNS | D&B Universal Numbering System |
| 02 | Tax ID | Tax Identification Number |
| 03 | VAT ID | VAT Registration |
| 04 | Trade Register | Commercial Register Number |
| COUPA | Coupa Supplier # | Coupa System Reference |

---

## 10. Validation Rules Summary

### 10.1 Coupa-Specific Validations

| Rule Code | Field | Type | Value | Error Message |
|:---|:---|:---|:---|:---|
| CP_PAY_TERMS | paymentTerms_code | Required | - | Payment terms are required |
| CP_PAY_METHOD | paymentMethod_code | Required | - | Payment method is required |
| CP_IDENT_MIN | identifications | MinCount | 1 | At least one identification required |
| CP_BANK_COUNTRY | banks.bankCountry_code | Required | - | Bank country is required |
| CP_IBAN_SEPA | banks.iban | Required | (SEPA countries) | IBAN required for SEPA countries |

### 10.2 Universal Validations

| Rule Code | Field | Type | Value | Error Message |
|:---|:---|:---|:---|:---|
| REQ_PARTNER_NAME | partnerName | Required | - | Partner name is required |
| REQ_NAME1 | name1 | Required | - | Name 1 is required |
| REQ_ADDR_STREET | addresses.street | Required | - | Street is required |
| REQ_ADDR_CITY | addresses.city | Required | - | City is required |
| REQ_ADDR_COUNTRY | addresses.country_code | Required | - | Country is required |
| VAL_IBAN_FORMAT | banks.iban | IBAN | - | Invalid IBAN format |
| VAL_SWIFT_FORMAT | banks.swiftCode | Regex | - | Invalid SWIFT/BIC format |
