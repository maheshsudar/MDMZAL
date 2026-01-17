# ID Preservation for Change Requests

## The Duplicate Problem
When updating a Business Partner in SAP, a critical challenge emerges: how do you tell SAP to update an EXISTING address rather than create a NEW one?
SAP uses internal IDs to identify records within a Business Partner:
- Address ID identifies a specific address
- Bank Identification identifies a specific bank account

If you send an update without these IDs, SAP creates new records, resulting in duplicates.

## Preservation Mechanism
1. User searches for existing SAP Business Partner
2. System imports current data including internal SAP IDs
3. IDs are stored in hidden fields (sapAddressId, sapBankIdentification, etc.)
4. User makes modifications (IDs remain unchanged)
5. Upon approval, IDs are included in the SAP API call
6. SAP correctly updates existing records
