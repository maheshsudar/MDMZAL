using SatelliteAcknowledgementService as service from '../../srv/satellite-acknowledgement-service';

// Shared UI annotations for all acknowledgement entities
// Currently using AllAcknowledgements for open access
// Future: Can switch to filtered entities based on user role (XS Security)

annotate service.AllAcknowledgements with @(
    UI.HeaderInfo: {
        $Type: 'UI.HeaderInfoType',
        TypeName: 'System Acknowledgement',
        TypeNamePlural: 'System Acknowledgements',
        Title: { $Type: 'UI.DataField', Value: requestNumber },
        Description: { $Type: 'UI.DataField', Value: partnerName }
    },
    UI.Identification: [
        { $Type: 'UI.DataFieldForAction', Action: 'SatelliteAcknowledgementService.acknowledge', Label: 'Acknowledge' }
    ],
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: requestNumber, Label: 'Request Number' },
        { $Type: 'UI.DataField', Value: partnerName, Label: 'Partner Name' },
        { $Type: 'UI.DataField', Value: targetSystem, Label: 'Target System' },
        { $Type: 'UI.DataField', Value: sourceSystem, Label: 'Updated By System' },
        { $Type: 'UI.DataField', Value: notificationDate, Label: 'Notification Date' },
        { $Type: 'UI.DataField', Value: status, Label: 'Status', Criticality: statusCriticality },
        { $Type: 'UI.DataField', Value: acknowledgedBy, Label: 'Acknowledged By' },
        { $Type: 'UI.DataField', Value: acknowledgedAt, Label: 'Acknowledged At' }
    ],
    UI.SelectionFields: [ status, notificationDate, sourceSystem, targetSystem ],
    UI.Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'NotificationDetailsFacet',
            Label: '0. Notification Details',
            Target: '@UI.FieldGroup#NotificationDetails'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'BasicInfoFacet',
            Label: '1. Basic Information',
            Target: '@UI.FieldGroup#BasicInfo'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'AddressFacet',
            Label: '2. Address',
            Target: 'request/addresses/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'TaxInfoFacet',
            Label: '3. Tax Information',
            Target: 'request/vatIds/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'IdentificationsFacet',
            Label: '4. Identifications',
            Target: 'request/identifications/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'SubAccountsFacet',
            Label: '5. Sub Accounts',
            Target: 'request/subAccounts/@UI.LineItem',
            ![@UI.Hidden]: {$edmJson: {$Not: {$Eq: [{$Path: 'sourceSystem'}, 'Salesforce']}}}
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'PaymentInfoFacet',
            Label: '5. Payment Information',
            Target: '@UI.FieldGroup#PaymentInfo',
            ![@UI.Hidden]: {$edmJson: {$Eq: [{$Path: 'sourceSystem'}, 'Salesforce']}}
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'BankDetailsFacet',
            Label: '6. Bank Details',
            Target: 'request/banks/@UI.LineItem',
            ![@UI.Hidden]: {$edmJson: {$Eq: [{$Path: 'sourceSystem'}, 'Salesforce']}}
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'EmailContactsFacet',
            Label: '7. Email Contacts',
            Target: 'request/emails/@UI.LineItem',
            ![@UI.Hidden]: {$edmJson: {$Eq: [{$Path: 'sourceSystem'}, 'Salesforce']}}
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'ChangeLogFacet',
            Label: '8. Change Log',
            Target: 'request/changeLogs/@UI.LineItem'
        }
    ],
    UI.FieldGroup#NotificationDetails: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: sourceSystem, Label: 'Changed By System' },
            { $Type: 'UI.DataField', Value: targetSystem, Label: 'Notified System' },
            { $Type: 'UI.DataField', Value: notificationDate, Label: 'Notification Date' },
            { $Type: 'UI.DataField', Value: status, Label: 'Acknowledgement Status', Criticality: statusCriticality },
            { $Type: 'UI.DataField', Value: acknowledgedBy, Label: 'Acknowledged By' },
            { $Type: 'UI.DataField', Value: acknowledgedAt, Label: 'Acknowledged At' },
            { $Type: 'UI.DataField', Value: comments, Label: 'Acknowledgement Comments' }
        ]
    },
    UI.FieldGroup#BasicInfo: {
        $Type: 'UI.FieldGroupType',
        Data: [
            // Common fields (matching all original request apps)
            { $Type: 'UI.DataField', Value: requestNumber, Label: 'Request Number' },
            { $Type: 'UI.DataField', Value: request.name1, Label: 'Name 1' },
            { $Type: 'UI.DataField', Value: request.name2, Label: 'Name 2' },
            { $Type: 'UI.DataField', Value: request.requestType, Label: 'Request Type' },
            { $Type: 'UI.DataField', Value: request.status, Label: 'Request Status' },
            { $Type: 'UI.DataField', Value: sapBpNumber, Label: 'SAP BP Number' },
            { $Type: 'UI.DataField', Value: request.sourceSystem, Label: 'Source System' },

            // Salesforce-specific fields (matching salesforce-requests app Basic Info)
            { $Type: 'UI.DataField', Value: request.bpType_code, Label: 'BP Type',
              ![@UI.Hidden]: {$edmJson: {$Not: {$Eq: [{$Path: 'sourceSystem'}, 'Salesforce']}}} },
            { $Type: 'UI.DataField', Value: request.merchantId, Label: 'Merchant ID',
              ![@UI.Hidden]: {$edmJson: {$Not: {$Eq: [{$Path: 'sourceSystem'}, 'Salesforce']}}} }
        ]
    },
    UI.FieldGroup#PaymentInfo: {
        $Type: 'UI.FieldGroupType',
        Data: [
            // Matching coupa-requests and pi-requests apps Payment Info section
            { $Type: 'UI.DataField', Value: request.paymentTerms_code, Label: 'Payment Terms' },
            { $Type: 'UI.DataField', Value: request.paymentMethod_code, Label: 'Payment Method' },
            { $Type: 'UI.DataField', Value: request.currency_code, Label: 'Currency' }
        ]
    }
);

// Field-level annotations
annotate service.AllAcknowledgements with {
    requestNumber @Common.Label: 'Request Number';
    partnerName @Common.Label: 'Partner Name';
    sapBpNumber @Common.Label: 'SAP BP Number';
    targetSystem @Common.Label: 'Target System';
    sourceSystem @Common.Label: 'Updated By System';
    status @(
        Common.Label: 'Status',
        Common.ValueListWithFixedValues: true
    );
    notificationDate @Common.Label: 'Notification Date';
    acknowledgedBy @Common.Label: 'Acknowledged By';
    acknowledgedAt @Common.Label: 'Acknowledged At';
    comments @(
        Common.Label: 'Comments',
        UI.MultiLineText: true
    );
    statusCriticality @Common.Label: 'Status Criticality';
};

// Action annotations
annotate service.AllAcknowledgements actions {
    acknowledge @(
        Core.OperationAvailable: { $edmJson: { $Ne: [{ $Path: 'status' }, 'Acknowledged'] } },
        Common.SideEffects: {
            TargetProperties: ['status', 'acknowledgedBy', 'acknowledgedAt']
        }
    ) (
        comments @UI.MultiLineText
    );
};

// Annotate filtered entities for future role-based access
// These entities are filtered by targetSystem in the service definition

annotate service.CoupaAcknowledgements with @(
    UI.HeaderInfo: {
        $Type: 'UI.HeaderInfoType',
        TypeName: 'Coupa Acknowledgement',
        TypeNamePlural: 'Coupa Acknowledgements',
        Title: { $Type: 'UI.DataField', Value: requestNumber },
        Description: { $Type: 'UI.DataField', Value: partnerName }
    },
    UI.Identification: [
        { $Type: 'UI.DataFieldForAction', Action: 'SatelliteAcknowledgementService.acknowledge', Label: 'Acknowledge' }
    ],
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: requestNumber, Label: 'Request Number' },
        { $Type: 'UI.DataField', Value: partnerName, Label: 'Partner Name' },
        { $Type: 'UI.DataField', Value: sourceSystem, Label: 'Updated By System' },
        { $Type: 'UI.DataField', Value: notificationDate, Label: 'Notification Date' },
        { $Type: 'UI.DataField', Value: status, Label: 'Status', Criticality: statusCriticality },
        { $Type: 'UI.DataField', Value: acknowledgedBy, Label: 'Acknowledged By' },
        { $Type: 'UI.DataField', Value: acknowledgedAt, Label: 'Acknowledged At' }
    ],
    UI.SelectionFields: [ status, notificationDate, sourceSystem ],
    UI.Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'NotificationDetailsFacet',
            Label: '0. Notification Details',
            Target: '@UI.FieldGroup#NotificationDetails'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'BasicInfoFacet',
            Label: '1. Basic Information',
            Target: '@UI.FieldGroup#BasicInfo'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'AddressFacet',
            Label: '2. Address',
            Target: 'request/addresses/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'TaxInfoFacet',
            Label: '3. Tax Information',
            Target: 'request/vatIds/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'IdentificationsFacet',
            Label: '4. Identifications',
            Target: 'request/identifications/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'PaymentInfoFacet',
            Label: '5. Payment Information',
            Target: '@UI.FieldGroup#PaymentInfo'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'BankDetailsFacet',
            Label: '6. Bank Details',
            Target: 'request/banks/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'EmailContactsFacet',
            Label: '7. Email Contacts',
            Target: 'request/emails/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'ChangeLogFacet',
            Label: '8. Change Log',
            Target: 'request/changeLogs/@UI.LineItem'
        }
    ],
    UI.FieldGroup#NotificationDetails: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: sourceSystem, Label: 'Changed By System' },
            { $Type: 'UI.DataField', Value: targetSystem, Label: 'Notified System' },
            { $Type: 'UI.DataField', Value: notificationDate, Label: 'Notification Date' },
            { $Type: 'UI.DataField', Value: status, Label: 'Acknowledgement Status', Criticality: statusCriticality },
            { $Type: 'UI.DataField', Value: acknowledgedBy, Label: 'Acknowledged By' },
            { $Type: 'UI.DataField', Value: acknowledgedAt, Label: 'Acknowledged At' },
            { $Type: 'UI.DataField', Value: comments, Label: 'Acknowledgement Comments' }
        ]
    },
    UI.FieldGroup#BasicInfo: {
        $Type: 'UI.FieldGroupType',
        Data: [
            // Common fields
            { $Type: 'UI.DataField', Value: requestNumber, Label: 'Request Number' },
            { $Type: 'UI.DataField', Value: request.name1, Label: 'Name 1' },
            { $Type: 'UI.DataField', Value: request.name2, Label: 'Name 2' },
            { $Type: 'UI.DataField', Value: request.requestType, Label: 'Request Type' },
            { $Type: 'UI.DataField', Value: request.status, Label: 'Request Status' },
            { $Type: 'UI.DataField', Value: sapBpNumber, Label: 'SAP BP Number' },
            { $Type: 'UI.DataField', Value: request.entityType, Label: 'Entity Type' },
            { $Type: 'UI.DataField', Value: request.sourceSystem, Label: 'Source System' },
            // Coupa-specific fields only
            { $Type: 'UI.DataField', Value: request.coupaInternalNo, Label: 'Coupa Internal No' }
        ]
    },
    UI.FieldGroup#PaymentInfo: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: request.paymentTerms_code, Label: 'Payment Terms' },
            { $Type: 'UI.DataField', Value: request.paymentMethod_code, Label: 'Payment Method' },
            { $Type: 'UI.DataField', Value: request.currency_code, Label: 'Currency' }
        ]
    }
);

annotate service.SalesforceAcknowledgements with @(
    UI.HeaderInfo: {
        $Type: 'UI.HeaderInfoType',
        TypeName: 'Salesforce Acknowledgement',
        TypeNamePlural: 'Salesforce Acknowledgements',
        Title: { $Type: 'UI.DataField', Value: requestNumber },
        Description: { $Type: 'UI.DataField', Value: partnerName }
    },
    UI.Identification: [
        { $Type: 'UI.DataFieldForAction', Action: 'SatelliteAcknowledgementService.acknowledge', Label: 'Acknowledge' }
    ],
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: requestNumber, Label: 'Request Number' },
        { $Type: 'UI.DataField', Value: partnerName, Label: 'Partner Name' },
        { $Type: 'UI.DataField', Value: sourceSystem, Label: 'Updated By System' },
        { $Type: 'UI.DataField', Value: notificationDate, Label: 'Notification Date' },
        { $Type: 'UI.DataField', Value: status, Label: 'Status', Criticality: statusCriticality },
        { $Type: 'UI.DataField', Value: acknowledgedBy, Label: 'Acknowledged By' },
        { $Type: 'UI.DataField', Value: acknowledgedAt, Label: 'Acknowledged At' }
    ],
    UI.SelectionFields: [ status, notificationDate, sourceSystem ],
    UI.Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'NotificationDetailsFacet',
            Label: '0. Notification Details',
            Target: '@UI.FieldGroup#NotificationDetails'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'BasicInfoFacet',
            Label: '1. Basic Information',
            Target: '@UI.FieldGroup#BasicInfo'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'AddressFacet',
            Label: '2. Address',
            Target: 'request/addresses/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'TaxInfoFacet',
            Label: '3. Tax Information',
            Target: 'request/vatIds/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'IdentificationsFacet',
            Label: '4. Identifications',
            Target: 'request/identifications/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'SubAccountsFacet',
            Label: '5. Sub Accounts',
            Target: 'request/subAccounts/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'ChangeLogFacet',
            Label: '6. Change Log',
            Target: 'request/changeLogs/@UI.LineItem'
        }
    ],
    UI.FieldGroup#NotificationDetails: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: sourceSystem, Label: 'Changed By System' },
            { $Type: 'UI.DataField', Value: targetSystem, Label: 'Notified System' },
            { $Type: 'UI.DataField', Value: notificationDate, Label: 'Notification Date' },
            { $Type: 'UI.DataField', Value: status, Label: 'Acknowledgement Status', Criticality: statusCriticality },
            { $Type: 'UI.DataField', Value: acknowledgedBy, Label: 'Acknowledged By' },
            { $Type: 'UI.DataField', Value: acknowledgedAt, Label: 'Acknowledged At' },
            { $Type: 'UI.DataField', Value: comments, Label: 'Acknowledgement Comments' }
        ]
    },
    UI.FieldGroup#BasicInfo: {
        $Type: 'UI.FieldGroupType',
        Data: [
            // Common fields
            { $Type: 'UI.DataField', Value: requestNumber, Label: 'Request Number' },
            { $Type: 'UI.DataField', Value: request.name1, Label: 'Name 1' },
            { $Type: 'UI.DataField', Value: request.name2, Label: 'Name 2' },
            { $Type: 'UI.DataField', Value: request.requestType, Label: 'Request Type' },
            { $Type: 'UI.DataField', Value: request.status, Label: 'Request Status' },
            { $Type: 'UI.DataField', Value: sapBpNumber, Label: 'SAP BP Number' },
            { $Type: 'UI.DataField', Value: request.entityType, Label: 'Entity Type' },
            { $Type: 'UI.DataField', Value: request.sourceSystem, Label: 'Source System' },
            // Salesforce-specific fields only
            { $Type: 'UI.DataField', Value: request.bpType_code, Label: 'BP Type' },
            { $Type: 'UI.DataField', Value: request.merchantId, Label: 'Merchant ID' },
            { $Type: 'UI.DataField', Value: request.accountType, Label: 'Account Type' },
            { $Type: 'UI.DataField', Value: request.industry, Label: 'Industry' },
            { $Type: 'UI.DataField', Value: request.revenueStream_code, Label: 'Revenue Stream' },
            { $Type: 'UI.DataField', Value: request.billingCycle_code, Label: 'Billing Cycle' },
            { $Type: 'UI.DataField', Value: request.dunningStrategy_code, Label: 'Dunning Strategy' },
            { $Type: 'UI.DataField', Value: request.salesforceId, Label: 'Salesforce ID' }
        ]
    }
);

annotate service.PIAcknowledgements with @(
    UI.HeaderInfo: {
        $Type: 'UI.HeaderInfoType',
        TypeName: 'PI Acknowledgement',
        TypeNamePlural: 'PI Acknowledgements',
        Title: { $Type: 'UI.DataField', Value: requestNumber },
        Description: { $Type: 'UI.DataField', Value: partnerName }
    },
    UI.Identification: [
        { $Type: 'UI.DataFieldForAction', Action: 'SatelliteAcknowledgementService.acknowledge', Label: 'Acknowledge' }
    ],
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: requestNumber, Label: 'Request Number' },
        { $Type: 'UI.DataField', Value: partnerName, Label: 'Partner Name' },
        { $Type: 'UI.DataField', Value: sourceSystem, Label: 'Updated By System' },
        { $Type: 'UI.DataField', Value: notificationDate, Label: 'Notification Date' },
        { $Type: 'UI.DataField', Value: status, Label: 'Status', Criticality: statusCriticality },
        { $Type: 'UI.DataField', Value: acknowledgedBy, Label: 'Acknowledged By' },
        { $Type: 'UI.DataField', Value: acknowledgedAt, Label: 'Acknowledged At' }
    ],
    UI.SelectionFields: [ status, notificationDate, sourceSystem ],
    UI.Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'NotificationDetailsFacet',
            Label: '0. Notification Details',
            Target: '@UI.FieldGroup#NotificationDetails'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'BasicInfoFacet',
            Label: '1. Basic Information',
            Target: '@UI.FieldGroup#BasicInfo'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'AddressFacet',
            Label: '2. Address',
            Target: 'request/addresses/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'TaxInfoFacet',
            Label: '3. Tax Information',
            Target: 'request/vatIds/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'IdentificationsFacet',
            Label: '4. Identifications',
            Target: 'request/identifications/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'PaymentInfoFacet',
            Label: '5. Payment Information',
            Target: '@UI.FieldGroup#PaymentInfo'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'BankDetailsFacet',
            Label: '6. Bank Details',
            Target: 'request/banks/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'EmailContactsFacet',
            Label: '7. Email Contacts',
            Target: 'request/emails/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'ChangeLogFacet',
            Label: '8. Change Log',
            Target: 'request/changeLogs/@UI.LineItem'
        }
    ],
    UI.FieldGroup#NotificationDetails: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: sourceSystem, Label: 'Changed By System' },
            { $Type: 'UI.DataField', Value: targetSystem, Label: 'Notified System' },
            { $Type: 'UI.DataField', Value: notificationDate, Label: 'Notification Date' },
            { $Type: 'UI.DataField', Value: status, Label: 'Acknowledgement Status', Criticality: statusCriticality },
            { $Type: 'UI.DataField', Value: acknowledgedBy, Label: 'Acknowledged By' },
            { $Type: 'UI.DataField', Value: acknowledgedAt, Label: 'Acknowledged At' },
            { $Type: 'UI.DataField', Value: comments, Label: 'Acknowledgement Comments' }
        ]
    },
    UI.FieldGroup#BasicInfo: {
        $Type: 'UI.FieldGroupType',
        Data: [
            // Common fields
            { $Type: 'UI.DataField', Value: requestNumber, Label: 'Request Number' },
            { $Type: 'UI.DataField', Value: request.name1, Label: 'Name 1' },
            { $Type: 'UI.DataField', Value: request.name2, Label: 'Name 2' },
            { $Type: 'UI.DataField', Value: request.requestType, Label: 'Request Type' },
            { $Type: 'UI.DataField', Value: request.status, Label: 'Request Status' },
            { $Type: 'UI.DataField', Value: sapBpNumber, Label: 'SAP BP Number' },
            { $Type: 'UI.DataField', Value: request.entityType, Label: 'Entity Type' },
            { $Type: 'UI.DataField', Value: request.sourceSystem, Label: 'Source System' },
            // PI-specific fields only
            { $Type: 'UI.DataField', Value: request.piId, Label: 'PI ID' }
        ]
    },
    UI.FieldGroup#PaymentInfo: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: request.paymentTerms_code, Label: 'Payment Terms' },
            { $Type: 'UI.DataField', Value: request.paymentMethod_code, Label: 'Payment Method' },
            { $Type: 'UI.DataField', Value: request.currency_code, Label: 'Currency' }
        ]
    }
);

// Field-level annotations for filtered entities
annotate service.CoupaAcknowledgements with {
    requestNumber @Common.Label: 'Request Number';
    partnerName @Common.Label: 'Partner Name';
    sapBpNumber @Common.Label: 'SAP BP Number';
    sourceSystem @Common.Label: 'Updated By System';
    status @(
        Common.Label: 'Status',
        Common.ValueListWithFixedValues: true
    );
    notificationDate @Common.Label: 'Notification Date';
    acknowledgedBy @Common.Label: 'Acknowledged By';
    acknowledgedAt @Common.Label: 'Acknowledged At';
    comments @(
        Common.Label: 'Comments',
        UI.MultiLineText: true
    );
    statusCriticality @Common.Label: 'Status Criticality';
};

annotate service.SalesforceAcknowledgements with {
    requestNumber @Common.Label: 'Request Number';
    partnerName @Common.Label: 'Partner Name';
    sapBpNumber @Common.Label: 'SAP BP Number';
    sourceSystem @Common.Label: 'Updated By System';
    status @(
        Common.Label: 'Status',
        Common.ValueListWithFixedValues: true
    );
    notificationDate @Common.Label: 'Notification Date';
    acknowledgedBy @Common.Label: 'Acknowledged By';
    acknowledgedAt @Common.Label: 'Acknowledged At';
    comments @(
        Common.Label: 'Comments',
        UI.MultiLineText: true
    );
    statusCriticality @Common.Label: 'Status Criticality';
};

annotate service.PIAcknowledgements with {
    requestNumber @Common.Label: 'Request Number';
    partnerName @Common.Label: 'Partner Name';
    sapBpNumber @Common.Label: 'SAP BP Number';
    sourceSystem @Common.Label: 'Updated By System';
    status @(
        Common.Label: 'Status',
        Common.ValueListWithFixedValues: true
    );
    notificationDate @Common.Label: 'Notification Date';
    acknowledgedBy @Common.Label: 'Acknowledged By';
    acknowledgedAt @Common.Label: 'Acknowledged At';
    comments @(
        Common.Label: 'Comments',
        UI.MultiLineText: true
    );
    statusCriticality @Common.Label: 'Status Criticality';
};

// Action annotations for filtered entities
annotate service.CoupaAcknowledgements actions {
    acknowledge @(
        Core.OperationAvailable: { $edmJson: { $Ne: [{ $Path: 'status' }, 'Acknowledged'] } },
        Common.SideEffects: {
            TargetProperties: ['status', 'acknowledgedBy', 'acknowledgedAt']
        }
    ) (
        comments @UI.MultiLineText
    );
};

annotate service.SalesforceAcknowledgements actions {
    acknowledge @(
        Core.OperationAvailable: { $edmJson: { $Ne: [{ $Path: 'status' }, 'Acknowledged'] } },
        Common.SideEffects: {
            TargetProperties: ['status', 'acknowledgedBy', 'acknowledgedAt']
        }
    ) (
        comments @UI.MultiLineText
    );
};

annotate service.PIAcknowledgements actions {
    acknowledge @(
        Core.OperationAvailable: { $edmJson: { $Ne: [{ $Path: 'status' }, 'Acknowledged'] } },
        Common.SideEffects: {
            TargetProperties: ['status', 'acknowledgedBy', 'acknowledgedAt']
        }
    ) (
        comments @UI.MultiLineText
    );
};

// ========================================
// Child Entity Annotations (for displaying request details)
// Annotate service entities for proper navigation
// ========================================

// Address LineItem for tables
annotate service.PartnerAddresses with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: addressType_code, Label: 'Address Type' },
        { $Type: 'UI.DataField', Value: street, Label: 'Street' },
        { $Type: 'UI.DataField', Value: streetNumber, Label: 'House No' },
        { $Type: 'UI.DataField', Value: city, Label: 'City' },
        { $Type: 'UI.DataField', Value: postalCode, Label: 'Postal Code' },
        { $Type: 'UI.DataField', Value: country_code, Label: 'Country' }
    ]
);

// VAT IDs LineItem for tables
annotate service.PartnerVatIds with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: vatType_code, Label: 'Tax Type' },
        { $Type: 'UI.DataField', Value: country_code, Label: 'Country' },
        { $Type: 'UI.DataField', Value: vatNumber, Label: 'VAT Number' },
        { $Type: 'UI.DataField', Value: isEstablished, Label: 'Is Established' }
    ]
);

// Identifications LineItem for tables
annotate service.PartnerIdentifications with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: idType_code, Label: 'ID Type' },
        { $Type: 'UI.DataField', Value: idNumber, Label: 'ID Number' },
        { $Type: 'UI.DataField', Value: country_code, Label: 'Country' }
    ]
);

// Bank Details LineItem for tables
annotate service.PartnerBanks with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: bankName, Label: 'Bank Name' },
        { $Type: 'UI.DataField', Value: bankCountry_code, Label: 'Bank Country' },
        { $Type: 'UI.DataField', Value: iban, Label: 'IBAN' },
        { $Type: 'UI.DataField', Value: swiftCode, Label: 'SWIFT/BIC' },
        { $Type: 'UI.DataField', Value: bankAccountNumber, Label: 'Account Number' }
    ]
);

// Email Contacts LineItem for tables
annotate service.PartnerEmails with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: emailType_code, Label: 'Email Type' },
        { $Type: 'UI.DataField', Value: emailAddress, Label: 'Email Address' }
    ]
);

// Change Logs LineItem for tables
annotate service.ChangeLogs with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: entityType, Label: 'Entity Type' },
        { $Type: 'UI.DataField', Value: fieldName, Label: 'Field Name' },
        { $Type: 'UI.DataField', Value: oldValue, Label: 'Old Value' },
        { $Type: 'UI.DataField', Value: newValue, Label: 'New Value' },
        { $Type: 'UI.DataField', Value: changedAt, Label: 'Changed At' }
    ]
);

// Sub Accounts LineItem for tables (Salesforce only)
annotate service.SubAccounts with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: subAccountId, Label: 'Sub Account ID' },
        { $Type: 'UI.DataField', Value: revenueStream_code, Label: 'Revenue Stream' },
        { $Type: 'UI.DataField', Value: billingCycle_code, Label: 'Billing Cycle' },
        { $Type: 'UI.DataField', Value: currency_code, Label: 'Currency' }
    ]
);

// Sub Account Banks LineItem for tables
annotate service.SubAccountBanks with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: bankReference, Label: 'Reference' },
        { $Type: 'UI.DataField', Value: bankCountry_code, Label: 'Bank Country' },
        { $Type: 'UI.DataField', Value: iban, Label: 'IBAN' },
        { $Type: 'UI.DataField', Value: swiftCode, Label: 'SWIFT Code' },
        { $Type: 'UI.DataField', Value: accountNumber, Label: 'Account Number' }
    ]
);

// Sub Account Emails LineItem for tables
annotate service.SubAccountEmails with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: contactType_code, Label: 'Contact Type' },
        { $Type: 'UI.DataField', Value: emailAddress, Label: 'Email Address' }
    ]
);
