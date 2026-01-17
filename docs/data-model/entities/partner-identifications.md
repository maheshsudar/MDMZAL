# Partner Identifications

## Description
Definition of the partner-identifications entity. This entity stores core business data.

## Fields
| Name | Type | Description |
|:-----|:-----|:------------|
| ID | UUID | Primary Key |
| createdAt | DateTime | Creation Timestamp |
| createdBy | String | User who created the record |
| request | String/Association | Business Field |
| identificationType_code | String/Association | Business Field |
| identificationNumber | String/Association | Business Field |
| country_code | String/Association | Business Field |
| issuingAuthority | String/Association | Business Field |
| validFrom | String/Association | Business Field |
| validTo | String/Association | Business Field |

← Back to [Entities](README.md)
