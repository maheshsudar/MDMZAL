# AEB Compliance Integration

## Overview
The system integrates with AEB for Restricted Party Screening (RPS). This ensures compliance with international sanctions lists.

## Workflow
1. **Trigger**: When a request moves to 'Submitted' status.
2. **Payload Construction**: Name, Address, and Country fields are mapped to AEB schema.
3. **API Call**: POST to AEB endpoint.
4. **Response Processing**:
    - **Green**: No match found. Status -> `NotChecked` (Safe).
    - **Red/Orange**: Match found. Status -> `ComplianceReview`.
    - **Error**: API failure. Status -> `Error`.

## Risk Scoring
- **0**: No match.
- **1-99**: Potential match (requires review).
- **100**: Exact match (blocked).

## Schema
### Request
```json
{
  "name1": "Acme Corp",
  "street": "123 Main St",
  "city": "New York",
  "country": "US"
}
```

### Response
```json
{
  "status": "success",
  "matches": [],
  "riskScore": 0
}
```
