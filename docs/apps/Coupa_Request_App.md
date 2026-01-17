# Coupa Request App

**Version:** 7.2
**Date:** 2026-05-21
**Status:** Live

---

## 1. Functional Goal

The Coupa Request App enables **Procurement Specialists** to onboard and update **Suppliers** for the Coupa procurement system. It ensures that all data required for purchasing and payment (tax IDs, banking) is captured and validated before entering SAP.

---

## 2. User Workflow

### 2.1 Scenario: New Supplier Onboarding
1.  **Initiation**: User clicks **Create**. The system automatically sets the context to `SourceSystem: Coupa` and `EntityType: Supplier`.
2.  **Basic Data**: User enters the **Partner Name** and **Name 1**.
3.  **Mandatory Configuration**:
    *   **Payment**: User must select **Payment Terms** and **Payment Method**.
    *   **Identifications**: User must add at least one ID (e.g., DUNS, Tax ID).
4.  **Banking**: If the supplier is in a SEPA country, the user *must* provide an IBAN.
5.  **Submission**: User clicks **Submit**. The system validates the data against the `ValidationRules`. If successful, the request moves to **Submitted** status.

### 2.2 Scenario: Update Existing Supplier
1.  **Search**: User initiates a **Change** request and searches for the SAP Business Partner (by Name, BP Number, or VAT ID).
2.  **Import**: The system loads the current SAP data.
3.  **Modify**: User updates fields (e.g., adds a new Address).
4.  **Submit**: The system tracks the delta in the **Change Log** and submits the request.

---

## 3. Technical Specifications

### 3.1 Service Definition
*   **Service**: `CoupaService` (`srv/coupa-service.cds`)
*   **Entity**: `CoupaRequests`
    *   This is a projection of `db.BusinessPartnerRequests` filtered for `SourceSystem = 'Coupa'`.

### 3.2 Key Logic & Validations
*   **Bank Validation**: The service enforces strict checks on `BankCountry` and `IBAN` format for Coupa requests.
*   **Duplicate Check**: The `checkForDuplicates` action performs a fuzzy search against existing SAP partners and pending requests to prevent redundancy.
*   **ID Preservation**: During the "Update" flow, technical keys (`sapAddressId`, `sapBankIdentification`) are preserved in hidden fields to ensure the update reaches the correct SAP record.
