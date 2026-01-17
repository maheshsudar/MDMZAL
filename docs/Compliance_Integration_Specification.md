# Compliance Integration Specification

**Version:** 7.0
**Date:** 2026-05-21
**Status:** Draft

---

## 1. Introduction

This document details the integration with external compliance services: **AEB** (Trade Compliance/Sanctions) and **VIES** (EU VAT Validation).

---

## 2. AEB Trade Compliance

### 2.1 Overview
The system integrates with AEB to screen Business Partners against restricted party lists (OFAC, EU, UN, UK).

### 2.2 Integration Point
*   **Trigger**: `performAEBCheck` action in `MDMService`.
*   **Result**: Updates `aebStatus` (Pass, Warning, Blocked) and `aebCheckDetails`.

### 2.3 Configuration
*   **URL**: Configured via `AEB_API_URL` environment variable.
*   **Mocking**: Controlled via `AEB_USE_MOCK` (default: true).

---

## 3. VIES VAT Validation

### 3.1 Overview
Validates VAT identification numbers for EU member states via the VIES SOAP service.

### 3.2 Integration Point
*   **Trigger**: `performVIESCheck` action in `MDMService`.
*   **Result**: Updates `viesStatus` (Valid, Invalid, Error) and `viesCheckDetails`.

### 3.3 Configuration
*   **Enabled**: Controlled via `VIES_ENABLED` environment variable (default: false).

---

## 4. Duplicate Check

### 4.1 Overview
Internal service to detect duplicate partners based on Fuzzy Name Matching and Exact ID Matching (VAT, DUNS).

### 4.2 Integration Point
*   **Trigger**: `checkDuplicates` action in all Request Services and MDM Service.
*   **Result**: Populates `DuplicateChecks` entity.
