sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function (MessageToast, MessageBox, JSONModel) {
    "use strict";

    return {
        // ========== ADDRESS HANDLERS ==========
        onCreateAddress: function (oBindingContext, aSelectedContexts) {
            console.log("=== onCreateAddress called ===");
            this._openAddressDialog("create", null);
        },

        _openAddressDialog: function (sMode, oData) {
            var that = this;
            var oView = this.getView ? this.getView() : this._view;

            if (!oView) {
                console.error("View not found");
                return;
            }

            if (!this._oAddressDialog) {
                sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "com.company.couparequests.ext.fragment.AddressDialog",
                    controller: this
                }).then(function (oDialog) {
                    that._oAddressDialog = oDialog;
                    oView.addDependent(oDialog);
                    that._setupAndOpenAddressDialog(sMode, oData);
                });
            } else {
                this._setupAndOpenAddressDialog(sMode, oData);
            }
        },

        _setupAndOpenAddressDialog: function (sMode, oData) {
            var oAddressModel = new JSONModel(oData || {
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

            var oModeModel = new JSONModel({ dialogMode: sMode });
            this._oAddressDialog.setModel(oModeModel, "dialogMode");

            this._sAddressDialogMode = sMode;
            this._oAddressContext = oData ? oData._context : null;

            this._oAddressDialog.open();
        },

        onSaveAddress: function () {
            var oView = this.getView ? this.getView() : this._view;
            var oModel = oView.getModel();
            var oContext = oView.getBindingContext();

            if (!oContext) {
                MessageBox.error("No request context found");
                return;
            }

            var oAddressModel = this._oAddressDialog.getModel("addressData");
            var addressData = oAddressModel.getData();

            if (!addressData.street || !addressData.city || !addressData.postalCode || !addressData.country_code) {
                MessageBox.error("Please fill all required fields (Street, City, Postal Code, Country)");
                return;
            }

            var that = this;
            var sPath = oContext.getPath() + "/addresses";
            var oListBinding = oModel.bindList(sPath);

            var createData = Object.assign({}, addressData);
            delete createData._context;
            delete createData.ID;

            oListBinding.create(createData).created().then(function () {
                MessageToast.show("Address created successfully");
                that._oAddressDialog.close();
                oContext.refresh();
            }).catch(function (err) {
                MessageBox.error("Failed to save address: " + err.message);
            });
        },

        onCloseAddressDialog: function () {
            if (this._oAddressDialog) {
                this._oAddressDialog.close();
            }
        },

        // ========== BANK HANDLERS ==========
        onCreateBank: function (oBindingContext, aSelectedContexts) {
            console.log("=== onCreateBank called ===");
            this._openBankDialog("create", null);
        },

        _openBankDialog: function (sMode, oData) {
            var that = this;
            var oView = this.getView ? this.getView() : this._view;

            if (!oView) {
                console.error("View not found");
                return;
            }

            if (!this._oBankDialog) {
                sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "com.company.couparequests.ext.fragment.BankDialog",
                    controller: this
                }).then(function (oDialog) {
                    that._oBankDialog = oDialog;
                    oView.addDependent(oDialog);
                    that._setupAndOpenBankDialog(sMode, oData);
                });
            } else {
                this._setupAndOpenBankDialog(sMode, oData);
            }
        },

        _setupAndOpenBankDialog: function (sMode, oData) {
            var oBankModel = new JSONModel(oData || {
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

            var oModeModel = new JSONModel({ dialogMode: sMode });
            this._oBankDialog.setModel(oModeModel, "dialogMode");

            this._sBankDialogMode = sMode;
            this._oBankContext = oData ? oData._context : null;

            this._oBankDialog.open();
        },

        onSaveBank: function () {
            var oView = this.getView ? this.getView() : this._view;
            var oModel = oView.getModel();
            var oContext = oView.getBindingContext();

            if (!oContext) {
                MessageBox.error("No request context found");
                return;
            }

            var oBankModel = this._oBankDialog.getModel("bankData");
            var bankData = oBankModel.getData();

            if (!bankData.bankName || !bankData.accountHolder) {
                MessageBox.error("Please fill all required fields (Bank Name, Account Holder)");
                return;
            }

            var that = this;
            var sPath = oContext.getPath() + "/banks";
            var oListBinding = oModel.bindList(sPath);

            var createData = Object.assign({}, bankData);
            delete createData._context;
            delete createData.ID;

            oListBinding.create(createData).created().then(function () {
                MessageToast.show("Bank details created successfully");
                that._oBankDialog.close();
                oContext.refresh();
            }).catch(function (err) {
                MessageBox.error("Failed to save bank details: " + err.message);
            });
        },

        onCloseBankDialog: function () {
            if (this._oBankDialog) {
                this._oBankDialog.close();
            }
        },

        // ========== VAT HANDLERS ==========
        onCreateVat: function (oBindingContext, aSelectedContexts) {
            console.log("=== onCreateVat called ===");
            this._openVatDialog("create", null);
        },

        _openVatDialog: function (sMode, oData) {
            var that = this;
            var oView = this.getView ? this.getView() : this._view;

            if (!oView) {
                console.error("View not found");
                return;
            }

            if (!this._oVatDialog) {
                sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "com.company.couparequests.ext.fragment.VatDialog",
                    controller: this
                }).then(function (oDialog) {
                    that._oVatDialog = oDialog;
                    oView.addDependent(oDialog);
                    that._setupAndOpenVatDialog(sMode, oData);
                });
            } else {
                this._setupAndOpenVatDialog(sMode, oData);
            }
        },

        _setupAndOpenVatDialog: function (sMode, oData) {
            var oVatModel = new JSONModel(oData || {
                vatType_code: "",
                country_code: "",
                vatNumber: "",
                isEstablished: false
            });
            this._oVatDialog.setModel(oVatModel, "vatData");

            var oModeModel = new JSONModel({ dialogMode: sMode });
            this._oVatDialog.setModel(oModeModel, "dialogMode");

            this._sVatDialogMode = sMode;
            this._oVatContext = oData ? oData._context : null;

            this._oVatDialog.open();
        },

        onSaveVat: function () {
            var oView = this.getView ? this.getView() : this._view;
            var oModel = oView.getModel();
            var oContext = oView.getBindingContext();

            if (!oContext) {
                MessageBox.error("No request context found");
                return;
            }

            var oVatModel = this._oVatDialog.getModel("vatData");
            var vatData = oVatModel.getData();

            if (!vatData.vatType_code || !vatData.country_code || !vatData.vatNumber) {
                MessageBox.error("Please fill all required fields (Tax Type, Country, VAT Number)");
                return;
            }

            var that = this;
            var sPath = oContext.getPath() + "/vatIds";
            var oListBinding = oModel.bindList(sPath);

            var createData = Object.assign({}, vatData);
            delete createData._context;
            delete createData.ID;

            oListBinding.create(createData).created().then(function () {
                MessageToast.show("Tax information created successfully");
                that._oVatDialog.close();
                oContext.refresh();
            }).catch(function (err) {
                MessageBox.error("Failed to save tax information: " + err.message);
            });
        },

        onCloseVatDialog: function () {
            if (this._oVatDialog) {
                this._oVatDialog.close();
            }
        }
    };
});
