# Adhoc Sync Validation Logic

## 1. Pre-Check
Before creating the request, the UI calls `validateAndFetchSAPBP`.
*   **Input**: `sapBpNumber`.
*   **Logic**: Queries the `ExistingPartners` (or SAP Mock) table.
*   **Output**: Returns BP Name and Type if found; otherwise error.

## 2. Request Creation
The `createAdhocSyncRequest` action:
1.  Generates a new `ADHOC-XXXX` request number.
2.  Sets `RequestType` to `AdhocSync`.
3.  Sets `Status` to `Submitted` (skipping Draft).
4.  Sets `SourceSystem` to match `TargetSystem` (for visibility).
