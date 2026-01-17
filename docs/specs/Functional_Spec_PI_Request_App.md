# Functional Specification: PI Request App

**Version:** 7.0
**Date:** 2026-05-21
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose

The PI (Purchasing Interface) Request App serves the Purchasing department, allowing them to onboard and update suppliers directly from their purchasing workflows. It supports both UI-based interaction and system-to-system integration.

### 1.2 Target Audience

*   **Purchasing Specialists**: Users creating purchase orders who need compliant supplier masters.
*   **System Integrators**: Developers connecting PI workflows to MDM.

---

## 2. Functionality

### 2.1 Request Creation

*   **Default Context**: `SourceSystem` = 'PI', `EntityType` = 'Supplier'.
*   **Mandatory Fields**:
    *   **Header**: Partner Name, Name 1.
    *   **Identifications**: At least one identification (typically 'PI' type or Tax ID).
    *   **Addresses**: At least one address.
    *   **Payment**: Payment Method is marked mandatory in the system configuration (Annotation).

### 2.2 Change Requests

Supports importing existing SAP suppliers to update details. Preserves `sapAddressId` and `sapBankIdentification` to ensure updates are applied to the correct records in SAP.

---

## 3. Data Model & UI

### 3.1 Service Definition

Exposed via `PIService`.
*   **Entity**: `PIRequests` (Draft-enabled).
*   **Children**: `PartnerAddresses`, `PartnerBanks`, `PartnerVatIds`, `PartnerIdentifications`, `PartnerEmails`.

### 3.2 UI Layout

Similar to Coupa, but tailored for PI fields:
*   **Basic Info**: Includes `piInternalNo`.
*   **Identifications**: Validates existence of ID. Note: The current UI implementation defaults the ID type filter to 'PI'.
*   **Payment Info**: Payment Terms, Payment Method (Mandatory), Currency.

---

## 4. API Integration (Inbound)

While the Fiori app uses `PIService`, the PI system can also trigger requests via the `IntegrationAPI`.
*   **Endpoint**: `/integration/partners/create`
*   **Source System Header**: `PI`
*   **Payload**: Standard JSON schema (Partner Name, Addresses, Banks, etc.).

---

## 5. Discrepancies & Notes

*   **Payment Method**: Conceptually optional in legacy specs, but the current implementation enforces it as **Mandatory** via annotations (`Common.FieldControl: #Mandatory`).
*   **Identification Type**: The UI annotation for `PartnerIdentifications` currently filters the Type list to only show 'PI' (`ValueListParameterConstant`). This restricts users from selecting DUNS or Tax IDs in the UI, although the data model supports them.
