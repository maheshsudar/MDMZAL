# Functional Specification: Satellite Acknowledgement App

**Version:** 6.0
**Date:** 2026-01-17
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose

The Satellite Acknowledgement App serves as the **notification inbox** for the Business Partner Management System. When a Business Partner is created or updated in SAP S/4HANA, the satellite systems (Salesforce, Coupa, PI) that need to know about this change receive notifications. This application provides system owners with a centralized view of these notifications and enables them to acknowledge receipt.

Think of this application as the "delivery confirmation" mechanism. When a package is delivered, the recipient signs for it. Similarly, when a Business Partner update is "delivered" to a satellite system, the system owner acknowledges that their system has received and processed the update. This creates an auditable trail showing that all affected systems are aware of each master data change.

The application is fundamentally **read-only** from a data perspective. Users cannot modify Business Partner data through this interface - that's not its purpose. Instead, it provides visibility into the flow of notifications and confirmation that those notifications have been received and acted upon.

### 1.2 Understanding "Satellite Systems"

The term "satellite system" refers to the source systems that orbit around SAP S/4HANA as the central master data repository. In this architecture:

**SAP S/4HANA** is the sun - the central source of truth for Business Partner master data.

**Satellite Systems** (Salesforce, Coupa, PI) are planets that:
- Generate requests for new Business Partners
- Maintain local copies of relevant Business Partner data
- Need to stay synchronized with the SAP master

When a Business Partner is created or updated in SAP, the satellite systems need to know about it so they can:
- Update their local records with the SAP Business Partner Number
- Refresh cached data in their systems
- Trigger downstream processes that depend on the updated data

### 1.3 Target Audience

**Satellite System Owners** are the primary users. These are the technical or business leads responsible for the integration health of Salesforce, Coupa, or PI. They need to confirm that their systems are receiving updates.

**Integration Support Teams** use this application to troubleshoot when satellite systems report missing or stale data. They can check whether notifications were sent and acknowledged.

**MDM Coordinators** may use this application to verify that high-priority Business Partner changes have been acknowledged by all affected systems.

### 1.4 Key Characteristics

This application differs fundamentally from the request-based applications:

| Characteristic | Satellite Acknowledgement | Request Apps |
|:---|:---|:---|
| Data Entry | None (read-only) | Full CRUD |
| Validation | None needed | Comprehensive |
| Primary Action | Acknowledge receipt | Create/Update/Submit |
| User Role | System Owner | Business User |
| Focus | Integration monitoring | Data entry |

### 1.5 Cross-References

| Document | Description |
|:---|:---|
| [Common Architecture](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Functional_Spec_Common_Architecture.md) | Notification service, Change Log entity |
| [MDM Approval App](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Functional_Spec_MDM_Approval_App.md) | Approval workflow that triggers notifications |

---

## 2. Business Context

### 2.1 The Data Consistency Challenge

In a distributed system where multiple applications maintain copies of Business Partner data, keeping everything synchronized is critical. Consider what happens when a supplier's address changes:

1. A Coupa user submits a change request to update the supplier's remittance address
2. MDM approves the change
3. SAP S/4HANA is updated with the new address
4. **But what about the copies of this address in other systems?**

If Salesforce also has this partner as a customer, their copy may have the old address. Invoices sent to the customer might have outdated information. Payment processing might fail because the remittance address doesn't match.

### 2.2 The Notification Solution

The Business Partner Management System addresses this through a notification mechanism:

**When a Business Partner is created or updated in SAP:**
1. The system identifies all satellite systems that have a relationship with this partner
2. A notification is created for each affected system
3. The notification contains the updated Business Partner data
4. System owners can view and acknowledge these notifications

**The notification serves multiple purposes:**
- **Alerting**: "Hey, this partner you care about was just updated"
- **Data Delivery**: "Here's the updated data you need"
- **Audit Trail**: "We can prove you were notified on this date"
- **Problem Detection**: "Notifications stuck in pending = integration issue"

### 2.3 When Notifications Are Generated

Notifications are created at specific points in the Business Partner lifecycle:

**Partner Created (New Request Approved):**
When a new Business Partner is created in SAP, the system generates a notification to the satellite system that originally requested it. This notification includes the SAP Business Partner Number, which the satellite system needs to store as a reference.

**Partner Updated (Change Request Approved):**
When an existing Business Partner is updated, the system generates notifications to:
- The satellite system that submitted the change request
- Any OTHER satellite systems that have this partner in their records

This is important - a change made by Coupa might affect data that Salesforce also uses. Both systems need to know.

**Adhoc Sync (Manual Trigger):**
MDM Stewards can manually trigger a notification to a specific satellite system. This is used when:
- Initial setup needs testing
- A system missed a notification
- Data refresh is needed

---

## 3. Notification Flow

### 3.1 End-to-End Process

The following describes the complete notification flow from approval to acknowledgement:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  MDM Steward approves Business Partner request                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CPI Integration syncs partner to SAP S/4HANA                                   │
│  - Creates/Updates Business Partner                                             │
│  - Returns SAP BP Number                                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Notification Service creates ChangeNotification records                        │
│  - One for the originating satellite system                                     │
│  - One for each other satellite system with this partner                        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Notifications appear in Satellite Acknowledgement App                          │
│  - Filtered by target system                                                    │
│  - Status shows "Pending"                                                       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  System Owner reviews and acknowledges                                          │
│  - Confirms their system received the update                                    │
│  - Status changes to "Acknowledged"                                             │
│  - Timestamp and user recorded                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Cross-System Notifications

One of the most important scenarios this application handles is when a Business Partner change affects multiple satellite systems. Let's walk through an example:

**Scenario: Supplier Becomes Customer and Supplier**

1. **Month 1**: Salesforce creates "Acme Corp" as a Customer
   - Request approved, SAP BP Number 1000001234 created
   - Salesforce receives notification with BP Number

2. **Month 3**: Coupa creates "Acme Corp" as a Supplier
   - Duplicate detection finds existing BP 1000001234
   - MDM extends the existing BP to be Customer AND Supplier
   - Coupa receives notification with BP Number

3. **Month 6**: Coupa submits address change for "Acme Corp"
   - Change approved, SAP updated
   - **Both Coupa AND Salesforce receive notifications**
   - Both system owners must acknowledge

This ensures that when one system makes a change, all other systems that share the partner are informed.

---

## 4. User Interface

### 4.1 Dashboard (Notification Inbox)

The dashboard presents a list of notifications relevant to the current user's assigned satellite systems. The interface is designed for quick scanning and action.

**What Users See:**

When a system owner opens the application, they see a filtered view of notifications for their systems. A Salesforce system owner sees only Salesforce notifications; a Coupa owner sees only Coupa notifications. Some users may have access to multiple systems.

**Filter Bar:**

The filter bar allows users to narrow down the list. The most common filter is by status - most users want to see "Pending" notifications that require action.

| Filter | Options | Default |
|:---|:---|:---|
| Status | Pending, Acknowledged, Error, All | Pending |
| Target System | User's assigned systems | All available |
| Event Type | Create, Update | All |
| Date Range | Date picker | Last 7 days |

**Table Display:**

The notification table shows essential information for triage:

| Column | Purpose |
|:---|:---|
| Notification # | Unique identifier for reference |
| Partner Name | Quick identification of the partner |
| SAP BP # | The SAP Business Partner Number |
| Event Type | Create or Update |
| Target System | Which satellite system this is for |
| Status | Pending, Acknowledged, Error |
| Created At | When the notification was generated |
| Acknowledged By | Who acknowledged (if applicable) |

**Status Badges:**

Each notification shows a color-coded status badge:
- **Yellow (Pending)**: Awaiting acknowledgement
- **Green (Acknowledged)**: Confirmed received
- **Red (Error)**: Delivery failed

### 4.2 Detail Page

Clicking on a notification row opens the detail page with comprehensive information. This is where users review the notification content before acknowledging.

**Header Information:**

The header shows the partner name prominently, with the notification number as subtitle. A large status badge indicates current status.

**Notification Details:**

This section provides context about the notification:
- **Event Type**: "Create" or "Update"
- **Target System**: Which satellite system this is for
- **SAP BP Number**: The Business Partner number in SAP
- **Created At**: When the notification was generated
- **Acknowledged By**: User who acknowledged (if applicable)
- **Acknowledged At**: Timestamp of acknowledgement

**Payload Section:**

For technical users who need to verify the data content, a collapsible section shows the JSON payload that was (or would be) sent to the satellite system. This is particularly useful for troubleshooting when a satellite system claims it didn't receive correct data.

**Change Log Section:**

For Update notifications, this section shows exactly what changed. This helps system owners understand the scope of the update and verify that their system correctly reflects the changes.

---

## 5. Acknowledgement Process

### 5.1 The Purpose of Acknowledgement

Acknowledgement is more than just clicking a button. It represents a confirmation that:

1. The system owner is aware of the Business Partner change
2. Their satellite system has received or will receive the update
3. They take responsibility for ensuring their system reflects the change

This creates accountability and provides an audit trail.

### 5.2 Acknowledge Button

The primary action button appears prominently on the detail page:

| Property | Value |
|:---|:---|
| Label | "Acknowledge" |
| Type | Emphasized (Primary) |
| Icon | sap-icon://accept |
| Visibility | Only when status is "Pending" |

The button is disabled for notifications that are already acknowledged or in error state.

### 5.3 Acknowledgement Dialog

When the user clicks Acknowledge, a confirmation dialog appears:

**Dialog Content:**
- **Title**: "Acknowledge Notification"
- **Message**: "By acknowledging, you confirm that your system ({Target System}) has received the Business Partner update."
- **Optional Input**: Comments field (max 500 characters)
- **Buttons**: "Acknowledge" (Primary), "Cancel"

The optional comments field allows users to add notes, such as:
- "Verified in Salesforce - record updated"
- "Manual update required - FICA not active"
- "Ticket opened for data sync issue"

### 5.4 What Happens on Acknowledgement

When the user confirms acknowledgement:

1. **Validation**: System confirms status is still "Pending" (prevents race conditions)
2. **API Call**: POST /ChangeNotifications({ID})/acknowledge
3. **Status Update**: status → "Acknowledged"
4. **User Recording**: acknowledgedBy → current user
5. **Timestamp**: acknowledgedAt → current date/time
6. **Comments Storage**: Any notes stored with the record
7. **UI Feedback**: Success message displayed
8. **List Refresh**: Table updates to reflect new status

---

## 6. Change Log Viewing

### 6.1 When Change Logs Appear

For notifications related to **Update** events (not Create), the Change Log section becomes visible. This shows the user exactly what fields changed in the original change request.

### 6.2 Why This Matters

Consider a system owner who receives an Update notification for "Acme Corp". Without the change log, they know something changed but not what. With the change log, they can:

- Verify that only expected fields changed
- Identify which areas of their system need attention
- Troubleshoot if their local data doesn't match
- Prioritize based on the significance of changes

### 6.3 Change Log Display

The change log appears as a table showing:

| Column | Description |
|:---|:---|
| Section | Which part of the BP changed (General, Address, Bank) |
| Field | Human-readable field name |
| Change Type | Created, Modified, or Deleted (with icon) |
| Old Value | What it was before |
| New Value | What it is now |
| Record | For child records, which one (e.g., "Address #1") |

**Change Type Icons:**
- **Created** (Green +): A new record was added
- **Modified** (Blue pencil): An existing value changed
- **Deleted** (Red -): A record was removed

---

## 7. Status Management

### 7.1 Notification Status Values

| Status | Meaning | Color | Next Actions |
|:---|:---|:---|:---|
| Pending | Awaiting acknowledgement | Yellow | Acknowledge |
| Acknowledged | User confirmed receipt | Green | None (complete) |
| Error | Delivery failed | Red | Investigate, Retry |

### 7.2 Status Transitions

The notification lifecycle is simple:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            Notification Created                               │
│                           Status = "Pending"                                  │
└──────────────────────────────────────────────────────────────────────────────┘
                    │                               │
        [User Acknowledges]                [Delivery Fails]
                    │                               │
                    ▼                               ▼
┌──────────────────────────────┐   ┌──────────────────────────────────────────┐
│        Acknowledged          │   │              Error                        │
│   (Terminal - Complete)      │   │   (Requires Investigation)               │
└──────────────────────────────┘   └──────────────────────────────────────────┘
                                                    │
                                         [Retry Succeeds + Acknowledge]
                                                    │
                                                    ▼
                                   ┌──────────────────────────────────────────┐
                                   │           Acknowledged                    │
                                   └──────────────────────────────────────────┘
```

---

## 8. Entity Structure

### 8.1 ChangeNotifications Entity

This entity stores all notification records:

| Field | Type | Description |
|:---|:---|:---|
| ID | UUID | Primary key |
| notificationNumber | String | Human-readable ID |
| businessPartnerId | UUID | Link to original request |
| sapBpNumber | String | SAP Business Partner Number |
| partnerName | String | Partner display name |
| eventType | String | "Create" or "Update" |
| targetSystem | String | Salesforce, Coupa, PI |
| status | String | Pending, Acknowledged, Error |
| payload | LargeString | JSON payload content |
| acknowledgedBy | String | User who acknowledged |
| acknowledgedAt | DateTime | Acknowledgement timestamp |
| comments | String | Optional acknowledger comments |
| createdAt | DateTime | When notification was created |
| errorMessage | String | Error details if status=Error |

### 8.2 ChangeLogs Entity

For Update notifications, change details are read from this entity:

| Field | Type | Description |
|:---|:---|:---|
| ID | UUID | Primary key |
| request_ID | UUID | Link to the request |
| changeType | String | CREATED, MODIFIED, DELETED |
| section | String | General, Address, Bank, etc. |
| fieldName | String | Technical field name |
| fieldLabel | String | Human-readable label |
| oldValue | String | Previous value |
| newValue | String | New value |
| recordIdentifier | String | e.g., "Address #1" |

---

## 9. Filtering and Personalization

### 9.1 Default Filters

The application applies sensible defaults to help users focus on actionable items:

| Filter | Default | Rationale |
|:---|:---|:---|
| Status | Pending | Focus on unacknowledged items |
| Date Range | Last 7 days | Reasonable working window |
| Target System | User's systems | Only show relevant notifications |

### 9.2 Saved Views

Users can save their preferred filter combinations as variants. Common patterns:

| Variant Name | Filters | Use Case |
|:---|:---|:---|
| My Pending | Status=Pending, My Systems | Daily inbox |
| All Recent | Last 30 days, All Statuses | Audit/Review |
| Errors Only | Status=Error | Troubleshooting |
| Last Month | Last 30 days, Acknowledged | Monthly report |

---

## 10. API Endpoints

This application is primarily UI-based, but exposes endpoints for integration:

| Endpoint | Method | Description |
|:---|:---|:---|
| `/ChangeNotifications` | GET | List notifications (OData filters) |
| `/ChangeNotifications({ID})` | GET | Get notification details |
| `/ChangeNotifications({ID})/acknowledge` | POST | Acknowledge a notification |
| `/ChangeLogs` | GET | Get change logs (filter by request_ID) |
