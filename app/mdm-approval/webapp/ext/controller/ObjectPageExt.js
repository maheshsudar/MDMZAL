sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/Label",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/ObjectStatus"
], function (ControllerExtension, MessageBox, MessageToast, Dialog, Button, Text, Label, VBox, HBox, Table, Column, ColumnListItem, ObjectStatus) {
    "use strict";

    return ControllerExtension.extend("com.company.mdmapproval.ext.controller.ObjectPageExt", {
        // Required by manifest.json for custom button handlers

        /**
         * Handler for AEB Sanctions Check button
         * Executes AEB check action and shows results popup
         */
        onPerformAEBCheck: function () {
            console.log("=== AEB Sanctions Check button clicked ===");
            const oView = this.base.getView();
            const oContext = oView.getBindingContext();
            const that = this;

            if (!oContext) {
                MessageBox.error("No request selected");
                return;
            }

            const oModel = oContext.getModel();
            const sPath = oContext.getPath();

            MessageToast.show("Running AEB Sanctions Check...");

            // Execute AEB check action
            oModel.bindContext(sPath + "/MDMService.performAEBCheck(...)").execute()
                .then(function () {
                    console.log("✅ AEB check completed successfully");
                    MessageToast.show("AEB Check completed");

                    // Refresh context to get updated data
                    oContext.refresh();

                    // Wait a moment for data to refresh, then show popup
                    setTimeout(function () {
                        const oData = oContext.getObject();
                        that._showAEBCheckResultsPopup(oData);
                    }, 500);
                })
                .catch(function (oError) {
                    console.error("❌ AEB check error:", oError);
                    MessageBox.error("AEB check failed: " + (oError.message || "Unknown error"));
                });
        },

        /**
         * Handler for VIES VAT Check button
         * Executes VIES check action and shows results popup
         */
        onPerformVIESCheck: function () {
            console.log("=== VIES VAT Check button clicked ===");
            const oView = this.base.getView();
            const oContext = oView.getBindingContext();
            const that = this;

            if (!oContext) {
                MessageBox.error("No request selected");
                return;
            }

            const oModel = oContext.getModel();
            const sPath = oContext.getPath();

            MessageToast.show("Running VIES VAT Check...");

            // Execute VIES check action
            oModel.bindContext(sPath + "/MDMService.performVIESCheck(...)").execute()
                .then(function () {
                    console.log("✅ VIES check completed successfully");
                    MessageToast.show("VIES Check completed");

                    // Refresh context to get updated data
                    oContext.refresh();

                    // Wait a moment for data to refresh, then show popup
                    setTimeout(function () {
                        const oData = oContext.getObject();
                        that._showVIESCheckResultsPopup(oData);
                    }, 500);
                })
                .catch(function (oError) {
                    console.error("❌ VIES check error:", oError);
                    MessageBox.error("VIES check failed: " + (oError.message || "Unknown error"));
                });
        },

        /**
         * Handler for Duplicate Check button
         * Executes duplicate check action and shows results popup
         */
        onCheckDuplicates: function () {
            console.log("=== Duplicate Check button clicked ===");
            const oView = this.base.getView();
            const oContext = oView.getBindingContext();
            const that = this;

            if (!oContext) {
                MessageBox.error("No request selected");
                return;
            }

            const oModel = oContext.getModel();
            const sPath = oContext.getPath();

            MessageToast.show("Checking for duplicates...");

            // Execute duplicate check action
            oModel.bindContext(sPath + "/MDMService.checkDuplicates(...)").execute()
                .then(function () {
                    console.log("✅ Duplicate check completed successfully");
                    MessageToast.show("Duplicate check completed");

                    // Refresh context to get updated data
                    oContext.refresh();

                    // Wait a moment for data to refresh, then show popup
                    setTimeout(function () {
                        const oData = oContext.getObject();
                        that._showDuplicateCheckResultsPopup(oData);
                    }, 500);
                })
                .catch(function (oError) {
                    console.error("❌ Duplicate check error:", oError);
                    MessageBox.error("Duplicate check failed: " + (oError.message || "Unknown error"));
                });
        },

        /**
         * Legacy handler for combined compliance check
         * Runs both AEB and VIES checks sequentially
         */
        onComplianceCheck: function () {
            var oView = this.base.getView();
            var oContext = oView.getBindingContext();
            if (!oContext) {
                MessageBox.error("No request selected");
                return;
            }

            var oModel = oContext.getModel();
            var sPath = oContext.getPath();

            MessageBox.confirm("Run AEB and VIES compliance checks?", {
                title: "Compliance Check",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        MessageToast.show("Running compliance checks...");
                        oModel.bindContext(sPath + "/MDMService.performAEBCheck(...)").execute()
                            .then(function () {
                                MessageToast.show("AEB Check completed");
                                return oModel.bindContext(sPath + "/MDMService.performVIESCheck(...)").execute();
                            })
                            .then(function () {
                                MessageToast.show("VIES Check completed");
                                oModel.refresh();
                            })
                            .catch(function (oError) {
                                MessageBox.error("Compliance check failed: " + (oError.message || "Unknown error"));
                            });
                    }
                }
            });
        },

        /**
         * Handler for Approve button
         */
        onApprove: function () {
            var oView = this.base.getView();
            var oContext = oView.getBindingContext();
            if (!oContext) {
                MessageBox.error("No request selected");
                return;
            }

            var oModel = oContext.getModel();
            var sPath = oContext.getPath();

            MessageBox.confirm("Are you sure you want to approve this request?", {
                title: "Approve Request",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        oModel.bindContext(sPath + "/MDMService.approveRequest(...)").execute()
                            .then(function () {
                                MessageToast.show("Request approved successfully");
                                oModel.refresh();
                            })
                            .catch(function (oError) {
                                MessageBox.error("Approval failed: " + (oError.message || "Unknown error"));
                            });
                    }
                }
            });
        },

        /**
         * Handler for Reject button
         */
        onReject: function () {
            var oView = this.base.getView();
            var oContext = oView.getBindingContext();
            if (!oContext) {
                MessageBox.error("No request selected");
                return;
            }

            var oModel = oContext.getModel();
            var sPath = oContext.getPath();

            MessageBox.confirm("Are you sure you want to reject this request?", {
                title: "Reject Request",
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        oModel.bindContext(sPath + "/MDMService.rejectRequest(...)").execute()
                            .then(function () {
                                MessageToast.show("Request rejected");
                                oModel.refresh();
                            })
                            .catch(function (oError) {
                                MessageBox.error("Rejection failed: " + (oError.message || "Unknown error"));
                            });
                    }
                }
            });
        },

        /**
         * Show AEB Trade Compliance Check results in a popup dialog
         * @param {object} oData - Request data containing AEB check results
         * @private
         */
        _showAEBCheckResultsPopup: function (oData) {
            console.log("=== Showing AEB Check Results Popup ===");
            const sStatus = oData.aebStatus || "Not Checked";
            const sDetails = oData.aebCheckDetails || "No details available";
            const sCheckDate = oData.aebCheckDate ? new Date(oData.aebCheckDate).toLocaleString() : "N/A";

            // Determine dialog state based on status
            let sState = "Information";
            if (sStatus === "Pass") sState = "Success";
            else if (sStatus === "Fail" || sStatus === "Blocked") sState = "Error";
            else if (sStatus === "Warning") sState = "Warning";

            // Create dialog content
            const oDialog = new Dialog({
                title: "AEB Trade Compliance Check Results",
                state: sState,
                content: [
                    new VBox({
                        items: [
                            new HBox({
                                items: [
                                    new Label({ text: "Status:", width: "120px" }).addStyleClass("sapUiTinyMarginEnd"),
                                    new ObjectStatus({
                                        text: sStatus,
                                        state: sState === "Success" ? "Success" : sState === "Error" ? "Error" : sState === "Warning" ? "Warning" : "None"
                                    })
                                ]
                            }).addStyleClass("sapUiSmallMarginBottom"),
                            new HBox({
                                items: [
                                    new Label({ text: "Check Date:", width: "120px" }).addStyleClass("sapUiTinyMarginEnd"),
                                    new Text({ text: sCheckDate }).addStyleClass("sapUiSmallMarginBottom")
                                ]
                            }).addStyleClass("sapUiSmallMarginBottom"),
                            new VBox({
                                items: [
                                    new Label({ text: "Details:" }).addStyleClass("sapUiSmallMarginBottom"),
                                    new Text({ text: sDetails, width: "400px" }).addStyleClass("sapUiSmallMarginBottom")
                                ]
                            })
                        ]
                    }).addStyleClass("sapUiSmallMargin")
                ],
                beginButton: new Button({
                    text: "Close",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.open();
        },

        /**
         * Show VIES VAT Validation Check results in a popup dialog
         * @param {object} oData - Request data containing VIES check results
         * @private
         */
        _showVIESCheckResultsPopup: function (oData) {
            console.log("=== Showing VIES Check Results Popup ===");
            const sStatus = oData.viesStatus || "Not Checked";
            const sDetails = oData.viesCheckDetails || "No details available";
            const sCheckDate = oData.viesCheckDate ? new Date(oData.viesCheckDate).toLocaleString() : "N/A";

            // Determine dialog state based on status
            let sState = "Information";
            if (sStatus === "Valid") sState = "Success";
            else if (sStatus === "Invalid" || sStatus === "Error") sState = "Error";
            else if (sStatus === "Partial") sState = "Warning";

            // Create dialog content
            const oDialog = new Dialog({
                title: "VIES VAT Validation Check Results",
                state: sState,
                content: [
                    new VBox({
                        items: [
                            new HBox({
                                items: [
                                    new Label({ text: "Status:", width: "120px" }).addStyleClass("sapUiTinyMarginEnd"),
                                    new ObjectStatus({
                                        text: sStatus,
                                        state: sState === "Success" ? "Success" : sState === "Error" ? "Error" : sState === "Warning" ? "Warning" : "None"
                                    })
                                ]
                            }).addStyleClass("sapUiSmallMarginBottom"),
                            new HBox({
                                items: [
                                    new Label({ text: "Check Date:", width: "120px" }).addStyleClass("sapUiTinyMarginEnd"),
                                    new Text({ text: sCheckDate }).addStyleClass("sapUiSmallMarginBottom")
                                ]
                            }).addStyleClass("sapUiSmallMarginBottom"),
                            new VBox({
                                items: [
                                    new Label({ text: "Details:" }).addStyleClass("sapUiSmallMarginBottom"),
                                    new Text({ text: sDetails, width: "400px" }).addStyleClass("sapUiSmallMarginBottom")
                                ]
                            })
                        ]
                    }).addStyleClass("sapUiSmallMargin")
                ],
                beginButton: new Button({
                    text: "Close",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.open();
        },

        /**
         * Show Duplicate Check results in a popup dialog
         * @param {object} oData - Request data containing duplicate check results
         * @private
         */
        _showDuplicateCheckResultsPopup: function (oData) {
            console.log("=== Showing Duplicate Check Results Popup ===");
            const sStatus = oData.duplicateCheckStatus || "Not Checked";
            const sCheckDate = oData.duplicateCheckDate ? new Date(oData.duplicateCheckDate).toLocaleString() : "N/A";

            // Determine dialog state based on status
            let sState = "Information";
            if (sStatus === "No Duplicates") sState = "Success";
            else if (sStatus === "Duplicates Found") sState = "Warning";

            // Create table for duplicate results if available
            const aTableItems = [];
            if (oData.duplicateChecks && oData.duplicateChecks.length > 0) {
                oData.duplicateChecks.forEach(function (oDup) {
                    aTableItems.push(new ColumnListItem({
                        cells: [
                            new Text({ text: oDup.existingBpNumber || "N/A" }),
                            new Text({ text: oDup.existingBpName || "N/A" }),
                            new ObjectStatus({
                                text: oDup.matchScore ? oDup.matchScore + "%" : "N/A",
                                state: oDup.matchScore > 80 ? "Error" : oDup.matchScore > 60 ? "Warning" : "Success"
                            }),
                            new Text({ text: oDup.matchType || "N/A" }),
                            new Text({ text: oDup.matchDetails || "N/A" })
                        ]
                    }));
                });
            }

            const aContent = [
                new VBox({
                    items: [
                        new HBox({
                            items: [
                                new Label({ text: "Status:", width: "120px" }).addStyleClass("sapUiTinyMarginEnd"),
                                new ObjectStatus({
                                    text: sStatus,
                                    state: sState === "Success" ? "Success" : sState === "Warning" ? "Warning" : "None"
                                })
                            ]
                        }).addStyleClass("sapUiSmallMarginBottom"),
                        new HBox({
                            items: [
                                new Label({ text: "Check Date:", width: "120px" }).addStyleClass("sapUiTinyMarginEnd"),
                                new Text({ text: sCheckDate }).addStyleClass("sapUiSmallMarginBottom")
                            ]
                        }).addStyleClass("sapUiSmallMarginBottom")
                    ]
                }).addStyleClass("sapUiSmallMargin")
            ];

            // Add results table if duplicates found
            if (aTableItems.length > 0) {
                const oTable = new Table({
                    columns: [
                        new Column({ header: new Label({ text: "BP Number" }) }),
                        new Column({ header: new Label({ text: "BP Name" }) }),
                        new Column({ header: new Label({ text: "Match Score" }) }),
                        new Column({ header: new Label({ text: "Match Type" }) }),
                        new Column({ header: new Label({ text: "Details" }) })
                    ],
                    items: aTableItems
                }).addStyleClass("sapUiSmallMarginTop");

                aContent.push(oTable);
            } else {
                aContent.push(new Text({
                    text: "No duplicates found for this partner.",
                    width: "400px"
                }).addStyleClass("sapUiSmallMargin"));
            }

            // Create dialog
            const oDialog = new Dialog({
                title: "Duplicate Check Results",
                state: sState,
                contentWidth: aTableItems.length > 0 ? "900px" : "500px",
                content: aContent,
                beginButton: new Button({
                    text: "Close",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.open();
        }
    });
});
