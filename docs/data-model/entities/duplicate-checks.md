# Duplicate Checks

## Description
Definition of the duplicate-checks entity. This entity stores core business data.

## Fields
| Name | Type | Description |
|:-----|:-----|:------------|
| ID | UUID | Primary Key |
| createdAt | DateTime | Creation Timestamp |
| createdBy | String | User who created the record |
| request | String/Association | Business Field |
| matchType | String/Association | Business Field |
| matchScore | String/Association | Business Field |
| existingBpNumber | String/Association | Business Field |
| matchDetails | String/Association | Business Field |
| reviewRequired | String/Association | Business Field |

← Back to [Entities](README.md)
