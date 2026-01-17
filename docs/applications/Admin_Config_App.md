# Admin Config App

**Version:** 7.1
**Date:** 2026-05-21
**Status:** Live

---

## 1. Overview

The Admin Config App empowers administrators to modify system behavior without code deployment. It manages the **Dynamic Validation Framework** and **Code Lists** (Reference Data).

---

## 2. Technical Implementation

*   **Service**: `AdminService` (`srv/admin-service.cds`)
*   **Entities**: `ValidationRules`, `SectionValidationRules`, `SystemConfiguration`, `UserRoles`.
*   **Access**: Restricted to `SystemOwner` and `MDMApprover`.

---

## 3. Validation Framework

The system uses a database-driven validation engine (`ValidationService`).

### 3.1 Rule Configuration (`ValidationRules`)
*   **Context**: Rules can be scoped by `SourceSystem`, `EntityType`, `RequestType`, and `Status`.
*   **Types**:
    *   **Field**: Regex, Min/Max Length, Required.
    *   **Custom**: Logic defined in registered JS handlers.
*   **Draft Support**: Rules use SAP Fiori Draft patterns, allowing administrators to test rules before activation.

### 3.2 Testing
*   **Action**: `testValidation(payload, context)`
*   **Usage**: Simulates a request payload against *active and draft* rules to verify behavior.

---

## 4. Code Lists

Managed entities that populate dropdowns across all apps:
*   **Payment**: `PaymentTerms`, `PaymentMethods`.
*   **Address**: `AddressTypes`, `Countries`.
*   **Identification**: `IdentificationTypes`.
*   **Salesforce**: `RevenueStreams`, `BillingCycles`, `DunningStrategies`.
*   **System**: `SourceSystems`, `RequestTypes`.

Changes to these lists are cached. The system automatically invalidates the cache upon update.
