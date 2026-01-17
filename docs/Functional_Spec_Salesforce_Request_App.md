# Functional Specification: Salesforce Request App

**Version:** 7.0
**Date:** 2026-05-21
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose

The Salesforce Request App enables Sales Operations to request new **Customers** or update existing ones. It handles Salesforce-specific data structures like Sub-Accounts, Revenue Streams, and Billing Cycles.

### 1.2 Target Audience

*   **Sales Operations**: Users setting up customer accounts for billing.
*   **Account Managers**: Users updating customer details.

---

## 2. Functionality

### 2.1 Request Creation

*   **Default Context**: `SourceSystem` = 'Salesforce', `EntityType` = 'Customer'.
*   **Structure**: Salesforce requests make heavy use of the **Sub-Account** concept. A single Request (Header) can contain multiple Sub-Accounts (Billing relationships).
*   **Mandatory Fields**:
    *   **Header**: Partner Name, Name 1.
    *   **Payment**: Payment Terms are required for Customers.
    *   **Addresses**: At least one address.
    *   **Sub-Accounts**: Revenue Stream, Billing Cycle, Dunning Strategy.

### 2.2 Sub-Account Management

Salesforce uses `SubAccounts` to model different revenue streams or billing entities under the main customer.
*   **Banking & Emails**: In the Salesforce model, Bank Accounts and Email Contacts are often managed under the **Sub-Account** rather than the header, allowing per-stream configuration. The UI reflects this by grouping these under the Sub-Account facet.

### 2.3 Webhook Callbacks

The service includes actions (`receiveCreateCallback`, `receiveUpdateCallback`) to handle asynchronous responses from the Integration Suite, updating the Salesforce Sub-Account ID and SAP Contract Account references in the MDM database.

---

## 3. Data Model & UI

### 3.1 Service Definition

Exposed via `SalesforceService`.
*   **Entity**: `SalesforceRequests`.
*   **Children**: `PartnerAddresses`, `PartnerVatIds`, `PartnerIdentifications`, `SubAccounts`.
*   **Sub-Children**: `SubAccounts` contain `SubAccountBanks` and `SubAccountEmails`.

### 3.2 UI Layout

1.  **Basic Information**: Name, Salesforce ID, Merchant ID, BP Type.
2.  **Address**: Physical locations.
3.  **Tax Information**: VAT IDs.
4.  **Identifications**: External IDs (Salesforce ID, DUNS).
5.  **Sub Accounts**: List of billing entities.
    *   **Sub Account Details**: Revenue Stream, Billing Cycle, Payment Terms.
    *   **Bank Details**: Specific to the sub-account.
    *   **Email Contacts**: Specific to the sub-account.
6.  **MDM Approval Feedback**: Comments.
7.  **Change Log**: Field-level delta.

**Note**: Unlike other apps, the Salesforce app does **not** expose top-level Bank or Email sections in the main UI facets, reinforcing the Sub-Account model.

---

## 4. Workflow

1.  **Create/Change**: User drafts request.
2.  **Submit**: Validation ensures Sub-Account completeness (Revenue Stream, etc.).
3.  **Approval**: MDM approves.
4.  **Callback**: Integration Suite calls back with SAP Contract Account numbers, which are updated in the `SubAccounts` entity.
