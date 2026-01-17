# Compliance Integration Specification

**Version:** 2.0
**Date:** 2026-01-17
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose

This document provides comprehensive technical specifications for the compliance integration services used in the Business Partner Management System. These services ensure that every Business Partner entering SAP S/4HANA has been screened for regulatory compliance.

Compliance screening is not optional - it's a legal requirement for global businesses. Companies that trade with sanctioned parties face severe penalties including fines, criminal prosecution, and reputational damage. This system automates the compliance check process as part of the Business Partner onboarding workflow.

### 1.2 Compliance Services Overview

The system integrates with two compliance services:

**AEB Trade Compliance (Sanctions Screening):**
Screens business partners against global sanctions and restricted party lists. This includes lists maintained by the US (OFAC), European Union, United Nations, and United Kingdom. When a potential match is found, the system alerts MDM Stewards and can block approval for high-risk matches.

**VIES VAT Validation (Tax Compliance):**
Validates EU VAT numbers against the official European Commission database. This ensures that suppliers claiming VAT exemption for intra-EU trade actually have valid VAT registrations. Invalid VAT numbers could indicate fraud or simple data entry errors.

### 1.3 When Compliance Checks Run

Compliance checks are triggered at specific points:

| Trigger | Check Type | Mandatory |
|:---|:---|:---|
| Request submitted | AEB (if addresses present) | No |
| MDM clicks "AEB Check" | AEB | No |
| MDM clicks "VIES Check" | VIES | No |
| Before approval | AEB (if status=Blocked) | Yes |

The system design allows flexibility - checks can run automatically or on-demand - but blocks approval for high-risk situations.

### 1.4 Cross-References

| Document | Description |
|:---|:---|
| [MDM Approval App](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Functional_Spec_MDM_Approval_App.md) | How compliance results affect approval |
| [Common Architecture](file:///c:/Users/msudarsanan/.gemini/antigravity/brain/4c48700f-4a4c-4049-97a6-ff6f1821b397/Functional_Spec_Common_Architecture.md) | Compliance status fields in data model |

---

## 2. AEB Trade Compliance Integration

### 2.1 What is AEB Compliance Screening?

AEB (Advanced Export Business) provides trade compliance services that help companies avoid doing business with sanctioned parties. Their service screens names and addresses against authoritative lists of restricted parties maintained by governments and international organizations.

**Why This Matters:**

Imagine your company is about to onboard a new supplier. Everything looks fine - they have a valid address, bank account, and tax registration. But they happen to share a name similar to an entity on the OFAC sanctions list. Without screening, you might unknowingly enter into a business relationship that violates US sanctions law.

The AEB integration catches these situations before they become problems.

### 2.2 Sanctions Lists Covered

The AEB service screens against multiple authoritative lists:

**OFAC - Office of Foreign Assets Control (US):**
The US Treasury maintains lists of Specially Designated Nationals (SDN) and blocked persons. US companies and companies using US dollars are prohibited from doing business with listed parties.

**EU Consolidated Sanctions List:**
The European Union maintains a list of individuals, entities, and countries subject to EU sanctions. European companies must screen against this list.

**UN Security Council Consolidated List:**
The United Nations maintains a list of individuals and entities subject to UN sanctions. These sanctions are binding on all UN member states.

**UK Sanctions List:**
Post-Brexit, the UK maintains its own sanctions regime. Companies trading with the UK must screen against this list.

### 2.3 API Endpoint

| Property | Value |
|:---|:---|
| Production URL | `https://rz3.aeb.de/test4ce/rest/ComplianceScreening/screenAddresses` |
| Method | `POST` |
| Authentication | API Key + Client ID |
| Content-Type | `application/json` |
| **Developer Reference** | [https://trade-compliance.docs.developers.aeb.com/reference/screenaddresses](https://trade-compliance.docs.developers.aeb.com/reference/screenaddresses) |

### 2.4 How Screening Works

The screening process follows these steps:

**Step 1: Prepare Addresses**
The system extracts all addresses from the Business Partner request. Each address includes the partner name, street, city, postal code, and country.

**Step 2: Call AEB API**
The addresses are sent to the AEB API in a structured JSON format. The API processes each address against all configured sanctions lists.

**Step 3: Analyze Results**
AEB returns a risk assessment for each address, including:
- Whether any matches were found
- A risk score (0-100)
- Details of any matching list entries
- Recommended action (Pass, Review, Blocked)

**Step 4: Update Request**
The system stores the screening results on the request:
- aebStatus: Overall status (Pass, Warning, Blocked)
- aebCheckDate: When the check was performed
- Detailed findings for MDM review

### 2.5 Request Schema

When calling the AEB API, the system sends:

```json
{
  "screeningParameters": {
    "considerGoodGuys": true,
    "screeningLists": ["OFAC", "EU", "UN", "UK"],
    "matchTolerance": "MEDIUM"
  },
  "addresses": [
    {
      "referenceId": "ADDR_001",
      "name": "Company Name GmbH",
      "street": "Hauptstrasse 123",
      "city": "Berlin",
      "postalCode": "10115",
      "countryISO": "DE",
      "additionalInfo": {
        "addressType": "Business",
        "isMainAddress": true
      }
    }
  ]
}
```

**Understanding the Parameters:**

- **considerGoodGuys**: If true, the system checks against a "good guy" list of known-safe entities. This reduces false positives for common company names.

- **screeningLists**: Specifies which sanctions lists to check. The system checks all major lists by default.

- **matchTolerance**: Controls how strictly names are matched. MEDIUM tolerance catches spelling variations and transliterations while avoiding excessive false positives.

- **addresses**: Array of addresses to screen. Each has a referenceId for tracking and country information that helps with regional sanctions.

### 2.6 Response Schema

The AEB API returns:

```json
{
  "screeningId": "AEB-1705493943000-ABC123",
  "screeningDate": "2026-01-17T12:00:00Z",
  "results": [
    {
      "referenceId": "ADDR_001",
      "matchFound": true,
      "wasGoodGuy": false,
      "riskScore": 75,
      "status": "Review",
      "hits": [
        {
          "listName": "OFAC SDN",
          "matchScore": 85,
          "matchedName": "Similar Company Name",
          "listEntryId": "OFAC-12345",
          "matchType": "NAME",
          "remarks": "Potential SDN match - manual review required"
        }
      ],
      "details": {
        "countriesOfConcern": ["RU", "IR"],
        "sanctionPrograms": ["UKRAINE-EO13660"]
      }
    }
  ],
  "summary": {
    "totalAddresses": 1,
    "matchesFound": 1,
    "blockedCount": 0,
    "reviewCount": 1,
    "passedCount": 0,
    "maxRiskScore": 75
  }
}
```

**Interpreting the Response:**

- **screeningId**: Unique ID for audit trail purposes
- **riskScore**: 0-100 score indicating risk level
- **status**: Recommended action (Pass, Review, Blocked)
- **hits**: Array of matching list entries with details
- **matchScore**: How closely the name matches (0-100)
- **listName**: Which sanctions list triggered the match

### 2.7 Risk Score Thresholds

The system interprets risk scores as follows:

| Score Range | AEB Status | MDM Action | Approval Allowed |
|:---|:---|:---|:---|
| 0-29 | **Pass** | Proceed normally | Yes |
| 30-69 | **Warning** | Manual review recommended | Yes (with caution) |
| 70-89 | **Review** | **Manual review required** | Yes (after review) |
| 90-100 | **Blocked** | **Cannot proceed** | **NO** |

When a request has AEB Status = "Blocked", the Approve button is disabled in the MDM Approval App.

### 2.8 Mock Service for Development

For development and testing, a mock service simulates AEB responses:

**High-Risk Triggers:**
- Address in sanctioned countries (RU, IR, KP, SY, CU)
- Name containing suspicious keywords
- Matches against test entity names

**Environment Variable:**
Set `AEB_USE_MOCK=true` to use the mock service instead of calling the real API.

---

## 3. VIES VAT Validation Integration

### 3.1 What is VIES?

VIES (VAT Information Exchange System) is a search engine owned by the European Commission that allows businesses to verify VAT numbers of companies registered in EU member states. It's the authoritative source for VAT registration validation.

**Why This Matters:**

In intra-EU trade, businesses can apply zero-rate VAT when selling to another VAT-registered business in a different EU country. To qualify for this exemption, the buyer's VAT number must be valid. VIES validation ensures the VAT numbers in your system are legitimate.

Invalid VAT numbers could indicate:
- Data entry errors (typos in the VAT number)
- Outdated information (company deregistered)
- Fraud attempts (fake VAT numbers)

### 3.2 Supported Countries

VIES validates VAT numbers for all EU member states:

| Code | Country | VAT Format |
|:---|:---|:---|
| AT | Austria | ATU + 8 digits |
| BE | Belgium | BE + 10 digits |
| BG | Bulgaria | BG + 9-10 digits |
| CY | Cyprus | CY + 8 digits + letter |
| CZ | Czech Republic | CZ + 8-10 digits |
| **DE** | **Germany** | **DE + 9 digits** |
| DK | Denmark | DK + 8 digits |
| EE | Estonia | EE + 9 digits |
| EL | Greece | EL + 9 digits |
| ES | Spain | ES + letter + 7 digits + letter |
| FI | Finland | FI + 8 digits |
| FR | France | FR + 2 chars + 9 digits |
| HR | Croatia | HR + 11 digits |
| HU | Hungary | HU + 8 digits |
| IE | Ireland | IE + 7 digits + 1-2 letters |
| IT | Italy | IT + 11 digits |
| LT | Lithuania | LT + 9 or 12 digits |
| LU | Luxembourg | LU + 8 digits |
| LV | Latvia | LV + 11 digits |
| MT | Malta | MT + 8 digits |
| NL | Netherlands | NL + 9 digits + B + 2 digits |
| PL | Poland | PL + 10 digits |
| PT | Portugal | PT + 9 digits |
| RO | Romania | RO + 2-10 digits |
| SE | Sweden | SE + 12 digits |
| SI | Slovenia | SI + 8 digits |
| SK | Slovakia | SK + 10 digits |

### 3.3 API Endpoint

VIES uses a SOAP-based web service:

| Property | Value |
|:---|:---|
| WSDL URL | `http://ec.europa.eu/taxation_customs/vies/checkVatService.wsdl` |
| Service URL | `http://ec.europa.eu/taxation_customs/vies/services/checkVatService` |
| Protocol | SOAP 1.1 |
| Operation | `checkVat` |

### 3.4 How Validation Works

**Step 1: Extract VAT Numbers**
The system identifies all VAT IDs on the Business Partner request. Only VAT numbers from EU member states are validated (non-EU VAT numbers skip VIES validation).

**Step 2: Format Validation**
Before calling VIES, the system validates the format. Each country has specific format rules. If the format is invalid, the system returns immediately without calling VIES.

**Step 3: Call VIES Service**
For valid formats, the system calls the VIES SOAP service with the country code and VAT number (without country prefix).

**Step 4: Process Response**
VIES returns:
- Whether the VAT number is valid
- The registered company name (if valid)
- The registered address (if valid)

**Step 5: Update Request**
The system stores:
- viesStatus: Valid, Invalid, or Error
- viesCheckDate: When the check was performed
- Retrieved company information for comparison

### 3.5 Request Format (SOAP)

```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                  xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
   <soapenv:Header/>
   <soapenv:Body>
      <urn:checkVat>
         <urn:countryCode>DE</urn:countryCode>
         <urn:vatNumber>123456789</urn:vatNumber>
      </urn:checkVat>
   </soapenv:Body>
</soapenv:Envelope>
```

**Note:** The VAT number is sent WITHOUT the country prefix. "DE123456789" becomes countryCode="DE" and vatNumber="123456789".

### 3.6 Response Format (SOAP)

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
   <soap:Body>
      <checkVatResponse xmlns="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
         <countryCode>DE</countryCode>
         <vatNumber>123456789</vatNumber>
         <requestDate>2026-01-17+01:00</requestDate>
         <valid>true</valid>
         <name>Company Name GmbH</name>
         <address>Hauptstrasse 123, 10115 Berlin</address>
      </checkVatResponse>
   </soap:Body>
</soap:Envelope>
```

**Response Fields:**
- **valid**: Boolean indicating if the VAT number is registered
- **name**: Official registered company name
- **address**: Official registered address
- **requestDate**: Timestamp of validation

### 3.7 Caching Strategy

To avoid excessive VIES calls and handle service availability issues:

| Property | Value |
|:---|:---|
| Cache TTL | 24 hours |
| Cache Key | `{countryCode}{vatNumber}` |
| Cache Storage | In-memory |

**Why Cache?**
- VIES has rate limits
- VAT registrations don't change frequently
- Reduces latency for repeated checks
- Provides fallback when VIES is unavailable

### 3.8 Error Handling

The VIES service can be unreliable. Common issues:

| Scenario | Handling |
|:---|:---|
| Invalid format | Return immediately with format error |
| VIES unavailable | Retry 2 times with backoff |
| Timeout (10 seconds) | Return error result |
| Network error | Return error result with message |

When VIES is unavailable, the system:
1. Logs the error
2. Returns viesStatus = "Error" with message
3. Does NOT block approval (service issue, not partner issue)
4. Suggests MDM retry later

---

## 4. Implementation in the System

### 4.1 Service Architecture

The compliance services are implemented as CAP (Cloud Application Programming) service modules:

```
srv/
├── lib/
│   ├── enhanced-aeb-service.js    # AEB integration
│   └── vies-service.js            # VIES integration
```

### 4.2 Data Model Integration

Compliance results are stored on the BusinessPartnerRequests entity:

| Field | Type | Description |
|:---|:---|:---|
| aebStatus | String | Pass, Warning, Blocked |
| aebCheckDate | DateTime | When AEB check ran |
| aebScreeningId | String | Reference for audit |
| aebRiskScore | Integer | 0-100 risk score |
| viesStatus | String | Valid, Invalid, Error |
| viesCheckDate | DateTime | When VIES check ran |

### 4.3 Triggering Checks

**Automatic (On Submit):**
When a request is submitted, the system can automatically trigger AEB screening. This is controlled by configuration.

**Manual (MDM Buttons):**
The MDM Approval App has buttons for "Perform AEB Check" and "Perform VIES Check" that run checks on demand.

---

## 5. Environment Configuration

### 5.1 AEB Configuration

| Variable | Description | Default |
|:---|:---|:---|
| `AEB_USE_MOCK` | Use mock service | `true` |
| `AEB_API_URL` | Production API URL | Test endpoint |
| `AEB_API_KEY` | Authentication key | - |
| `AEB_CLIENT_ID` | Client identifier | - |

### 5.2 VIES Configuration

| Variable | Description | Default |
|:---|:---|:---|
| `VIES_ENABLED` | Enable real VIES calls | `false` |
| `VIES_TIMEOUT` | Request timeout (ms) | `10000` |
| `VIES_CACHE_TTL` | Cache duration (hours) | `24` |

---

## 6. Testing

### 6.1 AEB Test Scenarios

| Test Case | Expected Result |
|:---|:---|
| Normal company name | Pass (score < 30) |
| Country in sanctions list | Warning/Review (score 30-70) |
| Name matching SDN list | Blocked (score > 90) |
| API timeout | Error (graceful handling) |

### 6.2 VIES Test Scenarios

| Test Case | Expected Result |
|:---|:---|
| Valid DE VAT | Valid + company info |
| Invalid format | Invalid (format error) |
| Unregistered VAT | Invalid (not found) |
| Service unavailable | Error (with message) |
