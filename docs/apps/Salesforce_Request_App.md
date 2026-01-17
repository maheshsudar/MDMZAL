# Salesforce Request App

**Version:** 7.2
**Date:** 2026-05-21
**Status:** Live

---

## 1. Functional Goal

The Salesforce Request App enables **Sales Operations** to onboard **Customers**. It handles the specific complexity of Salesforce billing relationships through the **Sub-Account** model.

---

## 2. User Workflow

### 2.1 Customer Onboarding
1.  **Initiation**: User creates a request. Context: `SourceSystem: Salesforce`, `EntityType: Customer`.
2.  **Basic Info**: Partner Name, Name 1.
3.  **Sub-Account Configuration**:
    *   Instead of adding banks/emails at the top level, the user adds a **Sub-Account**.
    *   **Billing**: User selects `RevenueStream` (e.g., 'Direct Sales') and `BillingCycle` (e.g., 'Monthly').
    *   **Banking/Email**: User adds bank details and contacts *within* the Sub-Account context.
4.  **Submission**: Validates that all Sub-Accounts are complete.

---

## 3. Technical Specifications

### 3.1 Service Definition
*   **Service**: `SalesforceService` (`srv/salesforce-service.cds`)
*   **Entity**: `SalesforceRequests`.
*   **Composition**: `SubAccounts` (Child) -> `SubAccountBanks`, `SubAccountEmails`.

### 3.2 Webhook Integration
The integration is bidirectional.
*   **Outbound**: MDM sends request to SAP.
*   **Inbound Callback**: SAP generates a Contract Account. CPI calls back `receiveCreateCallback` to update the `SubAccount` with the `sapFICAContractAccount` and the generated `salesforceSubAccountId`.
