# Common Architecture

**Version:** 7.1
**Date:** 2026-05-21
**Status:** Live

---

## 1. Data Model

The system is built on a unified data model (`mdm.db`).

### 1.1 BusinessPartnerRequests
The root entity for all workflows.
*   **Key Fields**: `ID`, `requestNumber`, `status`, `sourceSystem`, `entityType`.
*   **Compliance**: `aebStatus` (Sanctions), `viesStatus` (VAT).
*   **Integration**: `sapInitialStatus`, `satelliteStatus`.

### 1.2 Child Entities
*   **PartnerAddresses**: Physical locations.
*   **PartnerIdentifications**: External IDs (DUNS, Tax).
*   **SubAccounts**: Salesforce-specific hierarchy.
*   **ChangeLogs**: Delta tracking for updates.

---

## 2. Validation Framework

A centralized, metadata-driven engine (`ValidationService`).
*   **Rule Storage**: `ValidationRules` table.
*   **Logic**: Rules are applied dynamically based on Request Context (`Source`, `Type`, `Status`).
*   **Flow**:
    1.  User Submits.
    2.  Framework fetches active rules.
    3.  Evaluates payload.
    4.  Returns Success or Errors.

---

## 3. Integration Architecture

### 3.1 Inbound (Satellite -> MDM)
*   **API**: `IntegrationAPI` (REST).
*   **Logic**: Creates `BusinessPartnerRequests` in `Draft`/`New` status.

### 3.2 Outbound (MDM -> SAP -> Satellite)
*   **Trigger**: MDM Approval.
*   **Flow**:
    1.  MDM pushes payload to **SAP Integration Suite (CPI)**.
    2.  CPI calls SAP S/4HANA (Business Partner API).
    3.  SAP returns BP Number.
    4.  CPI calls back MDM (`updateIntegrationData`) to write BP Number.
    5.  MDM Notification Service alerts Satellite Systems.
