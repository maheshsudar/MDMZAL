# Technical Implementation Details

## 1. Project Structure

*   `app/`: Fiori applications (UI). Each folder is a separate UI5 app.
*   `db/`: Data model definitions (`schema.cds`).
*   `srv/`: Service definitions and logic (`service.cds`, `service.js`).
    *   `lib/`: Shared logic (Validation, Utils).
    *   `integration/`: Mock integration services.

## 2. Key Concepts

### Dynamic Validation
Validation logic uses a `ValidationService` that reads rules from the `ValidationRules` database table.

**Adding a Rule:**
1.  Go to the **Admin Config App**.
2.  Create a new Rule.
3.  Specify Context (e.g., Source: `Coupa`, Field: `paymentTerms`).
4.  Specify Rule (e.g., `Required`).

### Service Projections
All Apps operate on the same physical table (`mdm.db.BusinessPartnerRequests`). However, each service exposes a specific **Projection** of this table.
*   `CoupaService` projects fields relevant to Coupa.
*   `SalesforceService` projects fields relevant to Salesforce (and includes `SubAccounts`).

### Integration API
The `srv/integration-api.js` file handles inbound REST calls. It bypasses the standard CAP OData handlers for performance and flexibility but writes to the same database.

## 3. Extension Guide

### Adding a New Field
1.  **Database**: Add field to `db/data-model.cds` under `BusinessPartnerRequests`.
2.  **Service**: Add field to relevant Service Projections in `srv/*.cds`.
3.  **UI**: Add field to `app/<app-name>/annotations.cds` (LineItem, Facets).
4.  **Integration**: Update `Integration_Schema.md` and `srv/integration-api.js`.
