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
