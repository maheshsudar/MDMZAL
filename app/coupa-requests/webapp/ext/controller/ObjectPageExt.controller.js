sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/core/routing/History",
    "sap/ui/core/UIComponent",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Dialog",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/Text",
    "sap/m/ColumnListItem",
    "sap/m/Button",
    "sap/m/ObjectStatus",
    "sap/m/VBox"
], function (ControllerExtension, History, UIComponent, MessageToast, MessageBox, Dialog, Table, Column, Text, ColumnListItem, Button, ObjectStatus, VBox) {
    "use strict";

    return ControllerExtension.extend("com.company.couparequests.ext.controller.ObjectPageExt", {
        override: {
            onInit: function () {
                console.log("=== ObjectPageExt onInit called ===");

                // Add custom validation buttons to header
                if (this._addValidationButtons) {
                    this._addValidationButtons();
                } else {
                    console.error("❌ _addValidationButtons not found on this instance");
                }
            },

            editFlow: {
                onAfterSave: function (mParameters) {
                    console.log("=== ObjectPageExt onAfterSave called ===");
                    // Note: Removed navigation logic to prevent router errors
                    // The system will handle display mode automatically after save
                }
            },

            routing: {
                onBeforeBinding: function (oBindingContext) {
                    console.log("=== ObjectPageExt onBeforeBinding called ===");

                    const bViewMode = sessionStorage.getItem("sap.coupa.viewMode") === "true";
                    if (bViewMode) {
                        console.log("=== View Mode Detected - Preparing display mode ===");
                        this._bViewModeActive = true;
                        sessionStorage.removeItem("sap.coupa.viewMode");
                    }
                },

                onAfterBinding: function (oBindingContext) {
                    console.log("=== ObjectPageExt onAfterBinding called ===");

                    // Note: Popup dialogs have been removed - users can view all fields via "Show More/Less per Row"

                    // Fetch and apply dynamic validation rules (FIORI COMPLIANT) - DEFERRED to avoid reload cycles
                    // Note: This is commented out to prevent binding errors that cause page refreshes
                    // The validation rules are still enforced on the backend during save/submit
                    // this._fetchApplicableValidationRules(oBindingContext);

                    if (this._bViewModeActive) {
                        console.log("=== Applying View Mode restrictions ===");

                        const oExtensionAPI = this.base.getExtensionAPI();
                        if (oExtensionAPI && oExtensionAPI.getEditFlow) {
                            const oEditFlow = oExtensionAPI.getEditFlow();

                            try {
                                // Use setUiEditable to make fields read-only
                                if (oEditFlow.setUiEditable) {
                                    oEditFlow.setUiEditable(false);
                                    console.log("✅ Set UI to non-editable");
                                }

                                // Also try switchToDisplayMode
                                if (oEditFlow.switchToDisplayMode) {
                                    oEditFlow.switchToDisplayMode().catch(err => {
                                        console.warn("⚠️ switchToDisplayMode failed:", err);
                                    });
                                }

                                MessageToast.show("View Only Mode - All fields are read-only", {
                                    duration: 3000
                                });

                                // Hide action buttons
                                setTimeout(() => {
                                    const oView = this.base.getView();

                                    ["fe::StandardAction::Edit", "fe::StandardAction::Delete",
                                        "fe::FooterBar::StandardAction::Save", "fe::FooterBar::StandardAction::Cancel"].forEach(sId => {
                                            const oBtn = oView.byId(sId);
                                            if (oBtn) {
                                                oBtn.setVisible(false);
                                                console.log(`✅ ${sId} hidden`);
                                            }
                                        });
                                }, 1000);

                            } catch (error) {
                                console.error("❌ Error setting view  mode:", error);
                            }
                        }

                        this._bViewModeActive = false;
                    }
                }
            }
        },

        // Note: Popup dialogs have been removed for all child entity tables (addresses, banks, VAT IDs).
        // Users can view all fields using the "Show More/Less per Row" table feature in MDC tables.
        // This simplifies the codebase and improves performance.


        _isInEditMode: function () {
            // Check if page is in edit mode
            try {
                const oExtAPI = this.base.getExtensionAPI();
                if (oExtAPI) {
                    const oEditState = oExtAPI.getEditMode ? oExtAPI.getEditMode() : null;
                    return oEditState === "Editable";
                }
            } catch (e) {
                console.warn("Could not determine edit mode:", e);
            }
            return false;
        },

        _addValidationButtons: function () {
            const oView = this.base.getView();
            console.log("=== _addValidationButtons called ===");

            const fnAddButton = () => {
                console.log("=== Attempting to add Duplicate Check button ===");
                const aContent = oView.getContent();
                if (!aContent || aContent.length === 0) {
                    console.warn("❌ No content found in view");
                    return;
                }

                const oObjectPage = aContent[0];

                if (!oObjectPage) {
                    console.error("❌ First content element is undefined");
                    return;
                }

                if (oObjectPage.getMetadata) {
                    console.log("Found content:", oObjectPage.getMetadata().getName());
                } else {
                    console.warn("⚠️ First content element does not have getMetadata");
                }

                if (oObjectPage && oObjectPage.isA("sap.uxap.ObjectPageLayout")) {
                    const oHeaderTitle = oObjectPage.getHeaderTitle();

                    if (oHeaderTitle) {
                        let bButtonExists = false;
                        try {
                            const aActions = oHeaderTitle.getActions();
                            bButtonExists = aActions.some(oAction => {
                                return oAction.getText && typeof oAction.getText === 'function' && oAction.getText() === "Check Duplicates";
                            });
                        } catch (e) {
                            console.warn("⚠️ Error checking for existing buttons:", e);
                        }

                        if (!bButtonExists) {
                            const oDuplicateCheckButton = new sap.m.Button({
                                text: "Check Duplicates",
                                icon: "sap-icon://duplicate",
                                type: "Emphasized",
                                press: this.onCheckDuplicates.bind(this)
                            });

                            oHeaderTitle.addAction(oDuplicateCheckButton);
                            console.log("✅ Duplicate Check button added to Object Page header");
                        } else {
                            console.log("⚠️ Duplicate Check button already exists");
                        }
                    } else {
                        console.error("❌ HeaderTitle not found in ObjectPageLayout");
                    }
                } else {
                    console.error("❌ First content element is not ObjectPageLayout");
                }
            };

            fnAddButton();

            oView.attachEvent("afterBinding", () => {
                console.log("=== afterBinding event fired ===");
                fnAddButton();
            });
        },

        onCheckDuplicates: function () {
            console.log("=== Check Duplicates button clicked ===");

            const oView = this.base.getView();
            const oContext = oView.getBindingContext();

            if (!oContext) {
                MessageToast.show("No request selected");
                return;
            }

            const requestID = oContext.getProperty("ID");
            const oModel = oView.getModel();

            MessageToast.show("Checking for duplicates...");

            const oAction = oModel.bindContext("/checkForDuplicates(...)");
            oAction.setParameter("requestID", requestID);

            oAction.execute()
                .then(() => {
                    const oResultContext = oAction.getBoundContext();
                    const oResponse = oResultContext.getObject();
                    const results = oResponse.value || oResponse;

                    console.log("Duplicate check results:", results);

                    if (!results || results.length === 0) {
                        MessageBox.success("No duplicates found!", {
                            title: "Duplicate Check"
                        });
                    } else {
                        this._showDuplicatesDialog(results);
                    }

                    oContext.refresh();
                })
                .catch((oError) => {
                    console.error("Duplicate check error:", oError);
                    MessageBox.error("Duplicate check failed: " + (oError.message || oError));
                });
        },

        _showDuplicatesDialog: function (aDuplicates) {
            const oTable = new Table({
                columns: [
                    new Column({ header: new Text({ text: "BP Number" }) }),
                    new Column({ header: new Text({ text: "Partner Name" }) }),
                    new Column({ header: new Text({ text: "VAT ID" }) }),
                    new Column({ header: new Text({ text: "Street" }) }),
                    new Column({ header: new Text({ text: "City" }) }),
                    new Column({ header: new Text({ text: "Country" }) }),
                    new Column({ header: new Text({ text: "Match %" }) })
                ]
            });

            aDuplicates.forEach((dup) => {
                oTable.addItem(new ColumnListItem({
                    cells: [
                        new sap.m.Link({
                            text: dup.sapBpNumber,
                            press: () => this._showDuplicateDetails(dup.sapBpNumber)
                        }),
                        new Text({ text: dup.partnerName }),
                        new Text({ text: dup.vatId || "N/A" }),
                        new Text({ text: dup.street || "N/A" }),
                        new Text({ text: dup.city || "N/A" }),
                        new Text({ text: dup.country || "N/A" }),
                        new ObjectStatus({
                            text: dup.matchScore + "%",
                            state: dup.matchScore > 80 ? "Error" : dup.matchScore > 60 ? "Warning" : "Success"
                        })
                    ]
                }));
            });

            const oDialog = new Dialog({
                title: "Potential Duplicates Found",
                contentWidth: "900px",
                content: [oTable],
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

        _showDuplicateDetails: function (sBpNumber) {
            const oView = this.base.getView();
            const oModel = oView.getModel();

            MessageToast.show("Fetching details...");

            const oAction = oModel.bindContext("/getSAPPartnerDetails(...)");
            oAction.setParameter("sapBpNumber", sBpNumber);

            oAction.execute().then(() => {
                const oResponse = oAction.getBoundContext().getObject();
                const data = oResponse.value || oResponse;

                const aDialogContent = [];

                // Basic Information
                const oBasicForm = new sap.ui.layout.form.SimpleForm({
                    editable: false,
                    layout: "ResponsiveGridLayout",
                    content: [
                        new sap.ui.core.Title({ text: "1. Basic Information" }),
                        new sap.m.Label({ text: "SAP BP Number" }),
                        new Text({ text: data.sapBpNumber }),
                        new sap.m.Label({ text: "Partner Name" }),
                        new Text({ text: data.partnerName }),
                        new sap.m.Label({ text: "Partner Role" }),
                        new Text({ text: data.partnerRole }),
                        new sap.m.Label({ text: "Status" }),
                        new ObjectStatus({
                            text: data.status,
                            state: data.status === 'Blocked' ? 'Error' : 'Success'
                        })
                    ]
                });

                if (data.satelliteSystemId) {
                    oBasicForm.addContent(new sap.m.Label({ text: "Satellite System ID" }));
                    oBasicForm.addContent(new Text({ text: data.satelliteSystemId }));
                }

                aDialogContent.push(oBasicForm);

                // Addresses Table
                if (data.addresses && data.addresses.length > 0) {
                    const oAddressTable = new Table({
                        width: "100%",
                        headerText: "2. Addresses (" + data.addresses.length + ")",
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
                    const oTaxTable = new Table({
                        width: "100%",
                        headerText: "3. Tax Information (" + data.taxNumbers.length + ")",
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
                    const oBankTable = new Table({
                        width: "100%",
                        headerText: "4. Bank Details (" + data.bankAccounts.length + ")",
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
                    const oContactForm = new sap.ui.layout.form.SimpleForm({
                        editable: false,
                        layout: "ResponsiveGridLayout",
                        content: [
                            new sap.ui.core.Title({ text: "5. Contact Information" })
                        ]
                    });

                    if (data.contacts.email) {
                        oContactForm.addContent(new sap.m.Label({ text: "Email" }));
                        oContactForm.addContent(new Text({ text: data.contacts.email }));
                    }
                    if (data.contacts.phone) {
                        oContactForm.addContent(new sap.m.Label({ text: "Phone" }));
                        oContactForm.addContent(new Text({ text: data.contacts.phone }));
                    }
                    if (data.contacts.fax) {
                        oContactForm.addContent(new sap.m.Label({ text: "Fax" }));
                        oContactForm.addContent(new Text({ text: data.contacts.fax }));
                    }

                    aDialogContent.push(oContactForm);
                }

                const oVBox = new VBox({
                    items: aDialogContent,
                    width: "100%"
                });

                oVBox.addStyleClass("sapUiSmallMargin");

                const oDetailDialog = new Dialog({
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

        // ========== ADDRESS DIALOG HANDLERS ==========
        openAddressDialog: function (sMode, oData) {
            const oView = this.base.getView();

            if (!this._oAddressDialog) {
                this._oAddressDialog = sap.ui.xmlfragment(
                    oView.getId(),
                    "com.company.couparequests.ext.fragment.AddressDialog",
                    this
                );
                oView.addDependent(this._oAddressDialog);
            }

            // Create JSON model for dialog data
            const oAddressModel = new sap.ui.model.json.JSONModel(oData || {
                addressType_code: "",
                name1: "",
                name2: "",
                street: "",
                streetNumber: "",
                city: "",
                postalCode: "",
                region: "",
                country_code: ""
            });
            this._oAddressDialog.setModel(oAddressModel, "addressData");

            // Set mode model
            const oModeModel = new sap.ui.model.json.JSONModel({ dialogMode: sMode });
            this._oAddressDialog.setModel(oModeModel, "dialogMode");

            this._sAddressDialogMode = sMode;
            this._oAddressContext = oData ? oData._context : null;

            this._oAddressDialog.open();
        },

        onCreateAddress: function () {
            this.openAddressDialog("create", null);
        },

        onEditAddress: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const oData = oContext.getObject();
            oData._context = oContext;
            this.openAddressDialog("edit", oData);
        },

        onDisplayAddress: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const oData = oContext.getObject();
            this.openAddressDialog("display", oData);
        },

        onSaveAddress: function () {
            const oView = this.base.getView();
            const oModel = oView.getModel();
            const oContext = oView.getBindingContext();

            if (!oContext) {
                MessageBox.error("No request context found");
                return;
            }

            const oAddressModel = this._oAddressDialog.getModel("addressData");
            const addressData = oAddressModel.getData();

            // Validate required fields
            if (!addressData.street || !addressData.city || !addressData.postalCode || !addressData.country_code) {
                MessageBox.error("Please fill all required fields (Street, City, Postal Code, Country)");
                return;
            }

            if (this._sAddressDialogMode === "edit" && this._oAddressContext) {
                // Update existing
                Object.keys(addressData).forEach(key => {
                    if (key !== "_context" && key !== "ID") {
                        this._oAddressContext.setProperty(key, addressData[key]);
                    }
                });
                MessageToast.show("Address updated successfully");
                this._oAddressDialog.close();
            } else {
                // Create new
                const sPath = oContext.getPath() + "/addresses";
                const oListBinding = oModel.bindList(sPath);

                const createData = { ...addressData };
                delete createData._context;
                delete createData.ID;

                oListBinding.create(createData).created().then(() => {
                    MessageToast.show("Address created successfully");
                    this._oAddressDialog.close();
                    oContext.refresh();
                }).catch(err => {
                    MessageBox.error("Failed to save address: " + err.message);
                });
            }
        },

        onCloseAddressDialog: function () {
            if (this._oAddressDialog) {
                this._oAddressDialog.close();
            }
        },

        // ========== BANK DIALOG HANDLERS ==========
        openBankDialog: function (sMode, oData) {
            const oView = this.base.getView();

            if (!this._oBankDialog) {
                this._oBankDialog = sap.ui.xmlfragment(
                    oView.getId(),
                    "com.company.couparequests.ext.fragment.BankDialog",
                    this
                );
                oView.addDependent(this._oBankDialog);
            }

            const oBankModel = new sap.ui.model.json.JSONModel(oData || {
                bankCountry_code: "",
                bankKey: "",
                bankName: "",
                accountHolder: "",
                accountNumber: "",
                iban: "",
                controlKey: "",
                swiftCode: "",
                currency_code: ""
            });
            this._oBankDialog.setModel(oBankModel, "bankData");

            const oModeModel = new sap.ui.model.json.JSONModel({ dialogMode: sMode });
            this._oBankDialog.setModel(oModeModel, "dialogMode");

            this._sBankDialogMode = sMode;
            this._oBankContext = oData ? oData._context : null;

            this._oBankDialog.open();
        },

        onCreateBank: function () {
            this.openBankDialog("create", null);
        },

        onEditBank: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const oData = oContext.getObject();
            oData._context = oContext;
            this.openBankDialog("edit", oData);
        },

        onDisplayBank: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const oData = oContext.getObject();
            this.openBankDialog("display", oData);
        },

        onSaveBank: function () {
            const oView = this.base.getView();
            const oModel = oView.getModel();
            const oContext = oView.getBindingContext();

            if (!oContext) {
                MessageBox.error("No request context found");
                return;
            }

            const oBankModel = this._oBankDialog.getModel("bankData");
            const bankData = oBankModel.getData();

            if (!bankData.bankName || !bankData.accountHolder) {
                MessageBox.error("Please fill all required fields (Bank Name, Account Holder)");
                return;
            }

            if (this._sBankDialogMode === "edit" && this._oBankContext) {
                Object.keys(bankData).forEach(key => {
                    if (key !== "_context" && key !== "ID") {
                        this._oBankContext.setProperty(key, bankData[key]);
                    }
                });
                MessageToast.show("Bank details updated successfully");
                this._oBankDialog.close();
            } else {
                const sPath = oContext.getPath() + "/banks";
                const oListBinding = oModel.bindList(sPath);

                const createData = { ...bankData };
                delete createData._context;
                delete createData.ID;

                oListBinding.create(createData).created().then(() => {
                    MessageToast.show("Bank details created successfully");
                    this._oBankDialog.close();
                    oContext.refresh();
                }).catch(err => {
                    MessageBox.error("Failed to save bank details: " + err.message);
                });
            }
        },

        onCloseBankDialog: function () {
            if (this._oBankDialog) {
                this._oBankDialog.close();
            }
        },

        // ========== VAT DIALOG HANDLERS ==========
        openVatDialog: function (sMode, oData) {
            const oView = this.base.getView();

            if (!this._oVatDialog) {
                this._oVatDialog = sap.ui.xmlfragment(
                    oView.getId(),
                    "com.company.couparequests.ext.fragment.VatDialog",
                    this
                );
                oView.addDependent(this._oVatDialog);
            }

            const oVatModel = new sap.ui.model.json.JSONModel(oData || {
                vatType_code: "",
                country_code: "",
                vatNumber: "",
                isEstablished: false
            });
            this._oVatDialog.setModel(oVatModel, "vatData");

            const oModeModel = new sap.ui.model.json.JSONModel({ dialogMode: sMode });
            this._oVatDialog.setModel(oModeModel, "dialogMode");

            this._sVatDialogMode = sMode;
            this._oVatContext = oData ? oData._context : null;

            this._oVatDialog.open();
        },

        onCreateVat: function () {
            this.openVatDialog("create", null);
        },

        onEditVat: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const oData = oContext.getObject();
            oData._context = oContext;
            this.openVatDialog("edit", oData);
        },

        onDisplayVat: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const oData = oContext.getObject();
            this.openVatDialog("display", oData);
        },

        onSaveVat: function () {
            const oView = this.base.getView();
            const oModel = oView.getModel();
            const oContext = oView.getBindingContext();

            if (!oContext) {
                MessageBox.error("No request context found");
                return;
            }

            const oVatModel = this._oVatDialog.getModel("vatData");
            const vatData = oVatModel.getData();

            if (!vatData.vatType_code || !vatData.country_code || !vatData.vatNumber) {
                MessageBox.error("Please fill all required fields (Tax Type, Country, VAT Number)");
                return;
            }

            if (this._sVatDialogMode === "edit" && this._oVatContext) {
                Object.keys(vatData).forEach(key => {
                    if (key !== "_context" && key !== "ID") {
                        this._oVatContext.setProperty(key, vatData[key]);
                    }
                });
                MessageToast.show("Tax information updated successfully");
                this._oVatDialog.close();
            } else {
                const sPath = oContext.getPath() + "/vatIds";
                const oListBinding = oModel.bindList(sPath);

                const createData = { ...vatData };
                delete createData._context;
                delete createData.ID;

                oListBinding.create(createData).created().then(() => {
                    MessageToast.show("Tax information created successfully");
                    this._oVatDialog.close();
                    oContext.refresh();
                }).catch(err => {
                    MessageBox.error("Failed to save tax information: " + err.message);
                });
            }
        },

        onCloseVatDialog: function () {
            if (this._oVatDialog) {
                this._oVatDialog.close();
            }
        },

        /**
         * Fetch applicable validation rules for dynamic field indicators (FIORI COMPLIANT)
         * Stores rules in view model for UI consumption
         * Does NOT directly manipulate UI controls - maintains Fiori Elements principles
         */
        _fetchApplicableValidationRules: async function (oBindingContext) {
            console.log("=== Fetching applicable validation rules ===");

            try {
                const oView = this.base.getView();
                const oModel = oView.getModel();
                const oContext = oBindingContext || oView.getBindingContext();

                if (!oContext) {
                    console.warn("No binding context available for validation rules");
                    return;
                }

                // Get current request properties
                const status = oContext.getProperty('status') || 'New';
                const sourceSystem = oContext.getProperty('sourceSystem') || 'Coupa';
                const entityType = oContext.getProperty('entityType') || 'Supplier';
                const requestType = oContext.getProperty('requestType') || 'Create';

                console.log("Fetching validation rules for:", { status, sourceSystem, entityType, requestType });

                // Call AdminService function to get applicable rules
                const sPath = `/getApplicableValidationRules(status='${status}',sourceSystem='${sourceSystem}',entityType='${entityType}',requestType='${requestType}')`;

                // Use the AdminService model directly with proper binding parameters
                const oAdminModel = oView.getModel('admin');
                if (!oAdminModel) {
                    console.warn("⚠️ AdminService model not available");
                    return;
                }

                const oBinding = oAdminModel.bindContext(sPath, null, {$$groupId: "$auto"});

                await oBinding.execute();

                const oResult = oBinding.getBoundContext().getObject();
                const aRules = oResult.value || [];

                console.log(`✅ Found ${aRules.length} applicable validation rules:`, aRules);

                // Create view model if it doesn't exist
                let oViewModel = oView.getModel('viewModel');
                if (!oViewModel) {
                    oViewModel = new sap.ui.model.json.JSONModel({});
                    oView.setModel(oViewModel, 'viewModel');
                }

                // Store rules in view model
                oViewModel.setProperty('/validationRules', aRules);

                // Create a map for easy field lookup
                const mandatoryFieldsMap = {};
                aRules.forEach(rule => {
                    if (rule.isMandatory) {
                        const key = `${rule.targetEntity}.${rule.targetField}`;
                        mandatoryFieldsMap[key] = {
                            isMandatory: true,
                            errorMessage: rule.errorMessage
                        };
                    }
                });

                oViewModel.setProperty('/mandatoryFields', mandatoryFieldsMap);

                // Log mandatory fields for visibility
                const mandatoryCount = Object.keys(mandatoryFieldsMap).length;
                console.log(`✅ ${mandatoryCount} mandatory fields identified:`, Object.keys(mandatoryFieldsMap));

                // Store status info for reference
                oViewModel.setProperty('/currentValidationContext', {
                    status,
                    sourceSystem,
                    entityType,
                    requestType,
                    rulesCount: aRules.length,
                    mandatoryCount
                });

            } catch (error) {
                console.error("❌ Failed to fetch validation rules:", error);
                // Fail gracefully - don't break page rendering
                // Backend validation will still enforce rules on save/submit
            }
        },

        /**
         * Helper: Check if a specific field is mandatory based on current validation rules
         * Can be called from XML view expressions or other methods
         */
        isFieldMandatory: function (entityName, fieldName) {
            const oView = this.base.getView();
            const oViewModel = oView.getModel('viewModel');

            if (!oViewModel) return false;

            const mandatoryFields = oViewModel.getProperty('/mandatoryFields') || {};
            const key = `${entityName}.${fieldName}`;

            return mandatoryFields[key] && mandatoryFields[key].isMandatory;
        }
    });
});
