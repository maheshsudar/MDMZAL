# Application Development Task List

**Project:** Business Partner Management System
**Created:** 2026-01-17

---

## How to Use This List

This task list contains all **development tasks** grouped by functionality area. Assign sprint numbers as needed.

---

## 1. Data Layer & Core Services

### Database & Entities

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Define CDS data model (BusinessPartnerRequests, child entities) | P0 | 8h | | [ ] |
| Create seed data for code lists (CSV files) | P0 | 4h | | [ ] |
| Implement data model associations and compositions | P0 | 4h | | [ ] |
| Add computed fields and virtual properties | P1 | 3h | | [ ] |
| Implement change tracking entity (ChangeLogs) | P0 | 4h | | [ ] |
| Create DuplicateChecks entity | P1 | 3h | | [ ] |
| Create ChangeNotifications entity | P0 | 3h | | [ ] |

### Core Backend Services

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Implement request number generator (SALESFORCE-XXX, COUPA-XXX, ADHOC-XXX) | P0 | 4h | | [ ] |
| Implement error handler utility | P0 | 3h | | [ ] |
| Implement input validator (sanitization) | P0 | 4h | | [ ] |
| Implement field-label mapper | P1 | 3h | | [ ] |
| Implement caching layer for code lists | P1 | 4h | | [ ] |

---

## 2. Validation Framework

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Create ValidationRules entity and seed data | P0 | 4h | | [ ] |
| Create SectionValidationRules entity | P0 | 3h | | [ ] |
| Implement validation-service.js | P0 | 8h | | [ ] |
| Implement custom validators (IBAN, email, VAT format) | P0 | 6h | | [ ] |
| Implement field-level validation engine | P0 | 6h | | [ ] |
| Implement section-level validation (MinCount) | P0 | 4h | | [ ] |
| Implement Create vs Change validation logic | P0 | 4h | | [ ] |
| Implement fallback rules when no specific rule exists | P1 | 3h | | [ ] |
| Implement validation rule caching | P1 | 3h | | [ ] |

---

## 3. MDM Approval App - Backend

### Core MDM Service

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Create MDM service CDS definition | P0 | 4h | | [ ] |
| Implement MDM service main handler (mdm-service.js) | P0 | 8h | | [ ] |
| Implement approveRequest action | P0 | 4h | | [ ] |
| Implement rejectRequest action | P0 | 4h | | [ ] |
| Implement checkDuplicates action | P0 | 6h | | [ ] |
| Implement submit action | P0 | 4h | | [ ] |
| Implement status transition logic | P0 | 6h | | [ ] |

### Compliance Checks

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Implement performAEBCheck action | P0 | 6h | | [ ] |
| Implement AEB service (aeb-service.js) | P0 | 8h | | [ ] |
| Implement enhanced AEB service with retry | P1 | 4h | | [ ] |
| Implement performVIESCheck action | P0 | 6h | | [ ] |
| Implement VIES service (vies-service.js) | P0 | 6h | | [ ] |
| AEB mock service for testing | P1 | 3h | | [ ] |
| VIES mock service for testing | P1 | 3h | | [ ] |

### Adhoc Sync

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Implement validateAndFetchSAPBP function | P0 | 4h | | [ ] |
| Implement createAdhocSyncRequest action | P0 | 6h | | [ ] |
| Implement ADHOC-XXX request number generation | P0 | 2h | | [ ] |

### Status Management

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Implement updateSAPStatus action | P0 | 3h | | [ ] |
| Implement updateSatelliteStatus action | P0 | 3h | | [ ] |
| Implement updateSAPIdStatus action | P0 | 3h | | [ ] |
| Implement status transition validation | P0 | 4h | | [ ] |

### Modular Handlers

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Create approval-handler.js | P1 | 4h | | [ ] |
| Create aeb-compliance-handler.js | P1 | 4h | | [ ] |
| Create vies-validation-handler.js | P1 | 4h | | [ ] |
| Create duplicate-check-handler.js | P1 | 4h | | [ ] |
| Create status-update-handler.js | P1 | 4h | | [ ] |

---

## 4. MDM Approval App - Frontend

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Create MDM Fiori Elements List Report | P0 | 6h | | [ ] |
| Create MDM Object Page with all sections | P0 | 8h | | [ ] |
| Implement General Information section | P0 | 4h | | [ ] |
| Implement Payment Information section | P0 | 3h | | [ ] |
| Implement Addresses section table | P0 | 4h | | [ ] |
| Implement Bank Accounts section table | P0 | 4h | | [ ] |
| Implement VAT IDs section table | P1 | 3h | | [ ] |
| Implement Identifications section table | P0 | 3h | | [ ] |
| Implement Emails section table | P1 | 3h | | [ ] |
| Implement AEB Compliance section | P0 | 4h | | [ ] |
| Implement VIES Validation section | P0 | 4h | | [ ] |
| Implement Duplicate Partners section | P0 | 4h | | [ ] |
| Implement Change Log section | P0 | 4h | | [ ] |
| Implement Approval History section | P1 | 3h | | [ ] |
| Implement Approve button and dialog | P0 | 3h | | [ ] |
| Implement Reject button and dialog | P0 | 3h | | [ ] |
| Implement Check Duplicates button | P0 | 3h | | [ ] |
| Implement AEB Check button | P0 | 3h | | [ ] |
| Implement VIES Check button | P0 | 3h | | [ ] |
| Implement Adhoc Sync creation dialog | P0 | 4h | | [ ] |
| Implement status-based field editability | P0 | 4h | | [ ] |
| Implement status-based button visibility | P0 | 4h | | [ ] |

---

## 5. Salesforce Request App - Backend

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Create Salesforce service CDS definition | P0 | 4h | | [ ] |
| Implement Salesforce service handler | P0 | 6h | | [ ] |
| Implement submit action | P0 | 4h | | [ ] |
| Implement checkDuplicates action | P0 | 4h | | [ ] |
| Implement getSAPPartnerDetails function | P0 | 4h | | [ ] |
| Implement importSAPPartner function | P0 | 4h | | [ ] |
| Implement searchSAPPartners function | P0 | 4h | | [ ] |
| Implement createChangeRequestFromSAP action | P0 | 4h | | [ ] |
| Implement receiveCreateCallback action | P1 | 4h | | [ ] |
| Implement receiveUpdateCallback action | P1 | 4h | | [ ] |
| Implement Salesforce-specific validations | P0 | 4h | | [ ] |
| Implement mandatory email validation | P0 | 2h | | [ ] |

---

## 6. Salesforce Request App - Frontend

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Create Salesforce Fiori Elements List Report | P0 | 6h | | [ ] |
| Create Salesforce Object Page | P0 | 6h | | [ ] |
| Implement General Information section | P0 | 4h | | [ ] |
| Implement Payment Information section | P0 | 3h | | [ ] |
| Implement Addresses section with CRUD | P0 | 4h | | [ ] |
| Implement Emails section (MANDATORY) | P0 | 4h | | [ ] |
| Implement Bank Accounts section | P1 | 4h | | [ ] |
| Implement VAT IDs section | P1 | 3h | | [ ] |
| Implement Identifications section | P0 | 3h | | [ ] |
| Implement Sub-Accounts section | P0 | 6h | | [ ] |
| Implement Change Log section | P0 | 3h | | [ ] |
| Implement Submit button | P0 | 2h | | [ ] |
| Implement Check Duplicates button | P0 | 2h | | [ ] |
| Implement Search SAP Partners dialog | P0 | 4h | | [ ] |
| Implement Import SAP Partner flow | P0 | 4h | | [ ] |
| Implement draft/submitted editability | P0 | 4h | | [ ] |

---

## 7. Coupa Request App - Backend

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Create Coupa service CDS definition | P0 | 4h | | [ ] |
| Implement Coupa service handler | P0 | 6h | | [ ] |
| Implement submit action | P0 | 4h | | [ ] |
| Implement checkDuplicates action | P0 | 4h | | [ ] |
| Implement getSAPPartnerDetails function | P0 | 4h | | [ ] |
| Implement importSAPPartner function | P0 | 4h | | [ ] |
| Implement searchSAPPartners function | P0 | 4h | | [ ] |
| Implement createChangeRequestFromSAP action | P0 | 4h | | [ ] |
| Implement Coupa-specific validations | P0 | 4h | | [ ] |
| Implement mandatory payment terms/method validation | P0 | 2h | | [ ] |
| Implement mandatory identification validation (MIN 1) | P0 | 2h | | [ ] |
| Implement banking validation (IBAN, SWIFT) | P0 | 4h | | [ ] |

---

## 8. Coupa Request App - Frontend

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Create Coupa Fiori Elements List Report | P0 | 6h | | [ ] |
| Create Coupa Object Page | P0 | 6h | | [ ] |
| Implement General Information section (entityType=Supplier default) | P0 | 4h | | [ ] |
| Implement Payment Information section (MANDATORY fields) | P0 | 4h | | [ ] |
| Implement Addresses section | P0 | 4h | | [ ] |
| Implement Bank Accounts section (CRITICAL) | P0 | 5h | | [ ] |
| Implement VAT IDs section | P1 | 3h | | [ ] |
| Implement Identifications section (MIN 1 required) | P0 | 4h | | [ ] |
| Implement Change Log section | P0 | 3h | | [ ] |
| Implement Submit button | P0 | 2h | | [ ] |
| Implement Check Duplicates button | P0 | 2h | | [ ] |
| Implement Search SAP Partners dialog | P0 | 4h | | [ ] |

---

## 9. PI Request App - Backend

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Create PI service CDS definition | P0 | 4h | | [ ] |
| Implement PI service handler | P0 | 6h | | [ ] |
| Implement submit action | P0 | 4h | | [ ] |
| Implement checkDuplicates action | P0 | 4h | | [ ] |
| Implement getSAPPartnerDetails function | P0 | 4h | | [ ] |
| Implement importSAPPartner function | P0 | 4h | | [ ] |
| Implement searchSAPPartners function | P0 | 4h | | [ ] |
| Implement createChangeRequestFromSAP function | P0 | 4h | | [ ] |
| Implement PI-specific validations | P0 | 4h | | [ ] |
| Implement mandatory address validation (MIN 1) | P0 | 2h | | [ ] |
| Implement mandatory identification validation (MIN 1) | P0 | 2h | | [ ] |

---

## 10. PI Request App - Frontend

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Create PI Fiori Elements List Report | P0 | 6h | | [ ] |
| Create PI Object Page | P0 | 6h | | [ ] |
| Implement General Information section (entityType=Supplier default) | P0 | 4h | | [ ] |
| Implement Payment Information section | P1 | 3h | | [ ] |
| Implement Addresses section (MIN 1 required) | P0 | 4h | | [ ] |
| Implement Bank Accounts section | P1 | 4h | | [ ] |
| Implement VAT IDs section | P1 | 3h | | [ ] |
| Implement Identifications section (MIN 1 required) | P0 | 4h | | [ ] |
| Implement Change Log section | P0 | 3h | | [ ] |
| Implement Submit button | P0 | 2h | | [ ] |
| Implement Check Duplicates button | P0 | 2h | | [ ] |

---

## 11. Satellite Acknowledgement App

### Backend

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Create Satellite Acknowledgement service CDS | P0 | 4h | | [ ] |
| Implement service handler | P0 | 4h | | [ ] |
| Implement acknowledge action | P0 | 4h | | [ ] |
| Filter by target system (Coupa, Salesforce, PI views) | P0 | 3h | | [ ] |

### Frontend

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Create Satellite Acknowledgement List Report | P0 | 6h | | [ ] |
| Create Notification Object Page (read-only) | P0 | 4h | | [ ] |
| Implement notification details display | P0 | 3h | | [ ] |
| Implement payload display | P0 | 3h | | [ ] |
| Implement Change Log display | P0 | 3h | | [ ] |
| Implement Acknowledge button | P0 | 2h | | [ ] |

---

## 12. Admin Config App

### Backend

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Create Admin service CDS definition | P0 | 4h | | [ ] |
| Implement Admin service handler | P0 | 6h | | [ ] |
| Implement toggleActive action (validation rules) | P0 | 2h | | [ ] |
| Implement duplicate action (clone rule) | P0 | 3h | | [ ] |
| Implement testValidation action | P0 | 4h | | [ ] |
| Implement updateRulePriorities action | P1 | 3h | | [ ] |
| Implement cloneValidationRules action | P1 | 4h | | [ ] |
| Implement getApplicableValidationRules function | P0 | 4h | | [ ] |
| Implement getValidationStatistics function | P2 | 3h | | [ ] |
| Implement cache clear functionality | P1 | 2h | | [ ] |

### Frontend

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Create Admin Config List Report | P0 | 6h | | [ ] |
| Create Validation Rules management page | P0 | 6h | | [ ] |
| Create Code Lists management page | P0 | 5h | | [ ] |
| Implement rule CRUD operations | P0 | 4h | | [ ] |
| Implement code list entry CRUD | P0 | 4h | | [ ] |
| Implement test validation dialog | P1 | 3h | | [ ] |
| Implement cache management UI | P2 | 3h | | [ ] |

---

## 13. SAP Integration

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Create integration API CDS | P0 | 4h | | [ ] |
| Implement SAP Partner Service (shared) | P0 | 8h | | [ ] |
| Implement Create BP sync payload generation | P0 | 6h | | [ ] |
| Implement Change BP sync payload generation | P0 | 6h | | [ ] |
| Implement updateIntegrationData callback handler | P0 | 6h | | [ ] |
| Implement SAP ID writeback logic | P0 | 4h | | [ ] |
| Implement SAP mock service for testing | P1 | 4h | | [ ] |

---

## 14. Satellite Notifications Integration

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Implement Notification Service | P0 | 6h | | [ ] |
| Implement callback payload builder | P0 | 4h | | [ ] |
| Implement Salesforce callback | P0 | 4h | | [ ] |
| Implement Coupa callback | P0 | 4h | | [ ] |
| Implement PI callback | P0 | 4h | | [ ] |
| Implement satellite mock service for testing | P1 | 4h | | [ ] |

---

## 15. Duplicate Detection

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Implement Duplicate Checker service (shared) | P0 | 8h | | [ ] |
| Implement fuzzy name matching | P0 | 4h | | [ ] |
| Implement VAT ID matching | P0 | 3h | | [ ] |
| Implement DUNS matching | P0 | 2h | | [ ] |
| Implement existing partners search | P0 | 4h | | [ ] |
| Implement match scoring | P0 | 4h | | [ ] |

---

## 16. Change Tracking

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Implement Change Tracker service | P0 | 6h | | [ ] |
| Track field-level changes | P0 | 4h | | [ ] |
| Track child entity changes (addresses, banks, etc.) | P0 | 4h | | [ ] |
| Implement change type detection (Modified, Created, Deleted) | P0 | 3h | | [ ] |
| Preserve SAP IDs during change requests | P0 | 4h | | [ ] |

---

## 17. Testing

### Unit Tests

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Unit tests for validation service | P0 | 6h | | [ ] |
| Unit tests for custom validators | P0 | 4h | | [ ] |
| Unit tests for request number generator | P1 | 2h | | [ ] |
| Unit tests for duplicate checker | P0 | 4h | | [ ] |
| Unit tests for change tracker | P0 | 4h | | [ ] |

### Integration Tests

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Integration tests for MDM approval flow | P0 | 8h | | [ ] |
| Integration tests for Salesforce request flow | P0 | 6h | | [ ] |
| Integration tests for Coupa request flow | P0 | 6h | | [ ] |
| Integration tests for PI request flow | P0 | 6h | | [ ] |
| Integration tests for SAP sync | P0 | 6h | | [ ] |
| Integration tests for compliance checks | P1 | 4h | | [ ] |

### E2E Tests

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| E2E test: Create Salesforce request end-to-end | P0 | 8h | | [ ] |
| E2E test: Create Coupa request end-to-end | P0 | 8h | | [ ] |
| E2E test: Approval workflow end-to-end | P0 | 8h | | [ ] |
| E2E test: Adhoc sync end-to-end | P1 | 4h | | [ ] |

---

## 18. Security & Authorization

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Define roles (SalesforceUser, CoupaUser, PIUser, MDMApprover, SystemOwner) | P0 | 2h | | [ ] |
| Implement role-based access on services | P0 | 4h | | [ ] |
| Implement row-level security | P1 | 4h | | [ ] |
| Implement action-level authorization | P0 | 3h | | [ ] |
| Security testing | P0 | 4h | | [ ] |

---

## 19. Deployment & DevOps

| Task | Priority | Effort | Sprint | Status |
|:-----|:---------|-------:|:------:|:-------|
| Create MTA build configuration | P0 | 4h | | [ ] |
| Configure BTP deployment | P0 | 6h | | [ ] |
| Set up CI/CD pipeline | P1 | 8h | | [ ] |
| Configure environment variables | P0 | 2h | | [ ] |
| Create deployment documentation | P1 | 3h | | [ ] |

---

## Summary Statistics

| Area | P0 Tasks | P1 Tasks | P2 Tasks | Total Est. Hours |
|:-----|:--------:|:--------:|:--------:|:----------------:|
| Data Layer & Core | 9 | 3 | 0 | 40h |
| Validation Framework | 7 | 2 | 0 | 41h |
| MDM Backend | 18 | 7 | 0 | 95h |
| MDM Frontend | 19 | 2 | 0 | 85h |
| Salesforce Backend | 10 | 2 | 0 | 48h |
| Salesforce Frontend | 13 | 2 | 0 | 60h |
| Coupa Backend | 10 | 0 | 0 | 48h |
| Coupa Frontend | 10 | 1 | 0 | 48h |
| PI Backend | 9 | 0 | 0 | 42h |
| PI Frontend | 8 | 2 | 0 | 40h |
| Satellite Ack | 8 | 0 | 0 | 34h |
| Admin Config | 10 | 4 | 2 | 56h |
| SAP Integration | 6 | 1 | 0 | 38h |
| Satellite Notifications | 5 | 1 | 0 | 26h |
| Duplicate Detection | 6 | 0 | 0 | 25h |
| Change Tracking | 5 | 0 | 0 | 21h |
| Testing | 11 | 3 | 0 | 76h |
| Security | 4 | 1 | 0 | 17h |
| Deployment | 3 | 2 | 0 | 23h |
| **TOTAL** | **171** | **33** | **2** | **~863h** |

---

## Priority Legend

| Priority | Meaning |
|:---------|:--------|
| **P0** | Critical - Core functionality, must complete |
| **P1** | Important - Enhances system, should complete |
| **P2** | Nice to have - Can defer |

---

## Acceptance Criteria

Each feature must:
- [ ] Pass unit tests
- [ ] Pass integration tests where applicable
- [ ] Be code reviewed
- [ ] Have error handling implemented
- [ ] Have logging implemented
- [ ] Meet security requirements
