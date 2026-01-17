# Salesforce Request App

## Functional Overview
Used by Sales to onboard Customers.
*   **Key Concept**: **Sub-Accounts**. A single customer can have multiple billing relationships.
*   **Mandatory**: Revenue Stream, Billing Cycle (per Sub-Account).

## Technical Implementation
*   **Service**: `SalesforceService` (`srv/salesforce-service.cds`)
*   **Entity**: `SalesforceRequests`.
*   **Composition**: `SubAccounts` contain `SubAccountBanks` and `SubAccountEmails`.
