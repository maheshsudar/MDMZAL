# Partner Banks

## Description
Definition of the partner-banks entity. This entity stores core business data.

## Fields
| Name | Type | Description |
|:-----|:-----|:------------|
| ID | UUID | Primary Key |
| createdAt | DateTime | Creation Timestamp |
| createdBy | String | User who created the record |
| request | String/Association | Business Field |
| bankCountry_code | String/Association | Business Field |
| bankKey | String/Association | Business Field |
| bankName | String/Association | Business Field |
| accountNumber | String/Association | Business Field |
| iban | String/Association | Business Field |
| swiftCode | String/Association | Business Field |
| currency_code | String/Association | Business Field |
| isDefault | String/Association | Business Field |

← Back to [Entities](README.md)
