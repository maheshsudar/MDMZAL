# Payment Information

## Purpose
This document specifies the payment information section of the Coupa Request App.

## Fields

| Field | Label | Type | Mandatory | Create | Change | Notes |
|:------|:------|:-----|:----------|:-------|:-------|:------|
| Payment Terms | Payment Terms | Code List | Yes | Editable | Read-Only | Critical for AP |
| Payment Method | Payment Method | Code List | Yes | Editable | Read-Only | T (Transfer), C (Check) |


## UI Behavior
- **Visibility**: Always visible unless conditional logic applies.
- **Editability**: Generally editable in 'New' status, read-only after submission.

## Related Documentation
- **Entity**: [Related Entity](../../../data-model/entities/README.md)
- **Validation**: [Validation Rules](../validation/field-validations.md)
- **SAP Mapping**: [Field Mappings](../../../field-mappings/README.md)

← Back to [Coupa Request App](README.md)
