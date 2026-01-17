# Add Code List Entry

## Purpose
This document describes the add code list entry workflow in the Admin Config App.

## Process Flow
1. **Initiation**: User clicks 'Create' or receives a task.
2. **Steps**:
   - Validation of mandatory fields.
   - Submission to MDM Approval (if applicable).
   - Integration with SAP S/4HANA.
3. **Completion**: Request reaches 'Completed' status or is rejected.

## Status Transitions
- **Start**: `New`
- **In-Progress**: `Submitted`, `ApprovalPending`, `SAPUpdatePending`
- **End**: `Approved`, `Rejected`, `Completed`

## Related Documentation
- **Sections Used**: [General](sections/general-information.md)
- **Validations**: [Field Validations](validation/field-validations.md)
- **Status Flow**: [Status Transitions](../../../status-management/state-machine.md)

← Back to [Admin Config App](README.md)
