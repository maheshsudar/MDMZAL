import os

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f"Created {path}")

# --- Data Structures ---

# API Examples extracted from old_docs/Integration_Request_Schema.md
api_examples = {
    "coupa": """```json
{
  "requestId": "...",
  "requestType": "Create",
  "sourceSystem": "Coupa",
  "entityType": "Supplier",
  "data": {
    "partnerName": "Acme Corp",
    "searchTerm": "ACME",
    "paymentTerms": "NET30",
    "currency": "USD",
    "addresses": [
      {
        "street": "123 Main St",
        "city": "New York",
        "postalCode": "10001",
        "country": "US",
        "addressType": "Business"
      }
    ],
    "banks": [
      {
        "bankCountry": "US",
        "bankKey": "123456789",
        "accountNumber": "987654321",
        "accountHolder": "Acme Corp"
      }
    ],
    "identifications": [
      {
        "type": "DUNS",
        "idNumber": "123456789"
      }
    ]
  }
}
```""",
    "salesforce": """```json
{
  "requestId": "...",
  "requestType": "Change",
  "sourceSystem": "Salesforce",
  "entityType": "Customer",
  "data": {
    "sapBpNumber": "1000001",
    "partnerName": "Acme Inc (Renamed)",
    "addresses": [
      {
        "action": "UPDATE",
        "addressId": "100",
        "street": "456 New St",
        "city": "San Francisco",
        "postalCode": "94105",
        "country": "US"
      },
      {
        "action": "CREATE",
        "street": "789 Branch St",
        "city": "Austin",
        "postalCode": "73301",
        "country": "US"
      }
    ],
    "subAccounts": [
      {
        "subAccountId": "SUB-1001",
        "revenueStream": "Influencer",
        "billingCycle": "Monthly",
        "paymentTerms": "NET30",
        "addressRef": "100"
      }
    ]
  }
}
```""",
    "adhoc-sync": """```json
{
  "requestId": "...",
  "requestType": "AdhocSync",
  "sourceSystem": "Salesforce",
  "data": {
    "sapBpNumber": "1000001",
    "reason": "Sync missing record"
  }
}
```"""
}

# Integration Spec for AEB/VIES extracted from old_docs
integration_specs = {
    "aeb": """# AEB Compliance Integration

## Overview
The system integrates with AEB for Restricted Party Screening (RPS). This ensures compliance with international sanctions lists.

## Workflow
1. **Trigger**: When a request moves to 'Submitted' status.
2. **Payload Construction**: Name, Address, and Country fields are mapped to AEB schema.
3. **API Call**: POST to AEB endpoint.
4. **Response Processing**:
    - **Green**: No match found. Status -> `NotChecked` (Safe).
    - **Red/Orange**: Match found. Status -> `ComplianceReview`.
    - **Error**: API failure. Status -> `Error`.

## Risk Scoring
- **0**: No match.
- **1-99**: Potential match (requires review).
- **100**: Exact match (blocked).

## Schema
### Request
```json
{
  "name1": "Acme Corp",
  "street": "123 Main St",
  "city": "New York",
  "country": "US"
}
```

### Response
```json
{
  "status": "success",
  "matches": [],
  "riskScore": 0
}
```
""",
    "vies": """# VIES VAT Validation Integration

## Overview
Validates VAT Identification Numbers for EU countries using the VIES SOAP API.

## Workflow
1. **Trigger**: When a VAT ID is added or changed for an EU country.
2. **Pre-check**: Regex validation of format.
3. **API Call**: SOAP request to VIES.
4. **Response**: Valid/Invalid.

## Logic
- **Valid**: Status -> `Valid`.
- **Invalid**: Status -> `Invalid`. User must correct or provide justification.
- **Service Unavailable**: Status -> `NotChecked`. Retry allowed.
"""
}

# Common Architecture Specs extracted from Functional_Spec_Common_Architecture.md
common_specs = {
    "status-management": """# Status Management

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
""",
    "validation": """# Validation Framework

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
""",
    "id-preservation": """# ID Preservation for Change Requests

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
"""
}


apps = {
    "salesforce": {
        "title": "Salesforce Request App",
        "description": "Handles customer onboarding requests originating from Salesforce. Key features include sub-account management and revenue stream tracking.",
        "type": "Customer",
        "sections": {
            "general-information": {
                "fields": [
                    {"label": "Partner Name", "type": "String", "mandatory": "Yes", "notes": "Legal name of the customer"},
                    {"label": "Search Term", "type": "String", "mandatory": "Yes", "notes": "Search key (e.g., ACME)"},
                    {"label": "Business Partner Type", "type": "Code List", "mandatory": "Yes", "notes": "ORG or PERSON"},
                    {"label": "Customer Code", "type": "String", "mandatory": "No", "notes": "Legacy system ID"}
                ]
            },
            "payment-information": {
                "fields": [
                    {"label": "Payment Terms", "type": "Code List", "mandatory": "Yes", "notes": "Required for Customer (e.g., NET30)"},
                    {"label": "Currency", "type": "Code List", "mandatory": "Yes", "notes": "Default currency"},
                    {"label": "Payment Method", "type": "Code List", "mandatory": "No", "notes": "e.g., Wire Transfer"}
                ]
            },
            "addresses": {
                "fields": [
                    {"label": "Street", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "City", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "Postal Code", "type": "String", "mandatory": "Yes", "notes": "Validated by regex"},
                    {"label": "Country", "type": "Code List", "mandatory": "Yes", "notes": "ISO Code"},
                    {"label": "Address Type", "type": "Code List", "mandatory": "Yes", "notes": "Business, Shipping"}
                ]
            },
            "emails": {
                "fields": [
                    {"label": "Email Address", "type": "String", "mandatory": "Yes", "notes": "Must be valid format"},
                    {"label": "Email Type", "type": "Code List", "mandatory": "Yes", "notes": "General, Invoice"}
                ]
            },
            "identifications": {
                "fields": [
                    {"label": "ID Type", "type": "Code List", "mandatory": "Yes", "notes": "DUNS, SALESFORCE"},
                    {"label": "ID Number", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "Issuing Authority", "type": "String", "mandatory": "No", "notes": ""}
                ]
            },
            "sub-accounts": {
                "fields": [
                    {"label": "Sub Account Name", "type": "String", "mandatory": "Yes", "notes": "Name of the sub-account"},
                    {"label": "Revenue Stream", "type": "Code List", "mandatory": "Yes", "notes": "License, Services"},
                    {"label": "Billing Cycle", "type": "Code List", "mandatory": "Yes", "notes": "Monthly, Quarterly"}
                ]
            }
        },
        "workflows": ["create-request", "change-request"],
        "api_example": api_examples["salesforce"]
    },
    "coupa": {
        "title": "Coupa Request App",
        "description": "Handles supplier onboarding requests originating from Coupa. Focuses on banking information and tax compliance.",
        "type": "Supplier",
        "sections": {
            "general-information": {
                "fields": [
                    {"label": "Partner Name", "type": "String", "mandatory": "Yes", "notes": "Legal name"},
                    {"label": "Search Term", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "Supplier Code", "type": "String", "mandatory": "No", "notes": "Legacy ID"}
                ]
            },
            "payment-information": {
                "fields": [
                    {"label": "Payment Terms", "type": "Code List", "mandatory": "Yes", "notes": "Critical for AP"},
                    {"label": "Payment Method", "type": "Code List", "mandatory": "Yes", "notes": "T (Transfer), C (Check)"}
                ]
            },
            "addresses": {
                "fields": [
                    {"label": "Street", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "City", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "Postal Code", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "Country", "type": "Code List", "mandatory": "Yes", "notes": ""}
                ]
            },
            "bank-accounts": {
                "fields": [
                    {"label": "Bank Country", "type": "Code List", "mandatory": "Yes", "notes": ""},
                    {"label": "Bank Key", "type": "String", "mandatory": "Yes", "notes": "Routing number / Sort code"},
                    {"label": "Account Number", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "IBAN", "type": "String", "mandatory": "Conditional", "notes": "Required for SEPA countries"},
                    {"label": "Account Holder", "type": "String", "mandatory": "Yes", "notes": ""}
                ]
            },
            "vat-ids": {
                "fields": [
                    {"label": "VAT Registration No", "type": "String", "mandatory": "Conditional", "notes": "Required for EU suppliers"},
                    {"label": "Country", "type": "Code List", "mandatory": "Yes", "notes": ""}
                ]
            },
            "identifications": {
                "fields": [
                    {"label": "ID Type", "type": "Code List", "mandatory": "Yes", "notes": "DUNS, COUPA"},
                    {"label": "ID Number", "type": "String", "mandatory": "Yes", "notes": ""}
                ]
            }
        },
        "workflows": ["create-request", "change-request"],
        "api_example": api_examples["coupa"]
    },
    "pi": {
        "title": "PI Request App",
        "description": "Handles supplier onboarding requests from the Purchasing Interface (PI). Similar to Coupa but for direct purchasing.",
        "type": "Supplier",
        "sections": {
             "general-information": {
                "fields": [
                    {"label": "Partner Name", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "Search Term", "type": "String", "mandatory": "Yes", "notes": ""}
                ]
            },
            "payment-information": {
                "fields": [
                    {"label": "Payment Terms", "type": "Code List", "mandatory": "Yes", "notes": ""},
                    {"label": "Currency", "type": "Code List", "mandatory": "Yes", "notes": ""}
                ]
            },
            "addresses": {
                "fields": [
                    {"label": "Street", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "City", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "Postal Code", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "Country", "type": "Code List", "mandatory": "Yes", "notes": ""}
                ]
            },
            "bank-accounts": {
                "fields": [
                    {"label": "Bank Country", "type": "Code List", "mandatory": "Yes", "notes": ""},
                    {"label": "Account Number", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "Account Holder", "type": "String", "mandatory": "Yes", "notes": ""}
                ]
            },
             "vat-ids": {
                "fields": [
                    {"label": "VAT Registration No", "type": "String", "mandatory": "Conditional", "notes": ""},
                    {"label": "Country", "type": "Code List", "mandatory": "Yes", "notes": ""}
                ]
            },
            "identifications": {
                "fields": [
                    {"label": "ID Type", "type": "Code List", "mandatory": "Yes", "notes": "DUNS, PI"},
                    {"label": "ID Number", "type": "String", "mandatory": "Yes", "notes": ""}
                ]
            }
        },
        "workflows": ["create-request", "change-request"],
        "api_example": api_examples["coupa"] # PI schema similar to Coupa
    },
    "mdm-approval": {
        "title": "MDM Approval App",
        "description": "Central governance application. Allows MDM stewards to review, approve, reject, or correct requests from all satellite systems. Includes integration with compliance services (AEB, VIES).",
        "type": "All",
        "sections": {
            "general-information": {
                "fields": [
                    {"label": "Request ID", "type": "String", "mandatory": "Yes", "notes": "Read-only"},
                    {"label": "Status", "type": "String", "mandatory": "Yes", "notes": "Read-only"},
                    {"label": "Source System", "type": "String", "mandatory": "Yes", "notes": "Read-only"}
                ]
            },
            "aeb-compliance": {
                "fields": [
                    {"label": "Status", "type": "String", "mandatory": "No", "notes": "Clear, Blocked, Review"},
                    {"label": "Risk Score", "type": "Number", "mandatory": "No", "notes": "0-100"},
                    {"label": "Screening Date", "type": "Date", "mandatory": "No", "notes": ""}
                ]
            },
             "vies-validation": {
                "fields": [
                    {"label": "VAT ID", "type": "String", "mandatory": "No", "notes": ""},
                    {"label": "Status", "type": "String", "mandatory": "No", "notes": "Valid, Invalid"},
                    {"label": "Validation Date", "type": "Date", "mandatory": "No", "notes": ""}
                ]
            },
            "approval-history": {
                 "fields": [
                    {"label": "Action", "type": "String", "mandatory": "No", "notes": "Approve, Reject"},
                    {"label": "User", "type": "String", "mandatory": "No", "notes": ""},
                    {"label": "Comment", "type": "String", "mandatory": "No", "notes": ""}
                ]
            }
        },
        "workflows": ["approval-workflow", "compliance-checks", "duplicate-resolution", "adhoc-sync"],
        "actions": ["approve", "reject", "check-duplicates", "perform-aeb-check", "perform-vies-check", "create-adhoc-sync", "validate-sap-bp"],
        "api_example": api_examples["adhoc-sync"]
    },
    "satellite-acknowledgement": {
        "title": "Satellite Acknowledgement App",
        "description": "Manages notifications sent to satellite systems (Salesforce, Coupa, PI) when a Business Partner is created or updated in SAP. Allows manual acknowledgement if automated ack fails.",
        "type": "Notification",
        "sections": {
            "notification-details": {
                "fields": [
                    {"label": "Notification ID", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "Target System", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "Status", "type": "String", "mandatory": "Yes", "notes": "Pending, Acknowledged, Error"}
                ]
            },
            "payload": {
                "fields": [
                    {"label": "JSON Content", "type": "Code", "mandatory": "No", "notes": "The actual payload sent"}
                ]
            }
        },
        "workflows": ["acknowledgement"],
    },
    "admin-config": {
        "title": "Admin Config App",
        "description": "Allows administrators to configure dynamic validation rules and manage code lists without code changes.",
        "type": "Configuration",
        "sections": {
            "validation-rules": {
                 "fields": [
                    {"label": "Rule ID", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "Entity", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "Field", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "Rule Type", "type": "Code List", "mandatory": "Yes", "notes": "Required, MinLength, Regex"}
                ]
            },
            "code-lists": {
                 "fields": [
                    {"label": "List Name", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "Code", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "Description", "type": "String", "mandatory": "Yes", "notes": ""}
                ]
            },
             "cache-management": {
                 "fields": [
                    {"label": "Cache Name", "type": "String", "mandatory": "Yes", "notes": ""},
                    {"label": "Action", "type": "Button", "mandatory": "No", "notes": "Clear Cache"}
                ]
            }
        },
        "workflows": ["add-validation-rule", "add-code-list-entry", "clear-cache"],
    }
}

code_lists = {
    "request-types": {"desc": "Defines the type of business partner request. Determines workflow behavior and required fields.", "values": ["Create", "Change", "AdhocSync"]},
    "source-systems": {"desc": "Identifies the originating system. Controls app-specific validation rules.", "values": ["Salesforce", "Coupa", "PI", "MDM"]},
    "overall-statuses": {"desc": "Master list of all workflow statuses. Controls UI behavior.", "values": ["New", "Submitted", "Approved", "Rejected", "Completed", "Error", "ComplianceReview", "SAPCreated", "SAPUpdatePending", "SAPUpdateComplete", "SatelliteNotified", "SatelliteConfirmed"]},
    "status-transitions": {"desc": "Defines valid status changes.", "values": ["New->Submitted", "Submitted->Approved", "Submitted->Rejected", "Approved->SAPCreated"]},
    "workflow-steps": {"desc": "Defines workflow step sequences.", "values": ["Initiation", "Validation", "Approval", "Integration"]},
    "bp-types": {"desc": "Distinguishes between organization and individual business partners.", "values": ["ORG", "PERSON"]},
    "entity-types": {"desc": "Defines the business relationship type.", "values": ["Customer", "Supplier", "Both"]},
    "address-types": {"desc": "Categorizes addresses by business function.", "values": ["Business", "Shipping", "Remit-To", "Ordering"]},
    "countries": {"desc": "ISO 3166-1 alpha-2 country codes.", "values": ["DE", "US", "GB", "FR", "CN", "JP", "IN", "BR"]},
    "postal-code-patterns": {"desc": "Country-specific postal code validation patterns.", "values": ["US: ^\\d{5}(-\\d{4})?$", "DE: ^\\d{5}$", "GB: ^[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2}$"]},
    "payment-terms": {"desc": "Standard payment terms defining when invoices are due.", "values": ["NET30", "NET60", "2%10NET30", "IMMEDIATE"]},
    "payment-methods": {"desc": "How payments are made to/from the business partner.", "values": ["T (Bank Transfer)", "C (Check)", "D (Direct Debit)", "P (PayPal)"]},
    "currencies": {"desc": "ISO 4217 currency codes for transactions.", "values": ["EUR", "USD", "GBP", "CHF", "JPY"]},
    "iban-patterns": {"desc": "Country-specific IBAN validation patterns.", "values": ["DE: ^DE\\d{20}$", "FR: ^FR\\d{25}$"]},
    "vat-types": {"desc": "Categorizes VAT registration types.", "values": ["EU", "LOCAL", "EXEMPT"]},
    "vat-patterns": {"desc": "Country-specific VAT ID validation patterns.", "values": ["DE: ^DE\\d{9}$", "AT: ^ATU\\d{8}$"]},
    "identification-types": {"desc": "Types of business identifications.", "values": ["DUNS", "TAXID", "REGISTER", "SALESFORCE", "COUPA", "PI"]},
    "email-types": {"desc": "Categorizes email addresses by purpose.", "values": ["GENERAL", "INVOICE", "ORDER"]},
    "contact-types": {"desc": "Types of contacts associated with the business partner.", "values": ["PRIMARY", "BILLING", "SHIPPING"]},
    "revenue-streams": {"desc": "Categorizes revenue for financial reporting (Salesforce).", "values": ["License", "Services", "Support", "Maintenance"]},
    "billing-cycles": {"desc": "Defines invoice frequency for sub-accounts.", "values": ["MONTHLY", "QUARTERLY", "ANNUALLY"]},
    "dunning-strategies": {"desc": "Collection strategy for overdue payments.", "values": ["Standard", "Aggressive", "VIP"]},
    "business-channels": {"desc": "Sales channel classification.", "values": ["DIRECT", "PARTNER", "ONLINE"]},
    "admin-menu": {"desc": "Navigation menu items for Admin Config app.", "values": ["Validation Rules", "Code Lists", "System Config"]},
    "system-configuration": {"desc": "System-wide settings.", "values": ["AEB_ENABLED", "VIES_ENABLED", "AUTO_APPROVE_LIMIT"]},
    "status-app-config": {"desc": "Per-status UI configuration.", "values": ["New:Blue", "Approved:Green", "Rejected:Red"]}
}

# Entities mapped from db/data-model.cds
entities = {
    "business-partner-request": [
        "requestNumber", "entityType", "requestType", "sourceSystem", "status",
        "partnerName", "name1", "name2", "merchantId", "searchTerm",
        "partnerRole", "communicationLanguage", "reconAccount", "currency_code",
        "paymentMethod_code", "paymentTerms_code", "aebStatus", "viesStatus", "duplicateCheckStatus"
    ],
    "partner-addresses": [
        "request", "sapAddressId", "addressType_code", "street", "city",
        "postalCode", "country_code", "region", "isDefault"
    ],
    "partner-banks": [
        "request", "bankCountry_code", "bankKey", "bankName", "accountNumber",
        "iban", "swiftCode", "currency_code", "isDefault"
    ],
    "partner-emails": [
        "request", "emailType_code", "emailAddress", "notes", "isDefault"
    ],
    "partner-vat-ids": [
        "request", "country_code", "vatNumber", "vatType_code", "isEstablished", "validationStatus"
    ],
    "partner-identifications": [
        "request", "identificationType_code", "identificationNumber", "country_code", "issuingAuthority", "validFrom", "validTo"
    ],
    "sub-accounts": [
        "request", "subAccountId", "revenueStream_code", "billingCycle_code", "paymentTerms_code", "dunningStrategy_code"
    ],
    "change-logs": [
        "request", "changeDate", "changedBy", "sectionName", "fieldName", "oldValue", "newValue", "changeType"
    ],
    "duplicate-checks": [
        "request", "matchType", "matchScore", "existingBpNumber", "matchDetails", "reviewRequired"
    ],
    "change-notifications": [
        "bpNumber", "bpName", "changeType", "impactedSystems", "fieldsChanged", "notificationSent"
    ],
    "notification-acknowledgments": [
        "notification", "systemOwnerUserId", "targetSystem", "status", "comments", "acknowledgedAt"
    ]
}

# --- Content Generators ---

def generate_root_readme():
    content = """# Business Partner Management System - Documentation

## Quick Navigation

### 📋 Overview
- [System Overview](overview/system-overview.md)
- [Architecture](overview/architecture.md)
- [Glossary](overview/glossary.md)

### 🗄️ Data Model
- [Entities](data-model/entities/README.md)
- [Code Lists](data-model/code-lists/README.md)

### 📱 Applications
| App | Description |
|:----|:------------|
| [Salesforce](apps/salesforce/README.md) | Customer onboarding for sales |
| [Coupa](apps/coupa/README.md) | Supplier onboarding for procurement |
| [PI](apps/pi/README.md) | Supplier onboarding for purchasing |
| [MDM Approval](apps/mdm-approval/README.md) | Governance and approval |
| [Satellite Acknowledgement](apps/satellite-acknowledgement/README.md) | Notification handling |
| [Admin Config](apps/admin-config/README.md) | System configuration |

### 🔗 Integration
- [SAP S/4HANA](integration/sap-s4hana/README.md)
- [Compliance (AEB/VIES)](integration/compliance/README.md)

### ✅ Validation & Status
- [Validation Framework](validation/README.md)
- [Status Management](status-management/README.md)
- [Field Mappings](field-mappings/README.md)

### 📊 Project Management
- [📋 Development Task List](project/task-list.md)
- [📁 Documentation Structure](project/structure.md)
"""
    create_file("docs/README.md", content)

def generate_app_readmes():
    for app, data in apps.items():
        sections_links = "\n".join([f"- [{s.replace('-', ' ').title()}](sections/{s}.md)" for s in data["sections"].keys()])
        workflows_links = "\n".join([f"- [{w.replace('-', ' ').title()}](workflows/{w}.md)" for w in data["workflows"]])

        actions_section = ""
        if "actions" in data:
            actions_links = "\n".join([f"- [{a.replace('-', ' ').title()}](actions/{a}.md)" for a in data["actions"]])
            actions_section = f"\n### Actions\n{actions_links}\n"

        content = f"""# {data['title']} - Functional Specification

## Overview
{data['description']}

## Navigation

### Sections
{sections_links}

### Workflows
{workflows_links}
{actions_section}
### Validation
- [Field Validations](validation/field-validations.md)
- [Section Validations](validation/section-validations.md)

### API
- [Endpoints](api/endpoints.md)
- [Examples](api/examples.md)

## Key Characteristics
| Characteristic | Value |
|:---------------|:------|
| Entity Type | {data.get('type', 'N/A')} |
| Source System | {app.title()} |

← Back to [Main Documentation](../../README.md)
"""
        create_file(f"docs/apps/{app}/README.md", content)

def generate_section_docs():
    for app, data in apps.items():
        for section, details in data["sections"].items():
            rows = ""
            for field in details.get("fields", []):
                rows += f"| {field.get('label', '')} | {field.get('label', '')} | {field.get('type', '')} | {field.get('mandatory', '')} | Editable | Read-Only | {field.get('notes', '')} |\n"

            if not rows:
                 rows = "| - | - | - | - | - | - | - |"

            content = f"""# {section.replace('-', ' ').title()}

## Purpose
This document specifies the {section.replace('-', ' ')} section of the {data['title']}.

## Fields

| Field | Label | Type | Mandatory | Create | Change | Notes |
|:------|:------|:-----|:----------|:-------|:-------|:------|
{rows}

## UI Behavior
- **Visibility**: Always visible unless conditional logic applies.
- **Editability**: Generally editable in 'New' status, read-only after submission.

## Related Documentation
- **Entity**: [Related Entity](../../../data-model/entities/README.md)
- **Validation**: [Validation Rules](../validation/field-validations.md)
- **SAP Mapping**: [Field Mappings](../../../field-mappings/README.md)

← Back to [{data['title']}](README.md)
"""
            create_file(f"docs/apps/{app}/sections/{section}.md", content)

def generate_workflow_docs():
    for app, data in apps.items():
        for workflow in data["workflows"]:
            content = f"""# {workflow.replace('-', ' ').title()}

## Purpose
This document describes the {workflow.replace('-', ' ')} workflow in the {data['title']}.

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

← Back to [{data['title']}](README.md)
"""
            create_file(f"docs/apps/{app}/workflows/{workflow}.md", content)

def generate_code_list_docs():
    create_file("docs/data-model/code-lists/README.md", "# Code Lists\n\nIndex of all code lists.\n\n" + "\n".join([f"- [{k}]( {k}.md )" for k in code_lists.keys()]))
    for code, info in code_lists.items():
        values_table = "\n".join([f"| {v} | Standard value for {v} |" for v in info["values"]])
        content = f"""# {code.replace('-', ' ').title()}

## Purpose
{info['desc']}

## Values
| Value | Description |
|:------|:------------|
{values_table}

## Usage
- Used in validation rules.
- Populates dropdowns in UI.
- Ensures data consistency across apps.

← Back to [Code Lists](README.md)
"""
        create_file(f"docs/data-model/code-lists/{code}.md", content)

def generate_action_docs():
    if "actions" in apps["mdm-approval"]:
        for action in apps["mdm-approval"]["actions"]:
            content = f"""# {action.replace('-', ' ').title()}

## Purpose
Describes the '{action}' action in MDM Approval.

## Logic
1. **Pre-checks**: Verify current status allows this action.
2. **Execution**: Call backend API `{action}`.
3. **Post-processing**: Update status, send notifications, or trigger integration.

## Related Documentation
- **API Endpoint**: [Endpoints](../api/endpoints.md)
- **Status Change**: [Status Values](../../../status-management/status-values.md)

← Back to [MDM Approval App](../README.md)
"""
            create_file(f"docs/apps/mdm-approval/actions/{action}.md", content)

def generate_entity_docs():
    create_file("docs/data-model/entities/README.md", "# Entities\n\nOverview of data entities.\n\n" + "\n".join([f"- [{e}]({e}.md)" for e in entities]))
    for entity, fields in entities.items():
        field_rows = "\n".join([f"| {f} | String/Association | Business Field |" for f in fields])
        content = f"""# {entity.replace('-', ' ').title()}

## Description
Definition of the {entity} entity. This entity stores core business data.

## Fields
| Name | Type | Description |
|:-----|:-----|:------------|
| ID | UUID | Primary Key |
| createdAt | DateTime | Creation Timestamp |
| createdBy | String | User who created the record |
{field_rows}

← Back to [Entities](README.md)
"""
        create_file(f"docs/data-model/entities/{entity}.md", content)

def generate_project_files():
    create_file("docs/project/structure.md", "# Documentation Structure\n\nThis folder contains the project management and documentation structure details.")
    create_file("docs/project/task-list.md", "# Development Task List\n\n- [ ] Implement new folder structure\n- [ ] Migrate content\n- [ ] Verify links")

def generate_misc_readmes():
    # Use common_specs to populate specific READMEs
    create_file("docs/status-management/README.md", common_specs["status-management"])
    create_file("docs/validation/README.md", common_specs["validation"])
    create_file("docs/overview/architecture.md", "# System Architecture\n\n" + common_specs["status-management"] + "\n\n" + common_specs["validation"]) # Combining for overview

    # Generic ones
    misc_paths = [
        "docs/overview/system-overview.md", "docs/overview/glossary.md",
        "docs/integration/README.md", "docs/integration/sap-s4hana/README.md",
        "docs/integration/satellite-notifications/README.md", "docs/integration/compliance/README.md",
        "docs/field-mappings/README.md"
    ]
    for p in misc_paths:
        title = os.path.basename(p).replace('.md', '').replace('-', ' ').title()
        create_file(p, f"# {title}\n\nDetailed content for {title}.\n\nThis section covers high-level concepts and specifications.\n\n← Back to [Main Documentation](../../README.md)")

    # Special case for integration/compliance subfolders
    create_file("docs/integration/compliance/aeb/README.md", integration_specs["aeb"])
    create_file("docs/integration/compliance/vies/README.md", integration_specs["vies"])

    # ID Preservation logic
    create_file("docs/integration/sap-s4hana/id-writeback.md", common_specs["id-preservation"])


def generate_api_docs():
    for app, data in apps.items():
        create_file(f"docs/apps/{app}/api/endpoints.md", "# API Endpoints\n\nList of API endpoints exposed by this application.\n\n- `GET /Requests`: List requests\n- `POST /Requests`: Create request\n")

        example_content = "# API Examples\n\n"
        if "api_example" in data:
            example_content += f"## {app.title()} Payload\n{data['api_example']}\n"
        else:
            example_content += "No specific examples available.\n"

        create_file(f"docs/apps/{app}/api/examples.md", example_content)
        create_file(f"docs/apps/{app}/validation/field-validations.md", "# Field Validations\n\nValidation rules for fields in this app.\n")
        create_file(f"docs/apps/{app}/validation/section-validations.md", "# Section Validations\n\nValidation rules for sections in this app.\n")

def main():
    generate_root_readme()
    generate_app_readmes()
    generate_section_docs()
    generate_workflow_docs()
    generate_code_list_docs()
    generate_entity_docs()
    generate_action_docs()
    generate_misc_readmes()
    generate_api_docs()
    generate_project_files()
    print("Documentation generation complete.")

if __name__ == "__main__":
    main()
