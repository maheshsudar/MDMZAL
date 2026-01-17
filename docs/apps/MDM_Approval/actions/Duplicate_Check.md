# Duplicate Check

## 1. Overview
Scans SAP Master Data and pending requests for redundancy.

## 2. Match Logic
*   **Exact Match**:
    *   VAT Registration Number.
    *   DUNS Number.
*   **Fuzzy Match**:
    *   Partner Name (similarity threshold > 80%).
    *   City + Country combination.

## 3. Output
Populates the `DuplicateChecks` entity with a list of candidates and match scores.
