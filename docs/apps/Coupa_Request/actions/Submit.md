# Submit Action

## 1. Overview
Validates data and moves request to `Submitted` status.

## 2. Validation Logic
*   **Context**: `SourceSystem = 'Coupa'`.
*   **Checks**:
    *   Payment Terms present.
    *   Bank Country present (if Bank exists).
    *   IBAN format (if SEPA).
