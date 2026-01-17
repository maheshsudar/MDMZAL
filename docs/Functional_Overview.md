# Functional Overview

This document outlines the core functional workflows supported by the Business Partner Management System.

## 1. Supplier Onboarding (Coupa/PI)

**Actor**: Procurement Specialist
**Goal**: Create a new Supplier in SAP S/4HANA to enable purchasing.

1.  **Initiation**: User opens the **Coupa Request App** (or PI Request App).
2.  **Data Entry**: User enters mandatory details:
    *   **Partner Name**: Legal entity name.
    *   **Identifications**: DUNS number or Tax ID (Mandatory).
    *   **Payment Details**: Payment Terms and Method (Mandatory).
    *   **Banking**: IBAN required for SEPA suppliers.
3.  **Submission**: User submits the request. System validates completeness.
4.  **Result**: Request moves to **Submitted** status for MDM review.

## 2. Customer Onboarding (Salesforce)

**Actor**: Sales Operations
**Goal**: Create a new Customer account for billing.

1.  **Initiation**: User opens the **Salesforce Request App**.
2.  **Sub-Account Setup**: User adds a **Sub-Account** representing the billing entity.
    *   Selects **Revenue Stream** and **Billing Cycle**.
    *   Selects **Dunning Strategy**.
3.  **Contact Info**: User ensures at least one **Email Address** is provided (Mandatory).
4.  **Submission**: User submits the request.

## 3. Governance & Approval (MDM)

**Actor**: MDM Steward
**Goal**: Ensure data quality and compliance.

1.  **Review**: Steward opens **MDM Approval App** and selects a pending request.
2.  **Compliance Checks**:
    *   **Sanctions**: Steward triggers **AEB Check**. If "Blocked", approval is prevented.
    *   **VAT**: Steward triggers **VIES Check** to validate EU Tax IDs.
3.  **Duplicate Check**: Steward runs a check against existing SAP partners to prevent redundancy.
4.  **Decision**:
    *   **Approve**: Request is locked and synchronized to SAP.
    *   **Reject**: Request is returned to the user with comments.

## 4. Integration Monitoring

**Actor**: System Owner
**Goal**: Confirm data synchronization.

1.  **Notification**: When MDM approves a request, the System Owner receives a notification in the **Satellite Acknowledgement App**.
2.  **Verification**: Owner reviews the **Change Log** (if update) or Partner Details.
3.  **Acknowledgement**: Owner clicks **Acknowledge** to confirm their local system (e.g., Salesforce) is up to date.

## 5. System Administration

**Actor**: Administrator
**Goal**: Update business rules without code deployment.

1.  **Validation Rules**: Admin opens **Admin Config App** to modify rules (e.g., make "Postal Code" mandatory for US addresses).
2.  **Testing**: Admin uses the **Test Validation** feature to verify the rule.
3.  **Activation**: Admin sets the rule to "Active". It applies immediately.
