# Functional Specification: Coupa Request App

**Version:** 7.0
**Date:** 2026-05-21
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose

The Coupa Request App enables Procurement Specialists to initiate Supplier onboarding and update requests. It ensures that suppliers created for Coupa procurement processes are compliant and exist in SAP S/4HANA.

### 1.2 Target Audience

*   **Procurement Specialists**: Users sourcing goods and managing suppliers.
*   **Accounts Payable**: Users managing supplier banking and payment details.

---

## 2. Functionality

### 2.1 Request Creation (Supplier Onboarding)

Users can create "Create" requests for new suppliers.
*   **Default Context**: `SourceSystem` = 'Coupa', `EntityType` = 'Supplier'.
*   **Mandatory Fields**:
    *   **Header**: Partner Name, Name 1, Payment Terms, Payment Method, Currency.
    *   **Identifications**: At least one identification (e.g., DUNS, Tax ID, Coupa ID).
    *   **Addresses**: At least one address.
    *   **Bank Accounts**: Required for SEPA countries (IBAN).

### 2.2 Change Requests

Users can search for existing SAP partners (by Name, BP Number, VAT ID) and initiate a "Change" request.
*   The system imports current SAP data (Addresses, Banks, etc.) including technical keys (`sapAddressId`, `sapBankIdentification`).
*   Users modify the data, and changes are tracked in the **Change Log**.

### 2.3 Validation

The app enforces Coupa-specific rules via the shared Validation Framework:
*   **Banking**: Strict checks on Bank Country and IBAN formats.
*   **Payment**: Payment Terms and Method are mandatory.
*   **Duplicates**: Users can check for duplicates (`checkDuplicates` action) before submission.

### 2.4 Duplicate Check

The `checkForDuplicates` function scans existing SAP partners and pending requests for matches (Name, VAT ID) to prevent redundant data.

---

## 3. Data Model & UI

### 3.1 Service Definition

Exposed via `CoupaService`.
*   **Entity**: `CoupaRequests` (Draft-enabled).
*   **Children**: `PartnerAddresses`, `PartnerBanks`, `PartnerVatIds`, `PartnerIdentifications`, `PartnerEmails`.
*   **Value Lists**: `PaymentTerms`, `PaymentMethods`, `Countries`, `Currencies`, etc.

### 3.2 UI Layout (Fiori Object Page)

1.  **Basic Information**: Name, Status, SAP BP Number.
2.  **Address**: List of addresses (Business, Remit-To).
3.  **Tax Information**: VAT Registrations.
4.  **Identifications**: External IDs (DUNS, etc.).
5.  **Payment Information**: Terms, Method, Currency (Mandatory).
6.  **Bank Details**: Account information.
7.  **Email Contacts**: Contact details.
8.  **MDM Approval Feedback**: Comments from MDM (read-only).
9.  **Change Log**: (Change requests only) Field-level delta.

---

## 4. Workflow

1.  **New**: User drafts request.
2.  **Submit**: Validation runs. If successful, status -> **Submitted**.
3.  **MDM Review**: Request moves to MDM queue.
4.  **Approved/Rejected**: Final state determined by MDM.
5.  **Integration**: On approval, syncs to SAP and updates status to **Completed** (if successful).

---

## 5. API Integration

The `CoupaService` exposes actions and functions for internal app logic. External system integration (inbound from Coupa) is handled via the separate `IntegrationAPI` (`/integration/partners/*`).
