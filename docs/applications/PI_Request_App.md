# PI Request App

**Version:** 7.1
**Date:** 2026-05-21
**Status:** Live

---

## 1. Overview

The PI (Purchasing Interface) Request App serves the Purchasing department for Supplier onboarding. It supports both UI-based interaction and API-based integration.

---

## 2. Technical Implementation

*   **Service**: `PIService` (`srv/pi-service.cds`)
*   **Entity**: `PIRequests` (Projection of `BusinessPartnerRequests` where `SourceSystem = 'PI'`)

---

## 3. Functionality

### 3.1 Data Requirements
*   **Context**: `SourceSystem='PI'`, `EntityType='Supplier'`.
*   **Mandatory**:
    *   **Identification**: At least one ID. The UI defaults to the `PI` identification type.
    *   **Payment Method**: Enforced as mandatory via UI annotations (`Common.FieldControl: #Mandatory`), distinguishing it from generic supplier requirements.

### 3.2 Integration
In addition to the Fiori UI, the PI system pushes requests to the MDM Hub via the **Integration API** (`/integration/partners/create`).
