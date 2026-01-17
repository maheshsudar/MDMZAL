# Functional Specification: Admin Config App

**Version:** 6.0
**Date:** 2026-01-17
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose

The Admin Config App is the **control center** for the Business Partner Management System. It empowers administrators to modify the application's behavior without requiring code deployments, database scripts, or developer intervention.

Modern enterprise applications need flexibility. Business rules change, regulations evolve, and organizational needs shift. Rather than hardcoding every validation rule and dropdown value, this system stores configuration as data. The Admin Config App provides a user-friendly interface for managing that configuration.

Consider a simple example: a new payment term needs to be added. Without a configuration interface, this would require a developer to modify code, a database administrator to add data, testing, and deployment. With the Admin Config App, an authorized administrator simply adds a new entry to the Payment Terms code list, clears the cache, and the new option is immediately available across all applications.

### 1.2 The Philosophy of Configuration Over Code

The Business Partner Management System follows the principle of **configuration over code**. This means:

**What's in Code:**
- Application structure and logic
- Integration connectors
- Security enforcement
- Core business processes

**What's in Configuration (managed here):**
- Validation rules and their parameters
- Error messages and their translations
- Dropdown values and their labels
- Feature flags and thresholds

This separation provides several benefits:
- **Agility**: Business process owners can make changes without IT involvement
- **Governance**: All configuration changes are logged and auditable
- **Consistency**: Rules are applied uniformly across all applications
- **Testability**: Configuration can be tested before production deployment

### 1.3 Target Audience

**System Administrators** are the primary users. These are technical users who understand the system architecture and can safely modify configuration without breaking functionality.

**Business Process Owners** may use specific sections of this application. For example, a procurement lead might be granted access to manage payment-related code lists.

**MDM Coordinators** might be granted access to view (but not modify) configuration to understand why certain validations are triggering.

### 1.4 Cross-References

| Document | Description |
|:---|:---|
| [Common Architecture](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Functional_Spec_Common_Architecture.md) | Full code list reference |
| [Compliance Integration](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Compliance_Integration_Specification.md) | Environment variables for AEB/VIES |

---

## 2. Validation Rule Management

### 2.1 Understanding Validation Rules

Validation rules are the backbone of data quality in the Business Partner Management System. They define what field values are acceptable, what error messages to show users, and under what circumstances a validation should apply.

Think of validation rules as the "guards" protecting data quality. When a user enters data, the guards check each piece of information against their rules. If something doesn't meet the criteria, the guard raises an alert.

**Where Rules Are Applied:**

Validation rules are applied at multiple points:
- When a user saves a draft (soft validation - warnings allowed)
- When a user submits for approval (hard validation - must pass)
- When an API receives a request (immediate validation)

**Rule Specificity:**

One of the most powerful features is rule specificity. A single field can have different validation rules depending on context:

| Scenario | Example Rule |
|:---|:---|
| Universal | "Partner name is required for all requests" |
| Source-specific | "DUNS number is required for Coupa" |
| Entity-specific | "Minimum 1 email for Customers" |
| Combined | "IBAN required for German suppliers from Coupa" |

### 2.2 Rule Components

Each validation rule consists of several components:

**Identification:**
- **Rule Code**: A unique identifier like `REQ_PARTNER_NAME`
- **Rule Name**: Human-readable name displayed in the admin UI
- **Category**: Grouping for organization (Basic, Address, Banking)

**Scope (When the rule applies):**
- **Source System**: Coupa, Salesforce, PI, or null (all)
- **Entity Type**: Supplier, Customer, Both, or null (all)
- **Request Type**: Create, Change, or null (both)
- **Status**: When in the workflow this rule applies

**Validation Logic:**
- **Target Entity**: Which entity to validate (BusinessPartnerRequests, PartnerAddresses)
- **Target Field**: Which field to check (partnerName, street)
- **Validation Type**: What kind of check (Required, MinLength, Regex)
- **Validation Value**: Parameters for the check (minimum length, regex pattern)

**User Feedback:**
- **Error Message**: What to show the user if validation fails
- **Error Severity**: Error (blocks submit) or Warning (allows override)
- **Examples**: Sample valid values for user guidance

**Administration:**
- **Is Active**: Whether the rule is currently being enforced
- **Priority**: Execution order when multiple rules apply

### 2.3 Validation Types

The system supports various validation types to handle different data quality needs:

**Required Validation:**
The most basic check - ensures a field has a value. Used for mandatory fields like partner name, address country, etc.

**Length Validations (MinLength, MaxLength):**
Checks string length. MinLength ensures adequate data (e.g., partner name must be at least 3 characters). MaxLength prevents data truncation in downstream systems (e.g., search term max 20 characters).

**Pattern Validation (Regex):**
Uses regular expressions to validate format. Examples include postal code formats (German: 5 digits), phone numbers, and website URLs.

**Email Validation:**
Specialized check for email format. More reliable than a simple regex because it handles edge cases like internationalized domain names.

**VAT Validation:**
Country-specific VAT number format validation. Each EU country has different format rules.

**IBAN Validation:**
International Bank Account Number validation including check digit verification.

**MinCount Validation:**
For child entities, ensures a minimum number of records. Example: "At least one address is required."

**Custom Validation:**
For complex business rules that can't be expressed as simple patterns, custom JavaScript functions can be invoked. Examples include cross-field validation ("If country is DE, postal code must be 5 digits").

### 2.4 Rule Management Interface

The Admin Config App provides a complete interface for managing validation rules.

**Rule List Page:**
Displays all validation rules in a searchable, filterable table. Administrators can quickly find rules by searching for target fields, rule codes, or validation types.

| Column | Description |
|:---|:---|
| Rule Code | Unique identifier |
| Rule Name | Display name |
| Target Field | Which field is validated |
| Validation Type | Required, Regex, etc. |
| Source System | Which satellite system (if specific) |
| Is Active | Currently enforced? |
| Priority | Execution order |

**Rule Editor:**
A form for creating or modifying rules. Organized into logical sections:

1. **Basic Information**: Code, name, category, business description
2. **Scope**: When the rule applies (source system, entity type, etc.)
3. **Validation**: What to check (entity, field, type, value)
4. **Error Handling**: Message, severity, examples
5. **Status**: Active flag, priority

**Rule Testing:**
Before activating a rule, administrators can test it against sample payloads. This prevents broken validations from reaching production.

---

## 3. Code List Management

### 3.1 Understanding Code Lists

Code lists (also called value lists, dropdowns, or reference data) provide the selectable values for dropdown fields throughout the applications. Managing these centrally ensures consistency.

**Why Central Management Matters:**

Consider the Payment Terms dropdown. If different applications had their own lists, you might end up with "Net30", "NET 30", and "NET30" as supposedly the same value. Central management enforces consistency.

**Localization:**

Each code list entry can have translations for different languages. The same payment term might display as "Net 30" in English and "Netto 30" in German, but the underlying code is always "NET30".

### 3.2 Managed Code Lists

The following code lists are managed through this application:

**Business-Critical Lists:**

| Code List | Entity | Business Purpose |
|:---|:---|:---|
| Payment Terms | PaymentTerms | When payment is due |
| Payment Methods | PaymentMethods | How payment is made |
| Currencies | Currencies | Transaction currency |
| Countries | Countries | Address countries |

**Categorization Lists:**

| Code List | Entity | Business Purpose |
|:---|:---|:---|
| Address Types | AddressTypes | Type of address |
| Email Types | EmailTypes | Type of email contact |
| VAT Types | VatTypes | Type of tax ID |
| Identification Types | IdentificationTypes | Partner ID types |

**Source-Specific Lists:**

| Code List | Entity | Used By |
|:---|:---|:---|
| Revenue Streams | RevenueStreams | Salesforce |
| Billing Cycles | BillingCycles | Salesforce |
| Dunning Strategies | DunningStrategies | Salesforce |

### 3.3 Code List Entry Structure

All code lists share a common structure:

| Field | Purpose |
|:---|:---|
| code | Technical value stored in database |
| locale | Language (en, de) |
| name | Display text shown to users |
| description | Help text explaining the option |
| isActive | Whether option is selectable |

**Best Practices:**

- **Use meaningful codes**: "NET30" is clearer than "PT001"
- **Always add translations**: German users need German labels
- **Deactivate, don't delete**: Historical data uses old codes
- **Add descriptions**: Help users choose correctly

### 3.4 Adding a New Code List Entry

Let's walk through adding a new payment term:

**Step 1: Open Payment Terms**
Navigate to Admin Config > Code Lists > Payment Terms

**Step 2: Add English Entry**
Click "Add Entry" and fill in:
- Code: NET120
- Locale: en
- Name: Net 120 Days
- Description: Payment due within 120 days of invoice
- Is Active: Yes

**Step 3: Add German Translation**
Click "Add Entry" again:
- Code: NET120
- Locale: de
- Name: Netto 120 Tage
- Description: Zahlung innerhalb von 120 Tagen fällig
- Is Active: Yes

**Step 4: Clear Cache**
Click "Clear Cache" to apply changes immediately

**Step 5: Verify**
Open Coupa Request App and verify NET120 appears in Payment Terms dropdown

---

## 4. Cache Management

### 4.1 Why Caching Exists

For performance reasons, the application caches:
- Validation rules (loaded once, applied to every request)
- Code list values (loaded once, displayed in every dropdown)
- Field labels (loaded once, shown in every form)

Without caching, every page load would require dozens of database queries to fetch the same reference data. Caching reduces database load and improves response times.

### 4.2 Cache Invalidation

The tradeoff of caching is that changes aren't immediately reflected. When you add a new validation rule, the running application continues using its cached copy until:
- The cache expires (TTL-based)
- The cache is manually cleared
- The application restarts

### 4.3 Manual Cache Clear

The Admin Config App provides a "Clear Cache" function:

**Location:** Admin Config > System > Clear Cache

**What It Does:**
1. Clears validation rule cache
2. Clears code list cache
3. Clears field label cache
4. In clustered environments, broadcasts to all instances

**When to Use:**
- After adding or modifying validation rules
- After adding or modifying code list entries
- When troubleshooting unexpected validation behavior
- When changes aren't appearing in the applications

**Confirmation Dialog:**
A warning explains that cache clearing affects all applications and asks for confirmation. This prevents accidental clicks.

---

## 5. Read-Only Configuration

Some configuration is managed by the application itself and should not be modified through this interface:

**Status Values (OverallStatuses):**
Status codes are tightly coupled with application logic. Changing them could break workflows.

**Status Transitions:**
The state machine is defined in code because it represents core business logic.

**Source Systems:**
Source system identifiers are tied to integration configurations and authentication.

**Request Types:**
Create and Change are fundamental to the workflow and shouldn't be modified.

These entities are displayed for reference but editing is disabled.

---

## 6. Audit Trail

### 6.1 What's Logged

Every configuration change is automatically logged:

| Field | Description |
|:---|:---|
| Timestamp | When the change was made |
| User | Who made the change |
| Entity | What was changed (ValidationRules, PaymentTerms) |
| Record ID | Which specific record |
| Action | CREATE, UPDATE, DELETE |
| Old Value | Previous value (for updates) |
| New Value | New value |

### 6.2 Why Audit Matters

The audit trail enables:
- **Troubleshooting**: "Who changed that rule that's now causing errors?"
- **Accountability**: "Was this change authorized?"
- **Rollback**: "What was the previous value we need to restore?"
- **Compliance**: "Can we prove who changed what and when?"

### 6.3 Viewing Audit History

Administrators can view the audit trail for any configuration entity. This is particularly useful when investigating issues that started suddenly - you can correlate the timing with recent configuration changes.

---

## 7. Best Practices

### 7.1 Rule Management Best Practices

**Always Test First:**
Before activating any rule, test it against sample payloads. A broken validation can block all users from submitting requests.

**Use Clear Error Messages:**
"Field is invalid" is unhelpful. "Partner name must be at least 3 characters" tells users exactly what to fix.

**Document Business Rules:**
The "Business Rule" field should explain WHY the rule exists, not just what it checks. Future administrators will thank you.

**Use Consistent Naming:**
Establish naming conventions:
- REQ_ for required field checks
- VAL_ for format validations
- MIN_ for minimum length/count
- MAX_ for maximum length/count

### 7.2 Code List Best Practices

**Always Add Both Locales:**
If you add an English entry, add the German translation immediately. Some users see only German.

**Deactivate Instead of Delete:**
Historical records reference code values. Deleting breaks reports and audits.

**Add Descriptions:**
Not everyone knows what "NET EOM" means. Descriptions clarify options.

**Coordinate Changes:**
Before changing codes, check if other systems depend on them (integrations, reports, etc.).

---

## 8. API Endpoints

The Admin Config App exposes OData endpoints (UI and authorized system use only):

| Endpoint | Method | Description |
|:---|:---|:---|
| `/ValidationRules` | GET | List rules |
| `/ValidationRules` | POST | Create rule |
| `/ValidationRules({ID})` | PATCH | Update rule |
| `/ValidationRules({ID})` | DELETE | Delete rule |
| `/PaymentTerms` | GET/POST | Manage payment terms |
| `/AddressTypes` | GET/POST | Manage address types |
| `/admin/clearCache` | POST | Clear all caches |
