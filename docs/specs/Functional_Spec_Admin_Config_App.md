# Functional Specification: Admin Config App

**Version:** 7.0
**Date:** 2026-05-21
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose

The Admin Config App is the control center for the Business Partner Management System. It empowers administrators to modify the application's behavior without requiring code deployments. This includes managing validation rules, code lists (dropdown values), and system configurations.

### 1.2 Target Audience

*   **System Administrators**: Technical users who manage the system configuration.
*   **Business Process Owners**: Users responsible for business rules (e.g., payment terms, validation criteria).
*   **MDM Stewards**: Users who need to view or audit the active rules.

---

## 2. Validation Management

### 2.1 Dynamic Validation Framework

The application uses a database-driven validation framework managed through the `ValidationRules` and `SectionValidationRules` entities.

**Features:**
*   **Context-Aware Rules**: Rules can be specific to a Source System (Coupa, Salesforce, PI), Entity Type (Supplier, Customer), Request Type (Create, Change), or Status.
*   **Rule Types**:
    *   **Field Level**: Validates individual fields (Required, MinLength, MaxLength, Regex, Email, VAT, IBAN).
    *   **Section Level**: Validates child entity counts (MinCount, MaxCount).
    *   **Custom**: Invokes registered custom JavaScript functions.
*   **Draft Support**: Rules support a draft workflow, allowing administrators to create and test rules before activating them.

### 2.2 Validation Testing

The `AdminService` provides a `testValidation` action. This allows administrators to simulate a request payload against the active (or draft) rules to verify behavior before deployment.

**Statistics**: The app provides validation statistics (`getValidationStatistics`) to monitor rule usage and active counts.

---

## 3. Code List Management

The application manages extensive sets of reference data (Code Lists) used throughout the satellite apps. Changes here are immediately reflected in dropdowns (after cache clearing).

### 3.1 Managed Code Lists

**Business Data:**
*   **Payment Terms**: Terms of payment (e.g., NET30).
*   **Payment Methods**: Methods of payment (e.g., Bank Transfer).
*   **Address Types**: Usage types (Business, Shipping, Remit-To).
*   **Email Types**: Contact purposes.
*   **VAT Types**: Tax registration types.
*   **Identification Types**: External ID types (DUNS, Tax ID, Satellite IDs).
*   **BP Types**: Organization vs. Person.
*   **Contact Types**: Role of contact persons.
*   **Document Types**: Categories for attachments.

**Salesforce Specific:**
*   **Revenue Streams**: Revenue categorization.
*   **Billing Cycles**: Invoicing frequency.
*   **Dunning Strategies**: Collection strategies.

**Configuration:**
*   **Source Systems**: Registered satellite systems.
*   **Request Types**: Create, Change, AdhocSync.
*   **Overall Statuses**: Workflow states and criticality.
*   **Vendor Classifications**: Categorization for suppliers.
*   **Business Channels**: Industry/Channel codes.

### 3.2 System Configuration

The `SystemConfiguration` entity stores global key-value pairs for system behavior (e.g., feature flags, integration URLs).

---

## 4. User Role Management

The `UserRoles` entity allows mapping users to specific roles and system access permissions, controlling what data and actions are available to them.

---

## 5. Workflow Configuration

**Status Transitions**: Defines allowed state changes (`fromStatus` -> `toStatus`) and the required action/role.
**Workflow Steps**: Defines the approval steps and approver roles.

---

## 6. Service Definition

The functionality is exposed via the `AdminService` (OData V4).

**Key Entities:**
*   `AdminMenu`: Navigation structure.
*   `ValidationRules`: Field validation logic.
*   `SectionValidationRules`: Section count logic.
*   `CustomValidators`: Registered script validators.
*   `PaymentTerms`, `AddressTypes`, etc.: Code lists.

**Key Actions:**
*   `testValidation`: Simulate validation.
*   `getApplicableValidationRules`: Retrieve rules for UI logic.
*   `getValidationStatistics`: Dashboard metrics.
*   `updateRulePriorities`: Reorder rule execution.
*   `cloneValidationRules`: Copy rules between contexts.
*   `toggleActive`: Enable/disable rules.

**Cache Management**:
The service automatically clears validation caches upon rule updates.
