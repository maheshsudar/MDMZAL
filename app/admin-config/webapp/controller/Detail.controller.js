sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/Text",
    "sap/m/Label",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Input",
    "sap/m/CheckBox",
    "sap/m/DatePicker",
    "sap/ui/layout/form/SimpleForm",
    "sap/ui/core/Title"
], function (Controller, JSONModel, Filter, FilterOperator, MessageBox, MessageToast, Column, ColumnListItem, Text, Label,
    Dialog, Button, Input, CheckBox, DatePicker, SimpleForm, Title) {
    "use strict";

    return Controller.extend("com.company.adminconfig.controller.Detail", {
        onInit: function () {
            // Get the router and attach route matched event
            this._oRouter = this.getOwnerComponent().getRouter();
            this._oRouter.getRoute("master").attachMatched(this._onRouteMatched, this);
            this._oRouter.getRoute("detail").attachMatched(this._onRouteMatched, this);

            // Initialize detail model if not present
            if (!this.getOwnerComponent().getModel("detailModel")) {
                const oDetailModel = new JSONModel({
                    code: null,
                    title: "Select a Configuration Table",
                    description: null,
                    entitySet: null,
                    selectedItems: 0
                });
                this.getOwnerComponent().setModel(oDetailModel, "detailModel");
            }
        },

        /**
         * Handle route matched event
         */
        _onRouteMatched: function (oEvent) {
            const sEntitySet = oEvent.getParameter("arguments").entitySet;

            if (sEntitySet) {
                // Update detail model with entity set
                const oDetailModel = this.getOwnerComponent().getModel("detailModel");
                if (oDetailModel) {
                    oDetailModel.setProperty("/entitySet", sEntitySet);

                    // Build the table dynamically
                    this._buildTable(sEntitySet);
                }
            }
        },

        /**
         * Build table dynamically based on entity set
         */
        _buildTable: function (sEntitySet) {
            const oTable = this.byId("dataTable");
            const oModel = this.getOwnerComponent().getModel();

            if (!oTable || !oModel) {
                return;
            }

            // Clear existing columns and items
            oTable.destroyColumns();
            oTable.unbindItems();

            // Get metadata model
            const oMetaModel = oModel.getMetaModel();

            // Wait for metadata to be loaded
            oMetaModel.requestObject("/" + sEntitySet + "/").then((oEntityType) => {
                if (!oEntityType) {
                    return;
                }

                // Get all properties
                const aProperties = Object.keys(oEntityType).filter(key => {
                    const prop = oEntityType[key];
                    return prop && typeof prop === "object" && prop.$kind === "Property";
                });

                // Create columns for first 10 properties
                aProperties.slice(0, 10).forEach((sProperty) => {
                    const oColumn = new Column({
                        header: new Label({ text: sProperty }),
                        demandPopin: true,
                        minScreenWidth: "Tablet"
                    });
                    oTable.addColumn(oColumn);
                });

                // Create column list item template
                const aTextControls = aProperties.slice(0, 10).map((sProperty) => {
                    return new Text({
                        text: "{" + sProperty + "}"
                    });
                });

                const oTemplate = new ColumnListItem({
                    type: "Active",
                    cells: aTextControls
                });

                // Bind items
                oTable.bindItems({
                    path: "/" + sEntitySet,
                    template: oTemplate
                });

            }).catch((oError) => {
                console.error("Failed to load entity metadata:", oError);
                MessageBox.error("Failed to load table structure: " + (oError.message || "Unknown error"));
            });
        },

        /**
         * Navigate back to master page
         */
        onNavBack: function () {
            this._oRouter.navTo("master");
        },

        /**
         * Handle search
         */
        onSearch: function (oEvent) {
            const sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue");
            const oTable = this.byId("dataTable");
            const oBinding = oTable.getBinding("items");

            if (!oBinding) {
                return;
            }

            const aFilters = [];
            if (sQuery && sQuery.length > 0) {
                // Get all visible column paths
                const aColumns = oTable.getColumns();
                const aColumnFilters = aColumns.map(oColumn => {
                    const sPath = oColumn.getHeader().getText();
                    return new Filter(sPath, FilterOperator.Contains, sQuery);
                });

                if (aColumnFilters.length > 0) {
                    aFilters.push(new Filter({
                        filters: aColumnFilters,
                        and: false
                    }));
                }
            }

            oBinding.filter(aFilters);
        },

        /**
         * Handle table selection change
         */
        onTableSelectionChange: function (oEvent) {
            const oTable = oEvent.getSource();
            const aSelectedItems = oTable.getSelectedItems();

            const oDetailModel = this.getOwnerComponent().getModel("detailModel");
            if (oDetailModel) {
                oDetailModel.setProperty("/selectedItems", aSelectedItems.length);
            }
        },

        /**
         * Handle create button press
         */
        onCreate: function () {
            const oDetailModel = this.getOwnerComponent().getModel("detailModel");
            const sEntitySet = oDetailModel.getProperty("/entitySet");

            if (!sEntitySet) {
                MessageBox.warning("Please select a configuration table first.");
                return;
            }

            this._openCreateEditDialog(sEntitySet, null);
        },

        /**
         * Handle edit button press
         */
        onEdit: function () {
            const oTable = this.byId("dataTable");
            const aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0) {
                MessageBox.warning("Please select a row to edit.");
                return;
            }

            if (aSelectedItems.length > 1) {
                MessageBox.warning("Please select only one row to edit.");
                return;
            }

            const oDetailModel = this.getOwnerComponent().getModel("detailModel");
            const sEntitySet = oDetailModel.getProperty("/entitySet");
            const oContext = aSelectedItems[0].getBindingContext();

            this._openCreateEditDialog(sEntitySet, oContext);
        },

        /**
         * Handle delete button press
         */
        onDelete: function () {
            const oTable = this.byId("dataTable");
            const aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length === 0) {
                MessageBox.warning("Please select at least one row to delete.");
                return;
            }

            const sMessage = aSelectedItems.length === 1
                ? "Do you want to delete the selected entry?"
                : `Do you want to delete ${aSelectedItems.length} entries?`;

            MessageBox.confirm(sMessage, {
                title: "Confirm Deletion",
                onClose: (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        this._performDelete(aSelectedItems);
                    }
                }
            });
        },

        /**
         * Perform delete operation
         */
        _performDelete: function (aSelectedItems) {
            let iDeletedCount = 0;
            let iFailedCount = 0;

            aSelectedItems.forEach((oItem) => {
                const oContext = oItem.getBindingContext();
                if (oContext) {
                    oContext.delete().then(() => {
                        iDeletedCount++;

                        // Show success message after all deletions
                        if (iDeletedCount + iFailedCount === aSelectedItems.length) {
                            if (iDeletedCount > 0) {
                                MessageToast.show(`Successfully deleted ${iDeletedCount} entry(ies).`);
                            }
                            if (iFailedCount > 0) {
                                MessageBox.error(`Failed to delete ${iFailedCount} entry(ies).`);
                            }
                        }
                    }).catch((oError) => {
                        iFailedCount++;
                        console.error("Failed to delete entry:", oError);

                        // Show error message after all deletions
                        if (iDeletedCount + iFailedCount === aSelectedItems.length) {
                            if (iDeletedCount > 0) {
                                MessageToast.show(`Successfully deleted ${iDeletedCount} entry(ies).`);
                            }
                            MessageBox.error(`Failed to delete ${iFailedCount} entry(ies): ` + oError.message);
                        }
                    });
                }
            });
        },

        /**
         * Open create or edit dialog with dynamic form
         */
        _openCreateEditDialog: function (sEntitySet, oContext) {
            const oModel = this.getOwnerComponent().getModel();
            const oMetaModel = oModel.getMetaModel();
            const bIsEdit = oContext !== null;

            // Get entity metadata
            oMetaModel.requestObject("/" + sEntitySet + "/").then((oEntityType) => {
                if (!oEntityType) {
                    MessageBox.error("Failed to load entity metadata");
                    return;
                }

                // Get entity keys (primary keys)
                const aEntityKeys = oEntityType.$Key || [];

                // Get editable properties (exclude draft and system fields)
                const aProperties = Object.keys(oEntityType).filter(key => {
                    const prop = oEntityType[key];
                    if (!prop || typeof prop !== "object" || prop.$kind !== "Property") {
                        return false;
                    }
                    // Exclude draft and system-managed fields
                    const excludeFields = [
                        // Draft fields
                        "IsActiveEntity", "HasActiveEntity", "HasDraftEntity", "DraftAdministrativeData",
                        // System-managed audit fields
                        "createdAt", "modifiedAt", "createdBy", "modifiedBy",
                        // Auto-generated ID field
                        "ID"
                    ];
                    return !excludeFields.includes(key);
                });

                // Create form content
                const aFormContent = [];
                const oFormData = {};

                aProperties.forEach((sProperty) => {
                    const oProp = oEntityType[sProperty];
                    const sType = oProp.$Type || "Edm.String";
                    const bNullable = oProp.$Nullable !== false;
                    const sLabel = sProperty;
                    const bIsKey = aEntityKeys.includes(sProperty);
                    const bReadOnly = bIsEdit && bIsKey; // Keys are read-only in Edit mode

                    // Get current value if editing
                    let vValue = bIsEdit ? oContext.getProperty(sProperty) : null;

                    // Add label
                    aFormContent.push(new Label({
                        text: sLabel + (bNullable ? "" : " *"),
                        required: !bNullable
                    }));

                    // Add input field based on type
                    let oControl;
                    if (sType === "Edm.Boolean") {
                        oControl = new CheckBox({
                            selected: vValue === true,
                            enabled: !bReadOnly
                        });
                        oFormData[sProperty] = { control: oControl, type: "boolean" };
                    } else if (sType === "Edm.Date" || sType === "Edm.DateTime") {
                        oControl = new DatePicker({
                            value: vValue ? new Date(vValue).toLocaleDateString() : "",
                            valueFormat: "yyyy-MM-dd",
                            displayFormat: "medium",
                            enabled: !bReadOnly
                        });
                        oFormData[sProperty] = { control: oControl, type: "date" };
                    } else if (sType === "Edm.Int32" || sType === "Edm.Int64" || sType === "Edm.Decimal") {
                        oControl = new Input({
                            value: vValue !== null && vValue !== undefined ? String(vValue) : "",
                            type: "Number",
                            editable: !bReadOnly
                        });
                        oFormData[sProperty] = { control: oControl, type: "number" };
                    } else {
                        // Default to string
                        oControl = new Input({
                            value: vValue || "",
                            editable: !bReadOnly
                        });
                        oFormData[sProperty] = { control: oControl, type: "string" };
                    }

                    aFormContent.push(oControl);
                });

                // Create form
                const oForm = new SimpleForm({
                    editable: true,
                    layout: "ResponsiveGridLayout",
                    labelSpanXL: 4,
                    labelSpanL: 4,
                    labelSpanM: 4,
                    labelSpanS: 12,
                    adjustLabelSpan: false,
                    emptySpanXL: 0,
                    emptySpanL: 0,
                    emptySpanM: 0,
                    emptySpanS: 0,
                    columnsXL: 1,
                    columnsL: 1,
                    columnsM: 1,
                    singleContainerFullSize: false,
                    content: [
                        new Title({ text: bIsEdit ? "Edit Entry" : "Create New Entry" }),
                        ...aFormContent
                    ]
                });

                // Create dialog
                const oDialog = new Dialog({
                    title: bIsEdit ? "Edit " + sEntitySet : "Create " + sEntitySet,
                    contentWidth: "500px",
                    contentHeight: "auto",
                    resizable: true,
                    draggable: true,
                    content: oForm,
                    beginButton: new Button({
                        text: bIsEdit ? "Save" : "Create",
                        type: "Emphasized",
                        press: () => {
                            this._saveEntry(sEntitySet, oContext, oFormData, oDialog);
                        }
                    }),
                    endButton: new Button({
                        text: "Cancel",
                        press: () => {
                            oDialog.close();
                        }
                    }),
                    afterClose: () => {
                        oDialog.destroy();
                    }
                });

                this.getView().addDependent(oDialog);
                oDialog.open();

            }).catch((oError) => {
                console.error("Failed to load entity metadata:", oError);
                MessageBox.error("Failed to load form: " + (oError.message || "Unknown error"));
            });
        },

        /**
         * Save entry (create or update)
         */
        _saveEntry: function (sEntitySet, oContext, oFormData, oDialog) {
            const oModel = this.getOwnerComponent().getModel();
            const oTable = this.byId("dataTable");

            // Collect form data
            const oData = {};
            let bHasError = false;

            Object.keys(oFormData).forEach((sProperty) => {
                const oField = oFormData[sProperty];
                let vValue;

                if (oField.type === "boolean") {
                    vValue = oField.control.getSelected();
                } else if (oField.type === "date") {
                    const sDateValue = oField.control.getValue();
                    vValue = sDateValue ? new Date(sDateValue).toISOString() : null;
                } else if (oField.type === "number") {
                    const sNumValue = oField.control.getValue();
                    // Convert empty string to null for nullable fields
                    vValue = sNumValue && sNumValue.trim() !== "" ? parseFloat(sNumValue) : null;
                } else {
                    vValue = oField.control.getValue();
                    // Convert empty string to null for nullable fields
                    if (vValue === "") {
                        vValue = null;
                    }
                }

                oData[sProperty] = vValue;
            });

            console.log("Saving entry - Entity Set:", sEntitySet);
            console.log("Data to save:", oData);
            console.log("Is Edit mode:", !!oContext);

            if (bHasError) {
                return;
            }

            if (oContext) {
                // Update existing entry
                console.log("Updating existing entry...");
                Object.keys(oData).forEach((sProperty) => {
                    oContext.setProperty(sProperty, oData[sProperty]);
                });

                oModel.submitBatch(oModel.getUpdateGroupId()).then(() => {
                    console.log("Update successful");
                    MessageToast.show("Entry updated successfully");
                    oDialog.close();
                    oTable.getBinding("items").refresh();
                }).catch((oError) => {
                    console.error("Failed to update entry:", oError);
                    MessageBox.error("Failed to update entry: " + (oError.message || "Unknown error"));
                });
            } else {
                // Create new entry
                console.log("Creating new entry...");
                const oListBinding = oTable.getBinding("items");

                if (!oListBinding) {
                    console.error("No list binding found for table");
                    MessageBox.error("Cannot create entry: Table binding not found");
                    return;
                }

                try {
                    const oNewContext = oListBinding.create(oData);
                    console.log("Context created:", oNewContext);

                    // Check if entity is draft-enabled by checking the entity path
                    const sEntityPath = oListBinding.getPath();
                    const bIsDraftEnabled = sEntityPath.includes("ValidationRules") || sEntityPath.includes("SectionValidationRules");

                    console.log("Entity path:", sEntityPath, "Draft-enabled:", bIsDraftEnabled);

                    if (bIsDraftEnabled) {
                        // For draft-enabled entities: create draft → activate draft
                        oNewContext.created().then(() => {
                            console.log("Draft created successfully, now activating...");

                            // Bind to draftActivate action and execute it
                            const sContextPath = oNewContext.getPath();
                            const oActivateOperation = oModel.bindContext(`${sContextPath}/AdminService.draftActivate(...)`, oNewContext);

                            return oActivateOperation.execute();
                        }).then((oActivateContext) => {
                            console.log("Draft activated successfully");
                            MessageToast.show("Entry created successfully");
                            oDialog.close();
                            oTable.getBinding("items").refresh();
                        }).catch((oError) => {
                            console.error("Failed to create/activate entry:", oError);
                            console.error("Error details:", oError.message, oError.stack);

                            // Try to delete the failed draft context
                            if (oNewContext) {
                                oNewContext.delete().catch(() => {
                                    console.log("Could not delete failed draft context");
                                });
                            }

                            MessageBox.error("Failed to create entry: " + (oError.message || "Unknown error"));
                        });
                    } else {
                        // For non-draft entities: simple create
                        oNewContext.created().then(() => {
                            console.log("Entry created successfully (no draft)");
                            MessageToast.show("Entry created successfully");
                            oDialog.close();
                            oTable.getBinding("items").refresh();
                        }).catch((oError) => {
                            console.error("Failed to create entry:", oError);
                            console.error("Error details:", oError.message, oError.stack);

                            // Try to delete the failed context
                            if (oNewContext) {
                                oNewContext.delete().catch(() => {
                                    console.log("Could not delete failed context");
                                });
                            }

                            MessageBox.error("Failed to create entry: " + (oError.message || "Unknown error"));
                        });
                    }
                } catch (oError) {
                    console.error("Exception during create:", oError);
                    MessageBox.error("Failed to create entry: " + oError.message);
                }
            }
        }
    });
});
