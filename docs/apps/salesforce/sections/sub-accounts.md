# Sub Accounts

## Purpose
This document specifies the sub accounts section of the Salesforce Request App.

## Fields

| Field | Label | Type | Mandatory | Create | Change | Notes |
|:------|:------|:-----|:----------|:-------|:-------|:------|
| Sub Account Name | Sub Account Name | String | Yes | Editable | Read-Only | Name of the sub-account |
| Revenue Stream | Revenue Stream | Code List | Yes | Editable | Read-Only | License, Services |
| Billing Cycle | Billing Cycle | Code List | Yes | Editable | Read-Only | Monthly, Quarterly |


## UI Behavior
- **Visibility**: Always visible unless conditional logic applies.
- **Editability**: Generally editable in 'New' status, read-only after submission.

## Related Documentation
- **Entity**: [Related Entity](../../../data-model/entities/README.md)
- **Validation**: [Validation Rules](../validation/field-validations.md)
- **SAP Mapping**: [Field Mappings](../../../field-mappings/README.md)

← Back to [Salesforce Request App](README.md)
