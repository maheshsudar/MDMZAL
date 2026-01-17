# Functional Specification: MDM Approval App

**Version:** 7.0
**Date:** 2026-05-21
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose

The MDM Approval App is the central governance console. MDM Stewards use it to review, enrich, approve, or reject requests from all satellite systems (Coupa, Salesforce, PI). It integrates compliance checks (AEB, VIES) and duplicate detection.

### 1.2 Target Audience

*   **MDM Stewards**: Data governance experts.
*   **System Owners**: For monitoring integration status.

---

## 2. Functionality

### 2.1 Unified Inbox

The app displays a unified list of `MDMApprovalRequests` from all sources.
*   **Filters**: Status, Source System, Request Type, Date.
*   **Columns**: Request #, Name, Source, Status, Integration Status.

### 2.2 Review Process

Stewards can view all details provided by the requester.
*   **Editability**: Most fields are read-only to preserve the requester's intent. However, the `approverComments` field is editable for providing feedback.
*   **Enrichment**: (Future) Stewards may be granted permission to enrich data before approval.

### 2.3 Compliance & Validation

Stewards can trigger external checks:
*   **Duplicate Check** (`checkDuplicates`): Scans SAP and pending requests.
*   **AEB Check** (`performAEBCheck`): Runs sanctions screening. Updates `aebStatus` (Pass/Warning/Blocked) and `aebStatusCriticality`.
*   **VIES Check** (`performVIESCheck`): Validates EU VAT IDs. Updates `viesStatus` (Valid/Invalid/Error).

### 2.4 Decision

*   **Approve**: Triggers the `approveRequest` action. Validates that the partner is not Blocked by AEB. Updates status to **Approved** and initiates Integration.
*   **Reject**: Triggers `rejectRequest`. Requires a reason. Updates status to **Rejected** and notifies the requester.

### 2.5 Integration Monitoring

The app tracks the granular status of the synchronization process:
*   `sapInitialStatus`: Creation in S/4HANA.
*   `satelliteStatus`: Acknowledgment/Update of the source system.
*   `sapIdUpdateStatus`: Writeback of the generated SAP ID to the MDM record.

---

## 3. Data Model & UI

### 3.1 Service Definition

Exposed via `MDMService`.
*   **Entity**: `MDMApprovalRequests` (Projection of `BusinessPartnerRequests`).
*   **Permissions**: `MDMApprover` can Update (comments) and Approve/Reject.
*   **Read-Only Projections**: `A_BusinessPartner` (SAP Mock/Shadow), `IntegrationEndpoints` (Reference).

### 3.2 UI Layout

Comprehensive Object Page with all facets:
1.  **Basic Info**: Request metadata.
2.  **Addresses**: All addresses.
3.  **Tax Info**: VAT IDs.
4.  **Identifications**: External IDs.
5.  **Banks**: Banking details.
6.  **Emails**: Contact emails.
7.  **Payment Info**: Terms, Method.
8.  **Sub Accounts**: (Salesforce only) Billing details.
9.  **AEB Check**: Status and details.
10. **VIES Check**: Status and details.
11. **Duplicate Check**: Summary and results table.
12. **Approver Comments**: Input field.
13. **Integration Status**: Granular status display.
14. **Change Log**: Delta view.

---

## 4. Adhoc Sync

Stewards can initiate an `AdhocSync` request (`createAdhocSyncRequest`) to force synchronization of an existing SAP Partner to a target Satellite System. This bypasses the normal creation flow and is used for fixing data alignment issues.
