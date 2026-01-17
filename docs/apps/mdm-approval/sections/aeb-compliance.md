# Aeb Compliance

## Purpose
This document specifies the aeb compliance section of the MDM Approval App.

## Fields

| Field | Label | Type | Mandatory | Create | Change | Notes |
|:------|:------|:-----|:----------|:-------|:-------|:------|
| Status | Status | String | No | Editable | Read-Only | Clear, Blocked, Review |
| Risk Score | Risk Score | Number | No | Editable | Read-Only | 0-100 |
| Screening Date | Screening Date | Date | No | Editable | Read-Only |  |


## UI Behavior
- **Visibility**: Always visible unless conditional logic applies.
- **Editability**: Generally editable in 'New' status, read-only after submission.

## Related Documentation
- **Entity**: [Related Entity](../../../data-model/entities/README.md)
- **Validation**: [Validation Rules](../validation/field-validations.md)
- **SAP Mapping**: [Field Mappings](../../../field-mappings/README.md)

← Back to [MDM Approval App](README.md)
