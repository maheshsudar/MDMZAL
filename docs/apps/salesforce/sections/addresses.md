# Addresses

## Purpose
This document specifies the addresses section of the Salesforce Request App.

## Fields

| Field | Label | Type | Mandatory | Create | Change | Notes |
|:------|:------|:-----|:----------|:-------|:-------|:------|
| Street | Street | String | Yes | Editable | Read-Only |  |
| City | City | String | Yes | Editable | Read-Only |  |
| Postal Code | Postal Code | String | Yes | Editable | Read-Only | Validated by regex |
| Country | Country | Code List | Yes | Editable | Read-Only | ISO Code |
| Address Type | Address Type | Code List | Yes | Editable | Read-Only | Business, Shipping |


## UI Behavior
- **Visibility**: Always visible unless conditional logic applies.
- **Editability**: Generally editable in 'New' status, read-only after submission.

## Related Documentation
- **Entity**: [Related Entity](../../../data-model/entities/README.md)
- **Validation**: [Validation Rules](../validation/field-validations.md)
- **SAP Mapping**: [Field Mappings](../../../field-mappings/README.md)

← Back to [Salesforce Request App](README.md)
