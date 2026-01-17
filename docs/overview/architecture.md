# System Architecture

# Status Management

## The Status Lifecycle
Every Business Partner request moves through a defined lifecycle. Understanding this lifecycle is crucial because it determines what actions are available and who can perform them.

**The Journey of a Request:**
When a user creates a request, it starts in "New" status. This is the drafting phase - the user can save, edit, and delete their work.
When the user submits, the request moves to "Submitted" and enters the MDM queue. At this point, the user loses the ability to edit.
The MDM Steward reviews the request. They might run compliance checks (moving it to ComplianceCheck or DuplicateReview temporarily) before making a decision. Eventually, they either approve or reject.
If approved, the request enters the integration phase. Three separate integrations (SAP create/update, satellite notification, SAP ID writeback) all need to succeed. When they do, the request reaches its final "Completed" status.

## Status Values and Meanings

| Status | Who Acts | What Happens | Next Steps |
|:---|:---|:---|:---|
| **New** | Satellite User | Drafting the request | Submit or Delete |
| **Submitted** | MDM Steward | Awaiting review | Approve, Reject, or Check |
| **ComplianceCheck** | System | Running AEB/VIES | Automatic return to Submitted |
| **DuplicateReview** | MDM Steward | Duplicates found | Approve or Reject |
| **Approved** | System | Integrations running | Automatic on completion |
| **Rejected** | Satellite User | Request declined | Create new or appeal |
| **Completed** | Nobody | All done | Terminal state |
| **Error** | Support Team | Integration failed | Investigate and fix |

## Status Criticality
- **1 (Red)**: Negative/Problem (Rejected, Error)
- **2 (Yellow)**: In Progress/Warning (New, Submitted, ComplianceCheck)
- **3 (Green)**: Positive/Success (Approved, Completed)


# Validation Framework

## How Validation Works
The validation framework is a dynamic, database-driven system that applies business rules to request data. Rather than hardcoding validation logic, rules are stored as data and can be modified through the Admin Config app.

## Rule Fallback Logic
Rules are applied using a fallback mechanism that finds the most specific matching rule:
1. Try: SourceSystem + EntityType + RequestType + Field
2. Try: SourceSystem + EntityType + Field
3. Try: SourceSystem + Field
4. Try: Field only (universal rule)

## Validation Types
- **Required**: Field must have a value
- **MinLength**: String must be at least N characters
- **MaxLength**: String must be at most N characters
- **Regex**: Value must match a regular expression pattern
- **Email**: Must be a valid email format
- **VAT**: Must be a valid country-specific VAT format
- **IBAN**: Must be a valid IBAN with check digit
- **MinCount**: Child entity must have at least N records
- **Custom**: Calls a custom JavaScript function for complex logic
