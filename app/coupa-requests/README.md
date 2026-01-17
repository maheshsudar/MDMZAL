# Coupa Request App

## Functional Overview
Used by Procurement to onboard Suppliers.
*   **Mandatory**: Identifications, Payment Terms, Payment Method.
*   **Bank Accounts**: Critical for payment processing.

## Technical Implementation
*   **Service**: `CoupaService` (`srv/coupa-service.cds`)
*   **Entity**: `CoupaRequests` (Projection of `BusinessPartnerRequests`).
*   **Validations**: Enforces `SourceSystem = 'Coupa'` rules.
