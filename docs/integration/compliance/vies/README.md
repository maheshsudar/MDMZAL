# VIES VAT Validation Integration

## Overview
Validates VAT Identification Numbers for EU countries using the VIES SOAP API.

## Workflow
1. **Trigger**: When a VAT ID is added or changed for an EU country.
2. **Pre-check**: Regex validation of format.
3. **API Call**: SOAP request to VIES.
4. **Response**: Valid/Invalid.

## Logic
- **Valid**: Status -> `Valid`.
- **Invalid**: Status -> `Invalid`. User must correct or provide justification.
- **Service Unavailable**: Status -> `NotChecked`. Retry allowed.
