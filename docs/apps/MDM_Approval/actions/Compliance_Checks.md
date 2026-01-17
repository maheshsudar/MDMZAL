# Compliance Checks

## 1. AEB Trade Compliance
*   **Trigger**: `performAEBCheck`.
*   **Logic**: Calls external Sanctions Screening API.
*   **Outputs**:
    *   `aebStatus`: Pass, Warning, Blocked.
    *   `aebCheckDetails`: JSON details of hits.

## 2. VIES VAT Validation
*   **Trigger**: `performVIESCheck`.
*   **Logic**: Calls EU VIES SOAP service for all EU VAT IDs.
*   **Outputs**:
    *   `viesStatus`: Valid, Invalid, Error.
