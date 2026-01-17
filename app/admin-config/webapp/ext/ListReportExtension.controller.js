sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension"
], function(ControllerExtension) {
    "use strict";

    return ControllerExtension.extend("com.company.adminconfig.ext.ListReportExtension", {
        handlers: {
            onTitlePress: function(oEvent) {
                // Get the binding context from the event source
                const oContext = oEvent.getSource().getBindingContext();

                if (oContext) {
                    const sRouteName = oContext.getProperty("routeName");

                    if (sRouteName) {
                        // Get the router from the extension API
                        const oRouter = this.base.getExtensionAPI().getRouting().getRouter();

                        // Navigate to the target route
                        oRouter.navTo(sRouteName);
                    }
                }
            }
        }
    });
});
