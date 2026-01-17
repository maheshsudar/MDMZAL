using SalesforceService as service from '../../srv/salesforce-service';

// Field-level annotations (Labels, Value Lists, etc.)
annotate service.SalesforceRequests with {
    requestNumber @(
        Common.Label: 'Request Number',
        UI.ReadOnly: true
    );
    partnerName @(
        Common.Label: 'Customer Name (Deprecated)',
        Common.FieldControl: fieldControl
    );
    name1 @(
        Common.Label: 'Name 1',
        Common.FieldControl: fieldControl
    );
    name2 @(
        Common.Label: 'Name 2',
        Common.FieldControl: #Optional
    );
    requestType @(
        Common.Label: 'Request Type',
        Common.FieldControl: #ReadOnly
    );
    status @(
        Common.Label: 'Status',
        Common.FieldControl: #ReadOnly,
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Statuses',
            CollectionPath: 'OverallStatuses',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: status, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
            ]
        }
    );

    sourceSystem @(
        Common.Label: 'Source System',
        Common.FieldControl: #ReadOnly
    );
    sapBpNumber @(
        Common.Label: 'SAP BP Number',
        Common.FieldControl: #ReadOnly,
        UI.ReadOnly: true
    );
    createdAt @Common.Label: 'Created At';
    createdBy @Common.Label: 'Created By';
    
    // Salesforce Specific
    salesforceId @Common.Label: 'Salesforce ID';
    accountType @Common.Label: 'Account Type';
    
    revenueStream_code @(
        Common.Label: 'Revenue Stream',
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
    currency_code @(
        Common.Label: 'Currency',
        Common.ValueListWithFixedValues: true,
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
    bpType_code @(
        Common.Label: 'BP Type',
        Common.FieldControl: fieldControl,
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'BP Types',
            CollectionPath: 'BPTypes',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: bpType_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
    paymentTerms_code @(
        Common.Label: 'Payment Terms',
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Payment Terms',
            CollectionPath: 'PaymentTerms',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: paymentTerms_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'description' }
            ],
            SelectionVariant: {
                SelectOptions: [
                    { PropertyName: 'isActive', Ranges: [{ Sign: #I, Option: #EQ, Low: true }] }
                ]
            }
        }
    );
    paymentMethod_code @(
        Common.Label: 'Payment Method',
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Payment Methods',
            CollectionPath: 'PaymentMethods',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: paymentMethod_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'description' }
            ]
        }
    );
    approverComments @(
        Common.Label: 'MDM Approver Comments',
        Common.FieldControl: #ReadOnly,
        UI.MultiLineText: true
    );
};

annotate service.PartnerAddresses with {
    sapAddressId @(
        Common.Label: 'SAP Address ID',
        Common.FieldControl: #ReadOnly
    );
    addressType_code @(
        Common.Label: 'Address Type',
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Address Types',
            CollectionPath: 'AddressTypes',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: addressType_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
    country_code @(
        Common.Label: 'Country',
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Countries',
            CollectionPath: 'Countries',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: country_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
    street @Common.Label: 'Street';
    city @Common.Label: 'City';
    postalCode @Common.Label: 'Postal Code';
};

annotate service.PartnerVatIds with {
    vatType_code @(
        Common.Label: 'Tax Type',
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Tax Types',
            CollectionPath: 'VatTypes',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: vatType_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
    country_code @(
        Common.Label: 'Country',
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Countries',
            CollectionPath: 'Countries',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: country_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
    vatNumber @Common.Label: 'VAT Number';
    isEstablished @Common.Label: 'Is Established';
};

annotate service.PartnerBanks with {
    sapBankIdentification @(
        Common.Label: 'SAP Bank ID',
        Common.FieldControl: #ReadOnly
    );
    bankCountry_code @(
        Common.Label: 'Bank Country',
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Countries',
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
        Common.ValueListWithFixedValues: true,
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
    bankName @Common.Label: 'Bank Name';
    accountNumber @Common.Label: 'Account Number';
    iban @Common.Label: 'IBAN';
    swiftCode @Common.Label: 'SWIFT Code';
};

annotate service.PartnerEmails with {
    sapAddressId @(
        Common.Label: 'SAP Address ID',
        Common.FieldControl: #ReadOnly
    );
    sapOrdinalNumber @(
        Common.Label: 'SAP Email ID',
        Common.FieldControl: #ReadOnly
    );
    emailType_code @(
        Common.Label: 'Email Type',
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Email Types',
            CollectionPath: 'EmailTypes',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: emailType_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
    emailAddress @Common.Label: 'Email Address';
    notes @Common.Label: 'Notes';
};

// UI Annotations
annotate service.SalesforceRequests with @(
    UI.HeaderInfo: {
        $Type: 'UI.HeaderInfoType',
        TypeName: 'Customer Request',
        TypeNamePlural: 'Customer Requests',
        Title: { $Type: 'UI.DataField', Value: name1 },
        Description: { $Type: 'UI.DataField', Value: requestNumber }
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: requestNumber },
        { $Type: 'UI.DataField', Value: name1 },
        { $Type: 'UI.DataField', Value: requestType },
        { $Type: 'UI.DataField', Value: status },
        { $Type: 'UI.DataField', Value: createdAt },
        { $Type: 'UI.DataField', Value: createdBy }
    ],

    UI.SelectionFields: [ status, requestType ],
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
            ID: 'SubAccountsFacet',
            Label: '5. Sub Accounts',
            Target: 'subAccounts/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'ApproverCommentsFacet',
            Label: '6. MDM Approval Feedback',
            Target: '@UI.FieldGroup#ApproverComments',
            ![@UI.Hidden]: {$edmJson: {$And: [
                {$Ne: [{$Path: 'status'}, 'Submitted']},
                {$Ne: [{$Path: 'status'}, 'Approved']},
                {$Ne: [{$Path: 'status'}, 'Rejected']}
            ]}}
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'ChangeLogFacet',
            Label: '7. Change Log',
            Target: 'changeLogs/@UI.LineItem',
            ![@UI.Hidden]: {$edmJson: {$Eq: [{$Path: 'requestType'}, 'Create']}}
        }
    ],
    UI.Identification: [
        { $Type: 'UI.DataFieldForAction', Action: 'SalesforceService.submit', Label: 'Submit' }
    ],
    UI.FieldGroup#BasicInfo: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: requestNumber, ![@UI.Hidden]: {$edmJson: {$Eq: [{$Path: 'IsActiveEntity'}, false]}} },
            { $Type: 'UI.DataField', Value: bpType_code, Label: 'BP Type' },
            { $Type: 'UI.DataField', Value: name1 },
            { $Type: 'UI.DataField', Value: name2 },
            { $Type: 'UI.DataField', Value: merchantId, Label: 'Merchant ID' },
            { $Type: 'UI.DataField', Value: requestType },
            { $Type: 'UI.DataField', Value: status },
            { $Type: 'UI.DataField', Value: sapBpNumber, Label: 'SAP BP Number' },
            { $Type: 'UI.DataField', Value: sourceSystem }
        ]
    },
    UI.FieldGroup#ApproverComments: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: approverComments, Label: 'MDM Approver Comments' }
        ]
    }
);


annotate service.PartnerBanks with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: sapBankIdentification, Label: 'SAP Bank ID' },
        { $Type: 'UI.DataField', Value: bankCountry_code, Label: 'Bank Country' },
        { $Type: 'UI.DataField', Value: bankKey, Label: 'Bank Key' },
        { $Type: 'UI.DataField', Value: accountHolder, Label: 'Account Holder' },
        { $Type: 'UI.DataField', Value: accountNumber, Label: 'Account Number' },
        { $Type: 'UI.DataField', Value: iban, Label: 'IBAN' },
        { $Type: 'UI.DataField', Value: swiftCode, Label: 'SWIFT Code' }
    ],
    Capabilities: {
        Insertable: false,
        Deletable: false,
        Updatable: false
    }
);

annotate service.PartnerAddresses with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: sapAddressId, Label: 'SAP Address ID' },
        { $Type: 'UI.DataField', Value: addressType_code, Label: 'Address Type' },
        { $Type: 'UI.DataField', Value: street, Label: 'Street' },
        { $Type: 'UI.DataField', Value: streetNumber, Label: 'House No' },
        { $Type: 'UI.DataField', Value: city, Label: 'City' },
        { $Type: 'UI.DataField', Value: postalCode, Label: 'Postal Code' },
        { $Type: 'UI.DataField', Value: country_code, Label: 'Country' }
    ],
    UI.HeaderInfo: {
        TypeName: 'Address',
        TypeNamePlural: 'Addresses',
        Title: { Value: street }
    },
    UI.Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Address Details',
            Target: '@UI.FieldGroup#AddressDetails'
        }
    ],
    UI.FieldGroup #AddressDetails: {
        Data: [
            { $Type: 'UI.DataField', Value: addressType_code, Label: 'Address Type' },
            { $Type: 'UI.DataField', Value: street, Label: 'Street' },
            { $Type: 'UI.DataField', Value: streetNumber, Label: 'House No' },
            { $Type: 'UI.DataField', Value: city, Label: 'City' },
            { $Type: 'UI.DataField', Value: postalCode, Label: 'Postal Code' },
            { $Type: 'UI.DataField', Value: country_code, Label: 'Country' }
        ]
    }
) {
    street @Common.FieldControl: #Mandatory;
    streetNumber @Common.FieldControl: #Optional;
    city @Common.FieldControl: #Mandatory;
    postalCode @Common.FieldControl: #Mandatory;
    country_code @Common.FieldControl: #Mandatory;
    addressType_code @Common.FieldControl: #Mandatory;
};

annotate service.PartnerVatIds with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: vatType_code, Label: 'Tax Type' },
        { $Type: 'UI.DataField', Value: country_code, Label: 'Country' },
        { $Type: 'UI.DataField', Value: vatNumber, Label: 'VAT Number' },
        { $Type: 'UI.DataField', Value: isEstablished, Label: 'Is Established' }
        // Validation status fields removed - only visible in MDM app
    ]
) {
    vatType_code @Common.FieldControl: #Mandatory;
    country_code @Common.FieldControl: #Mandatory;
    vatNumber @Common.FieldControl: #Mandatory;
};

annotate service.PartnerIdentifications with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: identificationType_code, Label: 'Identification Type' },
        { $Type: 'UI.DataField', Value: identificationNumber, Label: 'Identification Number' },
        { $Type: 'UI.DataField', Value: country_code, Label: 'Country' },
        { $Type: 'UI.DataField', Value: issuingAuthority, Label: 'Issuing Authority' },
        { $Type: 'UI.DataField', Value: validFrom, Label: 'Valid From' },
        { $Type: 'UI.DataField', Value: validTo, Label: 'Valid To' }
    ]
) {
    identificationType_code @(
        Common.Label: 'Identification Type',
        Common.FieldControl: #Mandatory,
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Identification Types',
            CollectionPath: 'IdentificationTypes',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: identificationType_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
    sapBPIdentificationType @(
        UI.Hidden: true
    );
    identificationNumber @(
        Common.Label: 'Identification Number',
        Common.FieldControl: #Mandatory
    );
    country_code @(
        Common.Label: 'Country',
        Common.FieldControl: #Optional,
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Countries',
            CollectionPath: 'Countries',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: country_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
    issuingAuthority @(
        Common.Label: 'Issuing Authority',
        Common.FieldControl: #Optional
    );
    validFrom @Common.Label: 'Valid From';
    validTo @Common.Label: 'Valid To';
};

annotate service.SubAccounts with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: subAccountId, Label: 'Sub Account ID' },
        { $Type: 'UI.DataField', Value: address_ID, Label: 'Address', ![@Common.Text]: { $Path: 'address/street', $edmJson: {$If: [{$Ne: [{ $Path: 'address/street' }, null]}]} } },
        { $Type: 'UI.DataField', Value: revenueStream_code, Label: 'Revenue Stream' },
        { $Type: 'UI.DataField', Value: billingCycle_code, Label: 'Billing Cycle' }
    ],
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
    UI.FieldGroup #SubAccountDetails: {
        Data: [
            { $Type: 'UI.DataField', Value: subAccountId, Label: 'Salesforce Sub Account ID' },
            { $Type: 'UI.DataField', Value: sapFICAContractAccount, Label: 'SAP FICA Contract Account' },
            { $Type: 'UI.DataField', Value: address_ID, Label: 'Address' },
            { $Type: 'UI.DataField', Value: revenueStream_code, Label: 'Revenue Stream' },
            { $Type: 'UI.DataField', Value: billingCycle_code, Label: 'Billing Cycle' },
            { $Type: 'UI.DataField', Value: currency_code, Label: 'Currency' },
            { $Type: 'UI.DataField', Value: paymentTerms_code, Label: 'Payment Terms' },
            { $Type: 'UI.DataField', Value: dunningStrategy_code, Label: 'Dunning Strategy' }
        ]
    }
) {
    currency_code @(
        Common.Label: 'Currency',
        Common.ValueListWithFixedValues: true,
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
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Payment Terms',
            CollectionPath: 'PaymentTerms',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: paymentTerms_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'description' }
            ],
            SelectionVariant: {
                SelectOptions: [
                    { PropertyName: 'isActive', Ranges: [{ Sign: #I, Option: #EQ, Low: true }] }
                ]
            }
        }
    );
    dunningStrategy_code @(
        Common.Label: 'Dunning Strategy',
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Dunning Strategies',
            CollectionPath: 'DunningStrategies',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: dunningStrategy_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
    revenueStream_code @(
        Common.Label: 'Revenue Stream',
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Revenue Streams',
            CollectionPath: 'RevenueStreams',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: revenueStream_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
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
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
            ]
        }
    );

    // System-managed fields (read-only, populated via webhook)
    orderIndex @UI.Hidden: true;
    subAccountId @(
        Common.Label: 'Salesforce Sub Account ID',
        Common.FieldControl: #ReadOnly
    );
    sapFICAContractAccount @(
        Common.Label: 'SAP FICA Contract Account',
        Common.FieldControl: #ReadOnly
    );

    // Mandatory fields for SubAccounts (Salesforce requirement)
    address_ID @Common.FieldControl: #Mandatory;
    revenueStream_code @Common.FieldControl: #Mandatory;
    billingCycle_code @Common.FieldControl: #Mandatory;
    paymentTerms_code @Common.FieldControl: #Mandatory;
    dunningStrategy_code @Common.FieldControl: #Mandatory;

    address @(
        Common.Label: 'Address',
        Common.Text: address.street,
        Common.TextArrangement: #TextFirst,
        Common.ValueList: {
            Label: 'Select Address',
            CollectionPath: 'PartnerAddresses',
            Parameters: [
                {
                    $Type: 'Common.ValueListParameterIn',
                    LocalDataProperty: request_ID,
                    ValueListProperty: 'request_ID'
                },
                {
                    $Type: 'Common.ValueListParameterInOut',
                    LocalDataProperty: address_ID,
                    ValueListProperty: 'ID'
                },
                {
                    $Type: 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'addressType_code'
                },
                {
                    $Type: 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'street'
                },
                {
                    $Type: 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'city'
                },
                {
                    $Type: 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'postalCode'
                },
                {
                    $Type: 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'country_code'
                }
            ]
        }
    );
};

annotate service.SubAccountBanks with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: bankReference, Label: 'Reference / Purpose' },
        { $Type: 'UI.DataField', Value: bankCountry_code, Label: 'Bank Country' },
        { $Type: 'UI.DataField', Value: bankKey, Label: 'Bank Key' },
        { $Type: 'UI.DataField', Value: accountHolder, Label: 'Account Holder' },
        { $Type: 'UI.DataField', Value: accountNumber, Label: 'Account Number' },
        { $Type: 'UI.DataField', Value: iban, Label: 'IBAN' },
        { $Type: 'UI.DataField', Value: controlKey, Label: 'Control Key' },
        { $Type: 'UI.DataField', Value: swiftCode, Label: 'SWIFT Code' }
    ],
    UI.HeaderInfo: {
        TypeName: 'Bank Account',
        TypeNamePlural: 'Bank Accounts',
        Title: { Value: bankKey }
    },
    UI.Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Bank Details',
            Target: '@UI.FieldGroup#BankDetails'
        }
    ],
    UI.FieldGroup #BankDetails: {
        Data: [
            { $Type: 'UI.DataField', Value: bankReference, Label: 'Reference / Purpose' },
            { $Type: 'UI.DataField', Value: bankCountry_code, Label: 'Bank Country' },
            { $Type: 'UI.DataField', Value: bankKey, Label: 'Bank Key' },
            { $Type: 'UI.DataField', Value: accountHolder, Label: 'Account Holder' },
            { $Type: 'UI.DataField', Value: accountNumber, Label: 'Account Number' },
            { $Type: 'UI.DataField', Value: iban, Label: 'IBAN' },
            { $Type: 'UI.DataField', Value: controlKey, Label: 'Control Key' },
            { $Type: 'UI.DataField', Value: swiftCode, Label: 'SWIFT Code' },
            { $Type: 'UI.DataField', Value: currency_code, Label: 'Currency' }
        ]
    }
) {
    bankCountry_code @(
        Common.FieldControl: #Mandatory,
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Countries',
            CollectionPath: 'Countries',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: bankCountry_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
    currency_code @(
        Common.ValueListWithFixedValues: true,
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
};

annotate service.SubAccountEmails with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: contactType_code, Label: 'Contact Type' },
        { $Type: 'UI.DataField', Value: emailAddress, Label: 'Email Address' },

    ]
) {
    contactType_code @(
        Common.Label: 'Contact Type',
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Contact Types',
            CollectionPath: 'ContactTypes',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: contactType_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' }
            ]
        }
    );
};

annotate service.SalesforceRequests actions {
    submit @(
        Common.SideEffects : {
            TargetProperties : ['status', 'isEditable']
        }
    );
    checkDuplicates @(
        Common.SideEffects : {
            TargetProperties : ['duplicateChecks']
        }
    );
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
