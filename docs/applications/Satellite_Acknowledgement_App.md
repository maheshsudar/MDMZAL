# Satellite Acknowledgement App

**Version:** 7.1
**Date:** 2026-05-21
**Status:** Live

---

## 1. Overview

The Satellite Acknowledgement App is a notification inbox for System Owners. It provides visibility into the synchronization status of Business Partners.

---

## 2. Technical Implementation

*   **Service**: `SatelliteAcknowledgementService` (`srv/satellite-acknowledgement-service.cds`)
*   **Entity**: `AllAcknowledgements` (View over `NotificationAcknowledgments`).
*   **Role-Based Views**: `CoupaAcknowledgements`, `SalesforceAcknowledgements`, etc.

---

## 3. Functionality

### 3.1 Notification Lifecycle
1.  **Creation**: Triggered when an MDM Request is Approved and Synced.
2.  **Pending**: System Owner receives alert.
3.  **Review**: Owner checks the `ChangeLog` (for updates) or BP details (for creates).
4.  **Acknowledge**: Owner clicks `acknowledge()`. Status -> **Acknowledged**.

### 3.2 Change Visibility
The app links to the `ChangeLogs` entity, allowing System Owners to see the granular field-level delta (e.g., "Address 1 modified") to ensure their system is correctly aligned.
