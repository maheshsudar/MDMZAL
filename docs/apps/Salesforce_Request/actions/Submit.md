# Submit Action

## 1. Overview
Validates data and moves request to `Submitted` status.

## 2. Validation Logic
*   **Context**: `SourceSystem = 'Salesforce'`.
*   **Checks**:
    *   Email present (at least 1).
    *   Sub-Account completeness.
