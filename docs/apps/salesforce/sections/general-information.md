# General Information

## Purpose
This document specifies the general information section of the Salesforce Request App.

## Fields

| Field | Label | Type | Mandatory | Create | Change | Notes |
|:------|:------|:-----|:----------|:-------|:-------|:------|
| Partner Name | Partner Name | String | Yes | Editable | Read-Only | Legal name of the customer |
| Search Term | Search Term | String | Yes | Editable | Read-Only | Search key (e.g., ACME) |
| Business Partner Type | Business Partner Type | Code List | Yes | Editable | Read-Only | ORG or PERSON |
| Customer Code | Customer Code | String | No | Editable | Read-Only | Legacy system ID |


## UI Behavior
- **Visibility**: Always visible unless conditional logic applies.
- **Editability**: Generally editable in 'New' status, read-only after submission.

## Related Documentation
- **Entity**: [Related Entity](../../../data-model/entities/README.md)
- **Validation**: [Validation Rules](../validation/field-validations.md)
- **SAP Mapping**: [Field Mappings](../../../field-mappings/README.md)

← Back to [Salesforce Request App](README.md)
