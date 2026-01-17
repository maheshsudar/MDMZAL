using AdminService as service from '../../srv/admin-service';

// ========================================
// ADMIN MENU (HOME PAGE)
// ========================================

annotate service.AdminMenu with @(
    UI.HeaderInfo: {
        $Type: 'UI.HeaderInfoType',
        TypeName: 'Configuration Table',
        TypeNamePlural: 'Admin Configuration',
        Title: { $Type: 'UI.DataField', Value: title },
        Description: { $Type: 'UI.DataField', Value: description }
    },
    UI.SelectionFields: [
        category
    ],
    UI.SelectionVariant#GroupedByCategory: {
        $Type: 'UI.SelectionVariantType',
        Text: 'Grouped by Category',
        SelectOptions: []
    },
    UI.PresentationVariant: {
        $Type: 'UI.PresentationVariantType',
        SortOrder: [
            { Property: category, Descending: false },
            { Property: sortOrder, Descending: false }
        ],
        GroupBy: [ category ],
        Visualizations: [ '@UI.LineItem' ]
    },
    UI.PresentationVariant#GroupedByCategory: {
        $Type: 'UI.PresentationVariantType',
        SortOrder: [
            { Property: category, Descending: false },
            { Property: sortOrder, Descending: false }
        ],
        GroupBy: [ category ],
        Visualizations: [ '@UI.LineItem' ]
    },
    UI.SelectionPresentationVariant#GroupedByCategory: {
        $Type: 'UI.SelectionPresentationVariantType',
        Text: 'Grouped by Category',
        SelectionVariant: ![@UI.SelectionVariant#GroupedByCategory],
        PresentationVariant: ![@UI.PresentationVariant#GroupedByCategory]
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: title, Label: 'Table' },
        { $Type: 'UI.DataField', Value: description, Label: 'Description' },
        { $Type: 'UI.DataField', Value: routeName, ![@UI.Hidden] }
    ]
);

// ========================================
// VALIDATION RULES MANAGEMENT
// ========================================

annotate service.ValidationRules with @(
    UI.HeaderInfo: {
        $Type: 'UI.HeaderInfoType',
        TypeName: 'Validation Rule',
        TypeNamePlural: 'Validation Rules',
        Title: { $Type: 'UI.DataField', Value: ruleCode },
        Description: { $Type: 'UI.DataField', Value: errorMessage }
    },
    UI.SelectionFields: [
        entity,
        field,
        validationType,
        status,
        sourceSystem,
        requestType,
        isActive
    ],
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: ruleCode, Label: 'Rule Code' },
        { $Type: 'UI.DataField', Value: entity, Label: 'Entity' },
        { $Type: 'UI.DataField', Value: field, Label: 'Field' },
        { $Type: 'UI.DataField', Value: validationType, Label: 'Validation Type' },
        { $Type: 'UI.DataField', Value: errorSeverity, Label: 'Severity' },
        { $Type: 'UI.DataField', Value: status, Label: 'Applicable Status' },
        { $Type: 'UI.DataField', Value: sourceSystem, Label: 'Source System' },
        { $Type: 'UI.DataField', Value: requestType, Label: 'Request Type' },
        { $Type: 'UI.DataField', Value: isActive, Label: 'Active' },
        { $Type: 'UI.DataField', Value: priority, Label: 'Priority' }
    ],
    UI.Identification: [
        { $Type: 'UI.DataFieldForAction', Action: 'AdminService.toggleActive', Label: 'Toggle Active/Inactive' },
        { $Type: 'UI.DataFieldForAction', Action: 'AdminService.duplicate', Label: 'Duplicate Rule' }
    ],
    UI.Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'RuleBasicsFacet',
            Label: 'Basic Information',
            Target: '@UI.FieldGroup#RuleBasics'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'ValidationConfigFacet',
            Label: 'Validation Configuration',
            Target: '@UI.FieldGroup#ValidationConfig'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'ApplicabilityFacet',
            Label: 'Applicability',
            Target: '@UI.FieldGroup#Applicability'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'ErrorHandlingFacet',
            Label: 'Error Handling',
            Target: '@UI.FieldGroup#ErrorHandling'
        }
    ],
    UI.FieldGroup#RuleBasics: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: ruleCode, Label: 'Rule Code' },
            { $Type: 'UI.DataField', Value: entity, Label: 'Entity' },
            { $Type: 'UI.DataField', Value: field, Label: 'Field' },
            { $Type: 'UI.DataField', Value: isActive, Label: 'Active' },
            { $Type: 'UI.DataField', Value: priority, Label: 'Priority' }
        ]
    },
    UI.FieldGroup#ValidationConfig: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: validationType, Label: 'Validation Type' },
            { $Type: 'UI.DataField', Value: validationPattern, Label: 'Validation Pattern (Regex)' },
            { $Type: 'UI.DataField', Value: minLength, Label: 'Minimum Length' },
            { $Type: 'UI.DataField', Value: maxLength, Label: 'Maximum Length' },
            { $Type: 'UI.DataField', Value: allowedValues, Label: 'Allowed Values (comma-separated)' }
        ]
    },
    UI.FieldGroup#Applicability: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: status, Label: 'Applicable Status' },
            { $Type: 'UI.DataField', Value: sourceSystem, Label: 'Source System' },
            { $Type: 'UI.DataField', Value: requestType, Label: 'Request Type' },
            { $Type: 'UI.DataField', Value: entityType, Label: 'Entity Type' }
        ]
    },
    UI.FieldGroup#ErrorHandling: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: errorMessage, Label: 'Error Message' },
            { $Type: 'UI.DataField', Value: errorSeverity, Label: 'Error Severity' },
            { $Type: 'UI.DataField', Value: blockSubmission, Label: 'Block Submission' }
        ]
    }
);

// Field-level annotations for ValidationRules
annotate service.ValidationRules with {
    ruleCode @(
        Common.Label: 'Rule Code',
        Common.FieldControl: #Mandatory
    );
    entity @(
        Common.Label: 'Entity',
        Common.FieldControl: #Mandatory
    );
    field @(
        Common.Label: 'Field',
        Common.FieldControl: #Mandatory
    );
    validationType @(
        Common.Label: 'Validation Type',
        Common.FieldControl: #Mandatory,
        Common.ValueListWithFixedValues: true
    );
    errorMessage @(
        Common.Label: 'Error Message',
        UI.MultiLineText: true,
        Common.FieldControl: #Mandatory
    );
    errorSeverity @(
        Common.Label: 'Error Severity',
        Common.ValueListWithFixedValues: true
    );
    status @Common.Label: 'Applicable Status';
    sourceSystem @Common.Label: 'Source System';
    requestType @Common.Label: 'Request Type';
    entityType @Common.Label: 'Entity Type';
    isActive @Common.Label: 'Active';
    priority @Common.Label: 'Priority';
    blockSubmission @Common.Label: 'Block Submission';
    validationPattern @(
        Common.Label: 'Validation Pattern (Regex)',
        UI.MultiLineText: true
    );
    minLength @Common.Label: 'Minimum Length';
    maxLength @Common.Label: 'Maximum Length';
    allowedValues @(
        Common.Label: 'Allowed Values',
        UI.MultiLineText: true
    );
};

// ========================================
// SECTION VALIDATION RULES
// ========================================

annotate service.SectionValidationRules with @(
    UI.HeaderInfo: {
        $Type: 'UI.HeaderInfoType',
        TypeName: 'Section Validation Rule',
        TypeNamePlural: 'Section Validation Rules',
        Title: { $Type: 'UI.DataField', Value: ruleCode },
        Description: { $Type: 'UI.DataField', Value: errorMessage }
    },
    UI.SelectionFields: [
        entity,
        section,
        validationType,
        isActive
    ],
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: ruleCode, Label: 'Rule Code' },
        { $Type: 'UI.DataField', Value: entity, Label: 'Entity' },
        { $Type: 'UI.DataField', Value: section, Label: 'Section' },
        { $Type: 'UI.DataField', Value: validationType, Label: 'Validation Type' },
        { $Type: 'UI.DataField', Value: isActive, Label: 'Active' },
        { $Type: 'UI.DataField', Value: errorMessage, Label: 'Error Message' }
    ],
    UI.Identification: [
        { $Type: 'UI.DataFieldForAction', Action: 'AdminService.toggleActive', Label: 'Toggle Active/Inactive' }
    ],
    UI.Facets: [
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'BasicInfoFacet',
            Label: 'Basic Information',
            Target: '@UI.FieldGroup#BasicInfo'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'ValidationDetailsFacet',
            Label: 'Validation Details',
            Target: '@UI.FieldGroup#ValidationDetails'
        },
        {
            $Type: 'UI.ReferenceFacet',
            ID: 'ApplicabilityFacet',
            Label: 'Applicability',
            Target: '@UI.FieldGroup#Applicability'
        }
    ],
    UI.FieldGroup#BasicInfo: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: ruleCode, Label: 'Rule Code' },
            { $Type: 'UI.DataField', Value: entity, Label: 'Entity' },
            { $Type: 'UI.DataField', Value: section, Label: 'Section' },
            { $Type: 'UI.DataField', Value: isActive, Label: 'Active' }
        ]
    },
    UI.FieldGroup#ValidationDetails: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: validationType, Label: 'Validation Type' },
            { $Type: 'UI.DataField', Value: minCount, Label: 'Minimum Count' },
            { $Type: 'UI.DataField', Value: maxCount, Label: 'Maximum Count' },
            { $Type: 'UI.DataField', Value: errorMessage, Label: 'Error Message' },
            { $Type: 'UI.DataField', Value: blockSubmission, Label: 'Block Submission' }
        ]
    },
    UI.FieldGroup#Applicability: {
        $Type: 'UI.FieldGroupType',
        Data: [
            { $Type: 'UI.DataField', Value: status, Label: 'Applicable Status' },
            { $Type: 'UI.DataField', Value: sourceSystem, Label: 'Source System' },
            { $Type: 'UI.DataField', Value: entityType, Label: 'Entity Type' },
            { $Type: 'UI.DataField', Value: requestType, Label: 'Request Type' },
            { $Type: 'UI.DataField', Value: filterCriteria, Label: 'Filter Criteria' },
            { $Type: 'UI.DataField', Value: locale, Label: 'Language' }
        ]
    }
);

// ========================================
// CODE LISTS - SIMPLE ENTITIES
// ========================================

// Address Types
annotate service.AddressTypes with @(
    UI.HeaderInfo: {
        TypeName: 'Address Type',
        TypeNamePlural: 'Address Types'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: code, Label: 'Code' },
        { $Type: 'UI.DataField', Value: name, Label: 'Name' },
        { $Type: 'UI.DataField', Value: locale, Label: 'Language' }
    ]
);

// Email Types
annotate service.EmailTypes with @(
    UI.HeaderInfo: {
        TypeName: 'Email Type',
        TypeNamePlural: 'Email Types'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: code, Label: 'Code' },
        { $Type: 'UI.DataField', Value: name, Label: 'Name' },
        { $Type: 'UI.DataField', Value: locale, Label: 'Language' }
    ]
);

// VAT Types
annotate service.VatTypes with @(
    UI.HeaderInfo: {
        TypeName: 'VAT Type',
        TypeNamePlural: 'VAT Types'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: code, Label: 'Code' },
        { $Type: 'UI.DataField', Value: name, Label: 'Name' },
        { $Type: 'UI.DataField', Value: locale, Label: 'Language' }
    ]
);

// Payment Terms
annotate service.PaymentTerms with @(
    UI.HeaderInfo: {
        TypeName: 'Payment Term',
        TypeNamePlural: 'Payment Terms'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: code, Label: 'Code' },
        { $Type: 'UI.DataField', Value: name, Label: 'Name' },
        { $Type: 'UI.DataField', Value: locale, Label: 'Language' },
        { $Type: 'UI.DataField', Value: isActive, Label: 'Active' }
    ]
);

// Payment Methods
annotate service.PaymentMethods with @(
    UI.HeaderInfo: {
        TypeName: 'Payment Method',
        TypeNamePlural: 'Payment Methods'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: code, Label: 'Code' },
        { $Type: 'UI.DataField', Value: name, Label: 'Name' },
        { $Type: 'UI.DataField', Value: locale, Label: 'Language' },
        { $Type: 'UI.DataField', Value: isActive, Label: 'Active' }
    ]
);

// Source Systems
annotate service.SourceSystems with @(
    UI.HeaderInfo: {
        TypeName: 'Source System',
        TypeNamePlural: 'Source Systems'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: code, Label: 'Code' },
        { $Type: 'UI.DataField', Value: name, Label: 'Name' },
        { $Type: 'UI.DataField', Value: locale, Label: 'Language' },
        { $Type: 'UI.DataField', Value: isActive, Label: 'Active' }
    ]
);

// Request Types
annotate service.RequestTypes with @(
    UI.HeaderInfo: {
        TypeName: 'Request Type',
        TypeNamePlural: 'Request Types'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: code, Label: 'Code' },
        { $Type: 'UI.DataField', Value: name, Label: 'Name' },
        { $Type: 'UI.DataField', Value: locale, Label: 'Language' },
        { $Type: 'UI.DataField', Value: isActive, Label: 'Active' }
    ]
);

// Overall Statuses
annotate service.OverallStatuses with @(
    UI.HeaderInfo: {
        TypeName: 'Overall Status',
        TypeNamePlural: 'Overall Statuses'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: code, Label: 'Code' },
        { $Type: 'UI.DataField', Value: name, Label: 'Name' },
        { $Type: 'UI.DataField', Value: locale, Label: 'Language' },
        { $Type: 'UI.DataField', Value: isActive, Label: 'Active' }
    ]
);

// Revenue Streams (Salesforce)
annotate service.RevenueStreams with @(
    UI.HeaderInfo: {
        TypeName: 'Revenue Stream',
        TypeNamePlural: 'Revenue Streams'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: code, Label: 'Code' },
        { $Type: 'UI.DataField', Value: name, Label: 'Name' },
        { $Type: 'UI.DataField', Value: locale, Label: 'Language' }
    ]
);

// Billing Cycles (Salesforce)
annotate service.BillingCycles with @(
    UI.HeaderInfo: {
        TypeName: 'Billing Cycle',
        TypeNamePlural: 'Billing Cycles'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: code, Label: 'Code' },
        { $Type: 'UI.DataField', Value: name, Label: 'Name' },
        { $Type: 'UI.DataField', Value: locale, Label: 'Language' }
    ]
);

// Business Channels
annotate service.BusinessChannels with @(
    UI.HeaderInfo: {
        TypeName: 'Business Channel',
        TypeNamePlural: 'Business Channels'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: code, Label: 'Code' },
        { $Type: 'UI.DataField', Value: name, Label: 'Name' }
    ]
);

// BP Types
annotate service.BPTypes with @(
    UI.HeaderInfo: {
        TypeName: 'BP Type',
        TypeNamePlural: 'BP Types'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: code, Label: 'Code' },
        { $Type: 'UI.DataField', Value: name, Label: 'Name' },
        { $Type: 'UI.DataField', Value: locale, Label: 'Language' }
    ]
);

// Contact Types
annotate service.ContactTypes with @(
    UI.HeaderInfo: {
        TypeName: 'Contact Type',
        TypeNamePlural: 'Contact Types'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: code, Label: 'Code' },
        { $Type: 'UI.DataField', Value: name, Label: 'Name' },
        { $Type: 'UI.DataField', Value: locale, Label: 'Language' }
    ]
);

// Document Types
annotate service.DocumentTypes with @(
    UI.HeaderInfo: {
        TypeName: 'Document Type',
        TypeNamePlural: 'Document Types'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: code, Label: 'Code' },
        { $Type: 'UI.DataField', Value: name, Label: 'Name' },
        { $Type: 'UI.DataField', Value: locale, Label: 'Language' }
    ]
);

// Dunning Strategies
annotate service.DunningStrategies with @(
    UI.HeaderInfo: {
        TypeName: 'Dunning Strategy',
        TypeNamePlural: 'Dunning Strategies'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: code, Label: 'Code' },
        { $Type: 'UI.DataField', Value: name, Label: 'Name' },
        { $Type: 'UI.DataField', Value: locale, Label: 'Language' }
    ]
);

// Vendor Classifications
annotate service.VendorClassifications with @(
    UI.HeaderInfo: {
        TypeName: 'Vendor Classification',
        TypeNamePlural: 'Vendor Classifications'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: code, Label: 'Code' },
        { $Type: 'UI.DataField', Value: name, Label: 'Name' },
        { $Type: 'UI.DataField', Value: isActive, Label: 'Active' }
    ]
);

// System Configuration
annotate service.SystemConfiguration with @(
    UI.HeaderInfo: {
        TypeName: 'System Configuration',
        TypeNamePlural: 'System Configuration'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: configKey, Label: 'Configuration Key' },
        { $Type: 'UI.DataField', Value: configValue, Label: 'Value' },
        { $Type: 'UI.DataField', Value: description, Label: 'Description' }
    ]
);

// Status Transitions
annotate service.StatusTransitions with @(
    UI.HeaderInfo: {
        TypeName: 'Status Transition',
        TypeNamePlural: 'Status Transitions'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: fromStatus, Label: 'From Status' },
        { $Type: 'UI.DataField', Value: toStatus, Label: 'To Status' },
        { $Type: 'UI.DataField', Value: action, Label: 'Action' },
        { $Type: 'UI.DataField', Value: isAllowed, Label: 'Allowed' }
    ]
);

// User Roles
annotate service.UserRoles with @(
    UI.HeaderInfo: {
        TypeName: 'User Role',
        TypeNamePlural: 'User Roles'
    },
    UI.LineItem: [
        { $Type: 'UI.DataField', Value: roleCode, Label: 'Role Code' },
        { $Type: 'UI.DataField', Value: roleName, Label: 'Role Name' },
        { $Type: 'UI.DataField', Value: description, Label: 'Description' }
    ]
);
