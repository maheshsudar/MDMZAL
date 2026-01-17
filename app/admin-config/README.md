# Admin Config App

## Functional Overview
Allows administration of system configuration without code changes.
*   **Validation Rules**: Define logic like `Required`, `Regex`, `MinCount`.
*   **Code Lists**: Manage dropdown values (Payment Terms, etc.).

## Technical Implementation
*   **Service**: `AdminService` (`srv/admin-service.cds`)
*   **Entity**: `ValidationRules`, `SectionValidationRules`, `SystemConfiguration`.
*   **Key Logic**: The app supports a Draft workflow for rules, allowing testing (`testValidation` action) before activation.
