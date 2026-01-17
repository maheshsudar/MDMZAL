# Bank Accounts

## Purpose
This document specifies the bank accounts section of the Coupa Request App.

## Fields

| Field | Label | Type | Mandatory | Create | Change | Notes |
|:------|:------|:-----|:----------|:-------|:-------|:------|
| Bank Country | Bank Country | Code List | Yes | Editable | Read-Only |  |
| Bank Key | Bank Key | String | Yes | Editable | Read-Only | Routing number / Sort code |
| Account Number | Account Number | String | Yes | Editable | Read-Only |  |
| IBAN | IBAN | String | Conditional | Editable | Read-Only | Required for SEPA countries |
| Account Holder | Account Holder | String | Yes | Editable | Read-Only |  |


## UI Behavior
- **Visibility**: Always visible unless conditional logic applies.
- **Editability**: Generally editable in 'New' status, read-only after submission.

## Related Documentation
- **Entity**: [Related Entity](../../../data-model/entities/README.md)
- **Validation**: [Validation Rules](../validation/field-validations.md)
- **SAP Mapping**: [Field Mappings](../../../field-mappings/README.md)

← Back to [Coupa Request App](README.md)
