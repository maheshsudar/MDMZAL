# Sub Accounts

## Description
Definition of the sub-accounts entity. This entity stores core business data.

## Fields
| Name | Type | Description |
|:-----|:-----|:------------|
| ID | UUID | Primary Key |
| createdAt | DateTime | Creation Timestamp |
| createdBy | String | User who created the record |
| request | String/Association | Business Field |
| subAccountId | String/Association | Business Field |
| revenueStream_code | String/Association | Business Field |
| billingCycle_code | String/Association | Business Field |
| paymentTerms_code | String/Association | Business Field |
| dunningStrategy_code | String/Association | Business Field |

← Back to [Entities](README.md)
