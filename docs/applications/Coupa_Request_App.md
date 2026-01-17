# Coupa Request App

**Version:** 7.1
**Date:** 2026-05-21
**Status:** Live

---

## 1. Overview

The Coupa Request App is used by Procurement Specialists to onboard and update **Suppliers** for the Coupa procurement system.

---

## 2. Technical Implementation

*   **Service**: `CoupaService` (`srv/coupa-service.cds`)
*   **Entity**: `CoupaRequests` (Projection of `BusinessPartnerRequests` where `SourceSystem = 'Coupa'`)

---

## 3. Functionality

### 3.1 Request Creation
*   **Context**: Automatically sets `SourceSystem='Coupa'` and `EntityType='Supplier'`.
*   **Mandatory Fields** (Enforced by Validation Rules):
    *   **Payment**: `PaymentTerms`, `PaymentMethod`.
    *   **Banking**: Bank Account (with IBAN for SEPA).
    *   **Identification**: At least one external ID (e.g., DUNS).

### 3.2 Change Workflow
1.  **Search**: User searches for existing SAP Partner.
2.  **Import**: System retrieves current data (Addresses, Banks).
    *   *Technical Note*: Preserves `sapAddressId` and `sapBankIdentification` to ensure updates (not duplicates) in SAP.
3.  **Modify**: User edits data.
4.  **Track**: `ChangeLogs` entity captures the delta.

### 3.3 Duplicate Check
The `checkForDuplicates` action allows users to pre-screen their request against existing SAP data before submission.
