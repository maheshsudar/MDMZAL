# Payment Information

## Purpose
This document specifies the payment information section of the Salesforce Request App.

## Fields

| Field | Label | Type | Mandatory | Create | Change | Notes |
|:------|:------|:-----|:----------|:-------|:-------|:------|
| Payment Terms | Payment Terms | Code List | Yes | Editable | Read-Only | Required for Customer (e.g., NET30) |
| Currency | Currency | Code List | Yes | Editable | Read-Only | Default currency |
| Payment Method | Payment Method | Code List | No | Editable | Read-Only | e.g., Wire Transfer |


## UI Behavior
- **Visibility**: Always visible unless conditional logic applies.
- **Editability**: Generally editable in 'New' status, read-only after submission.

## Related Documentation
- **Entity**: [Related Entity](../../../data-model/entities/README.md)
- **Validation**: [Validation Rules](../validation/field-validations.md)
- **SAP Mapping**: [Field Mappings](../../../field-mappings/README.md)

← Back to [Salesforce Request App](README.md)
