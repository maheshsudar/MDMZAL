sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("com.company.adminconfig.controller.Home", {

        onInit: function () {
            // Initialize if needed
        },

        onNavigateToEntity: function (oEvent) {
            const oSource = oEvent.getSource();
            const sEntity = oSource.data("entity");

            // Map entity names to route names
            const routeMap = {
                "ValidationRules": "ValidationRulesList",
                "SectionValidationRules": "SectionValidationRulesList",
                "CustomValidators": "CustomValidatorsList",
                "PaymentTerms": "PaymentTermsList",
                "PaymentMethods": "PaymentMethodsList",
                "SourceSystems": "SourceSystemsList",
                "OverallStatuses": "OverallStatusesList",
                "RequestTypes": "RequestTypesList",
                "AddressTypes": "AddressTypesList",
                "EmailTypes": "EmailTypesList",
                "VatTypes": "VatTypesList",
                "BPTypes": "BPTypesList",
                "ContactTypes": "ContactTypesList",
                "DocumentTypes": "DocumentTypesList",
                "DunningStrategies": "DunningStrategiesList",
                "VendorClassifications": "VendorClassificationsList",
                "RevenueStreams": "RevenueStreamsList",
                "BillingCycles": "BillingCyclesList",
                "BusinessChannels": "BusinessChannelsList",
                "SystemConfiguration": "SystemConfigurationList",
                "StatusTransitions": "StatusTransitionsList",
                "UserRoles": "UserRolesList",
                "WorkflowSteps": "WorkflowStepsList",
                "StatusAppConfig": "StatusAppConfigList"
            };

            const sRoute = routeMap[sEntity];
            if (sRoute) {
                const oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo(sRoute);
            }
        }

    });
});
