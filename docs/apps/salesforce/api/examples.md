# API Examples

## Salesforce Payload
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
        "addressId": "100",
        "street": "456 New St",
        "city": "San Francisco",
        "postalCode": "94105",
        "country": "US"
      },
      {
        "action": "CREATE",
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
        "addressRef": "100"
      }
    ]
  }
}
```
