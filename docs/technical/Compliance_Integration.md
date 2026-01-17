# Compliance Integration

**Version:** 7.1
**Date:** 2026-05-21
**Status:** Live

---

## 1. AEB Trade Compliance

**Purpose**: Sanctions Screening (Denied Party List).
*   **Trigger**: `performAEBCheck` (MDM App).
*   **Result**: Updates `aebStatus` (Pass, Warning, Blocked).
*   **Logic**: Blocked status prevents Approval.

## 2. VIES VAT Validation

**Purpose**: Validate EU VAT Numbers.
*   **Trigger**: `performVIESCheck` (MDM App).
*   **Result**: Updates `viesStatus` (Valid, Invalid, Error).

## 3. Duplicate Check

**Purpose**: Prevent redundant master data.
*   **Trigger**: `checkDuplicates`.
*   **Logic**:
    1.  **Exact Match**: VAT ID, DUNS.
    2.  **Fuzzy Match**: Partner Name + City/Country.
*   **Result**: Populates `DuplicateChecks` entity.
