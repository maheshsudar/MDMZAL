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
    "sap/m/ObjectStatus"
], function (ControllerExtension, Fragment, JSONModel, MessageToast, MessageBox, Button, Dialog, SimpleForm, Title, Label, Text, ObjectStatus) {
    "use strict";

    return ControllerExtension.extend("com.company.couparequests.ext.controller.ListReportExt", {
        override: {
            onInit: function () {
                console.log("=== ListReportExt onInit called ===");

                // Wait for the table to be rendered, then add our custom buttons
                var that = this;
                setTimeout(function () {
                    that._addCustomButtons();
                }, 1500);
            }
        },

        _addCustomButtons: function () {
            console.log("=== Adding Custom buttons to toolbar ===");
            var oView = this.base.getView();

            // Find the table - FE V4 uses MDC Table
            var oTable = oView.byId("fe::table::CoupaRequests::LineItem");
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
                    name: "com.company.couparequests.ext.fragment.SearchPartnerDialog",
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

            var oSelectedItem = oTable.getSelectedItem();
            if (!oSelectedItem) {
                MessageToast.show("Please select a partner.");
                return;
            }

            var oSelectedPartner = oSelectedItem.getBindingContext("searchResults").getObject();
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
                var oBasicForm = new sap.ui.layout.form.SimpleForm({
                    editable: false,
                    layout: "ResponsiveGridLayout",
                    content: [
                        new sap.ui.core.Title({ text: "Basic Information" }),
                        new sap.m.Label({ text: "SAP BP Number" }),
                        new sap.m.Text({ text: data.sapBpNumber }),
                        new sap.m.Label({ text: "Partner Name" }),
                        new sap.m.Text({ text: data.partnerName }),
                        new sap.m.Label({ text: "Partner Role" }),
                        new sap.m.Text({ text: data.partnerRole }),
                        new sap.m.Label({ text: "Status" }),
                        new sap.m.ObjectStatus({
                            text: data.status,
                            state: data.status === 'Blocked' ? 'Error' : 'Success'
                        })
                    ]
                });

                if (data.satelliteSystemId) {
                    oBasicForm.addContent(new sap.m.Label({ text: "Satellite System ID" }));
                    oBasicForm.addContent(new sap.m.Text({ text: data.satelliteSystemId }));
                }

                aDialogContent.push(oBasicForm);

                // Addresses Table
                if (data.addresses && data.addresses.length > 0) {
                    var oAddressTable = new sap.m.Table({
                        width: "100%",
                        headerText: "Addresses (" + data.addresses.length + ")",
                        columns: [
                            new sap.m.Column({ header: new sap.m.Text({ text: "Type" }), width: "15%" }),
                            new sap.m.Column({ header: new sap.m.Text({ text: "Street" }), width: "25%" }),
                            new sap.m.Column({ header: new sap.m.Text({ text: "City" }), width: "20%" }),
                            new sap.m.Column({ header: new sap.m.Text({ text: "Postal Code" }), width: "15%" }),
                            new sap.m.Column({ header: new sap.m.Text({ text: "Country" }), width: "25%" })
                        ]
                    });

                    data.addresses.forEach(addr => {
                        oAddressTable.addItem(new sap.m.ColumnListItem({
                            cells: [
                                new sap.m.Text({ text: addr.addressType || "Business" }),
                                new sap.m.Text({ text: addr.street || "-" }),
                                new sap.m.Text({ text: addr.city || "-" }),
                                new sap.m.Text({ text: addr.postalCode || "-" }),
                                new sap.m.Text({ text: addr.country || "-" })
                            ]
                        }));
                    });

                    aDialogContent.push(oAddressTable);
                }

                // Tax Numbers Table
                if (data.taxNumbers && data.taxNumbers.length > 0) {
                    var oTaxTable = new sap.m.Table({
                        width: "100%",
                        headerText: "Tax Information (" + data.taxNumbers.length + ")",
                        columns: [
                            new sap.m.Column({ header: new sap.m.Text({ text: "Country" }), width: "30%" }),
                            new sap.m.Column({ header: new sap.m.Text({ text: "Tax Type" }), width: "30%" }),
                            new sap.m.Column({ header: new sap.m.Text({ text: "Tax Number" }), width: "40%" })
                        ]
                    });

                    data.taxNumbers.forEach(tax => {
                        oTaxTable.addItem(new sap.m.ColumnListItem({
                            cells: [
                                new sap.m.Text({ text: tax.country || "-" }),
                                new sap.m.Text({ text: tax.taxType || "VAT" }),
                                new sap.m.Text({ text: tax.taxNumber || "-" })
                            ]
                        }));
                    });

                    aDialogContent.push(oTaxTable);
                }

                // Bank Accounts Table
                if (data.bankAccounts && data.bankAccounts.length > 0) {
                    var oBankTable = new sap.m.Table({
                        width: "100%",
                        headerText: "Bank Details (" + data.bankAccounts.length + ")",
                        columns: [
                            new sap.m.Column({ header: new sap.m.Text({ text: "Bank Name" }), width: "25%" }),
                            new sap.m.Column({ header: new sap.m.Text({ text: "Country" }), width: "15%" }),
                            new sap.m.Column({ header: new sap.m.Text({ text: "IBAN" }), width: "30%" }),
                            new sap.m.Column({ header: new sap.m.Text({ text: "Account" }), width: "15%" }),
                            new sap.m.Column({ header: new sap.m.Text({ text: "SWIFT" }), width: "15%" })
                        ]
                    });

                    data.bankAccounts.forEach(bank => {
                        oBankTable.addItem(new sap.m.ColumnListItem({
                            cells: [
                                new sap.m.Text({ text: bank.bankName || "-" }),
                                new sap.m.Text({ text: bank.bankCountry || "-" }),
                                new sap.m.Text({ text: bank.iban || "-" }),
                                new sap.m.Text({ text: bank.accountNumber || "-" }),
                                new sap.m.Text({ text: bank.swiftCode || "-" })
                            ]
                        }));
                    });

                    aDialogContent.push(oBankTable);
                }

                // Contact Information
                if (data.contacts) {
                    var oContactForm = new sap.ui.layout.form.SimpleForm({
                        editable: false,
                        layout: "ResponsiveGridLayout",
                        content: [
                            new sap.ui.core.Title({ text: "Contact Information" })
                        ]
                    });

                    if (data.contacts.email) {
                        oContactForm.addContent(new sap.m.Label({ text: "Email" }));
                        oContactForm.addContent(new sap.m.Text({ text: data.contacts.email }));
                    }
                    if (data.contacts.phone) {
                        oContactForm.addContent(new sap.m.Label({ text: "Phone" }));
                        oContactForm.addContent(new sap.m.Text({ text: data.contacts.phone }));
                    }
                    if (data.contacts.fax) {
                        oContactForm.addContent(new sap.m.Label({ text: "Fax" }));
                        oContactForm.addContent(new sap.m.Text({ text: data.contacts.fax }));
                    }

                    aDialogContent.push(oContactForm);
                }

                var oVBox = new sap.m.VBox({
                    items: aDialogContent,
                    width: "100%"
                });

                oVBox.addStyleClass("sapUiSmallMargin");

                var oDetailDialog = new sap.m.Dialog({
                    title: "Business Partner Details: " + data.partnerName,
                    contentWidth: "900px",
                    contentHeight: "700px",
                    resizable: true,
                    draggable: true,
                    verticalScrolling: true,
                    content: [oVBox],
                    beginButton: new sap.m.Button({
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
                sap.m.MessageBox.error("Failed to fetch details: " + err.message);
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

            // Call the new action that creates the request immediately
            var oOperation = oModel.bindContext("/createChangeRequestFromSAP(...)");
            oOperation.setParameter("sapBpNumber", sSapBpNumber);

            oOperation.execute().then(function () {
                var sResult = oOperation.getBoundContext().getObject().value;
                try {
                    var oResult = JSON.parse(sResult);
                    if (!oResult.success) throw new Error(oResult.message);

                    sap.ui.core.BusyIndicator.hide();

                    // Show Fiori standard confirmation dialog
                    MessageBox.confirm(
                        "Change request " + oResult.requestNumber + " has been created successfully for SAP Business Partner " + sSapBpNumber + ".\n\nWould you like to open the request now?",
                        {
                            title: "Change Request Created",
                            icon: MessageBox.Icon.SUCCESS,
                            actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                            emphasizedAction: MessageBox.Action.YES,
                            onClose: function (sAction) {
                                if (sAction === MessageBox.Action.YES) {
                                    // Navigate to the created request using hash
                                    var sHash = "#/CoupaRequests(ID=" + oResult.requestId + ",IsActiveEntity=true)";
                                    window.location.hash = sHash;
                                } else {
                                    // Stay on list page and refresh
                                    MessageToast.show("Request " + oResult.requestNumber + " is ready for editing.");
                                    oExtensionAPI.refresh();
                                }
                            }
                        }
                    );

                } catch (e) {
                    MessageBox.error("Failed to process data: " + e.message);
                    sap.ui.core.BusyIndicator.hide();
                }
            }).catch(function (oError) {
                MessageBox.error("Request creation failed: " + (oError.message || oError));
                sap.ui.core.BusyIndicator.hide();
            });
        },

        onCancelSearch: function () {
            this.base.getView().byId("searchPartnerDialog").close();
        }
    });
});
