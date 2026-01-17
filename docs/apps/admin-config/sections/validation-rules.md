# Validation Rules

## Purpose
This document specifies the validation rules section of the Admin Config App.

## Fields

| Field | Label | Type | Mandatory | Create | Change | Notes |
|:------|:------|:-----|:----------|:-------|:-------|:------|
| Rule ID | Rule ID | String | Yes | Editable | Read-Only |  |
| Entity | Entity | String | Yes | Editable | Read-Only |  |
| Field | Field | String | Yes | Editable | Read-Only |  |
| Rule Type | Rule Type | Code List | Yes | Editable | Read-Only | Required, MinLength, Regex |


## UI Behavior
- **Visibility**: Always visible unless conditional logic applies.
- **Editability**: Generally editable in 'New' status, read-only after submission.

## Related Documentation
- **Entity**: [Related Entity](../../../data-model/entities/README.md)
- **Validation**: [Validation Rules](../validation/field-validations.md)
- **SAP Mapping**: [Field Mappings](../../../field-mappings/README.md)

← Back to [Admin Config App](README.md)
