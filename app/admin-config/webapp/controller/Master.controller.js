sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("com.company.adminconfig.controller.Master", {
        onInit: function () {
            // Get the router
            this._oRouter = this.getOwnerComponent().getRouter();
        },

        /**
         * Handle table row selection
         */
        onTableSelect: function (oEvent) {
            const oItem = oEvent.getParameter("listItem");
            if (!oItem) {
                return;
            }

            const oContext = oItem.getBindingContext();
            if (!oContext) {
                return;
            }

            // Get the selected table configuration
            const sCode = oContext.getProperty("code");
            const sTitle = oContext.getProperty("title");
            const sDescription = oContext.getProperty("description");

            if (!sCode) {
                return;
            }

            // Navigate to detail page with selected entity
            this._oRouter.navTo("detail", {
                entitySet: sCode
            });

            // Store the selected table info in a model for the detail page
            const oDetailModel = new sap.ui.model.json.JSONModel({
                code: sCode,
                title: sTitle,
                description: sDescription,
                entitySet: sCode,
                selectedItems: 0
            });
            this.getOwnerComponent().setModel(oDetailModel, "detailModel");
        },

        /**
         * Handle search in the admin menu table
         */
        onSearch: function (oEvent) {
            const sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
            const oTable = this.byId("adminMenuTable");
            const oBinding = oTable.getBinding("items");

            if (!oBinding) {
                return;
            }

            const aFilters = [];
            if (sQuery && sQuery.length > 0) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("title", FilterOperator.Contains, sQuery),
                        new Filter("description", FilterOperator.Contains, sQuery),
                        new Filter("category", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }

            oBinding.filter(aFilters);
        },

        /**
         * Navigate back (for nav button in mobile view)
         */
        onNavBack: function () {
            window.history.go(-1);
        }
    });
});
