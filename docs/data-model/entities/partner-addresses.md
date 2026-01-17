# Partner Addresses

## Description
Definition of the partner-addresses entity. This entity stores core business data.

## Fields
| Name | Type | Description |
|:-----|:-----|:------------|
| ID | UUID | Primary Key |
| createdAt | DateTime | Creation Timestamp |
| createdBy | String | User who created the record |
| request | String/Association | Business Field |
| sapAddressId | String/Association | Business Field |
| addressType_code | String/Association | Business Field |
| street | String/Association | Business Field |
| city | String/Association | Business Field |
| postalCode | String/Association | Business Field |
| country_code | String/Association | Business Field |
| region | String/Association | Business Field |
| isDefault | String/Association | Business Field |

← Back to [Entities](README.md)
