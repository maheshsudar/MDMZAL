# Business Partner Request

## Description
Definition of the business-partner-request entity. This entity stores core business data.

## Fields
| Name | Type | Description |
|:-----|:-----|:------------|
| ID | UUID | Primary Key |
| createdAt | DateTime | Creation Timestamp |
| createdBy | String | User who created the record |
| requestNumber | String/Association | Business Field |
| entityType | String/Association | Business Field |
| requestType | String/Association | Business Field |
| sourceSystem | String/Association | Business Field |
| status | String/Association | Business Field |
| partnerName | String/Association | Business Field |
| name1 | String/Association | Business Field |
| name2 | String/Association | Business Field |
| merchantId | String/Association | Business Field |
| searchTerm | String/Association | Business Field |
| partnerRole | String/Association | Business Field |
| communicationLanguage | String/Association | Business Field |
| reconAccount | String/Association | Business Field |
| currency_code | String/Association | Business Field |
| paymentMethod_code | String/Association | Business Field |
| paymentTerms_code | String/Association | Business Field |
| aebStatus | String/Association | Business Field |
| viesStatus | String/Association | Business Field |
| duplicateCheckStatus | String/Association | Business Field |

← Back to [Entities](README.md)
