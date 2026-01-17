# Satellite Acknowledgement Flow - Playwright Test Guide

## Overview
This guide provides step-by-step Playwright test commands to verify the complete satellite acknowledgement workflow.

## Prerequisites
- Server running on `http://localhost:4004`
- Browser: Chrome/Edge
- Playwright MCP tools available

## Test Flow

### Part 1: Create and Submit Coupa Request

#### Step 1: Navigate to Coupa Requests App
```javascript
await browser_navigate({
    url: "http://localhost:4004/coupa-requests/webapp/index.html"
});

await browser_snapshot({ filename: "01-coupa-requests-home.md" });
```

#### Step 2: Click Create Button
```javascript
await browser_click({
    element: "Create button",
    ref: "[data-testid='fe::table::CoupaRequests::LineItem::StandardAction::Create']"
});

await browser_snapshot({ filename: "02-create-dialog-opened.md" });
```

#### Step 3: Fill Basic Information
```javascript
// Name 1 (Required)
await browser_type({
    element: "Name 1 input field",
    ref: "[id*='name1']",
    text: "Satellite Test Supplier GmbH"
});

// Name 2 (Optional)
await browser_type({
    element: "Name 2 input field",
    ref: "[id*='name2']",
    text: "Technology Division"
});

// Request Type (should be auto-filled as 'Create')
// Status (should be auto-filled as 'Draft')
// Source System (should be auto-filled as 'Coupa')

await browser_snapshot({ filename: "03-basic-info-filled.md" });
```

#### Step 4: Fill Payment Information
```javascript
// Payment Terms
await browser_click({
    element: "Payment Terms dropdown",
    ref: "[id*='paymentTerms_code']"
});

await browser_click({
    element: "NT30 option",
    ref: "[title='NT30']"
});

// Payment Method
await browser_click({
    element: "Payment Method dropdown",
    ref: "[id*='paymentMethod_code']"
});

await browser_click({
    element: "T (Bank Transfer) option",
    ref: "[title='T']"
});

// Currency
await browser_click({
    element: "Currency dropdown",
    ref: "[id*='currency_code']"
});

await browser_click({
    element: "EUR option",
    ref: "[title='EUR']"
});

await browser_snapshot({ filename: "04-payment-info-filled.md" });
```

#### Step 5: Add Address (Required for established VAT check)
```javascript
// Click Add button in Address section
await browser_click({
    element: "Add Address button",
    ref: "[data-testid='fe::table::addresses::LineItem::StandardAction::Create']"
});

// Fill address fields
await browser_type({
    element: "Street field",
    ref: "[id*='street']",
    text: "Hauptstrasse"
});

await browser_type({
    element: "House Number field",
    ref: "[id*='streetNumber']",
    text: "123"
});

await browser_type({
    element: "City field",
    ref: "[id*='city']",
    text: "Munich"
});

await browser_type({
    element: "Postal Code field",
    ref: "[id*='postalCode']",
    text: "80331"
});

// Select Country
await browser_click({
    element: "Country dropdown",
    ref: "[id*='country_code']"
});

await browser_click({
    element: "Germany (DE) option",
    ref: "[title='DE']"
});

// Click OK to save address
await browser_click({
    element: "OK button",
    ref: "button[type='Emphasized']"
});

await browser_snapshot({ filename: "05-address-added.md" });
```

#### Step 6: Save Draft
```javascript
await browser_click({
    element: "Save button",
    ref: "[id*='Save']"
});

await browser_wait_for({ time: 2 });

await browser_snapshot({ filename: "06-draft-saved.md" });
```

#### Step 7: Submit for Approval
```javascript
await browser_click({
    element: "Submit button",
    ref: "[data-testid='fe::HeaderAction::submit']"
});

await browser_wait_for({ time: 2 });

await browser_snapshot({ filename: "07-submitted-for-approval.md" });
```

**Capture Request Number** from the screen for next steps.

---

### Part 2: Approve Request in MDM Approval App

#### Step 8: Navigate to MDM Approval App
```javascript
await browser_navigate({
    url: "http://localhost:4004/mdm-approval/webapp/index.html"
});

await browser_snapshot({ filename: "08-mdm-approval-home.md" });
```

#### Step 9: Filter by Status 'Submitted'
```javascript
await browser_click({
    element: "Filter button",
    ref: "[id*='fe::FilterBar::']"
});

await browser_click({
    element: "Status filter",
    ref: "[id*='status']"
});

await browser_click({
    element: "Submitted option",
    ref: "[title='Submitted']"
});

await browser_click({
    element: "Go button",
    ref: "[id*='Search']"
});

await browser_snapshot({ filename: "09-filtered-submitted-requests.md" });
```

#### Step 10: Click on the Test Request
```javascript
await browser_click({
    element: "Satellite Test Supplier GmbH request",
    ref: "[title='Satellite Test Supplier GmbH']"
});

await browser_wait_for({ time: 2 });

await browser_snapshot({ filename: "10-request-details.md" });
```

#### Step 11: Click Approve Button
```javascript
await browser_click({
    element: "Approve button",
    ref: "[data-testid='fe::HeaderAction::approveRequest']"
});

await browser_wait_for({ time: 2 });

await browser_snapshot({ filename: "11-approval-dialog.md" });
```

#### Step 12: Confirm Approval (if dialog appears)
```javascript
// If there's a confirmation dialog, click OK/Approve
await browser_click({
    element: "Confirm button",
    ref: "button[type='Emphasized']"
});

await browser_wait_for({ time: 3 });

await browser_snapshot({ filename: "12-request-approved.md" });
```

**Important**: After approval, the satellite mock system will automatically:
- Receive the webhook notification
- Wait 2 seconds
- Send acknowledgement back to MDM

---

### Part 3: Verify Acknowledgement

#### Step 13: Wait for Auto-Acknowledgement
```javascript
await browser_wait_for({ time: 3 });
```

#### Step 14: Navigate to Satellite Acknowledgement Admin App
```javascript
await browser_navigate({
    url: "http://localhost:4004/satellite-ack-admin/webapp/index.html"
});

await browser_wait_for({ time: 2 });

await browser_snapshot({ filename: "13-satellite-ack-admin-home.md" });
```

#### Step 15: Verify Acknowledgement Appears
```javascript
// Look for the request in the table
await browser_snapshot({ filename: "14-acknowledgement-found.md" });

// Click on the acknowledgement to see details
await browser_click({
    element: "Satellite Test Supplier GmbH acknowledgement",
    ref: "[title='Satellite Test Supplier GmbH']"
});

await browser_wait_for({ time: 1 });

await browser_snapshot({ filename: "15-acknowledgement-details.md" });
```

## Expected Results

### Acknowledgement Record Should Show:
- ✅ Request Number: COUPA-<timestamp>-<number>
- ✅ Partner Name: Satellite Test Supplier GmbH
- ✅ SAP BP Number: 10xxxxxx (8-digit number)
- ✅ Target System: Coupa
- ✅ Status: Acknowledged
- ✅ Acknowledged By: Coupa System (Auto)
- ✅ Acknowledged At: <timestamp>
- ✅ Comments: "Automatically acknowledged by Coupa system after processing approval"

---

## Troubleshooting

### If No Acknowledgement Appears:

1. **Check Server Logs** for webhook errors:
   ```
   Look for: "📨 [Coupa] Received MDM approval notification"
   Look for: "✅ [Coupa] Sending acknowledgement"
   ```

2. **Check Satellite Mock Received Notifications**:
   ```bash
   curl http://localhost:4004/satellite-mock/received-notifications
   ```

3. **Manually Trigger Acknowledgement** (if auto-ack failed):
   ```bash
   curl -X POST http://localhost:4004/satellite-mock/acknowledge \
     -H "Content-Type: application/json" \
     -d '{
       "requestNumber": "<your-request-number>",
       "targetSystem": "Coupa",
       "acknowledgedBy": "Manual Test",
       "comments": "Manual acknowledgement for testing"
     }'
   ```

4. **Check Auto-Acknowledgement Config**:
   ```bash
   curl -X POST http://localhost:4004/satellite-mock/config/auto-acknowledge \
     -H "Content-Type: application/json" \
     -d '{
       "enabled": true,
       "delayMs": 2000
     }'
   ```

---

## Success Criteria

✅ Request created and submitted successfully
✅ Request approved in MDM Approval app
✅ Status changed to "Approved"
✅ SAP BP Number generated
✅ Acknowledgement record created automatically
✅ Acknowledgement visible in Satellite Acknowledgement Admin app
✅ Acknowledgement shows correct details

---

## Notes

- The satellite mock system uses **auto-acknowledgement** by default (2-second delay)
- The webhook endpoint is: `http://localhost:4004/satellite-mock/coupa/webhook/mdm-approval`
- Acknowledgements are stored in the `NotificationAcknowledgments` table
- You can repeat this test for Salesforce and PI systems by using their respective request apps

