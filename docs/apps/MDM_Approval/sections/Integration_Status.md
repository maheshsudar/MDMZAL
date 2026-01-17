# Integration Status Section

## 1. Overview
Tracks the granular progress of the outbound synchronization.

## 2. Fields
*   **SAP Initial Status**: Creation in S/4HANA (Pending/Success/Error).
*   **Satellite Status**: Notification to source system (Pending/Success/Error).
*   **SAP ID Update Status**: Writeback of ID to MDM (Pending/Success/Error).

## 3. Completion Logic
The main Request Status moves to **Completed** only when ALL three sub-statuses are **Success**.
