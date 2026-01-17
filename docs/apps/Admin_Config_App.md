# Admin Config App

**Version:** 7.2
**Date:** 2026-05-21
**Status:** Live

---

## 1. Functional Goal

The Admin Config App serves as the control center for the Business Partner Management System. It empowers **System Administrators** and **Business Process Owners** to modify the application's behavior—specifically validation logic and reference data—without requiring code deployments or downtime.

---

## 2. User Workflow

### 2.1 Managing Validation Rules
1.  **Navigate**: Open the **Validation Rules** tile.
2.  **Create/Edit**:
    *   Define the **Context**: Which system (Coupa/Salesforce) and Status does this rule apply to?
    *   Define the **Logic**: Select a rule type (e.g., `Required`, `Regex`, `MinLength`) and the target field.
3.  **Test**: Use the **Test Validation** action to simulate a request payload against your draft rule to ensure it behaves as expected.
4.  **Activate**: Set the rule status to **Active**. The system automatically clears the validation cache, making the rule effective immediately across all apps.

### 2.2 Managing Code Lists
1.  **Navigate**: Select a specific code list (e.g., **Payment Terms**, **Address Types**).
2.  **Update**: Add new entries or deactivate obsolete ones.
3.  **Effect**: Changes populate the dropdowns in the Request Apps immediately.

---

## 3. Technical Specifications

### 3.1 Service Definition
*   **Service**: `AdminService` (`srv/admin-service.cds`)
*   **Access Control**: Restricted to `SystemOwner` and `MDMApprover` roles.

### 3.2 Key Entities
*   **`ValidationRules`**: Stores field-level validation logic. Supports Fiori Draft for safe editing.
*   **`SectionValidationRules`**: Stores logic for child entity counts (e.g., "Min 1 Address").
*   **`SystemConfiguration`**: Key-value store for global settings.

### 3.3 Dynamic Validation Engine
The app interacts with the `ValidationService` library.
*   **Action**: `testValidation(payload, context)` invokes the engine with the provided payload and the *current draft* rules, returning a list of would-be errors.
*   **Caching**: The `AdminService` triggers a cache invalidation event whenever a rule is modified.
