# Integration Request Schema (CPI Payloads)

**Version:** 2.1
**Date:** 2026-01-17
**Status:** Draft

---

## 1. Introduction
This document defines the JSON payloads sent from the MDM Hub (CAP) to the SAP Integration Suite (CPI) when a request is **Approved**. CPI uses this payload to orchestrate updates to SAP S/4HANA and Satellite Systems.

---

## 2. Common Payload Structure
All payloads share a common envelope.

```json
{
  "requestId": "UUID",
  "requestNumber": "REQ-1001",
  "requestType": "Create|Change|AdhocSync",
  "sourceSystem": "Salesforce|Coupa|PI",
  "entityType": "Supplier|Customer|Both",
  "timestamp": "2026-01-17T12:00:00Z",
  "data": { ... } // Business Data
}
```

---

## 3. Scenario: Create Supplier (Coupa)

### 3.1 Payload
```json
{
  "requestId": "...",
  "requestType": "Create",
  "sourceSystem": "Coupa",
  "entityType": "Supplier",
  "data": {
    "partnerName": "Acme Corp",
    "searchTerm": "ACME",
    "paymentTerms": "NET30",
    "currency": "USD",
    "addresses": [
      {
        "street": "123 Main St",
        "city": "New York",
        "postalCode": "10001",
        "country": "US",
        "addressType": "Business"
      }
    ],
    "banks": [
      {
        "bankCountry": "US",
        "bankKey": "123456789",
        "accountNumber": "987654321",
        "accountHolder": "Acme Corp"
      }
    ],
    "identifications": [
      {
        "type": "DUNS",
        "idNumber": "123456789"
      }
    ]
  }
}
```

---

## 4. Scenario: Change Customer (Salesforce) with Sub-Accounts

### 4.1 Payload
Note the inclusion of `sapBpNumber` and `addressId` for updates.

```json
{
  "requestId": "...",
  "requestType": "Change",
  "sourceSystem": "Salesforce",
  "entityType": "Customer",
  "data": {
    "sapBpNumber": "1000001",
    "partnerName": "Acme Inc (Renamed)",
    "addresses": [
      {
        "action": "UPDATE",
        "addressId": "100", // Existing SAP Address ID
        "street": "456 New St",
        "city": "San Francisco",
        "postalCode": "94105",
        "country": "US"
      },
      {
        "action": "CREATE", // New Address
        "street": "789 Branch St",
        "city": "Austin",
        "postalCode": "73301",
        "country": "US"
      }
    ],
    "subAccounts": [
      {
        "subAccountId": "SUB-1001",
        "revenueStream": "Influencer",
        "billingCycle": "Monthly",
        "paymentTerms": "NET30",
        "addressRef": "100" // Links to Address ID 100
      }
    ]
  }
}
```

---

## 5. Scenario: Adhoc Sync

### 5.1 Payload
Used to push an existing SAP BP to a satellite system.

```json
{
  "requestId": "...",
  "requestType": "AdhocSync",
  "sourceSystem": "Salesforce", // Target System
  "data": {
    "sapBpNumber": "1000001",
    "reason": "Sync missing record"
  }
}
```
