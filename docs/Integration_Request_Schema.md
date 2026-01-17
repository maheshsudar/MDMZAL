# Integration Request Schema (Outbound CPI Payloads)

**Version:** 7.0
**Date:** 2026-05-21
**Status:** Draft

---

## 1. Introduction

This document defines the JSON payloads sent from the MDM Hub (CAP) to the SAP Integration Suite (CPI) when a request is **Approved**. CPI uses this payload to orchestrate updates to SAP S/4HANA and Satellite Systems.

---

## 2. Common Envelope

All outbound payloads follow this structure:

```json
{
  "requestId": "UUID",
  "requestNumber": "REQ-1001",
  "requestType": "Create|Change|AdhocSync",
  "sourceSystem": "Salesforce|Coupa|PI|Manual",
  "entityType": "Supplier|Customer|Both",
  "timestamp": "ISO-8601 Timestamp",
  "data": { ... } // Business Data
}
```

---

## 3. Scenarios

### 3.1 Create Supplier (Coupa/PI)

**Payload Data:**
```json
{
  "partnerName": "Acme Corp",
  "name1": "Acme Corp",
  "paymentTerms": "NET30",
  "paymentMethod": "BankTransfer",
  "currency": "USD",
  "addresses": [
    {
      "addressType": "Business",
      "street": "123 Main St",
      "city": "New York",
      "postalCode": "10001",
      "country": "US"
    }
  ],
  "banks": [
    {
      "bankCountry": "US",
      "iban": "US123...",
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
```

### 3.2 Change Customer (Salesforce)

**Payload Data:**
```json
{
  "sapBpNumber": "1000001",
  "partnerName": "Acme Inc (Renamed)",
  "addresses": [
    {
      "action": "UPDATE",
      "addressId": "100", // SAP Address ID
      "street": "456 New St"
    }
  ],
  "subAccounts": [
    {
      "subAccountId": "SUB-1001",
      "revenueStream": "Influencer",
      "billingCycle": "Monthly",
      "addressRef": "100"
    }
  ]
}
```

### 3.3 Adhoc Sync

**Payload Data:**
```json
{
  "sapBpNumber": "1000001",
  "reason": "Sync missing record",
  "targetSystem": "Salesforce"
}
```

---

## 4. Inbound Integration API

For inbound requests (Satellite -> MDM), refer to the **Integration API** documentation.
*   **Base Path**: `/integration/partners`
*   **Authentication**: API Key + Source System Header.
*   **Format**: Similar JSON structure to the Create payload above.
