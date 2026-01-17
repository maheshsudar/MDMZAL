# Emails

## Purpose
This document specifies the emails section of the Salesforce Request App.

## Fields

| Field | Label | Type | Mandatory | Create | Change | Notes |
|:------|:------|:-----|:----------|:-------|:-------|:------|
| Email Address | Email Address | String | Yes | Editable | Read-Only | Must be valid format |
| Email Type | Email Type | Code List | Yes | Editable | Read-Only | General, Invoice |


## UI Behavior
- **Visibility**: Always visible unless conditional logic applies.
- **Editability**: Generally editable in 'New' status, read-only after submission.

## Related Documentation
- **Entity**: [Related Entity](../../../data-model/entities/README.md)
- **Validation**: [Validation Rules](../validation/field-validations.md)
- **SAP Mapping**: [Field Mappings](../../../field-mappings/README.md)

← Back to [Salesforce Request App](README.md)
