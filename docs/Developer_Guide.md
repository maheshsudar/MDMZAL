# Developer Guide

## 1. Getting Started

### Prerequisites
*   Node.js (v18+)
*   SQLite (for local development)
*   SAP CDS DK (`npm install -g @sap/cds-dk`)

### Installation
```bash
git clone <repository-url>
cd mdm-approval-app
npm install
```

### Running Locally
1.  **Initialize Database**:
    ```bash
    cds deploy --to sqlite
    ```
2.  **Start Server**:
    ```bash
    npm start
    ```
    The server runs at `http://localhost:4004`.

### Testing
*   **Unit Tests**: `npm test`
*   **Integration Tests**: `npm run test:integration`

---

## 2. Project Structure

*   `app/`: Fiori applications (UI). Each folder is a separate UI5 app.
*   `db/`: Data model definitions (`schema.cds`).
*   `srv/`: Service definitions and logic (`service.cds`, `service.js`).
    *   `lib/`: Shared logic (Validation, Utils).
    *   `integration/`: Mock integration services.
*   `docs/`: Project documentation.

---

## 3. Key Concepts

### Dynamic Validation
Validation logic is **not** hardcoded in the service handlers for the most part. Instead, it uses a `ValidationService` (`srv/lib/validation-service.js`) that reads rules from the `ValidationRules` database table.

**Adding a Rule:**
1.  Go to the **Admin Config App**.
2.  Create a new Rule.
3.  Specify Context (e.g., Source: `Coupa`, Field: `paymentTerms`).
4.  Specify Rule (e.g., `Required`).

### Service Projections
All Apps operate on the same physical table (`mdm.db.BusinessPartnerRequests`). However, each service exposes a specific **Projection** of this table.
*   `CoupaService` projects fields relevant to Coupa.
*   `SalesforceService` projects fields relevant to Salesforce (and includes `SubAccounts`).
*   **Tip**: If a field is missing in an App, check the Service Projection in `srv/<service>.cds`.

### Integration API
The `srv/integration-api.js` file handles inbound REST calls. It bypasses the standard CAP OData handlers for performance and flexibility but writes to the same database.

---

## 4. Extension Guide

### Adding a New Field
1.  **Database**: Add field to `db/data-model.cds` under `BusinessPartnerRequests`.
2.  **Service**: Add field to relevant Service Projections in `srv/*.cds`.
3.  **UI**: Add field to `app/<app-name>/annotations.cds` (LineItem, Facets).
4.  **Integration**: Update `Integration_Request_Schema.md` and `srv/integration-api.js` if the field needs to be received from API.

### Adding a New Source System
1.  Add entry to `SourceSystems` code list (via CSV or Admin App).
2.  Create new Fiori App in `app/` (copy existing request app).
3.  Create new Service in `srv/` (copy existing service).
4.  Define specific Validation Rules in Admin App.
