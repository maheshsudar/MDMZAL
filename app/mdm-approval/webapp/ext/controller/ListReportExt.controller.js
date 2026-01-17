sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/ui/layout/form/SimpleForm",
    "sap/ui/core/Title",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/ObjectStatus",
    "sap/m/VBox",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/ColumnListItem"
], function (ControllerExtension, Fragment, JSONModel, MessageToast, MessageBox, Button, Dialog, SimpleForm, Title, Label, Text, ObjectStatus, VBox, Table, Column, ColumnListItem) {
    "use strict";

    return ControllerExtension.extend("com.company.mdmapproval.ext.controller.ListReportExt", {
        override: {
            onInit: function () {
                console.log("=== ListReportExt onInit called ===");

                // Wait for the table to be rendered, then add our custom buttons
                var that = this;
                setTimeout(function () {
                    that._addCustomButtons();
                    // Hide unwanted buttons after adding custom ones
                    that._hideUnwantedButtons();
                }, 1500);
            }
        },

        _addCustomButtons: function () {
            console.log("=== Adding Custom buttons to toolbar ===");
            var oView = this.base.getView();

            // Find the table - FE V4 uses MDC Table
            var oTable = oView.byId("fe::table::MDMApprovalRequests::LineItem");
            if (!oTable) {
                console.error("Table not found!");
                return;
            }

            // Add "Change" Button
            if (this.onChangeRequest) {
                var oChangeButton = new Button({
                    text: "Change",
                    type: "Emphasized",
                    press: this.onChangeRequest.bind(this)
                });
                if (oTable.addAction) oTable.addAction(oChangeButton);
            }

            // Add "View SAP Partner" Button
            var oViewButton = new Button({
                text: "View SAP Partner",
                icon: "sap-icon://search",
                press: this.onViewSAPPartner.bind(this)
            });
            if (oTable.addAction) oTable.addAction(oViewButton);

            // Add "Adhoc Sync" Button
            var oAdhocSyncButton = new Button({
                text: "Adhoc Sync",
                icon: "sap-icon://synchronize",
                type: "Emphasized",
                press: this.onOpenAdhocSyncDialog.bind(this)
            });
            if (oTable.addAction) oTable.addAction(oAdhocSyncButton);
        },

        _hideUnwantedButtons: function () {
            console.log("=== Hiding unwanted standard buttons from MDM List Report ===");
            try {
                var oView = this.base.getView();
                var oTable = oView.byId("fe::table::MDMApprovalRequests::LineItem");

                if (!oTable) {
                    console.warn("Table not found for button hiding");
                    return;
                }

                // Get all actions and hide Create, Delete standard buttons
                var aActions = oTable.getActions?.() || [];
                aActions.forEach(function (oAction) {
                    var sId = oAction.getId();
                    var sText = oAction.getText?.();

                    // Hide standard Fiori Elements buttons
                    if (sId && (sId.includes("StandardAction::Create") ||
                        sId.includes("StandardAction::Delete") ||
                        sId.includes("StandardAction::Edit"))) {
                        oAction.setVisible(false);
                        console.log("Hidden standard button by ID:", sId);
                    }

                    // Hide by text (for dynamically added buttons)
                    if (sText === "Create" || sText === "Delete" || sText === "Edit") {
                        oAction.setVisible(false);
                        console.log("Hidden button by text:", sText);
                    }
                });

                // Also try to find toolbar and hide buttons there
                var aToolbarContent = oTable.getVariant?.()?.getContent?.() || [];
                aToolbarContent.forEach(function (oControl) {
                    if (oControl.getMetadata && oControl.getMetadata().getName() === "sap.m.Button") {
                        var sText = oControl.getText?.();
                        if (sText === "Create" || sText === "Delete" || sText === "Change") {
                            oControl.setVisible(false);
                            console.log("Hidden toolbar button:", sText);
                        }
                    }
                });

                console.log("Button hiding complete");
            } catch (e) {
                console.error("Error hiding List Report buttons:", e);
            }
        },

        onViewSAPPartner: function () {
            this._showSearchDialog("View");
        },

        onChangeRequest: function () {
            this._showSearchDialog("Change");
        },

        _showSearchDialog: function (sMode) {
            console.log("=== Opening Search Dialog in mode: " + sMode + " ===");
            this._sDialogMode = sMode; // Store mode

            var oView = this.base.getView();

            if (!this._pDialog) {
                this._pDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.company.mdmapproval.ext.fragment.SearchPartnerDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }

            this._pDialog.then(function (oDialog) {
                var oModel = new JSONModel({ results: [] });
                oDialog.setModel(oModel, "searchResults");

                // Update button text based on mode
                var oBtn = oView.byId("btnDialogAction");
                if (oBtn) {
                    oBtn.setText(sMode === "Change" ? "Start Change Request" : "View Details");
                    oBtn.setIcon(sMode === "Change" ? "sap-icon://edit" : "sap-icon://display");
                }

                oDialog.setTitle(sMode === "Change" ? "Search Partner to Change" : "Search SAP Business Partner");
                oDialog.open();
            });
        },

        onSearchPartner: function () {
            console.log("=== onSearchPartner called ===");
            var oView = this.base.getView();
            var sPartnerName = oView.byId("searchPartnerName").getValue();
            var sSapBpNumber = oView.byId("searchSapBpNumber").getValue();
            var sVatId = oView.byId("searchVatId").getValue();
            var sSatelliteSystemId = oView.byId("searchSatelliteSystemId").getValue();

            if (!sPartnerName && !sSapBpNumber && !sVatId && !sSatelliteSystemId) {
                MessageToast.show("Please enter at least one search criterion.");
                return;
            }

            var oModel = oView.getModel();
            var oDialog = oView.byId("searchPartnerDialog");
            var oDialogModel = oDialog.getModel("searchResults");

            var oOperation = oModel.bindContext("/searchSAPPartners(...)");

            if (sPartnerName) oOperation.setParameter("partnerName", sPartnerName);
            if (sSapBpNumber) oOperation.setParameter("sapBpNumber", sSapBpNumber);
            if (sVatId) oOperation.setParameter("vatId", sVatId);
            if (sSatelliteSystemId) oOperation.setParameter("satelliteSystemId", sSatelliteSystemId);

            console.log("Executing search...");
            oOperation.execute().then(function () {
                var oResults = oOperation.getBoundContext().getObject();
                var aResults = oResults.value || oResults;
                oDialogModel.setProperty("/results", aResults);

                if (!aResults || aResults.length === 0) {
                    MessageToast.show("No partners found.");
                } else {
                    MessageToast.show("Found " + aResults.length + " partner(s)");
                }
            }).catch(function (oError) {
                console.error("Search error:", oError);
                MessageBox.error("Error searching partners: " + (oError.message || oError));
            });
        },

        onDialogAction: function () {
            console.log("=== Dialog Action clicked. Mode: " + this._sDialogMode + " ===");
            var oView = this.base.getView();
            var oTable = oView.byId("partnerResultsTable");

            if (!oTable || oTable.getSelectedIndex() === -1) {
                MessageToast.show("Please select a partner.");
                return;
            }

            var oSelectedPartner = oTable.getContextByIndex(oTable.getSelectedIndex()).getObject();
            var sSapBpNumber = oSelectedPartner.sapBpNumber;

            if (this._sDialogMode === "View") {
                // For View mode, show details in a dialog (read-only)
                this._showPartnerDetailsDialog(sSapBpNumber);
            } else {
                // For Change mode, create a draft and navigate to Object Page
                this._createChangeRequest(sSapBpNumber, false);
            }
        },

        _showPartnerDetailsDialog: function (sSapBpNumber) {
            var oView = this.base.getView();
            var oModel = oView.getModel();

            MessageToast.show("Fetching details...");

            var oAction = oModel.bindContext("/getSAPPartnerDetails(...)");
            oAction.setParameter("sapBpNumber", sSapBpNumber);

            oAction.execute().then(() => {
                var oResponse = oAction.getBoundContext().getObject();
                var data = oResponse.value || oResponse;

                var aDialogContent = [];

                // Basic Information
                var oBasicForm = new SimpleForm({
                    editable: false,
                    layout: "ResponsiveGridLayout",
                    content: [
                        new Title({ text: "Basic Information" }),
                        new Label({ text: "SAP BP Number" }),
                        new Text({ text: data.sapBpNumber }),
                        new Label({ text: "Partner Name" }),
                        new Text({ text: data.partnerName }),
                        new Label({ text: "Partner Role" }),
                        new Text({ text: data.partnerRole }),
                        new Label({ text: "Status" }),
                        new ObjectStatus({
                            text: data.status,
                            state: data.status === 'Blocked' ? 'Error' : 'Success'
                        })
                    ]
                });

                if (data.satelliteSystemId) {
                    oBasicForm.addContent(new Label({ text: "Satellite System ID" }));
                    oBasicForm.addContent(new Text({ text: data.satelliteSystemId }));
                }

                aDialogContent.push(oBasicForm);

                // Addresses Table
                if (data.addresses && data.addresses.length > 0) {
                    var oAddressTable = new Table({
                        width: "100%",
                        headerText: "Addresses (" + data.addresses.length + ")",
                        columns: [
                            new Column({ header: new Text({ text: "Type" }), width: "15%" }),
                            new Column({ header: new Text({ text: "Street" }), width: "25%" }),
                            new Column({ header: new Text({ text: "City" }), width: "20%" }),
                            new Column({ header: new Text({ text: "Postal Code" }), width: "15%" }),
                            new Column({ header: new Text({ text: "Country" }), width: "25%" })
                        ]
                    });

                    data.addresses.forEach(addr => {
                        oAddressTable.addItem(new ColumnListItem({
                            cells: [
                                new Text({ text: addr.addressType || "Business" }),
                                new Text({ text: addr.street || "-" }),
                                new Text({ text: addr.city || "-" }),
                                new Text({ text: addr.postalCode || "-" }),
                                new Text({ text: addr.country || "-" })
                            ]
                        }));
                    });

                    aDialogContent.push(oAddressTable);
                }

                // Tax Numbers Table
                if (data.taxNumbers && data.taxNumbers.length > 0) {
                    var oTaxTable = new Table({
                        width: "100%",
                        headerText: "Tax Information (" + data.taxNumbers.length + ")",
                        columns: [
                            new Column({ header: new Text({ text: "Country" }), width: "30%" }),
                            new Column({ header: new Text({ text: "Tax Type" }), width: "30%" }),
                            new Column({ header: new Text({ text: "Tax Number" }), width: "40%" })
                        ]
                    });

                    data.taxNumbers.forEach(tax => {
                        oTaxTable.addItem(new ColumnListItem({
                            cells: [
                                new Text({ text: tax.country || "-" }),
                                new Text({ text: tax.taxType || "VAT" }),
                                new Text({ text: tax.taxNumber || "-" })
                            ]
                        }));
                    });

                    aDialogContent.push(oTaxTable);
                }

                // Bank Accounts Table
                if (data.bankAccounts && data.bankAccounts.length > 0) {
                    var oBankTable = new Table({
                        width: "100%",
                        headerText: "Bank Details (" + data.bankAccounts.length + ")",
                        columns: [
                            new Column({ header: new Text({ text: "Bank Name" }), width: "25%" }),
                            new Column({ header: new Text({ text: "Country" }), width: "15%" }),
                            new Column({ header: new Text({ text: "IBAN" }), width: "30%" }),
                            new Column({ header: new Text({ text: "Account" }), width: "15%" }),
                            new Column({ header: new Text({ text: "SWIFT" }), width: "15%" })
                        ]
                    });

                    data.bankAccounts.forEach(bank => {
                        oBankTable.addItem(new ColumnListItem({
                            cells: [
                                new Text({ text: bank.bankName || "-" }),
                                new Text({ text: bank.bankCountry || "-" }),
                                new Text({ text: bank.iban || "-" }),
                                new Text({ text: bank.accountNumber || "-" }),
                                new Text({ text: bank.swiftCode || "-" })
                            ]
                        }));
                    });

                    aDialogContent.push(oBankTable);
                }

                // Contact Information
                if (data.contacts) {
                    var oContactForm = new SimpleForm({
                        editable: false,
                        layout: "ResponsiveGridLayout",
                        content: [
                            new Title({ text: "Contact Information" })
                        ]
                    });

                    if (data.contacts.email) {
                        oContactForm.addContent(new Label({ text: "Email" }));
                        oContactForm.addContent(new Text({ text: data.contacts.email }));
                    }
                    if (data.contacts.phone) {
                        oContactForm.addContent(new Label({ text: "Phone" }));
                        oContactForm.addContent(new Text({ text: data.contacts.phone }));
                    }
                    if (data.contacts.fax) {
                        oContactForm.addContent(new Label({ text: "Fax" }));
                        oContactForm.addContent(new Text({ text: data.contacts.fax }));
                    }

                    aDialogContent.push(oContactForm);
                }

                var oVBox = new VBox({
                    items: aDialogContent,
                    width: "100%"
                });

                oVBox.addStyleClass("sapUiSmallMargin");

                var oDetailDialog = new Dialog({
                    title: "Business Partner Details: " + data.partnerName,
                    contentWidth: "900px",
                    contentHeight: "700px",
                    resizable: true,
                    draggable: true,
                    verticalScrolling: true,
                    content: [oVBox],
                    beginButton: new Button({
                        text: "Close",
                        press: function () {
                            oDetailDialog.close();
                        }
                    }),
                    afterClose: function () {
                        oDetailDialog.destroy();
                    }
                });

                oView.addDependent(oDetailDialog);
                oDetailDialog.open();
            }).catch(err => {
                MessageBox.error("Failed to fetch details: " + err.message);
            });
        },

        _createChangeRequest: function (sSapBpNumber, bViewOnly) {
            // Close dialog
            this.base.getView().byId("searchPartnerDialog").close();

            var oExtensionAPI = this.base.getExtensionAPI();
            if (!oExtensionAPI || !oExtensionAPI.getEditFlow) {
                MessageBox.error("ExtensionAPI not available.");
                return;
            }

            sap.ui.core.BusyIndicator.show();
            var oModel = this.base.getView().getModel();
            var oOperation = oModel.bindContext("/importSAPPartner(...)");
            oOperation.setParameter("sapBpNumber", sSapBpNumber);

            oOperation.execute().then(function () {
                var sResult = oOperation.getBoundContext().getObject().value;
                try {
                    var oResult = JSON.parse(sResult);
                    if (!oResult.success) throw new Error(oResult.message);

                    // Store View Mode flag if needed
                    if (bViewOnly) {
                        sessionStorage.setItem("sap.mdm.viewMode", "true");
                    } else {
                        sessionStorage.removeItem("sap.mdm.viewMode");
                    }

                    oExtensionAPI.getEditFlow().createDocument("/BusinessPartnerRequests", {
                        creationMode: "NewPage",
                        data: oResult.data
                    }).then(function () {
                        MessageToast.show(bViewOnly ? "Opening Partner Details..." : "Draft prepared.");
                    }).catch(function (oError) {
                        MessageBox.error("Navigation failed: " + oError);
                    }).finally(function () {
                        sap.ui.core.BusyIndicator.hide();
                    });

                } catch (e) {
                    MessageBox.error("Failed to process data: " + e.message);
                    sap.ui.core.BusyIndicator.hide();
                }
            }).catch(function (oError) {
                MessageBox.error("Import failed: " + (oError.message || oError));
                sap.ui.core.BusyIndicator.hide();
            });
        },

        onCancelSearch: function () {
            this.base.getView().byId("searchPartnerDialog").close();
        },

        // ================================
        // ADHOC SYNC DIALOG HANDLERS
        // ================================

        onOpenAdhocSyncDialog: function () {
            console.log("=== Opening Adhoc Sync Dialog ===");
            var oView = this.base.getView();

            if (!this._pAdhocSyncDialog) {
                this._pAdhocSyncDialog = Fragment.load({
                    id: oView.getId(),
                    name: "com.company.mdmapproval.ext.fragment.AdhocSyncDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }

            this._pAdhocSyncDialog.then(function (oDialog) {
                // Initialize model with empty data
                var oModel = new JSONModel({
                    sapBpNumber: "",
                    bpName: "",
                    bpType: "",
                    targetSystem: "Coupa",
                    adhocReason: "",
                    isValid: false
                });
                oDialog.setModel(oModel, "adhocSync");

                // Reset validation message
                var oMessageStrip = oView.byId("validationMessageStrip");
                if (oMessageStrip) {
                    oMessageStrip.setVisible(false);
                }

                oDialog.open();
            });
        },

        onSAPBpNumberChange: function (oEvent) {
            // When user changes BP number, reset validation
            var oView = this.base.getView();
            var oModel = oView.byId("adhocSyncDialog").getModel("adhocSync");
            oModel.setProperty("/bpName", "");
            oModel.setProperty("/bpType", "");
            oModel.setProperty("/isValid", false);

            var oMessageStrip = oView.byId("validationMessageStrip");
            if (oMessageStrip) {
                oMessageStrip.setVisible(false);
            }
        },

        onValidateSAPBP: function () {
            console.log("=== Validating SAP BP Number ===");
            var oView = this.base.getView();
            var sSapBpNumber = oView.byId("sapBpNumberInput").getValue().trim();

            if (!sSapBpNumber) {
                MessageToast.show("Please enter SAP BP Number");
                return;
            }

            sap.ui.core.BusyIndicator.show(0);

            // Call validateAndFetchSAPBP function
            var oModel = this.base.getView().getModel();
            var oBindingContext = oModel.bindContext("/validateAndFetchSAPBP(...)");
            oBindingContext.setParameter("sapBpNumber", sSapBpNumber);

            oBindingContext.execute().then(function () {
                sap.ui.core.BusyIndicator.hide();

                var oResult = oBindingContext.getBoundContext().getObject();
                console.log("Validation result:", oResult);

                var oDialogModel = oView.byId("adhocSyncDialog").getModel("adhocSync");
                var oMessageStrip = oView.byId("validationMessageStrip");

                if (oResult.isValid) {
                    // SAP BP found - update model
                    oDialogModel.setProperty("/sapBpNumber", oResult.bpNumber);
                    oDialogModel.setProperty("/bpName", oResult.bpName);
                    oDialogModel.setProperty("/bpType", oResult.bpType);
                    oDialogModel.setProperty("/isValid", true);

                    // Show success message
                    oMessageStrip.setType("Success");
                    oMessageStrip.setText("SAP Business Partner " + oResult.bpNumber + " validated successfully");
                    oMessageStrip.setVisible(true);

                    MessageToast.show("BP validated: " + oResult.bpName);
                } else {
                    // SAP BP not found
                    oDialogModel.setProperty("/bpName", "");
                    oDialogModel.setProperty("/bpType", "");
                    oDialogModel.setProperty("/isValid", false);

                    // Show error message
                    oMessageStrip.setType("Error");
                    oMessageStrip.setText(oResult.errorMessage || "Business Partner not found in SAP");
                    oMessageStrip.setVisible(true);

                    MessageBox.error(oResult.errorMessage || "Business Partner not found in SAP");
                }
            }.bind(this)).catch(function (oError) {
                sap.ui.core.BusyIndicator.hide();
                console.error("Error validating SAP BP:", oError);

                var oMessageStrip = oView.byId("validationMessageStrip");
                oMessageStrip.setType("Error");
                oMessageStrip.setText("Failed to validate SAP BP: " + (oError.message || "Unknown error"));
                oMessageStrip.setVisible(true);

                MessageBox.error("Failed to validate SAP BP: " + (oError.message || "Unknown error"));
            });
        },

        onCreateAdhocSyncRequest: function () {
            console.log("=== Creating Adhoc Sync Request ===");
            var oView = this.base.getView();
            var oDialogModel = oView.byId("adhocSyncDialog").getModel("adhocSync");
            var oData = oDialogModel.getData();

            // Validate required fields
            if (!oData.isValid) {
                MessageBox.error("Please validate SAP BP Number first");
                return;
            }

            if (!oData.targetSystem) {
                MessageBox.error("Please select a Target System");
                return;
            }

            if (!oData.adhocReason || oData.adhocReason.trim() === "") {
                MessageBox.error("Please enter a reason for the adhoc sync");
                return;
            }

            sap.ui.core.BusyIndicator.show(0);

            console.log("Creating Adhoc Sync Request with params:", {
                sapBpNumber: oData.sapBpNumber,
                existingBpName: oData.bpName,
                targetSystem: oData.targetSystem,
                adhocReason: oData.adhocReason.trim()
            });

            // Call the unbound action createAdhocSyncRequest
            var oModel = this.base.getView().getModel();
            var oBindingContext = oModel.bindContext("/createAdhocSyncRequest(...)");
            oBindingContext.setParameter("sapBpNumber", oData.sapBpNumber);
            oBindingContext.setParameter("existingBpName", oData.bpName);
            oBindingContext.setParameter("targetSystem", oData.targetSystem);
            oBindingContext.setParameter("adhocReason", oData.adhocReason.trim());

            oBindingContext.execute().then(function () {
                sap.ui.core.BusyIndicator.hide();
                var oCreatedData = oBindingContext.getBoundContext().getObject();
                console.log("Adhoc Sync Request created:", oCreatedData);

                MessageBox.success("Adhoc Sync Request created successfully!\n\nRequest Number: " + oCreatedData.requestNumber, {
                    onClose: function () {
                        // Close dialog
                        oView.byId("adhocSyncDialog").close();

                        // Refresh the list
                        var oTable = oView.byId("fe::table::BusinessPartnerRequests::LineItem");
                        if (oTable && oTable.getBinding("rows")) {
                            oTable.getBinding("rows").refresh();
                        }
                    }
                });
            }.bind(this)).catch(function (oError) {
                sap.ui.core.BusyIndicator.hide();
                console.error("Error creating Adhoc Sync Request:", oError);

                var sErrorMessage = "Failed to create Adhoc Sync Request";
                if (oError.message) {
                    sErrorMessage += ": " + oError.message;
                }

                MessageBox.error(sErrorMessage);
            });
        },

        onCancelAdhocSync: function () {
            this.base.getView().byId("adhocSyncDialog").close();
        }
    });
});
