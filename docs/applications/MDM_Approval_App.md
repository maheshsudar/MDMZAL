# MDM Approval App

**Version:** 7.1
**Date:** 2026-05-21
**Status:** Live

---

## 1. Overview

The MDM Approval App is the central governance console for the Business Partner Management System. It enables MDM Stewards to review, validate, and approve/reject requests from all satellite systems (Coupa, Salesforce, PI).

### 1.1 Key Features
*   **Unified Inbox**: Single view for all pending requests.
*   **Compliance Integration**: Built-in actions for AEB (Sanctions) and VIES (VAT) checks.
*   **Duplicate Detection**: Fuzzy matching against SAP master data.
*   **Adhoc Sync**: Ability to force-push existing SAP partners to satellite systems.

---

## 2. Technical Implementation

*   **Service**: `MDMService` (`srv/mdm-service.cds`)
*   **Entity**: `MDMApprovalRequests` (Projection of `db.BusinessPartnerRequests`)
*   **Access Control**: restricted to `MDMApprover` and `SystemOwner` roles.

### 2.1 Service Actions
*   `approveRequest`: Sets status to **Approved**, triggers CPI integration.
*   `rejectRequest(reason)`: Sets status to **Rejected**, notifies requester.
*   `checkDuplicates`: Runs fuzzy matching logic.
*   `performAEBCheck`: Calls external AEB service.
*   `performVIESCheck`: Calls external EU VIES service.
*   `createAdhocSyncRequest`: Initiates a manual synchronization request.

---

## 3. UI Functionality

The application uses a Fiori Object Page layout with comprehensive facets to display all aspects of the Business Partner.

### 3.1 Facets
1.  **Basic Info**: Request metadata, SAP BP Number, Source System.
2.  **Addresses**: All physical addresses.
3.  **Tax Info**: VAT Registrations and status.
4.  **Identifications**: External System IDs (DUNS, Salesforce ID, etc.).
5.  **Payment Info**: Payment Terms, Methods, Currency.
6.  **Sub Accounts**: (Salesforce specific) Revenue streams and billing cycles.
7.  **Compliance**:
    *   **AEB**: Status (Pass/Warning/Blocked) and details.
    *   **VIES**: Status (Valid/Invalid) and details.
8.  **Duplicate Check**: Match scores and potential conflicts.
9.  **Integration Status**: Granular tracking of SAP creation, Satellite update, and ID writeback.

---

## 4. Adhoc Sync Request

The **Adhoc Sync** feature allows MDM Stewards to manually trigger the synchronization of an *existing* SAP Business Partner to a specific Satellite System. This is useful for fixing data alignment issues where a partner exists in SAP but is missing from a satellite system.

### 4.1 Process Flow

1.  **Initiation**:
    *   User invokes the `createAdhocSyncRequest` action (typically via a dialog).
2.  **Inputs**:
    *   **SAP BP Number** (`sapBpNumber`): The ID of the existing partner in SAP.
    *   **Target System** (`targetSystem`): The system to receive the data (Coupa, Salesforce, PI).
    *   **Reason** (`adhocReason`): Mandatory justification.
3.  **Validation**:
    *   The system verifies the inputs are present.
    *   (UI Logic) typically calls `validateAndFetchSAPBP` first to ensure the BP exists and retrieve its name.
4.  **Creation**:
    *   A new `BusinessPartnerRequest` is created with:
        *   `requestType` = **'AdhocSync'**
        *   `status` = **'Submitted'** (Skips Draft/New state)
        *   `sourceSystem` = **targetSystem** (Ensures visibility in the target system's workflow if needed)
5.  **Execution**:
    *   The request appears in the **Submitted** queue.
    *   The Steward **Approves** the request.
    *   The Integration Logic detects `AdhocSync` type and sends a specific payload to CPI (containing just the BP Number and Target System).
    *   CPI fetches the full master data from SAP and pushes it to the Target System.

### 4.2 API Action Definition

```cds
action createAdhocSyncRequest(
  sapBpNumber: String,
  existingBpName: String,
  targetSystem: String,
  adhocReason: String
) returns MDMApprovalRequests;
```
