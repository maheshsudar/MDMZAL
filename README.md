# MDM Approval Application

This repository contains the full stack implementation of the Business Partner Management System.

## Documentation Map

*   **[System Architecture](docs/System_Architecture.md)**: High-level design, data flow diagrams, and core concepts. **Start Here.**
*   **[User Guide](docs/User_Guide.md)**: Step-by-step instructions for business users (Procurement, Sales, MDM).
*   **[Developer Guide](docs/Developer_Guide.md)**: Setup, running locally, project structure, and extension patterns.
*   **[Detailed Specifications](docs/specs/)**: Full functional specifications for each module (Version 7.0).
    *   [Common Architecture](docs/specs/Functional_Spec_Common_Architecture.md)
    *   [Admin Config](docs/specs/Functional_Spec_Admin_Config_App.md)
    *   [Coupa Requests](docs/specs/Functional_Spec_Coupa_Request_App.md)
    *   [Salesforce Requests](docs/specs/Functional_Spec_Salesforce_Request_App.md)
    *   [PI Requests](docs/specs/Functional_Spec_PI_Request_App.md)
    *   [MDM Approval](docs/specs/Functional_Spec_MDM_Approval_App.md)
    *   [Satellite Acknowledgement](docs/specs/Functional_Spec_Satellite_Acknowledgement_App.md)
    *   [Integration API](docs/specs/Integration_Request_Schema.md)
    *   [Compliance Integration](docs/specs/Compliance_Integration_Specification.md)

## Quick Start (Developers)

1.  **Install**: `npm install`
2.  **Deploy DB**: `cds deploy --to sqlite`
3.  **Run**: `npm start`
4.  **Browse**: Open `http://localhost:4004`

## Application List

| App Directory | Name | Purpose |
|:---|:---|:---|
| `app/admin-config` | **Admin Config** | Manage Validation Rules & Code Lists |
| `app/mdm-approval` | **MDM Approval** | Central Governance Console |
| `app/coupa-requests` | **Coupa Requests** | Supplier Onboarding (Procurement) |
| `app/salesforce-requests` | **Salesforce Requests** | Customer Onboarding (Sales) |
| `app/pi-requests` | **PI Requests** | Supplier Onboarding (Purchasing) |
| `app/satellite-ack` | **Satellite Acknowledgement** | Notification Inbox for System Owners |

See specific `README.md` files inside `app/` directories for app-specific technical details.
