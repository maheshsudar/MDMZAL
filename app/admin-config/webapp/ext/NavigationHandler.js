sap.ui.define([
    "sap/ui/model/json/JSONModel"
], function(JSONModel) {
    "use strict";

    return {
        /**
         * Handler for navigateToTable action
         * This gets called after the backend action completes
         */
        onAfterNavigateToTable: function(oBindingContext, aSelectedContexts) {
            // Get the result from the action
            const oResult = oBindingContext.getObject();

            if (oResult && oResult.routeName) {
                // Get the router
                const oRouter = sap.ui.core.UIComponent.getRouterFor(this);

                // Navigate to the target route
                oRouter.navTo(oResult.routeName);
            }
        }
    };
});
