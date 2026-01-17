# MDM Approval App

**Version:** 7.2
**Date:** 2026-05-21
**Status:** Live

---

## 1. Functional Goal

The MDM Approval App is the central governance console. **MDM Stewards** use it to review, enrich, and approve requests from all satellite systems (Coupa, Salesforce, PI). It ensures data quality through duplicate checks and regulatory compliance through Sanctions and VAT screening.

---

## 2. User Workflow

### 2.1 Reviewing a Request
1.  **Inbox**: Steward opens the app and selects a request in **Submitted** status.
2.  **Compliance Checks**:
    *   **AEB**: Steward clicks **AEB Sanctions Check**. If the status returns "Blocked", approval is disabled.
    *   **VIES**: Steward clicks **VIES VAT Check** to validate EU tax IDs.
    *   **Duplicates**: Steward clicks **Duplicate Check**. If matches are found, they review the score and details.
3.  **Decision**:
    *   **Approve**: If data is clean, Steward clicks **Approve**. This locks the request and triggers integration to SAP.
    *   **Reject**: If issues exist, Steward clicks **Reject** and provides a mandatory reason.

### 2.2 Adhoc Sync Request
Used to force-synchronize an existing SAP Partner to a satellite system (e.g., if a record was deleted in Coupa but exists in SAP).
1.  **Action**: Steward triggers `createAdhocSyncRequest`.
2.  **Input**: Provides the `sapBpNumber` and the target `sourceSystem`.
3.  **Result**: Creates a request in `Submitted` status, ready for immediate approval and outbound integration.

---

## 3. Technical Specifications

### 3.1 Service Definition
*   **Service**: `MDMService` (`srv/mdm-service.cds`)
*   **Entity**: `MDMApprovalRequests`. All fields are read-only except `approverComments`.

### 3.2 Integration Logic
*   **Outbound**: Approval triggers a CPI flow. The `MDMService` tracks granular status: `sapInitialStatus` (SAP Creation), `satelliteStatus` (Notification), `sapIdUpdateStatus` (Writeback).
*   **External Services**:
    *   `performAEBCheck`: Calls AEB API.
    *   `performVIESCheck`: Calls EU VIES SOAP service.
