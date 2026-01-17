# Satellite Acknowledgement App

**Version:** 7.2
**Date:** 2026-05-21
**Status:** Live

---

## 1. Functional Goal

The Satellite Acknowledgement App provides a "delivery confirmation" loop. When MDM updates a Business Partner in SAP, notifications are sent to all affected Satellite Systems. **System Owners** use this app to acknowledge they have received and processed the update.

---

## 2. User Workflow

### 2.1 Acknowledging an Update
1.  **Notification Inbox**: System Owner (e.g., Salesforce Admin) logs in and sees **Pending** notifications.
2.  **Review**:
    *   If it's a **Create** event: They check the new SAP BP Number.
    *   If it's an **Update** event: They open the **Change Log** to see exactly what changed (e.g., "Street Name changed from Main St to Broad St").
3.  **Action**: User clicks **Acknowledge**.
4.  **Result**: Status updates to **Acknowledged**. The audit trail records the user and timestamp.

---

## 3. Technical Specifications

### 3.1 Service Definition
*   **Service**: `SatelliteAcknowledgementService` (`srv/satellite-acknowledgement-service.cds`)
*   **Entity**: `AllAcknowledgements`.
*   **Role-Based Views**: `CoupaAcknowledgements`, `SalesforceAcknowledgements`, etc.

### 3.2 Change Log
The app exposes the `ChangeLogs` entity.
*   **Technical Note**: The UI annotations use properties mapped to the underlying `ChangeLogs` entity to display the `OldValue`, `NewValue`, and `FieldLabel`, providing transparency on the delta.
