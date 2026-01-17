# Partner Vat Ids

## Description
Definition of the partner-vat-ids entity. This entity stores core business data.

## Fields
| Name | Type | Description |
|:-----|:-----|:------------|
| ID | UUID | Primary Key |
| createdAt | DateTime | Creation Timestamp |
| createdBy | String | User who created the record |
| request | String/Association | Business Field |
| country_code | String/Association | Business Field |
| vatNumber | String/Association | Business Field |
| vatType_code | String/Association | Business Field |
| isEstablished | String/Association | Business Field |
| validationStatus | String/Association | Business Field |

← Back to [Entities](README.md)
