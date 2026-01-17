# Vat Ids

## Purpose
This document specifies the vat ids section of the Coupa Request App.

## Fields

| Field | Label | Type | Mandatory | Create | Change | Notes |
|:------|:------|:-----|:----------|:-------|:-------|:------|
| VAT Registration No | VAT Registration No | String | Conditional | Editable | Read-Only | Required for EU suppliers |
| Country | Country | Code List | Yes | Editable | Read-Only |  |


## UI Behavior
- **Visibility**: Always visible unless conditional logic applies.
- **Editability**: Generally editable in 'New' status, read-only after submission.

## Related Documentation
- **Entity**: [Related Entity](../../../data-model/entities/README.md)
- **Validation**: [Validation Rules](../validation/field-validations.md)
- **SAP Mapping**: [Field Mappings](../../../field-mappings/README.md)

← Back to [Coupa Request App](README.md)
