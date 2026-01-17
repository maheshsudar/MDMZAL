using CoupaService as service from '../../srv/coupa-service';

annotate service.CoupaRequests with @(
    UI.HeaderInfo: {
        $Type: 'UI.HeaderInfoType',
        TypeName: 'Supplier Request',
        TypeNamePlural: 'Supplier Requests',
        Title: { $Type: 'UI.DataField', Value: name1 },
        Description: { $Type: 'UI.DataField', Value: requestNumber }
    },
    UI.Identification: [
        { $Type: 'UI.DataFieldForAction', Action: 'CoupaService.submit', Label: 'Submit' },

    ],
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: requestNumber, Label: 'Request Number' },
        { $Type: 'UI.DataField', Value: name1, Label: 'Name 1' },
        { $Type: 'UI.DataField', Value: requestType, Label: 'Request Type' },
        { $Type: 'UI.DataField', Value: status, Label: 'Status' },
        { $Type: 'UI.DataField', Value: createdAt, Label: 'Created At' },
        { $Type: 'UI.DataField', Value: createdBy, Label: 'Created By' }
    ],
    UI.SelectionFields: [ status, requestType, createdAt ],
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
            ID: 'PaymentInfoFacet',
            Label: '5. Payment Information',
            Target: '@UI.FieldGroup#PaymentInfo'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'BankDetailsFacet',
            Label: '6. Bank Details',
            Target: 'banks/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'EmailContactsFacet',
            Label: '7. Email Contacts',
            Target: 'emails/@UI.LineItem'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'ApproverCommentsFacet',
            Label: '8. MDM Approval Feedback',
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
            Label: '9. Change Log',
            Target: 'changeLogs/@UI.LineItem',
            ![@UI.Hidden]: {$edmJson: {$Eq: [{$Path: 'requestType'}, 'Create']}}
        }
    ],
    UI.FieldGroup#BasicInfo: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: requestNumber, ![@UI.Hidden]: {$edmJson: {$Eq: [{$Path: 'IsActiveEntity'}, false]}} },
            { $Type: 'UI.DataField', Value: name1 },
            { $Type: 'UI.DataField', Value: name2 },
            { $Type: 'UI.DataField', Value: requestType },
            { $Type: 'UI.DataField', Value: status },
            { $Type: 'UI.DataField', Value: sapBpNumber, Label: 'SAP BP Number' },
            { $Type: 'UI.DataField', Value: sourceSystem }
        ]
    },
    UI.FieldGroup#PaymentInfo: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: paymentTerms_code, Label: 'Payment Terms' },
            { $Type: 'UI.DataField', Value: paymentMethod_code, Label: 'Payment Method' },
            { $Type: 'UI.DataField', Value: currency_code, Label: 'Currency' }
        ]
    },
    UI.FieldGroup#ApproverComments: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: approverComments, Label: 'MDM Approver Comments' }
        ]
    }
);

// Field-level annotations with labels
annotate service.CoupaRequests with {
    requestNumber @(
        Common.Label: 'Request Number',
        UI.ReadOnly: true
    );
    partnerName @(
        Common.Label: 'Supplier Name (Deprecated)',
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


    coupaInternalNo @(
        Common.Label: 'Coupa Internal No',
        Common.FieldControl: fieldControl
    );



    paymentTerms_code @(
        Common.Label: 'Payment Terms',
        Common.FieldControl: #Mandatory,
        Common.ValueListWithFixedValues: true,
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
    paymentMethod_code @(
        Common.Label: 'Payment Method',
        Common.FieldControl: #Mandatory,
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
    currency_code @(
        Common.Label: 'Currency',
        Common.FieldControl: #Mandatory,
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
    reconAccount @Common.Label: 'Reconciliation Account';
    approverComments @(
        Common.Label: 'MDM Approver Comments',
        Common.FieldControl: #ReadOnly,
        UI.MultiLineText: true
    );
};

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
    // Enable popup dialog for create/edit
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
    sapAddressId @(
        Common.Label: 'SAP Address ID',
        Common.FieldControl: #ReadOnly
    );
    street @Common.FieldControl: #Mandatory;
    streetNumber @Common.FieldControl: #Optional;
    city @Common.FieldControl: #Mandatory;
    postalCode @Common.FieldControl: #Mandatory;
    country_code @(
        Common.Label: 'Country',
        Common.FieldControl: #Mandatory,
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
};

annotate service.PartnerBanks with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: sapBankIdentification, Label: 'SAP Bank ID' },
        { $Type: 'UI.DataField', Value: bankCountry_code, Label: 'Bank Country' },
        { $Type: 'UI.DataField', Value: bankKey, Label: 'Bank Key' },
        { $Type: 'UI.DataField', Value: accountHolder, Label: 'Account Holder' },
        { $Type: 'UI.DataField', Value: accountNumber, Label: 'Account Number' },
        { $Type: 'UI.DataField', Value: iban, Label: 'IBAN' },
        { $Type: 'UI.DataField', Value: controlKey, Label: 'Control Key' },
        { $Type: 'UI.DataField', Value: swiftCode, Label: 'SWIFT Code' }
    ],
    // Enable popup dialog for create/edit
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
    sapBankIdentification @(
        Common.Label: 'SAP Bank ID',
        Common.FieldControl: #ReadOnly
    );
    bankCountry_code @(
        Common.Label: 'Bank Country',
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
};

annotate service.PartnerEmails with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: emailAddress, Label: 'Email Address' },
        { $Type: 'UI.DataField', Value: notes, Label: 'Notes' }
    ]
) {
    sapAddressId @(
        Common.Label: 'SAP Address ID',
        Common.FieldControl: #ReadOnly,
        UI.Hidden: true
    );
    sapOrdinalNumber @(
        Common.Label: 'SAP Email ID',
        Common.FieldControl: #ReadOnly,
        UI.Hidden: true
    );
    emailAddress @Common.FieldControl: #Mandatory;
};

annotate service.CoupaRequests actions {
    submit @(
        Common.SideEffects : {
            TargetProperties : ['status', 'isEditable']
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

// Identifications annotations
annotate service.PartnerIdentifications with @(
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: identificationType_code, Label: 'Identification Type' },
        { $Type: 'UI.DataField', Value: identificationNumber, Label: 'Identification Number' },
        { $Type: 'UI.DataField', Value: country_code, Label: 'Country' },
        { $Type: 'UI.DataField', Value: issuingAuthority, Label: 'Issuing Authority' },
        { $Type: 'UI.DataField', Value: validFrom, Label: 'Valid From' },
        { $Type: 'UI.DataField', Value: validTo, Label: 'Valid To' }
    ],
    // Enable popup dialog for create/edit
    UI.HeaderInfo: {
        TypeName: 'Identification',
        TypeNamePlural: 'Identifications',
        Title: { Value: identificationNumber }
    },
    UI.Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            Label: 'Identification Details',
            Target: '@UI.FieldGroup#IdentificationDetails'
        }
    ],
    UI.FieldGroup #IdentificationDetails: {
        Data: [
            { $Type: 'UI.DataField', Value: identificationType_code, Label: 'Identification Type' },
            { $Type: 'UI.DataField', Value: identificationNumber, Label: 'Identification Number' },
            { $Type: 'UI.DataField', Value: country_code, Label: 'Country' },
            { $Type: 'UI.DataField', Value: issuingAuthority, Label: 'Issuing Authority' },
            { $Type: 'UI.DataField', Value: validFrom, Label: 'Valid From' },
            { $Type: 'UI.DataField', Value: validTo, Label: 'Valid To' }
        ]
    }
) {
    identificationType_code @(
        Common.Label: 'Identification Type',
        Common.FieldControl: fieldControl,
        Common.ValueListWithFixedValues: true,
        Common.ValueList: {
            Label: 'Identification Types',
            CollectionPath: 'IdentificationTypes',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: identificationType_code, ValueListProperty: 'code' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'descr' },
                { $Type: 'Common.ValueListParameterConstant', Constant: 'COUPA', ValueListProperty: 'code' }
            ]
        }
    );
    sapBPIdentificationType @(
        UI.Hidden: true
    );
    identificationNumber @(
        Common.Label: 'Identification Number',
        Common.FieldControl: fieldControl
    );
    country_code @(
        Common.Label: 'Country',
        Common.FieldControl: fieldControl,
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
        Common.FieldControl: fieldControl
    );
    validFrom @(
        Common.Label: 'Valid From',
        Common.FieldControl: fieldControl
    );
    validTo @(
        Common.Label: 'Valid To',
        Common.FieldControl: fieldControl
    );
};
