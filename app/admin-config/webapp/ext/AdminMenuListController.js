sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/model/Sorter",
    "sap/m/MessageToast"
], function (ControllerExtension, Sorter, MessageToast) {
    "use strict";

    return ControllerExtension.extend("com.company.adminconfig.ext.AdminMenuListController", {

        override: {
            /**
             * Called when the controller is initialized
             */
            onInit: function() {
                // Wait for table to be ready and apply grouping
                this._applyGroupingWhenReady();
            }
        },

        /**
         * Wait for table to be ready and apply grouping
         * @private
         */
        _applyGroupingWhenReady: function() {
            const oView = this.base.getView();

            // Use setTimeout to ensure the table is fully rendered
            setTimeout(() => {
                const oTable = this._findTable(oView);
                if (oTable) {
                    this._applyGrouping(oTable);
                    this._setupRowNavigation(oTable);
                } else {
                    console.warn("Table not found, retrying...");
                    // Retry after a short delay
                    setTimeout(() => this._applyGroupingWhenReady(), 500);
                }
            }, 100);
        },

        /**
         * Find the table control in the view
         * @private
         */
        _findTable: function(oView) {
            const aControls = oView.findAggregatedObjects(true, function(oControl) {
                return oControl.isA("sap.m.Table");
            });
            return aControls.length > 0 ? aControls[0] : null;
        },

        /**
         * Apply automatic grouping by category
         * @private
         */
        _applyGrouping: function(oTable) {
            try {
                const oBinding = oTable.getBinding("items");
                if (oBinding) {
                    // Create sorter with grouping enabled
                    const oSorter = new Sorter("category", false, true);
                    oBinding.sort([oSorter]);
                    console.log("✅ Automatic grouping by category applied");
                }
            } catch (error) {
                console.error("Failed to apply grouping:", error);
            }
        },

        /**
         * Setup row press navigation
         * @private
         */
        _setupRowNavigation: function(oTable) {
            try {
                // Enable navigation mode
                oTable.setMode("SingleSelectMaster");

                // Attach item press event
                oTable.attachItemPress((oEvent) => {
                    const oItem = oEvent.getParameter("listItem");
                    const oContext = oItem.getBindingContext();

                    if (oContext) {
                        const sRouteName = oContext.getProperty("routeName");

                        if (sRouteName) {
                            const oRouter = this.base.getExtensionAPI().getRouting().getRouter();
                            oRouter.navTo(sRouteName);
                            MessageToast.show("Navigating to " + oContext.getProperty("title"));
                        }
                    }
                });

                console.log("✅ Row navigation enabled");
            } catch (error) {
                console.error("Failed to setup row navigation:", error);
            }
        }
    });
});
