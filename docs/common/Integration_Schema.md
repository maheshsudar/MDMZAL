# Integration Request Schema

**Version:** 7.1
**Date:** 2026-05-21
**Status:** Live

---

## 1. Outbound Payloads (MDM -> CPI)

When a request is **Approved**, MDM sends this payload to the Integration Suite.

### 1.1 Common Envelope
```json
{
  "requestId": "UUID",
  "requestNumber": "REQ-1001",
  "requestType": "Create|Change|AdhocSync",
  "sourceSystem": "Salesforce|Coupa|PI",
  "entityType": "Supplier|Customer",
  "data": { ... }
}
```

### 1.2 Scenario: Create Supplier
```json
{
  "partnerName": "Acme Corp",
  "paymentTerms": "NET30",
  "addresses": [{ "street": "Main St", "country": "US", "addressType": "Business" }],
  "identifications": [{ "type": "DUNS", "idNumber": "123456" }]
}
```

### 1.3 Scenario: Adhoc Sync
```json
{
  "sapBpNumber": "1000001",
  "targetSystem": "Salesforce",
  "reason": "Data alignment"
}
```

---

## 2. Inbound Payloads (Satellite -> MDM)

Sent to `/integration/partners/create`.

```json
{
  "partnerName": "Acme Corp",
  "sourceSystem": "Coupa",
  "requestType": "Create",
  "addresses": [...]
}
```
