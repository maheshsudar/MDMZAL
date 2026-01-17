# API Examples

## Coupa Payload
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
