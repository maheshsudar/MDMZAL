# PI Request App

**Version:** 7.2
**Date:** 2026-05-21
**Status:** Live

---

## 1. Functional Goal

The PI (Purchasing Interface) Request App serves the **Purchasing Department**. It allows buyers to onboard Suppliers directly from their purchasing workflow. It supports both a UI for manual entry and an API for automated creation from the PI system.

---

## 2. User Workflow

### 2.1 Supplier Onboarding (Manual)
1.  **Initiation**: User creates a request. Context is set to `SourceSystem: PI`.
2.  **Requirements**:
    *   **Identification**: User must provide at least one ID. The UI defaults to the `PI` internal ID type.
    *   **Payment Method**: Unlike general suppliers, PI requires a Payment Method for all requests.
3.  **Submission**: Validates and submits to MDM.

### 2.2 Automated Integration
The PI system can push requests automatically via API.
*   **Endpoint**: `/integration/partners/create`
*   **Payload**: Standard JSON with `SourceSystem: PI`.
*   **Result**: Request is created in `Draft`/`New` status for review or auto-submitted based on configuration.

---

## 3. Technical Specifications

### 3.1 Service Definition
*   **Service**: `PIService` (`srv/pi-service.cds`)
*   **Entity**: `PIRequests`.

### 3.2 Specific Logic
*   **Annotations**: The UI enforces `PaymentMethod` as mandatory via `Common.FieldControl`.
*   **ID Filtering**: The `PartnerIdentifications` list is filtered to show the 'PI' type by default to streamline the user experience.
