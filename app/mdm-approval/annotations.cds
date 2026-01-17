using { MDMService } from '../../srv/mdm-service';
using from './field-annotations';

// ========================================
// MDMApprovalRequests Entity Annotations
// ========================================

annotate MDMService.MDMApprovalRequests with @(
    // --- Header Information ---
    UI.HeaderInfo: {
        $Type: 'UI.HeaderInfoType',
        TypeName: 'Business Partner Request',
        TypeNamePlural: 'Business Partner Requests',
        Title: { $Type: 'UI.DataField', Value: name1 },
        Description: { $Type: 'UI.DataField', Value: requestNumber }
    },
    
    // --- Actions ---
    UI.Identification: [
        {
            $Type: 'UI.DataFieldForAction',
            Action: 'MDMService.performVIESCheck',
            Label: 'VIES VAT Check',
            ![@UI.Hidden]: {$edmJson: {$Ne: [{$Path: 'status'}, 'Submitted']}}
        },
        {
            $Type: 'UI.DataFieldForAction',
            Action: 'MDMService.performAEBCheck',
            Label: 'AEB Sanctions Check',
            ![@UI.Hidden]: {$edmJson: {$Ne: [{$Path: 'status'}, 'Submitted']}}
        },
        {
            $Type: 'UI.DataFieldForAction',
            Action: 'MDMService.checkDuplicates',
            Label: 'Duplicate Check',
            ![@UI.Hidden]: {$edmJson: {$Ne: [{$Path: 'status'}, 'Submitted']}}
        },
        {
            $Type: 'UI.DataFieldForAction',
            Action: 'MDMService.approveRequest',
            Label: 'Approve',
            ![@UI.Hidden]: {$edmJson: {$Ne: [{$Path: 'status'}, 'Submitted']}}
        },
        {
            $Type: 'UI.DataFieldForAction',
            Action: 'MDMService.rejectRequest',
            Label: 'Reject',
            ![@UI.Hidden]: {$edmJson: {$Ne: [{$Path: 'status'}, 'Submitted']}}
        }
    ],
    
    // --- List Report Columns ---
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: requestNumber, Label: 'Request Number' },
        { $Type: 'UI.DataField', Value: name1, Label: 'Name 1' },
        { $Type: 'UI.DataField', Value: sourceSystem, Label: 'Source System' },
        { $Type: 'UI.DataField', Value: requestType, Label: 'Request Type' },
        { $Type: 'UI.DataField', Value: status, Label: 'Status' },
        { $Type: 'UI.DataField', Value: integrationSuiteStatus, Label: 'Integration Suite Status' },
        { $Type: 'UI.DataField', Value: sapInitialStatus, Label: 'SAP Status' },
        { $Type: 'UI.DataField', Value: satelliteStatus, Label: 'Satellite Status' },
        { $Type: 'UI.DataField', Value: createdAt, Label: 'Created At' },
        { $Type: 'UI.DataField', Value: createdBy, Label: 'Created By' }
    ],
    
    // --- Filter Fields ---
    UI.SelectionFields: [
        status,
        sourceSystem,
        requestType,
        sapInitialStatus,
        createdAt
    ],
    
    // --- Object Page Layout ---
    UI.Facets: [
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
            Target: 'addresses/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'TaxInfoFacet',
            Label: '3. Tax Information',
            Target: 'vatIds/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'IdentificationsFacet',
            Label: '4. Identifications',
            Target: 'identifications/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'BankDetailsFacet',
            Label: '5. Bank Details',
            Target: 'banks/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'EmailContactsFacet',
            Label: '6. Email Contacts',
            Target: 'emails/@UI.LineItem'
        },
        // Payment Info (Coupa Only)
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'PaymentInfoFacet',
            Label: '7. Payment Information',
            Target: '@UI.FieldGroup#PaymentInfo'
        },
        // Sub Account Info (Salesforce Only)
        {
            $Type: 'UI.CollectionFacet',
            ID: 'SubAccountInfoFacet',
            Label: '8. Sub Account Information',
            Facets: [
                {
                    $Type: 'UI.ReferenceFacet',
                    ID: 'SubAccountResultsFacet',
                    Label: 'Sub Accounts',
                    Target: 'subAccounts/@UI.LineItem'
                }
            ],
            ![@UI.Hidden]: {$edmJson: {$Ne: [{$Path: 'sourceSystem'}, 'Salesforce']}}
        },
        // Compliance and Validation Checks
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'AEBCheckFacet',
            Label: '9. AEB Trade Compliance Check',
            Target: '@UI.FieldGroup#AEBCheck'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'VIESCheckFacet',
            Label: '10. VIES VAT Validation Check',
            Target: '@UI.FieldGroup#VIESCheck'
        },
        // Duplicate Check - Combined into single CollectionFacet
        {
            $Type: 'UI.CollectionFacet',
            ID: 'DuplicateCheckFacet',
            Label: '11. Duplicate Check',
            Facets: [
                {
                    $Type: 'UI.ReferenceFacet',
                    ID: 'DuplicateCheckSummaryFacet',
                    Label: 'Summary',
                    Target: '@UI.FieldGroup#DuplicateCheckSummary'
                },
                {
                    $Type: 'UI.ReferenceFacet',
                    ID: 'DuplicateCheckResultsFacet',
                    Label: 'Results',
                    Target: 'duplicateChecks/@UI.LineItem#Top5'
                }
            ]
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'ApproverCommentsFacet',
            Label: '12. MDM Approver Comments',
            Target: '@UI.FieldGroup#ApproverComments'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'IntegrationStatusFacet',
            Label: '13. Integration Status',
            Target: '@UI.FieldGroup#IntegrationStatus'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'ChangeLogFacet',
            Label: '14. Change Log',
            Target: 'changeLogs/@UI.LineItem',
            ![@UI.Hidden]: {$edmJson: {$Eq: [{$Path: 'requestType'}, 'Create']}}
        }
    ],
    
    // --- Field Groups ---
    UI.FieldGroup#BasicInfo: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: requestNumber, Label: 'Request Number' },
            { $Type: 'UI.DataField', Value: bpType_code, Label: 'BP Type', ![@UI.Hidden]: {$edmJson: {$Ne: [{$Path: 'sourceSystem'}, 'Salesforce']}} },
            { $Type: 'UI.DataField', Value: name1, Label: 'Name 1' },
            { $Type: 'UI.DataField', Value: name2, Label: 'Name 2' },
            { $Type: 'UI.DataField', Value: merchantId, Label: 'Merchant ID', ![@UI.Hidden]: {$edmJson: {$Ne: [{$Path: 'sourceSystem'}, 'Salesforce']}} },
            { $Type: 'UI.DataField', Value: requestType },
            { $Type: 'UI.DataField', Value: status },
            { $Type: 'UI.DataField', Value: sourceSystem },
            { $Type: 'UI.DataField', Value: existingBpNumber, Label: 'Existing BP Number', ![@UI.Hidden]: {$edmJson: {$Ne: [{$Path: 'requestType'}, 'Change']}} },
            { $Type: 'UI.DataField', Value: existingBpName, Label: 'Existing BP Name', ![@UI.Hidden]: {$edmJson: {$Ne: [{$Path: 'requestType'}, 'Change']}} },
            { $Type: 'UI.DataField', Value: changeDescription, Label: 'Change Description', ![@UI.Hidden]: {$edmJson: {$Ne: [{$Path: 'requestType'}, 'Change']}} },
            { $Type: 'UI.DataField', Value: sapBpNumber, Label: 'SAP BP Number' }
        ]
    },

    UI.FieldGroup#IntegrationStatus: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: sapInitialStatus, Label: 'SAP S/4HANA Status' },
            { $Type: 'UI.DataField', Value: satelliteStatus, Label: 'Satellite System Status' },
            { $Type: 'UI.DataField', Value: sapIdUpdateStatus, Label: 'SAP ID Writeback Status' }
        ]
    },

    UI.FieldGroup#PaymentInfo: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: paymentTerms_code, Label: 'Payment Terms' },
            { $Type: 'UI.DataField', Value: paymentMethod_code, Label: 'Payment Method' },
            { $Type: 'UI.DataField', Value: currency_code, Label: 'Currency' },
            { $Type: 'UI.DataField', Value: reconAccount, Label: 'Reconciliation Account' }
        ]
    },

    UI.FieldGroup#SubAccountInfo: {
        $Type: 'UI.FieldGroupType',
        Data: [
            // Salesforce Fields
            { $Type: 'UI.DataField', Value: salesforceId },
            { $Type: 'UI.DataField', Value: accountType },
            { $Type: 'UI.DataField', Value: revenueStream_code },
            { $Type: 'UI.DataField', Value: billingCycle_code }
        ]
    },

    // AEB Trade Compliance Check
    UI.FieldGroup#AEBCheck: {
        $Type: 'UI.FieldGroupType',
        Data: [
            {
                $Type: 'UI.DataField',
                Value: aebStatus,
                Label: 'Status',
                Criticality: aebStatusCriticality,
                CriticalityRepresentation: #WithIcon,
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: aebCheckDate,
                Label: 'Check Date',
                ![@UI.Importance]: #Medium
            },
            {
                $Type: 'UI.DataField',
                Value: aebCheckDetails,
                Label: 'Check Details',
                ![@UI.MultiLineText]: true,
                ![@UI.Importance]: #Low
            }
        ]
    },

    // VIES VAT Validation Check
    UI.FieldGroup#VIESCheck: {
        $Type: 'UI.FieldGroupType',
        Data: [
            {
                $Type: 'UI.DataField',
                Value: viesStatus,
                Label: 'Status',
                Criticality: viesStatusCriticality,
                CriticalityRepresentation: #WithIcon,
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: viesCheckDate,
                Label: 'Check Date',
                ![@UI.Importance]: #Medium
            },
            {
                $Type: 'UI.DataField',
                Value: viesCheckDetails,
                Label: 'Check Details',
                ![@UI.MultiLineText]: true,
                ![@UI.Importance]: #Low
            }
        ]
    },

    // Duplicate Check Summary
    UI.FieldGroup#DuplicateCheckSummary: {
        $Type: 'UI.FieldGroupType',
        Data: [
            {
                $Type: 'UI.DataField',
                Value: duplicateCheckStatus,
                Label: 'Status',
                ![@UI.Importance]: #High
            },
            {
                $Type: 'UI.DataField',
                Value: duplicateCheckDate,
                Label: 'Check Date',
                ![@UI.Importance]: #Medium
            }
        ]
    },

    UI.FieldGroup#ApproverComments: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: approverComments, Label: 'MDM Approver Comments' }
        ]
    },

    // --- Capabilities ---
    Capabilities: {
        Insertable: false,
        Deletable: false
    }
);

// ========================================
// Field Annotations for MDMApprovalRequests
// ========================================

annotate MDMService.MDMApprovalRequests with {
    partnerName @(
        Common.Label: 'Partner Name',
        Common.FieldControl: #ReadOnly
    );
    requestType @(
        Common.Label: 'Request Type',
        Common.FieldControl: #ReadOnly,
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'RequestTypes',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: requestType, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
            ]
        }
    );
    sourceSystem @(
        Common.Label: 'Source System',
        Common.FieldControl: #ReadOnly,
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'SourceSystems',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: sourceSystem, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
            ]
        }
    );
    status @(
        Common.Label: 'Status',
        Common.FieldControl: #ReadOnly,
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'OverallStatuses',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: status, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
            ]
        }
    );
    paymentTerms_code @(
        Common.Label: 'Payment Terms',
        Common.FieldControl: #ReadOnly,
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'PaymentTerms',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: paymentTerms_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
            ]
        }
    );
    paymentMethod_code @(
        Common.Label: 'Payment Method',
        Common.FieldControl: #ReadOnly,
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'PaymentMethods',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: paymentMethod_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
            ]
        }
    );
    currency_code @(
        Common.Label: 'Currency',
        Common.FieldControl: #ReadOnly,
        Common.ValueListWithFixedValues: false,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'Currencies',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: currency_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
    reconAccount @(
        Common.Label: 'Reconciliation Account',
        Common.FieldControl: #ReadOnly
    );
    aebStatus @(
        Common.Label: 'AEB Trade Compliance Status',
        Common.FieldControl: #ReadOnly
    );
    aebCheckDate @(
        Common.Label: 'AEB Check Date',
        Common.FieldControl: #ReadOnly
    );
    aebCheckDetails @(
        Common.Label: 'AEB Check Details',
        Common.FieldControl: #ReadOnly
    );
    viesStatus @(
        Common.Label: 'VIES VAT ID Status',
        Common.FieldControl: #ReadOnly
    );
    viesCheckDate @(
        Common.Label: 'VIES Check Date',
        Common.FieldControl: #ReadOnly
    );
    viesCheckDetails @(
        Common.Label: 'VIES Check Details',
        Common.FieldControl: #ReadOnly
    );
    duplicateCheckStatus @(
        Common.Label: 'Duplicate Check Status',
        Common.FieldControl: #ReadOnly
    );
    duplicateCheckDate @(
        Common.Label: 'Duplicate Check Date',
        Common.FieldControl: #ReadOnly
    );
    revenueStream_code @(
        Common.Label: 'Revenue Stream',
        Common.FieldControl: #ReadOnly,
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'RevenueStreams',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: revenueStream_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
            ]
        }
    );
    billingCycle_code @(
        Common.Label: 'Billing Cycle',
        Common.FieldControl: #ReadOnly,
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'BillingCycles',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: billingCycle_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
            ]
        }
    );
    salesforceId @(
        Common.Label: 'Salesforce ID',
        Common.FieldControl: #ReadOnly
    );
    coupaInternalNo @(
        Common.Label: 'Coupa Internal No',
        Common.FieldControl: #ReadOnly
    );
    accountType @(
        Common.Label: 'Account Type',
        Common.FieldControl: #ReadOnly
    );
    requestNumber @Common.FieldControl: #ReadOnly;
    name1 @Common.FieldControl: #ReadOnly;
    name2 @Common.FieldControl: #ReadOnly;
    merchantId @Common.FieldControl: #ReadOnly;
    bpType_code @Common.FieldControl: #ReadOnly;
    bpType @Common.FieldControl: #ReadOnly;
    existingBpNumber @Common.FieldControl: #ReadOnly;
    existingBpName @Common.FieldControl: #ReadOnly;
    changeDescription @Common.FieldControl: #ReadOnly;
    sapBpNumber @Common.FieldControl: #ReadOnly;
    createdAt @Common.FieldControl: #ReadOnly;
    createdBy @Common.FieldControl: #ReadOnly;
    modifiedAt @Common.FieldControl: #ReadOnly;
    modifiedBy @Common.FieldControl: #ReadOnly;

    // Integration status fields - read-only
    integrationSuiteStatus @Common.FieldControl: #ReadOnly;
    sapInitialStatus @Common.FieldControl: #ReadOnly;
    satelliteStatus @Common.FieldControl: #ReadOnly;
    sapIdUpdateStatus @Common.FieldControl: #ReadOnly;

    // Association fields - read-only
    paymentTerms @Common.FieldControl: #ReadOnly;
    paymentMethod @Common.FieldControl: #ReadOnly;
    revenueStream @Common.FieldControl: #ReadOnly;
    billingCycle @Common.FieldControl: #ReadOnly;

    // ONLY approverComments is editable
    approverComments @(
        Common.Label: 'MDM Approver Comments',
        UI.MultiLineText: true,
        Common.FieldControl: #Mandatory  // Make it mandatory and editable for MDM approvers
    );

    // Make child entity associations have Capabilities restrictions
    addresses @Capabilities: {
        InsertRestrictions: { Insertable: false },
        UpdateRestrictions: { Updatable: false },
        DeleteRestrictions: { Deletable: false }
    };
    vatIds @Capabilities: {
        InsertRestrictions: { Insertable: false },
        UpdateRestrictions: { Updatable: false },
        DeleteRestrictions: { Deletable: false }
    };
    banks @Capabilities: {
        InsertRestrictions: { Insertable: false },
        UpdateRestrictions: { Updatable: false },
        DeleteRestrictions: { Deletable: false }
    };
    emails @Capabilities: {
        InsertRestrictions: { Insertable: false },
        UpdateRestrictions: { Updatable: false },
        DeleteRestrictions: { Deletable: false }
    };
    identifications @Capabilities: {
        InsertRestrictions: { Insertable: false },
        UpdateRestrictions: { Updatable: false },
        DeleteRestrictions: { Deletable: false }
    };
    duplicateChecks @Capabilities: {
        InsertRestrictions: { Insertable: false },
        UpdateRestrictions: { Updatable: false },
        DeleteRestrictions: { Deletable: false }
    };
};

// Make all child entity fields read-only in MDM approval view
annotate MDMService.PartnerAddresses with {
    sapAddressId @Common.FieldControl: #ReadOnly;
    addressType_code @Common.FieldControl: #ReadOnly;
    name1 @Common.FieldControl: #ReadOnly;
    name2 @Common.FieldControl: #ReadOnly;
    name3 @Common.FieldControl: #ReadOnly;
    name4 @Common.FieldControl: #ReadOnly;
    street @Common.FieldControl: #ReadOnly;
    streetNumber @Common.FieldControl: #ReadOnly;
    city @Common.FieldControl: #ReadOnly;
    postalCode @Common.FieldControl: #ReadOnly;
    country_code @Common.FieldControl: #ReadOnly;
    region @Common.FieldControl: #ReadOnly;
    isDefault @Common.FieldControl: #ReadOnly;
};

annotate MDMService.PartnerVatIds with {
    country_code @Common.FieldControl: #ReadOnly;
    vatNumber @Common.FieldControl: #ReadOnly;
    vatType_code @Common.FieldControl: #ReadOnly;
    isEstablished @Common.FieldControl: #ReadOnly;
    validationStatus @Common.FieldControl: #ReadOnly;
    validationDate @Common.FieldControl: #ReadOnly;
    validationDetails @Common.FieldControl: #ReadOnly;
    isDefault @Common.FieldControl: #ReadOnly;
};

annotate MDMService.PartnerBanks with {
    sapBankIdentification @Common.FieldControl: #ReadOnly;
    bankCountry_code @Common.FieldControl: #ReadOnly;
    bankKey @Common.FieldControl: #ReadOnly;
    bankName @Common.FieldControl: #ReadOnly;
    accountHolder @Common.FieldControl: #ReadOnly;
    accountNumber @Common.FieldControl: #ReadOnly;
    iban @Common.FieldControl: #ReadOnly;
    swiftCode @Common.FieldControl: #ReadOnly;
    controlKey @Common.FieldControl: #ReadOnly;
    currency_code @Common.FieldControl: #ReadOnly;
    bankReference @Common.FieldControl: #ReadOnly;
    isDefault @Common.FieldControl: #ReadOnly;
};

annotate MDMService.PartnerEmails with {
    sapAddressId @Common.FieldControl: #ReadOnly;
    sapOrdinalNumber @Common.FieldControl: #ReadOnly;
    emailType_code @Common.FieldControl: #ReadOnly;
    emailAddress @Common.FieldControl: #ReadOnly;
    notes @Common.FieldControl: #ReadOnly;
    isDefault @Common.FieldControl: #ReadOnly;
};

annotate MDMService.PartnerIdentifications with {
    identificationType_code @Common.FieldControl: #ReadOnly;
    identificationNumber @Common.FieldControl: #ReadOnly;
    country_code @Common.FieldControl: #ReadOnly;
    issuingAuthority @Common.FieldControl: #ReadOnly;
    validFrom @Common.FieldControl: #ReadOnly;
    validTo @Common.FieldControl: #ReadOnly;
};

annotate MDMService.DuplicateChecks with {
    checkDate @Common.FieldControl: #ReadOnly;
    matchType @Common.FieldControl: #ReadOnly;
    matchScore @Common.FieldControl: #ReadOnly;
    existingBpNumber @Common.FieldControl: #ReadOnly;
    existingBpName @Common.FieldControl: #ReadOnly;
    matchDetails @Common.FieldControl: #ReadOnly;
    reviewRequired @Common.FieldControl: #ReadOnly;
    establishedVatId @Common.FieldControl: #ReadOnly;
    establishedCountry @Common.FieldControl: #ReadOnly;
    partnerStatus @Common.FieldControl: #ReadOnly;
    lastUpdated @Common.FieldControl: #ReadOnly;
    sourceSystem @Common.FieldControl: #ReadOnly;
    businessChannels @Common.FieldControl: #ReadOnly;
    mergeDecision @Common.FieldControl: #ReadOnly;
    mergeDecisionBy @Common.FieldControl: #ReadOnly;
    mergeDecisionAt @Common.FieldControl: #ReadOnly;
    mergeComments @Common.FieldControl: #ReadOnly;
    canMerge @Common.FieldControl: #ReadOnly;
    mergeRecommendation @Common.FieldControl: #ReadOnly;
};

// ========================================
// Child Entity Annotations
// ========================================

// Addresses annotations
annotate MDMService.PartnerAddresses with @(
    UI.CreateHidden: true,
    UI.UpdateHidden: true,
    UI.DeleteHidden: true,
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: sapAddressId, Label: 'SAP Address ID' },
        { $Type: 'UI.DataField', Value: addressType_code, Label: 'Address Type' },
        { $Type: 'UI.DataField', Value: street, Label: 'Street' },
        { $Type: 'UI.DataField', Value: streetNumber, Label: 'House No' },
        { $Type: 'UI.DataField', Value: city, Label: 'City' },
        { $Type: 'UI.DataField', Value: postalCode, Label: 'Postal Code' },
        { $Type: 'UI.DataField', Value: country_code, Label: 'Country' },
        {
            $Type: 'UI.DataField',
            Value: isDefault,
            Label: 'Default',
            ![@UI.Hidden]: {$edmJson: {$Or: [{$Eq: [{$Path: 'request/sourceSystem'}, 'Coupa']}, {$Eq: [{$Path: 'request/sourceSystem'}, 'Salesforce']}]}}
        }
    ],
    UI.HeaderInfo: {
        TypeName: 'Address',
        TypeNamePlural: 'Addresses',
        Title: { Value: addressType.name }
    },
    UI.Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Address Details',
            Target: '@UI.FieldGroup#AddressDetails'
        }
    ],
    UI.FieldGroup#AddressDetails: {
        Data: [
            { $Type: 'UI.DataField', Value: addressType_code, Label: 'Address Type' },
            { $Type: 'UI.DataField', Value: street, Label: 'Street' },
            { $Type: 'UI.DataField', Value: houseNumber, Label: 'House Number' },
            { $Type: 'UI.DataField', Value: city, Label: 'City' },
            { $Type: 'UI.DataField', Value: postalCode, Label: 'Postal Code' },
            { $Type: 'UI.DataField', Value: region, Label: 'Region' },
            { $Type: 'UI.DataField', Value: country_code, Label: 'Country' },
            { $Type: 'UI.DataField', Value: isDefault, Label: 'Default' }
        ]
    }
) {
    addressType_code @(
        Common.Label: 'Address Type',
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'AddressTypes',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: addressType_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
    country_code @(
        Common.Label: 'Country',
        Common.ValueListWithFixedValues: false,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'Countries',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: country_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
};

// VAT IDs annotations
annotate MDMService.PartnerVatIds with @(
    UI.CreateHidden: true,
    UI.UpdateHidden: true,
    UI.DeleteHidden: true,
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: vatType_code, Label: 'Tax Type' },
        { $Type: 'UI.DataField', Value: country_code, Label: 'Country' },
        { $Type: 'UI.DataField', Value: vatNumber, Label: 'VAT Number' },
        { $Type: 'UI.DataField', Value: isEstablished, Label: 'Is Established' },
        { $Type: 'UI.DataField', Value: validationStatus, Label: 'Validation Status' },
        { $Type: 'UI.DataField', Value: validationDate, Label: 'Validation Date' },
        { $Type: 'UI.DataField', Value: validationDetails, Label: 'Error Reason' }
    ],
    UI.HeaderInfo: {
        TypeName: 'Tax ID',
        TypeNamePlural: 'Tax IDs',
        Title: { Value: vatNumber }
    },
    UI.Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Tax Details',
            Target: '@UI.FieldGroup#TaxDetails'
        }
    ],
    UI.FieldGroup#TaxDetails: {
        Data: [
            { $Type: 'UI.DataField', Value: vatType_code, Label: 'Tax Type' },
            { $Type: 'UI.DataField', Value: country_code, Label: 'Country' },
            { $Type: 'UI.DataField', Value: vatNumber, Label: 'VAT Number' },
            { $Type: 'UI.DataField', Value: isEstablished, Label: 'Is Established' },
            { $Type: 'UI.DataField', Value: validationStatus, Label: 'Validation Status' },
            { $Type: 'UI.DataField', Value: validationDate, Label: 'Validation Date' },
            { $Type: 'UI.DataField', Value: validationDetails, Label: 'Error Reason', ![@UI.MultiLineText]: true }
        ]
    }
) {
    vatType_code @(
        Common.Label: 'Tax Type',
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'VatTypes',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: vatType_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
    country_code @(
        Common.Label: 'Country',
        Common.ValueListWithFixedValues: false,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'Countries',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: country_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
};

// Banks annotations
annotate MDMService.PartnerBanks with @(
    UI.CreateHidden: true,
    UI.UpdateHidden: true,
    UI.DeleteHidden: true,
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: sapBankIdentification, Label: 'SAP Bank ID' },
        { $Type: 'UI.DataField', Value: bankName, Label: 'Bank Name' },
        { $Type: 'UI.DataField', Value: accountNumber, Label: 'Account Number' },
        { $Type: 'UI.DataField', Value: iban, Label: 'IBAN' },
        { $Type: 'UI.DataField', Value: swiftCode, Label: 'SWIFT Code' },
        { $Type: 'UI.DataField', Value: bankCountry_code, Label: 'Bank Country' },
        { $Type: 'UI.DataField', Value: currency_code, Label: 'Currency' },
        {
            $Type: 'UI.DataField',
            Value: isDefault,
            Label: 'Default',
            ![@UI.Hidden]: {$edmJson: {$Or: [{$Eq: [{$Path: 'request/sourceSystem'}, 'Coupa']}, {$Eq: [{$Path: 'request/sourceSystem'}, 'Salesforce']}]}}
        }
    ],
    UI.HeaderInfo: {
        TypeName: 'Bank Account',
        TypeNamePlural: 'Bank Accounts',
        Title: { Value: bankName }
    },
    UI.Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Bank Details',
            Target: '@UI.FieldGroup#BankDetails'
        }
    ],
    UI.FieldGroup#BankDetails: {
        Data: [
            { $Type: 'UI.DataField', Value: bankName, Label: 'Bank Name' },
            { $Type: 'UI.DataField', Value: bankCountry_code, Label: 'Bank Country' },
            { $Type: 'UI.DataField', Value: bankKey, Label: 'Bank Key' },
            { $Type: 'UI.DataField', Value: accountHolder, Label: 'Account Holder' },
            { $Type: 'UI.DataField', Value: accountNumber, Label: 'Account Number' },
            { $Type: 'UI.DataField', Value: iban, Label: 'IBAN' },
            { $Type: 'UI.DataField', Value: swiftCode, Label: 'SWIFT Code' },
            { $Type: 'UI.DataField', Value: currency_code, Label: 'Currency' },
            { $Type: 'UI.DataField', Value: isDefault, Label: 'Default' }
        ]
    }
) {
    bankCountry_code @(
        Common.Label: 'Bank Country',
        Common.ValueListWithFixedValues: false,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'Countries',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: bankCountry_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
    currency_code @(
        Common.Label: 'Currency',
        Common.ValueListWithFixedValues: false,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'Currencies',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: currency_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
};

// Emails annotations
annotate MDMService.PartnerEmails with @(
    UI.CreateHidden: true,
    UI.UpdateHidden: true,
    UI.DeleteHidden: true,
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: sapAddressId, Label: 'SAP Address ID' },
        { $Type: 'UI.DataField', Value: sapOrdinalNumber, Label: 'SAP Email ID' },
        {
            $Type: 'UI.DataField',
            Value: emailType_code,
            Label: 'Email Type',
            ![@UI.Hidden]: {$edmJson: {$Eq: [{$Path: 'request/sourceSystem'}, 'Coupa']}}
        },
        { $Type: 'UI.DataField', Value: emailAddress, Label: 'Email Address' },
        { $Type: 'UI.DataField', Value: notes, Label: 'Notes' },
        { 
            $Type: 'UI.DataField', 
            Value: isDefault, 
            Label: 'Default',
            ![@UI.Hidden]: {$edmJson: {$Or: [{$Eq: [{$Path: 'request/sourceSystem'}, 'Coupa']}, {$Eq: [{$Path: 'request/sourceSystem'}, 'Salesforce']}]}}
        }
    ]
) {
    emailType_code @(
        Common.Label: 'Email Type',
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'EmailTypes',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: emailType_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
};

// Identifications annotations
annotate MDMService.PartnerIdentifications with @(
    UI.CreateHidden: true,
    UI.UpdateHidden: true,
    UI.DeleteHidden: true,
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: identificationType_code, Label: 'Identification Type' },
        { $Type: 'UI.DataField', Value: identificationNumber, Label: 'Identification Number' },
        { $Type: 'UI.DataField', Value: country_code, Label: 'Country' },
        { $Type: 'UI.DataField', Value: issuingAuthority, Label: 'Issuing Authority' },
        { $Type: 'UI.DataField', Value: validFrom, Label: 'Valid From' },
        { $Type: 'UI.DataField', Value: validTo, Label: 'Valid To' }
    ],
    UI.HeaderInfo: {
        TypeName: 'Identification',
        TypeNamePlural: 'Identifications',
        Title: { Value: identificationType_code }
    }
) {
    sapBPIdentificationType @(
        UI.Hidden: true
    );
};

// Duplicate Checks annotations
annotate MDMService.DuplicateChecks with @(
    UI.LineItem #Top5: [
        { $Type: 'UI.DataField', Value: checkDate, Label: 'Check Date' },
        { $Type: 'UI.DataField', Value: existingBpNumber, Label: 'BP Number', ![@HTML5.CssDefaults]: {width: '10rem'} },
        { $Type: 'UI.DataField', Value: existingBpName, Label: 'BP Name' },
        { $Type: 'UI.DataField', Value: matchScore, Label: 'Match Score' },
        { $Type: 'UI.DataField', Value: matchType, Label: 'Match Type' },
        { $Type: 'UI.DataField', Value: matchDetails, Label: 'Match Details' }
    ],
    UI.PresentationVariant #Top5: {
        $Type: 'UI.PresentationVariantType',
        SortOrder: [
            {
                $Type: 'Common.SortOrderType',
                Property: checkDate,
                Descending: true
            }
        ],
        MaxItems: 5,
        Visualizations: [
            '@UI.LineItem#Top5'
        ]
    }
) {
    checkDate @Common.Label: 'Check Date';
    existingBpNumber @(
        Common.Label: 'BP Number'
    );
    existingBpName @Common.Label: 'BP Name';
    matchScore @Common.Label: 'Match Score (%)';
    matchType @Common.Label: 'Match Type';
    matchDetails @Common.Label: 'Match Details';
};

// SubAccounts annotations
annotate MDMService.SubAccounts with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: subAccountId, Label: 'Sub Account ID' },
        { $Type: 'UI.DataField', Value: address_ID, Label: 'Address', ![@Common.Text]: { $Path: 'address/street', $edmJson: {$If: [{$Ne: [{ $Path: 'address/street' }, null]}]} } },
        { $Type: 'UI.DataField', Value: revenueStream_code, Label: 'Revenue Stream' },
        { $Type: 'UI.DataField', Value: billingCycle_code, Label: 'Billing Cycle' },
        { $Type: 'UI.DataField', Value: currency_code, Label: 'Currency' },
        { $Type: 'UI.DataField', Value: paymentTerms_code, Label: 'Payment Terms' },
        { $Type: 'UI.DataField', Value: dunningStrategy_code, Label: 'Dunning Strategy' }
    ],
    UI.PresentationVariant: {
        $Type: 'UI.PresentationVariantType',
        SortOrder: [
            {
                $Type: 'Common.SortOrderType',
                Property: subAccountId,
                Descending: false
            }
        ],
        Visualizations: [
            '@UI.LineItem'
        ]
    },
    UI.HeaderInfo: {
        TypeName: 'Sub Account',
        TypeNamePlural: 'Sub Accounts',
        Title: { Value: subAccountId }
    },
    UI.Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Sub Account Details',
            Target: '@UI.FieldGroup#SubAccountDetails'
        },
        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Email Contacts',
            Target: 'emails/@UI.LineItem'
        }
    ],
    UI.FieldGroup#SubAccountDetails: {
        Data: [
            { $Type: 'UI.DataField', Value: subAccountId, Label: 'Sub Account ID' },
            { $Type: 'UI.DataField', Value: address_ID, Label: 'Address' },
            { $Type: 'UI.DataField', Value: revenueStream_code, Label: 'Revenue Stream' },
            { $Type: 'UI.DataField', Value: billingCycle_code, Label: 'Billing Cycle' },
            { $Type: 'UI.DataField', Value: currency_code, Label: 'Currency' },
            { $Type: 'UI.DataField', Value: paymentTerms_code, Label: 'Payment Terms' },
            { $Type: 'UI.DataField', Value: dunningStrategy_code, Label: 'Dunning Strategy' }
        ]
    }
) {
    subAccountId @Common.Label: 'Sub Account ID';
    address_ID @(
        Common.Label: 'Address',
        Common.Text: { $Path: 'address/street' },
        Common.TextArrangement: #TextOnly
    );
    revenueStream_code @(
        Common.Label: 'Revenue Stream',
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Revenue Streams',
            CollectionPath: 'RevenueStreams',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: revenueStream_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'description' }
            ]
        }
    );
    billingCycle_code @(
        Common.Label: 'Billing Cycle',
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Billing Cycles',
            CollectionPath: 'BillingCycles',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: billingCycle_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'description' }
            ]
        }
    );
    currency_code @(
        Common.Label: 'Currency',
        Common.ValueList: {
            Label: 'Currencies',
            CollectionPath: 'Currencies',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: currency_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
    paymentTerms_code @(
        Common.Label: 'Payment Terms',
        Common.ValueList: {
            Label: 'Payment Terms',
            CollectionPath: 'PaymentTerms',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: paymentTerms_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'description' }
            ]
        }
    );
    dunningStrategy_code @(
        Common.Label: 'Dunning Strategy',
        Common.ValueList: {
            Label: 'Dunning Strategys',
            CollectionPath: 'DunningProcedures',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: dunningStrategy_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
};

// SubAccountBanks annotations
annotate MDMService.SubAccountBanks with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: bankName, Label: 'Bank Name' },
        { $Type: 'UI.DataField', Value: bankCountry_code, Label: 'Bank Country' },
        { $Type: 'UI.DataField', Value: bankKey, Label: 'Bank Key' },
        { $Type: 'UI.DataField', Value: accountHolder, Label: 'Account Holder' },
        { $Type: 'UI.DataField', Value: accountNumber, Label: 'Account Number' },
        { $Type: 'UI.DataField', Value: iban, Label: 'IBAN' },
        { $Type: 'UI.DataField', Value: swiftCode, Label: 'SWIFT Code' },
        { $Type: 'UI.DataField', Value: currency_code, Label: 'Currency' },
        { $Type: 'UI.DataField', Value: isDefault, Label: 'Default' }
    ],
    UI.HeaderInfo: {
        TypeName: 'Bank Account',
        TypeNamePlural: 'Bank Accounts',
        Title: { Value: bankName }
    },
    UI.Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Bank Details',
            Target: '@UI.FieldGroup#BankDetails'
        }
    ],
    UI.FieldGroup#BankDetails: {
        Data: [
            { $Type: 'UI.DataField', Value: bankName, Label: 'Bank Name' },
            { $Type: 'UI.DataField', Value: bankCountry_code, Label: 'Bank Country' },
            { $Type: 'UI.DataField', Value: bankKey, Label: 'Bank Key' },
            { $Type: 'UI.DataField', Value: accountHolder, Label: 'Account Holder' },
            { $Type: 'UI.DataField', Value: accountNumber, Label: 'Account Number' },
            { $Type: 'UI.DataField', Value: iban, Label: 'IBAN' },
            { $Type: 'UI.DataField', Value: swiftCode, Label: 'SWIFT Code' },
            { $Type: 'UI.DataField', Value: currency_code, Label: 'Currency' },
            { $Type: 'UI.DataField', Value: isDefault, Label: 'Default' }
        ]
    }
) {
    bankName @Common.Label: 'Bank Name';
    accountNumber @Common.Label: 'Account Number';
    iban @Common.Label: 'IBAN';
    swiftCode @Common.Label: 'SWIFT Code';
    bankCountry_code @(
        Common.Label: 'Bank Country',
        Common.ValueListWithFixedValues: false,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'Countries',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: bankCountry_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
            ]
        }
    );
    currency_code @(
        Common.Label: 'Currency',
        Common.ValueListWithFixedValues: false,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'Currencies',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: currency_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
            ]
        }
    );
    isDefault @Common.Label: 'Default';
};

// SubAccountEmails annotations
annotate MDMService.SubAccountEmails with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: contactType_code, Label: 'Contact Type' },
        { $Type: 'UI.DataField', Value: emailAddress, Label: 'Email Address' },
        { $Type: 'UI.DataField', Value: emailType_code, Label: 'Email Type' },
        { $Type: 'UI.DataField', Value: notes, Label: 'Notes' },
        { $Type: 'UI.DataField', Value: isDefault, Label: 'Default' }
    ],
    UI.HeaderInfo: {
        TypeName: 'Email Contact',
        TypeNamePlural: 'Email Contacts',
        Title: { Value: emailAddress }
    },
    UI.Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Email Details',
            Target: '@UI.FieldGroup#EmailDetails'
        }
    ],
    UI.FieldGroup#EmailDetails: {
        Data: [
            { $Type: 'UI.DataField', Value: contactType_code, Label: 'Contact Type' },
            { $Type: 'UI.DataField', Value: emailAddress, Label: 'Email Address' },
            { $Type: 'UI.DataField', Value: emailType_code, Label: 'Email Type' },
            { $Type: 'UI.DataField', Value: notes, Label: 'Notes' },
            { $Type: 'UI.DataField', Value: isDefault, Label: 'Default' }
        ]
    }
) {
    emailType_code @(
        Common.Label: 'Email Type',
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'EmailTypes',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: emailType_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
    contactType_code @(
        Common.Label: 'Contact Type',
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            $Type: 'Common.ValueListType',
            CollectionPath: 'ContactTypes',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: contactType_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
    emailAddress @Common.Label: 'Email Address';
    notes @Common.Label: 'Notes';
    isDefault @Common.Label: 'Default';
};

// Change Log annotations
annotate service.ChangeLogs with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: changeDate, Label: 'Change Date' },
        { $Type: 'UI.DataField', Value: changedByName, Label: 'Changed By' },
        { $Type: 'UI.DataField', Value: sectionName, Label: 'Section' },
        { $Type: 'UI.DataField', Value: fieldLabel, Label: 'Field' },
        { $Type: 'UI.DataField', Value: recordIdentifier, Label: 'Record' },
        { $Type: 'UI.DataField', Value: oldValue, Label: 'Old Value' },
        { $Type: 'UI.DataField', Value: newValue, Label: 'New Value' },
        { $Type: 'UI.DataField', Value: changeType, Label: 'Change Type' }
    ],
    UI.HeaderInfo: {
        TypeName: 'Change Log Entry',
        TypeNamePlural: 'Change Log Entries',
        Title: { Value: fieldLabel }
    }
);
