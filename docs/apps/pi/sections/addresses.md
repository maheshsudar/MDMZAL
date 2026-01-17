# Addresses

## Purpose
This document specifies the addresses section of the PI Request App.

## Fields

| Field | Label | Type | Mandatory | Create | Change | Notes |
|:------|:------|:-----|:----------|:-------|:-------|:------|
| Street | Street | String | Yes | Editable | Read-Only |  |
| City | City | String | Yes | Editable | Read-Only |  |
| Postal Code | Postal Code | String | Yes | Editable | Read-Only |  |
| Country | Country | Code List | Yes | Editable | Read-Only |  |


## UI Behavior
- **Visibility**: Always visible unless conditional logic applies.
- **Editability**: Generally editable in 'New' status, read-only after submission.

## Related Documentation
- **Entity**: [Related Entity](../../../data-model/entities/README.md)
- **Validation**: [Validation Rules](../validation/field-validations.md)
- **SAP Mapping**: [Field Mappings](../../../field-mappings/README.md)

← Back to [PI Request App](README.md)
