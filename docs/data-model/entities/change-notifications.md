# Change Notifications

## Description
Definition of the change-notifications entity. This entity stores core business data.

## Fields
| Name | Type | Description |
|:-----|:-----|:------------|
| ID | UUID | Primary Key |
| createdAt | DateTime | Creation Timestamp |
| createdBy | String | User who created the record |
| bpNumber | String/Association | Business Field |
| bpName | String/Association | Business Field |
| changeType | String/Association | Business Field |
| impactedSystems | String/Association | Business Field |
| fieldsChanged | String/Association | Business Field |
| notificationSent | String/Association | Business Field |

← Back to [Entities](README.md)
