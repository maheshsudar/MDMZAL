# User Guide

This guide describes how to use the applications within the Business Partner Management System.

## 1. Persona: Procurement Specialist (Coupa/PI)

**Goal**: Onboard a new Supplier.

1.  Open the **Coupa Request App** (or PI Request App).
2.  Click **Create**.
3.  Fill in the **Basic Information** (Partner Name, Name 1).
4.  **Important**: You must provide **Payment Terms** and **Payment Method**.
5.  Add at least one **Address** (Street, City, Country, Postal Code).
6.  Add at least one **Identification** (e.g., DUNS or Tax ID).
    *   *Note*: For Coupa, Bank Account is required if the country is SEPA (requires IBAN).
7.  Click **Submit**.
8.  The request status changes to **Submitted**. You will be notified via email when approved.

## 2. Persona: Sales Operations (Salesforce)

**Goal**: Onboard a new Customer.

1.  Open the **Salesforce Request App**.
2.  Click **Create**.
3.  Fill in **Basic Information**.
4.  Add a **Sub-Account**:
    *   Salesforce uses Sub-Accounts for billing details.
    *   Select Revenue Stream and Billing Cycle.
    *   Link the Sub-Account to an Address.
5.  **Mandatory**: You must provide at least one **Email Address**.
6.  Click **Submit**.

## 3. Persona: MDM Steward

**Goal**: Review and Approve a Request.

1.  Open the **MDM Approval App**.
2.  Locate requests with status **Submitted**.
3.  Review the details.
4.  **Compliance Checks**:
    *   Click **AEB Sanctions Check**. Verify result is "Pass".
    *   Click **VIES VAT Check**. Verify result is "Valid" (for EU).
    *   Click **Duplicate Check**. Ensure no conflicts exist.
5.  **Decision**:
    *   If issues found: Click **Reject** and provide a reason.
    *   If clean: Click **Approve**.
6.  Monitor the **Integration Status** fields to ensure successful sync to SAP.

## 4. Persona: System Administrator

**Goal**: Update a Validation Rule.

1.  Open the **Admin Config App**.
2.  Navigate to **Validation Rules**.
3.  Find the rule (e.g., "Partner Name Required").
4.  Edit the rule or create a new one.
    *   Example: Create a rule for Source System "Coupa" that makes "SWIFT Code" mandatory.
5.  Set status to **Active**.
6.  The rule takes effect immediately (caches are cleared automatically).

## 5. Persona: System Owner (Satellite Ack)

**Goal**: Acknowledge a Data Update.

1.  Open the **Satellite Acknowledgement App**.
2.  Filter for **Pending** notifications for your system (e.g., Salesforce).
3.  Open a notification.
    *   If it's an **Update**, check the **Change Log** to see what changed.
4.  Verify the data in your system (Salesforce).
5.  Click **Acknowledge**.
