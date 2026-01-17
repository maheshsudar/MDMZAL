# Approve & Reject Actions

## 1. Approve
*   **Trigger**: `approveRequest` action.
*   **Pre-Condition**:
    *   Status must be `Submitted` or `ComplianceCheck`.
    *   AEB Status must **NOT** be `Blocked`.
*   **Effect**:
    *   Status -> `Approved`.
    *   Triggers Integration Suite flow.

## 2. Reject
*   **Trigger**: `rejectRequest` action.
*   **Input**: Mandatory `reason` text.
*   **Effect**:
    *   Status -> `Rejected`.
    *   Sends email notification to Requester.
