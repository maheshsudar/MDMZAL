# Notification Acknowledgments

## Description
Definition of the notification-acknowledgments entity. This entity stores core business data.

## Fields
| Name | Type | Description |
|:-----|:-----|:------------|
| ID | UUID | Primary Key |
| createdAt | DateTime | Creation Timestamp |
| createdBy | String | User who created the record |
| notification | String/Association | Business Field |
| systemOwnerUserId | String/Association | Business Field |
| targetSystem | String/Association | Business Field |
| status | String/Association | Business Field |
| comments | String/Association | Business Field |
| acknowledgedAt | String/Association | Business Field |

← Back to [Entities](README.md)
