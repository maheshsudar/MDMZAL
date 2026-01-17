# Functional Specification: PI Request App

**Version:** 7.0
**Date:** 2026-01-17
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose

The PI (Purchasing Interface) Request App enables procurement users working in the PI purchasing system to initiate Business Partner requests for suppliers. PI is a dedicated procurement application used by purchasing teams to create and manage purchase orders. When a buyer needs to work with a new supplier, or when supplier information needs to be updated, they use this application to submit requests to the MDM governance workflow.

Like Salesforce and Coupa, PI is a **satellite system** that originates Business Partner requests. The key difference is that PI supports both user-driven workflows (through a UI) and system-driven workflows (through APIs) to accommodate different integration patterns within the organization.

### 1.2 What is PI?

PI (Purchasing Interface) is a procurement system used by the organization for:
- Creating and managing purchase orders
- Maintaining supplier relationships
- Tracking procurement transactions
- Managing supplier catalogs

Business users in the Purchasing department use PI as their primary work system. When they identify a need for a new supplier or need to update existing supplier data, they initiate a Business Partner request through this application.

### 1.3 Target Audience

**Purchasing Specialists** are the primary users. These are procurement professionals who create purchase orders in PI and need suppliers set up in SAP for invoicing and payment processing.

**Procurement Administrators** may use the application to bulk-update supplier information or handle supplier onboarding for entire supplier categories.

**Integration Developers** need to understand the API capabilities when building automated integrations between PI and the MDM system.

### 1.4 Key Characteristics

PI shares characteristics with both Salesforce/Coupa (UI-driven) and has API capabilities:

| Characteristic | PI Behavior |
|:---|:---|
| User Interface | **Yes** - Full Fiori UI for procurement users |
| System-to-System API | **Yes** - API for automated integrations |
| Default Entity Type | Supplier |
| Primary Use Case | Supplier onboarding for purchase orders |
| Create/Change Flows | Separate but similar workflows |

### 1.5 Cross-References

| Document | Description |
|:---|:---|
| [Common Architecture](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Functional_Spec_Common_Architecture.md) | Shared data model, validation framework |
| [Coupa Request App](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Functional_Spec_Coupa_Request_App.md) | Similar procurement-focused app |
| [MDM Approval App](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Functional_Spec_MDM_Approval_App.md) | How PI requests are approved |

---

## 2. Business Context

### 2.1 The Procurement Challenge

When a buyer in the PI system needs to place a purchase order with a new supplier, they face a challenge: the supplier doesn't exist in SAP S/4HANA yet. Without a valid SAP Business Partner number, the purchase order cannot be processed through the financial system.

The traditional process might involve:
- Sending emails to MDM teams with supplier details
- Filling out paper or PDF forms
- Waiting without visibility into request status
- Manual data entry with high error rates

### 2.2 How PI Request App Solves This

The PI Request App provides:

**For New Suppliers (Create Flow):**
1. Purchasing user identifies need for new supplier
2. Opens PI Request App and creates new request
3. Enters supplier information with guided forms
4. Submits for MDM approval
5. Receives notification when supplier is ready in SAP
6. Returns to PI to create purchase order

**For Existing Suppliers (Change Flow):**
1. Purchasing user identifies incorrect supplier data
2. Opens PI Request App and creates change request
3. Searches for and imports existing SAP supplier
4. Makes necessary modifications
5. Submits for MDM approval
6. SAP data is updated after approval

---

## 3. User Interface (UI Flow)

### 3.1 Dashboard

The dashboard shows all PI requests the user has created or has access to view.

**Filter Options:**
- Status (New, Submitted, Approved, Rejected, etc.)
- Date Range
- Partner Name
- Request Type (Create/Change)

**Table Columns:**
| Column | Description |
|:---|:---|
| Request Number | REQ-2026-00001 format |
| Partner Name | Supplier name |
| Request Type | Create or Change |
| Status | Current workflow status |
| Created At | Submission date |
| Created By | Requester name |

### 3.2 Create Request Flow (UI)

**Step 1: Initiate Request**
User clicks "Create Request" button. Form opens with:
- Status = "New"
- Source System = "PI" (auto-set)
- Entity Type = "Supplier" (default)
- Request Type = user must select Create or Change

**Step 2: For Create Requests**
User enters all supplier information:
- Partner Name, Name 1, Name 2
- Payment Terms, Currency
- Addresses (at least one)
- Bank Accounts (as needed)
- VAT IDs (as needed)
- Identifications

**Step 3: For Change Requests**
User searches for existing SAP supplier:
- Click "Search SAP Partner"
- Search by name, BP number, or VAT ID
- Select from results
- System imports current SAP data
- User makes modifications
- System tracks all changes

**Step 4: Save Draft**
User can save progress at any time. Request stays in "New" status.

**Step 5: Submit**
When complete, user clicks "Submit":
- System runs validation
- If errors: highlighted on form
- If valid: status changes to "Submitted", enters MDM queue

### 3.3 Button Actions

**Create Request:**
| Property | Value |
|:---|:---|
| Location | Dashboard Header |
| Label | Create Request |
| Type | Emphasized |

**Submit:**
| Property | Value |
|:---|:---|
| Location | Detail Page Footer |
| Visibility | status = "New" |
| Validation | Must pass before submit |

**Save:**
| Property | Value |
|:---|:---|
| Location | Detail Page Footer |
| Visibility | status = "New" |

**Delete:**
| Property | Value |
|:---|:---|
| Location | Detail Page Footer |
| Visibility | status = "New" |
| Confirmation | Required |

**Search SAP Partner:**
| Property | Value |
|:---|:---|
| Location | General Section |
| Visibility | requestType = "Change" |
| Opens | Search dialog |

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

### 3.4.2 Payment Information Section

| Field | Label | Editable | Notes |
|:---|:---|:---|:---|
| paymentTerms_code | Payment Terms | Yes | Recommended |
| paymentMethod_code | Payment Method | Yes | Optional |
| currency_code | Currency | Yes | Optional |

### 3.4.3 Addresses Section (MIN 1 REQUIRED)

Table displaying all supplier addresses. **At least one address is required.**

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

### 3.4.4 Bank Accounts Section

| Column | Editable | Notes |
|:---|:---|:---|
| Bank Country | Yes | Mandatory if bank present |
| IBAN | Yes | SEPA countries |
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

### 3.4.6 Identifications Section (MIN 1 REQUIRED)

**At least one identification is MANDATORY for PI requests.**

| Column | Editable | Notes |
|:---|:---|:---|
| Type | Yes | DUNS, Tax ID, PI, etc. |
| Number | Yes | Mandatory |
| Valid From | Yes | Optional |
| Valid To | Yes | Optional |
| Issuing Authority | Yes | Optional |

**PI ID**: The PI identification type links the SAP BP back to the PI Supplier record.

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

## 4. System-to-System API Integration

### 4.1 API Overview

In addition to the UI, the PI Request App exposes OData V4 endpoints for system-to-system integration. This enables:
- Automated supplier creation from PI workflows
- Batch supplier onboarding
- Integration with procurement automation tools

### 4.2 Base URL

```
Production: https://{tenant}.{region}.hana.ondemand.com/odata/v4/pi
Development: http://localhost:4004/odata/v4/pi
```

### 4.3 Authentication

All API calls require:
- **OAuth 2.0 Bearer Token** (recommended)
- **Basic Authentication** (development only)
- **SAP BTP Destination** (BTP services)

### 4.4 Endpoints Summary

| Endpoint | Method | Description |
|:---|:---|:---|
| `/PIRequests` | POST | Create new request |
| `/PIRequests` | GET | List requests |
| `/PIRequests({ID})` | GET | Get request details |
| `/PIRequests({ID})` | PUT | Update draft request |
| `/PIRequests({ID})` | DELETE | Delete draft request |
| `/PIRequests({ID})/submit` | POST | Submit for approval |
| `/checkDuplicates` | POST | Check for duplicates |
| `/searchSAPPartners` | POST | Search existing SAP BPs |
| `/importSAPPartner` | POST | Import SAP BP for change |

### 4.5 Create Request via API

```http
POST /odata/v4/pi/PIRequests
Content-Type: application/json
Authorization: Bearer {token}

{
  "requestType": "Create",
  "entityType": "Supplier",
  "partnerName": "Industrial Parts Ltd",
  "name1": "Industrial Parts Ltd",
  "paymentTerms_code": "NET30",
  "currency_code": "EUR",
  "addresses": [{
    "addressType_code": "Business",
    "street": "Factory Road 42",
    "city": "Manchester",
    "postalCode": "M1 2AB",
    "country_code": "GB"
  }],
  "identifications": [{
    "identificationType_code": "PI",
    "identificationNumber": "PI-SUPP-12345"
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

**Note:** Unlike UI submission, API creation puts request in "New" status. To submit, call the submit endpoint.

### 4.6 Submit Request via API

```http
POST /odata/v4/pi/PIRequests({ID})/submit
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "status": "Submitted",
  "message": "Request submitted for MDM approval"
}
```

### 4.7 Change Request via API

For updating existing SAP suppliers:

```json
{
  "requestType": "Change",
  "entityType": "Supplier",
  "sapBpNumber": "1000001234",
  "existingBpNumber": "1000001234",
  "partnerName": "Industrial Parts Ltd (Updated)",
  "addresses": [{
    "sapAddressId": "100",
    "street": "New Factory Road 100"
  }]
}
```

**Critical:** Include `sapAddressId`, `sapBankIdentification` to update existing records.

### 4.8 Duplicate Check via API

```http
POST /odata/v4/pi/checkDuplicates
Content-Type: application/json

{
  "partnerName": "Industrial Parts",
  "vatIds": [{ "vatNumber": "GB123456789" }]
}
```

**Response:**
```json
{
  "hasDuplicates": true,
  "matches": [{
    "sapBpNumber": "1000001234",
    "partnerName": "Industrial Parts Ltd",
    "matchType": "Name",
    "matchScore": 92
  }]
}
```

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
| Identifications | SEC_IDENT_MIN | MinCount = 1 | ✅ | ✅ | At least one identification is required |
| Emails | SEC_EMAIL_MIN | MinCount = 0 | Optional | Optional | (Not required for PI) |
| Banks | SEC_BANK_MIN | MinCount = 0 | Optional | Optional | (Not required for PI) |
| VAT IDs | SEC_VAT_MIN | MinCount = 0 | Optional | Optional | (Not required for PI) |

### 5.3 Field-Level Validations

| Field | Rule Code | Validation Type | Value | Create | Change | Error Message |
|:---|:---|:---|:---|:---|:---|:---|
| partnerName | REQ_PARTNER_NAME | Required | - | ✅ | ✅ | Partner name is required |
| partnerName | VAL_PARTNER_NAME_LEN | MinLength | 3 | ✅ | ✅ | Partner name must be at least 3 characters |
| name1 | REQ_NAME1 | Required | - | ✅ | ✅ | Name 1 is required |
| name1 | VAL_NAME1_MAX | MaxLength | 100 | ✅ | ✅ | Name 1 cannot exceed 100 characters |
| addresses.street | REQ_ADDR_STREET | Required | - | ✅ | ✅ | Street is required |
| addresses.city | REQ_ADDR_CITY | Required | - | ✅ | ✅ | City is required |
| addresses.country_code | REQ_ADDR_COUNTRY | Required | - | ✅ | ✅ | Country is required |
| addresses.postalCode | REQ_ADDR_POSTAL | Required | - | ✅ | ✅ | Postal code is required |
| banks.iban | VAL_IBAN_FORMAT | IBAN | - | ✅ | ✅ | Invalid IBAN format |
| banks.swiftCode | VAL_SWIFT_FORMAT | Regex | 8-11 chars | ✅ | ✅ | Invalid SWIFT/BIC format |
| identifications.identificationNumber | REQ_IDENT_NUMBER | Required | - | ✅ | ✅ | Identification number is required |

### 5.4 Validation on Submit

When a user (or API) submits a request, validation runs in this order:

**Step 1: Field-Level Validations**
- Check all required fields
- Validate format patterns (email, IBAN, SWIFT)
- Check length constraints

**Step 2: Section-Level Validations**
- Verify minimum record counts per section
- For PI: at least 1 address, at least 1 identification

**Step 3: Cross-Field Validations**
- Conditional requirements
- Date range validations (validFrom ≤ validTo)

**Step 4: Change-Specific Validations (Change Only)**
- Verify SAP BP Number is present
- Verify imported data exists

**Result:**
- If any fail: error returned, status remains "New"
- If all pass: status changes to "Submitted"

---

## 6. Status Management

### 6.1 Status Flow

PI requests follow the same status flow as other satellite systems:

```
New → Submitted → [MDM Review] → Approved/Rejected → Completed
                                         ↓
                                       Error
```

### 6.2 Status Descriptions

| Status | Meaning | User Actions |
|:---|:---|:---|
| **New** | Draft request | Edit, Save, Submit, Delete |
| **Submitted** | In MDM queue | View only |
| **ComplianceCheck** | AEB/VIES running | View only |
| **DuplicateReview** | Duplicates found | View only |
| **Approved** | MDM approved | View only |
| **Rejected** | MDM rejected | View reason |
| **Completed** | All done | View SAP BP Number |
| **Error** | Processing failed | View error |

---

## 7. Field Specifications

This section provides complete field-level details including data types, lengths, SAP mappings, and applicability for Create vs Change requests.

### 7.1 Main Request Fields (BusinessPartnerRequests)

| Field | Label | Data Type | Length | UI Control | Mandatory | SAP Mapping | Create | Change | Validation |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| ID | ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | Auto-generated |
| requestNumber | Request Number | String | 20 | Display | Auto | N/A | ✅ | ✅ | Pattern: REQ-YYYY-NNNNN |
| requestType | Request Type | String | 20 | Dropdown | Yes | N/A | ✅ | ✅ | Values: Create, Change |
| entityType | Entity Type | String | 20 | Hidden | Auto | N/A | ✅ | ✅ | **Default: Supplier** (auto) |
| sourceSystem | Source System | String | 20 | Hidden | Auto | N/A | ✅ | ✅ | Fixed: PI |
| status | Status | String | 30 | Display | Auto | N/A | ✅ | ✅ | System-managed |
| partnerName | Partner Name | String | 200 | Input | Yes | BusinessPartnerFullName | ✅ | ✅ | MinLength: 3 |
| name1 | Name 1 | String | 100 | Input | Yes | OrganizationBPName1 | ✅ | ✅ | MaxLength: 100 |
| name2 | Name 2 | String | 100 | Input | No | OrganizationBPName2 | ✅ | ✅ | MaxLength: 100 |
| name3 | Name 3 | String | 100 | Input | No | OrganizationBPName3 | ✅ | ✅ | MaxLength: 100 |
| name4 | Name 4 | String | 100 | Input | No | OrganizationBPName4 | ✅ | ✅ | MaxLength: 100 |
| searchTerm | Search Term | String | 20 | Input | Auto | SearchTerm1 | ✅ | ✅ | Auto-derived |
| sapBpNumber | SAP BP Number | String | 10 | Display | No* | BusinessPartner | ❌ | ✅ | *Required for Change |
| existingBpNumber | Existing BP # | String | 10 | Input | No | N/A | ❌ | ✅ | For search/import |
| paymentTerms_code | Payment Terms | String | 10 | Dropdown | Rec | PaymentTerms | ✅ | ✅ | Recommended |
| paymentMethod_code | Payment Method | String | 20 | Dropdown | No | PaymentMethod | ✅ | ✅ | Optional for PI |
| currency_code | Currency | String | 3 | Dropdown | No | Currency | ✅ | ✅ | ISO 4217 code |

**Notes:**
- `entityType` is automatically set to "Supplier" - users do not select this
- For Change requests, `sapBpNumber` is populated from the import step

### 7.2 Address Fields (PartnerAddresses) - MIN 1 REQUIRED

| Field | Label | Data Type | Length | UI Control | Mandatory | SAP Mapping | Create | Change | Validation |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| ID | ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | Auto-generated |
| request_ID | Request ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | FK to parent |
| sapAddressId | SAP Address ID | String | 10 | Hidden | No* | AddressID | ❌ | ✅ | **CRITICAL for updates** |
| addressType_code | Address Type | String | 20 | Dropdown | Yes | AddressUsage | ✅ | ✅ | From AddressTypes |
| name1 | Address Name | String | 100 | Input | No | AddressName | ✅ | ✅ | Optional |
| street | Street | String | 100 | Input | Yes | StreetName | ✅ | ✅ | Required |
| houseNumber | House Number | String | 10 | Input | No | HouseNumber | ✅ | ✅ | Optional |
| postalCode | Postal Code | String | 10 | Input | Yes | PostalCode | ✅ | ✅ | Required |
| city | City | String | 50 | Input | Yes | CityName | ✅ | ✅ | Required |
| region | Region/State | String | 10 | Dropdown | No | Region | ✅ | ✅ | Country-dependent |
| country_code | Country | String | 2 | Dropdown | Yes | Country | ✅ | ✅ | ISO 3166-1 alpha-2 |
| phoneNumber | Phone | String | 30 | Input | No | PhoneNumber | ✅ | ✅ | Format validation |
| faxNumber | Fax | String | 30 | Input | No | FaxNumber | ✅ | ✅ | Format validation |

**CRITICAL:** For Change requests, `sapAddressId` MUST be preserved from the import to update existing addresses.

### 7.3 Bank Account Fields (PartnerBanks)

| Field | Label | Data Type | Length | UI Control | Mandatory | SAP Mapping | Create | Change | Validation |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| ID | ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | Auto-generated |
| request_ID | Request ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | FK to parent |
| sapBankIdentification | SAP Bank ID | String | 4 | Hidden | No* | BankIdentification | ❌ | ✅ | **CRITICAL for updates** |
| bankCountry_code | Bank Country | String | 2 | Dropdown | Yes | BankCountryKey | ✅ | ✅ | Required if bank present |
| iban | IBAN | String | 34 | Input | Yes** | IBAN | ✅ | ✅ | SEPA countries |
| swiftCode | SWIFT/BIC | String | 11 | Input | Rec | SWIFTCode | ✅ | ✅ | 8 or 11 characters |
| accountHolder | Account Holder | String | 60 | Input | Yes | BankControlKey | ✅ | ✅ | MaxLength: 60 |
| validFrom | Valid From | Date | - | DatePicker | No | ValidityStartDate | ✅ | ✅ | ≤ validTo |
| validTo | Valid To | Date | - | DatePicker | No | ValidityEndDate | ✅ | ✅ | ≥ validFrom |

### 7.4 Identification Fields (PartnerIdentifications) - MIN 1 REQUIRED

| Field | Label | Data Type | Length | UI Control | Mandatory | SAP Mapping | Create | Change | Validation |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| ID | ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | Auto-generated |
| request_ID | Request ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | FK to parent |
| identificationType_code | Type | String | 10 | Dropdown | Yes | BPIdentificationType | ✅ | ✅ | From IdentificationTypes |
| identificationNumber | Number | String | 60 | Input | Yes | BPIdentificationNumber | ✅ | ✅ | MaxLength: 60 |
| validFrom | Valid From | Date | - | DatePicker | No | BPIdnNmbrIssuingDate | ✅ | ✅ | Optional |
| validTo | Valid To | Date | - | DatePicker | No | BPIdnNmbrExpiryDate | ✅ | ✅ | Optional |

**Identification Types for PI:**
| Code | Name | Description |
|:---|:---|:---|
| 05 | DUNS | D&B Universal Numbering System |
| 02 | Tax ID | Tax Identification Number |
| 03 | VAT ID | VAT Registration |
| **PI** | **PI Reference** | **PI System ID - RECOMMENDED** |

### 7.5 VAT ID Fields (PartnerVatIds)

| Field | Label | Data Type | Length | UI Control | Mandatory | SAP Mapping | Create | Change | Validation |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| ID | ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | Auto-generated |
| request_ID | Request ID | UUID | 36 | Hidden | Auto | N/A | ✅ | ✅ | FK to parent |
| vatType_code | VAT Type | String | 20 | Dropdown | Yes | VATRegistrationType | ✅ | ✅ | From VatTypes |
| country_code | Country | String | 2 | Dropdown | Yes | VATRegistrationCountry | ✅ | ✅ | ISO country |
| vatNumber | VAT Number | String | 20 | Input | Yes | VATRegistrationNumber | ✅ | ✅ | Country format |

---

## 8. PI vs Coupa Comparison

| Aspect | PI | Coupa |
|:---|:---|:---|
| Primary Function | Purchase Orders | Procurement/Invoicing |
| Payment Method | Recommended | **Mandatory** |
| Bank Details | Recommended | **Critical** |
| API Integration | Full support | Full support |
| User Base | Purchasing Dept | Procurement/AP |

---

## 9. Error Handling

### 9.1 API Error Responses

| HTTP Code | Meaning | Action |
|:---|:---|:---|
| 400 | Validation failed | Check error details |
| 401 | Authentication failed | Verify credentials |
| 403 | No permission | Check authorization |
| 404 | Not found | Verify ID |
| 409 | Conflict | Request already submitted |
| 500 | Server error | Contact support |

### 9.2 Validation Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "code": "REQ_PARTNER_NAME",
        "target": "partnerName",
        "message": "Partner name is required"
      },
      {
        "code": "SEC_ADDR_MIN",
        "target": "addresses",
        "message": "At least one address is required"
      }
    ]
  }
}
```
