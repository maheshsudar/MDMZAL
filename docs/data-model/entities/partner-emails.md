# Partner Emails

## Description
Definition of the partner-emails entity. This entity stores core business data.

## Fields
| Name | Type | Description |
|:-----|:-----|:------------|
| ID | UUID | Primary Key |
| createdAt | DateTime | Creation Timestamp |
| createdBy | String | User who created the record |
| request | String/Association | Business Field |
| emailType_code | String/Association | Business Field |
| emailAddress | String/Association | Business Field |
| notes | String/Association | Business Field |
| isDefault | String/Association | Business Field |

← Back to [Entities](README.md)
