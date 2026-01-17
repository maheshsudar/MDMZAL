# Notification Details

## Purpose
This document specifies the notification details section of the Satellite Acknowledgement App.

## Fields

| Field | Label | Type | Mandatory | Create | Change | Notes |
|:------|:------|:-----|:----------|:-------|:-------|:------|
| Notification ID | Notification ID | String | Yes | Editable | Read-Only |  |
| Target System | Target System | String | Yes | Editable | Read-Only |  |
| Status | Status | String | Yes | Editable | Read-Only | Pending, Acknowledged, Error |


## UI Behavior
- **Visibility**: Always visible unless conditional logic applies.
- **Editability**: Generally editable in 'New' status, read-only after submission.

## Related Documentation
- **Entity**: [Related Entity](../../../data-model/entities/README.md)
- **Validation**: [Validation Rules](../validation/field-validations.md)
- **SAP Mapping**: [Field Mappings](../../../field-mappings/README.md)

← Back to [Satellite Acknowledgement App](README.md)
