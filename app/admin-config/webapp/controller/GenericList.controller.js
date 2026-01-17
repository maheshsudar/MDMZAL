sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/table/Column",
    "sap/m/Text",
    "sap/m/Input",
    "sap/m/DatePicker",
    "sap/m/CheckBox"
], function (Controller, JSONModel, MessageToast, MessageBox, Column, Text, Input, DatePicker, CheckBox) {
    "use strict";

    return Controller.extend("com.company.adminconfig.controller.GenericList", {

        onInit: function () {
            this.oViewModel = new JSONModel({
                title: "Entity List",
                entitySet: "",
                busy: false,
                selectedRowCount: 0
            });
            this.getView().setModel(this.oViewModel, "viewModel");

            // Get entity from URL parameter
            this.getOwnerComponent().getRouter().attachRouteMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            const sRouteName = oEvent.getParameter("name");
            if (sRouteName === "genericList") {
                const oArgs = oEvent.getParameter("arguments");
                const sEntitySet = oArgs.entitySet;

                this.oViewModel.setProperty("/entitySet", sEntitySet);
                this.oViewModel.setProperty("/title", this._formatEntityName(sEntitySet));

                this._loadEntityData(sEntitySet);
            }
        },

        _formatEntityName: function (sEntitySet) {
            // Convert "RevenueStreams" to "Revenue Streams"
            return sEntitySet.replace(/([A-Z])/g, ' $1').trim();
        },

        _loadEntityData: function (sEntitySet) {
            this.oViewModel.setProperty("/busy", true);

            const oTable = this.byId("genericTable");
            const oModel = this.getView().getModel();

            // Build binding path
            const sPath = "/" + sEntitySet;

            // Get entity metadata
            const oMetaModel = oModel.getMetaModel();
            oMetaModel.requestObject("/" + sEntitySet + "/").then((oEntityType) => {
                // Clear existing columns
                oTable.removeAllColumns();

                // Create columns based on entity properties
                const aProperties = Object.keys(oEntityType).filter(sProp =>
                    !sProp.startsWith("$") &&
                    !sProp.startsWith("@") &&
                    sProp !== "DraftAdministrativeData" &&
                    sProp !== "SiblingEntity"
                );

                // Sort properties - ID first, then common fields, then rest
                const aPriorityFields = ["ID", "code", "name", "locale", "descr", "isActive"];
                aProperties.sort((a, b) => {
                    const aIndex = aPriorityFields.indexOf(a);
                    const bIndex = aPriorityFields.indexOf(b);
                    if (aIndex > -1 && bIndex > -1) return aIndex - bIndex;
                    if (aIndex > -1) return -1;
                    if (bIndex > -1) return 1;
                    return a.localeCompare(b);
                });

                // Create columns (limit to first 10 for readability)
                aProperties.slice(0, 10).forEach((sProperty) => {
                    const oProperty = oEntityType[sProperty];
                    const sType = oProperty.$Type;

                    const oColumn = new Column({
                        label: new Text({ text: this._formatPropertyName(sProperty) }),
                        template: this._createTemplate(sProperty, sType),
                        sortProperty: sProperty,
                        filterProperty: sProperty,
                        width: this._getColumnWidth(sProperty)
                    });

                    oTable.addColumn(oColumn);
                });

                // Bind rows
                oTable.bindRows({
                    path: sPath,
                    parameters: {
                        $count: true,
                        $select: aProperties.slice(0, 10).join(",")
                    }
                });

                // Attach selection change handler
                oTable.attachRowSelectionChange(this._onSelectionChange.bind(this));

                this.oViewModel.setProperty("/busy", false);
            }).catch((oError) => {
                console.error("Error loading entity metadata:", oError);
                MessageBox.error("Could not load entity: " + sEntitySet);
                this.oViewModel.setProperty("/busy", false);
            });
        },

        _formatPropertyName: function (sProperty) {
            // Convert "isActive" to "Is Active"
            return sProperty
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
        },

        _createTemplate: function (sProperty, sType) {
            // Create appropriate control based on type
            if (sType === "Edm.Boolean") {
                return new CheckBox({
                    selected: "{" + sProperty + "}",
                    editable: false
                });
            } else if (sType === "Edm.Date" || sType === "Edm.DateTime" || sType === "Edm.DateTimeOffset") {
                return new Text({
                    text: {
                        path: sProperty,
                        formatter: function (value) {
                            if (!value) return "";
                            const oDate = new Date(value);
                            return oDate.toLocaleDateString() + " " + oDate.toLocaleTimeString();
                        }
                    }
                });
            } else {
                return new Text({
                    text: "{" + sProperty + "}"
                });
            }
        },

        _getColumnWidth: function (sProperty) {
            // Set column widths based on property name
            const shortFields = ["ID", "code", "locale"];
            const mediumFields = ["name", "isActive", "priority"];

            if (shortFields.includes(sProperty)) return "100px";
            if (mediumFields.includes(sProperty)) return "150px";
            if (sProperty.toLowerCase().includes("descr")) return "300px";
            return "200px";
        },

        onNavBack: function () {
            window.history.back();
        },

        _onSelectionChange: function () {
            const oTable = this.byId("genericTable");
            const aSelectedIndices = oTable.getSelectedIndices();
            this.oViewModel.setProperty("/selectedRowCount", aSelectedIndices.length);
        },

        onCreate: function () {
            const sEntitySet = this.oViewModel.getProperty("/entitySet");
            MessageToast.show("Create functionality not implemented yet for " + sEntitySet);
            // TODO: Implement create dialog
        },

        onChange: function () {
            const oTable = this.byId("genericTable");
            const aSelectedIndices = oTable.getSelectedIndices();

            if (aSelectedIndices.length !== 1) {
                MessageBox.warning("Please select exactly one row to change");
                return;
            }

            const oContext = oTable.getContextByIndex(aSelectedIndices[0]);
            const oData = oContext.getObject();
            const sEntitySet = this.oViewModel.getProperty("/entitySet");

            // For now, show a simple alert with the data
            // TODO: Implement proper edit dialog
            MessageBox.information(
                "Change functionality will open an edit dialog here.\n\n" +
                "Selected Record ID: " + (oData.ID || oData.id || oData.code || "N/A") + "\n" +
                "Entity: " + sEntitySet,
                {
                    title: "Edit Record"
                }
            );
        },

        onDelete: function () {
            const oTable = this.byId("genericTable");
            const aSelectedIndices = oTable.getSelectedIndices();

            if (aSelectedIndices.length === 0) {
                MessageBox.warning("Please select at least one row to delete");
                return;
            }

            MessageBox.confirm("Are you sure you want to delete " + aSelectedIndices.length + " record(s)?", {
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        this._deleteSelectedRows(aSelectedIndices);
                    }
                }
            });
        },

        _deleteSelectedRows: function (aIndices) {
            const oTable = this.byId("genericTable");
            const oModel = this.getView().getModel();
            const aContexts = aIndices.map(i => oTable.getContextByIndex(i));

            let iSuccessCount = 0;
            let iErrorCount = 0;

            // Delete each selected row
            const aPromises = aContexts.map(oContext => {
                return oModel.remove(oContext.getPath(), {
                    success: () => iSuccessCount++,
                    error: () => iErrorCount++
                });
            });

            Promise.all(aPromises).finally(() => {
                if (iSuccessCount > 0) {
                    MessageToast.show(`Successfully deleted ${iSuccessCount} record(s)`);
                }
                if (iErrorCount > 0) {
                    MessageBox.error(`Failed to delete ${iErrorCount} record(s)`);
                }
                this.onRefresh();
            });
        },

        onRefresh: function () {
            const oTable = this.byId("genericTable");
            const oBinding = oTable.getBinding("rows");

            if (oBinding) {
                oBinding.refresh();
                MessageToast.show("Data refreshed");
            }
        }

    });
});
