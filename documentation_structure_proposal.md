# Documentation Structure Proposal

## 1. Goal
Create a hierarchical, navigable documentation structure that separates concerns while remaining linked.

## 2. Directory Structure

### Root
*   `README.md`: Central navigation hub linking to all apps and common specs.

### Applications (`docs/apps/`)
Each application will have its own dedicated folder with a consistent internal structure.

#### Pattern:
*   `docs/apps/<AppName>/Overview.md`: High-level purpose, user workflow, technical summary.
*   `docs/apps/<AppName>/actions/`: Folder containing specifications for specific UI actions (buttons).
    *   `docs/apps/<AppName>/actions/<ActionName>.md`
*   `docs/apps/<AppName>/sections/`: Folder containing specifications for UI facets/sections.
    *   `docs/apps/<AppName>/sections/<SectionName>.md`

### Common (`docs/common/`)
Shared technical specifications.
*   `docs/common/System_Architecture.md`
*   `docs/common/Common_Architecture.md`
*   `docs/common/Integration_Schema.md`
*   `docs/common/Compliance_Integration.md`

## 3. Application List & Key Components

### 3.1 MDM Approval (`MDM_Approval`)
*   **Actions**: `Approve_Reject`, `Adhoc_Sync` (Detailed), `Compliance_Checks`, `Duplicate_Check`.
*   **Sections**: `Basic_Info`, `Integration_Status`.

### 3.2 Admin Config (`Admin_Config`)
*   **Actions**: `Test_Validation`, `Clear_Cache`.
*   **Sections**: `Validation_Rules`, `Code_Lists`.

### 3.3 Coupa Request (`Coupa_Request`)
*   **Actions**: `Submit`, `Check_Duplicates`.
*   **Sections**: `Payment_Info`, `Identifications`.

### 3.4 Salesforce Request (`Salesforce_Request`)
*   **Actions**: `Submit`.
*   **Sections**: `Sub_Accounts`.

### 3.5 PI Request (`PI_Request`)
*   **Actions**: `Submit`.
*   **Sections**: `Identifications`.

### 3.6 Satellite Acknowledgement (`Satellite_Ack`)
*   **Actions**: `Acknowledge`.
*   **Sections**: `Change_Log`.
