# Change Logs

## Description
Definition of the change-logs entity. This entity stores core business data.

## Fields
| Name | Type | Description |
|:-----|:-----|:------------|
| ID | UUID | Primary Key |
| createdAt | DateTime | Creation Timestamp |
| createdBy | String | User who created the record |
| request | String/Association | Business Field |
| changeDate | String/Association | Business Field |
| changedBy | String/Association | Business Field |
| sectionName | String/Association | Business Field |
| fieldName | String/Association | Business Field |
| oldValue | String/Association | Business Field |
| newValue | String/Association | Business Field |
| changeType | String/Association | Business Field |

← Back to [Entities](README.md)
