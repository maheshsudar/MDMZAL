sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension"
], function(ControllerExtension) {
    "use strict";

    return ControllerExtension.extend("com.company.adminconfig.ext.AdminConfigExtension", {
        handleNavigation: function(oBindingContext, aSelectedContexts) {
            try {
                // Get the context from the action response
                const oActionContext = oBindingContext;

                if (oActionContext) {
                    // Read the route name from the action result
                    const oData = oActionContext.getObject();

                    if (oData && oData.routeName) {
                        // Get the router
                        const oRouter = this.base.getExtensionAPI().getRouting().getRouter();

                        // Navigate to the route
                        oRouter.navTo(oData.routeName);
                    }
                }
            } catch (error) {
                console.error("Navigation failed:", error);
            }
        }
    });
});
