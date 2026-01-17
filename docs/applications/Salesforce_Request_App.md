# Salesforce Request App

**Version:** 7.1
**Date:** 2026-05-21
**Status:** Live

---

## 1. Overview

The Salesforce Request App enables Sales Operations to manage **Customers**. It features a specialized data model to handle Salesforce **Sub-Accounts**.

---

## 2. Technical Implementation

*   **Service**: `SalesforceService` (`srv/salesforce-service.cds`)
*   **Entity**: `SalesforceRequests`.
*   **Sub-Entities**: `SubAccounts` (Child), which contains `SubAccountBanks` and `SubAccountEmails`.

---

## 3. Functionality

### 3.1 Sub-Account Model
Unlike other apps, Salesforce manages billing relationships via **Sub-Accounts**.
*   **Structure**: Header -> Sub-Account -> Bank/Email.
*   **UI Impact**: The main "Bank" and "Email" facets found in other apps are hidden or secondary. Instead, users configure these details within the **Sub-Account** facet.

### 3.2 Mandatory Fields
*   **Header**: Partner Name, Name 1.
*   **Customer**: Payment Terms.
*   **Sub-Account**: `RevenueStream`, `BillingCycle`, `DunningStrategy`.

### 3.3 Webhook Callbacks
The integration loop includes asynchronous callbacks (`receiveCreateCallback`) that update the `SalesforceRequests` with the generated `sapFICAContractAccount` and `salesforceSubAccountId`.
