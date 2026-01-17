# Adhoc Sync Request

**Feature**: Manual synchronization of an existing SAP Partner to a satellite system.

## 1. Functional Overview
The Adhoc Sync feature allows MDM Stewards to force-push an existing SAP Business Partner to a specific Satellite System (Coupa, Salesforce, PI). This bypasses the standard "Create" request flow.

## 2. Process Flow
1.  **Initiation**: User clicks **Adhoc Sync** action.
2.  **Input**:
    *   **SAP BP Number**: The ID of the existing partner.
    *   **Target System**: Where to send the data.
    *   **Reason**: Mandatory justification.
3.  **Execution**:
    *   System validates the BP exists in SAP.
    *   Creates a request in **Submitted** status.
    *   Steward **Approves** the request.
    *   Integration Suite pushes data to the target.

## 3. Technical Implementation
*   **Action**: `createAdhocSyncRequest`.
*   **Service**: `MDMService`.
*   **Validation**: `validateAndFetchSAPBP` ensures the BP exists before request creation.
