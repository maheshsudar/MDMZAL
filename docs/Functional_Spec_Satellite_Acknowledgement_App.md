# Functional Specification: Satellite Acknowledgement App

**Version:** 7.0
**Date:** 2026-05-21
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose

The Satellite Acknowledgement App closes the loop on data synchronization. When MDM updates a Business Partner, notifications are sent to all affected Satellite Systems. This app allows System Owners to view these notifications and acknowledge that their system has processed the update.

### 1.2 Target Audience

*   **System Owners** (Coupa, Salesforce, PI): Technical leads responsible for data sync.
*   **Integration Support**: Users troubleshooting missing data.

---

## 2. Functionality

### 2.1 Notification Inbox

Users see a list of `NotificationAcknowledgments`.
*   **Context**: The app provides filtered views (`CoupaAcknowledgements`, `SalesforceAcknowledgements`, `PIAcknowledgements`) to allow role-based access, though currently, the `AllAcknowledgements` view is often used for broad visibility.
*   **Status**: Pending, Acknowledged.

### 2.2 Acknowledgement

*   **Action**: `acknowledge(comments)`.
*   **Effect**: Updates status to **Acknowledged**, records the user and timestamp. This signals that the downstream system is now in sync.

### 2.3 Change Visibility

For **Update** notifications, the app displays the **Change Log** associated with the request. This allows the System Owner to see exactly *what* changed (e.g., "Street Name changed from X to Y") to ensure they validate the correct data in their system.

---

## 3. Data Model & UI

### 3.1 Service Definition

Exposed via `SatelliteAcknowledgementService`.
*   **Entity**: `AllAcknowledgements` (and system-specific projections).
*   **Associations**: Links back to `BusinessPartnerRequests` to show full details (Address, Banks, etc.) in read-only mode.

### 3.2 UI Layout

1.  **Notification Details**: Source system, Target system, Dates, Status.
2.  **Request Details**: Read-only view of the Partner data (Basic, Address, Tax, etc.).
3.  **Change Log**: Delta view.

### 3.3 Notes

*   **Change Log Properties**: The UI annotations currently reference properties like `entityType` and `changedAt` for the Change Log line items. This differs slightly from the underlying data model (`sectionName`, `changeDate`), which may require an update in the UI definitions to display correctly.
