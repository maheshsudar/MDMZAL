# Approval History

## Purpose
This document specifies the approval history section of the MDM Approval App.

## Fields

| Field | Label | Type | Mandatory | Create | Change | Notes |
|:------|:------|:-----|:----------|:-------|:-------|:------|
| Action | Action | String | No | Editable | Read-Only | Approve, Reject |
| User | User | String | No | Editable | Read-Only |  |
| Comment | Comment | String | No | Editable | Read-Only |  |


## UI Behavior
- **Visibility**: Always visible unless conditional logic applies.
- **Editability**: Generally editable in 'New' status, read-only after submission.

## Related Documentation
- **Entity**: [Related Entity](../../../data-model/entities/README.md)
- **Validation**: [Validation Rules](../validation/field-validations.md)
- **SAP Mapping**: [Field Mappings](../../../field-mappings/README.md)

← Back to [MDM Approval App](README.md)
