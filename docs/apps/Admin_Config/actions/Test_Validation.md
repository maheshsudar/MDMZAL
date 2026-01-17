# Test Validation Action

## 1. Overview
Allows administrators to test a new or modified rule against a sample JSON payload before activating it.

## 2. Logic
*   **Input**: JSON string representing a Request.
*   **Process**: Runs the `ValidationService` in "Draft Mode", checking against both Active and Draft rules.
*   **Output**: List of validation errors/warnings that would occur.
