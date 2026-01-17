# MDM Approval App

## Functional Overview
Central governance console.
*   **Compliance**: Runs AEB (Sanctions) and VIES (VAT) checks.
*   **Duplicates**: Checks against SAP and pending requests.
*   **Approval**: Triggers integration to SAP.

## Technical Implementation
*   **Service**: `MDMService` (`srv/mdm-service.cds`)
*   **Entity**: `MDMApprovalRequests`.
*   **Actions**: `approveRequest`, `rejectRequest`, `checkDuplicates`.
