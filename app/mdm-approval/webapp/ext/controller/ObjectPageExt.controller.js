sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Text",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Label",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/m/ObjectStatus",
    "sap/ui/core/library"
], function (ControllerExtension, JSONModel, Dialog, Button, Text, VBox, HBox, Label, MessageToast, MessageBox, Table, Column, ColumnListItem, ObjectStatus, coreLibrary) {
    "use strict";

    return ControllerExtension.extend("com.company.mdmapproval.ext.controller.ObjectPageExt", {
        override: {
            onInit: function () {
                console.log("=== MDM ObjectPageExt onInit called ===");
                this.oProcessFlowModel = new JSONModel();
                this.base.getView().setModel(this.oProcessFlowModel, "processFlow");

                // Flags to prevent duplicate execution during lifecycle events
                this._sectionRenumberingApplied = false;
                this._actionInterceptionApplied = false;
                this._tableHandlersApplied = false;
                this._childEntityButtonsHidden = false;
            },

            onPageReady: function (oEvent) {
                console.log("=== MDM ObjectPageExt onPageReady called ===");
                this._hideStandardButtons();
                this._replaceStatusFieldsWithObjectStatus();

                // Defer ProcessFlow update to avoid blocking page render
                setTimeout(() => {
                    this._updateProcessFlow();
                }, 100);

                // Intercept action executions for popups
                this._interceptActionExecutions();
            },

            onAfterRendering: function (oEvent) {
                console.log("=== MDM ObjectPageExt onAfterRendering called ===");

                // Attach listener for binding context changes to fix ObjectStatus inverted property
                const oView = this.base.getView();
                const oBinding = oView.getBindingContext();
                if (oBinding) {
                    // Detach first to avoid duplicate listeners
                    oBinding.getModel().detachPropertyChange(this._onModelPropertyChange, this);
                    oBinding.getModel().attachPropertyChange(this._onModelPropertyChange, this);
                }
            },

            routing: {
                onBeforeBinding: function (oEvent) {
                    console.log("=== MDM ObjectPageExt onBeforeBinding called ===");
                },

                onAfterBinding: function (oEvent) {
                    console.log("=== MDM ObjectPageExt onAfterBinding called ===");
                    // Setup table row handlers following Coupa/Salesforce pattern
                    // Do NOT call _updateProcessFlow here - it blocks page render
                    this._setupTableRowHandlers();

                    // Intercept action executions (as fallback if onPageReady doesn't fire)
                    this._interceptActionExecutions();

                    // Fix ObjectStatus controls after binding completes
                    setTimeout(() => {
                        this._replaceStatusFieldsWithObjectStatus();
                    }, 100);

                    // Hide Create buttons on child entity tables when in draft mode
                    // Single call with optimized delay
                    const that = this;
                    setTimeout(() => {
                        that._hideChildEntityCreateButtons();
                    }, 500);

                    // Note: Section renumbering is now triggered from _interceptActionExecutions
                    // which is guaranteed to fire, unlike this lifecycle event
                }
            }
        },


        /**
         * Intercept existing annotation-based action button executions to show popups
         * @private
         */
        _interceptActionExecutions: function () {
            // Guard: Only run once to prevent duplicate execution during lifecycle events
            if (this._actionInterceptionApplied) {
                console.log("⚠️ Action interception already applied, skipping duplicate execution");
                return;
            }

            console.log("=== Setting up action execution interception ===");
            const oView = this.base.getView();
            const that = this;

            // Find and intercept the action buttons
            setTimeout(() => {
                const aContent = oView.getContent();
                if (!aContent || aContent.length === 0) {
                    console.log("No content found, retrying...");
                    setTimeout(() => that._interceptActionExecutions(), 300);
                    return;
                }

                const oObjectPage = aContent[0];
                if (!oObjectPage || !oObjectPage.isA("sap.uxap.ObjectPageLayout")) {
                    console.log("ObjectPageLayout not found, retrying...");
                    setTimeout(() => that._interceptActionExecutions(), 300);
                    return;
                }

                const oHeaderTitle = oObjectPage.getHeaderTitle();
                if (!oHeaderTitle) {
                    console.log("HeaderTitle not found, retrying...");
                    setTimeout(() => that._interceptActionExecutions(), 300);
                    return;
                }

                // Get all action buttons
                const aActions = oHeaderTitle.getActions();
                console.log(`Found ${aActions.length} header actions`);

                aActions.forEach(function (oButton) {
                    const sText = oButton.getText ? oButton.getText() : "";
                    console.log(`  - Button: ${sText}`);

                    if (sText === "VIES VAT Check") {
                        console.log("    ⚡ Intercepting VIES VAT Check button");
                        that._interceptButton(oButton, "VIES");
                    } else if (sText === "AEB Sanctions Check") {
                        console.log("    ⚡ Intercepting AEB Sanctions Check button");
                        that._interceptButton(oButton, "AEB");
                    } else if (sText === "Duplicate Check") {
                        console.log("    ⚡ Intercepting Duplicate Check button");
                        that._interceptButton(oButton, "Duplicate");
                    }
                });

                console.log("✅ Action button interception complete");

                // Mark interception as applied to prevent duplicate execution
                that._actionInterceptionApplied = true;

                // Trigger section renumbering after action buttons are ready
                // Only run once to avoid re-execution
                if (!that._sectionRenumberingApplied) {
                    setTimeout(() => {
                        that._controlSubAccountSectionVisibility();
                    }, 300);
                }
            }, 500); // Reduced from 1000ms to 500ms
        },

        /**
         * Intercept a button's press event to show popup after action completes
         * @private
         */
        _interceptButton: function (oButton, sType) {
            const that = this;

            // Check if already intercepted
            if (oButton._intercepted) {
                console.log(`    ⚠️ ${sType} button already intercepted, skipping`);
                return;
            }

            const aHandlers = oButton.mEventRegistry?.press || [];
            if (aHandlers.length === 0) {
                console.log(`No press handler found for ${sType} button`);
                return;
            }

            // Store original handler info
            const oOriginalHandler = aHandlers[0];
            const fnOriginalPress = oOriginalHandler.fFunction;
            const oOriginalListener = oOriginalHandler.oListener;

            // Detach original handler
            oButton.detachPress(fnOriginalPress, oOriginalListener);

            // Attach new handler with busy indicator and action interception
            oButton.attachPress(async function (oEvent) {
                console.log(`=== ${sType} Check button intercepted ===`);

                // Show busy indicator
                sap.ui.core.BusyIndicator.show(0);

                // Disable all check buttons during processing
                that._setCheckButtonsEnabled(false);

                try {
                    const oView = that.base.getView();
                    const oContext = oView.getBindingContext();

                    // Call original handler with proper context
                    const result = fnOriginalPress.call(oOriginalListener || this, oEvent);

                    // Wait for action to complete
                    if (result && result.then) {
                        // It's a promise
                        await result;
                    }

                    // Wait for the model to update (single wait, no continuous refresh)
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Show popup based on type
                    if (sType === "VIES") {
                        that._handleVIESCheckCompletion();
                    } else if (sType === "AEB") {
                        that._handleAEBCheckCompletion();
                    } else if (sType === "Duplicate") {
                        // For duplicate check, get results from action response via binding context
                        that._handleDuplicateCheckCompletionFromAction();
                    }

                } catch (error) {
                    console.error(`Error during ${sType} check:`, error);
                } finally {
                    // Hide busy indicator and re-enable buttons
                    sap.ui.core.BusyIndicator.hide();
                    that._setCheckButtonsEnabled(true);
                }
            });

            // Mark as intercepted
            oButton._intercepted = true;
            console.log(`    ✅ ${sType} button intercepted successfully`);
        },

        /**
         * Enable or disable all check buttons
         * @param {boolean} bEnabled - true to enable, false to disable
         * @private
         */
        _setCheckButtonsEnabled: function (bEnabled) {
            const oView = this.base.getView();
            setTimeout(() => {
                const aContent = oView.getContent();
                if (!aContent || aContent.length === 0) return;

                const oObjectPage = aContent[0];
                const oHeaderTitle = oObjectPage.getHeaderTitle();
                const aActions = oHeaderTitle.getActions();

                aActions.forEach(function (oButton) {
                    const sText = oButton.getText ? oButton.getText() : "";
                    if (sText === "VIES VAT Check" || sText === "AEB Sanctions Check" || sText === "Duplicate Check") {
                        oButton.setEnabled(bEnabled);
                    }
                });
            }, 100);
        },

        /**
         * Handle VIES Check completion - show popup with results
         * @private
         */
        _handleVIESCheckCompletion: function () {
            const oView = this.base.getView();
            const oContext = oView.getBindingContext();

            if (!oContext) return;

            // Refresh to get latest data including VAT IDs
            oContext.refresh();

            // Get VIES check results from context - exactly as shown in the section
            const viesStatus = oContext.getProperty("viesStatus");
            const viesCheckDate = oContext.getProperty("viesCheckDate");
            const viesCheckDetails = oContext.getProperty("viesCheckDetails");

            // Show popup with the same data as displayed in the section
            this._showVIESCheckResultsPopupEnhanced({
                viesStatus: viesStatus,
                viesCheckDate: viesCheckDate,
                viesCheckDetails: viesCheckDetails
            });
        },

        /**
         * Handle AEB Check completion - show popup with results
         * @private
         */
        _handleAEBCheckCompletion: function () {
            const oView = this.base.getView();
            const oContext = oView.getBindingContext();

            if (!oContext) return;

            // Refresh to get latest data
            oContext.refresh();

            // Get AEB check results from context
            const status = oContext.getProperty("aebStatus");
            const riskScore = oContext.getProperty("aebRiskScore");
            const screeningId = oContext.getProperty("aebScreeningId");
            const summary = oContext.getProperty("aebSummary");
            const message = oContext.getProperty("aebMessage");

            // Show popup with results
            this._showAEBCheckResultsPopupEnhanced({
                status: status,
                riskScore: riskScore,
                screeningId: screeningId,
                summary: summary,
                message: message
            });
        },

        /**
         * Handle Duplicate Check completion - get results from current action (not history)
         * This gets only the duplicates from the most recent check
         * @private
         */
        _handleDuplicateCheckCompletionFromAction: function () {
            const oView = this.base.getView();
            const oContext = oView.getBindingContext();

            if (!oContext) return;

            // Read duplicate check results from navigation property
            const oModel = oView.getModel();
            const sDuplicatesPath = oContext.getPath() + "/duplicateChecks";
            const oDuplicatesBinding = oModel.bindList(sDuplicatesPath);

            // Add sorting to get most recent duplicates first
            oDuplicatesBinding.sort(new sap.ui.model.Sorter("checkDate", true)); // true = descending

            oDuplicatesBinding.requestContexts().then((aContexts) => {
                if (!aContexts || aContexts.length === 0) {
                    sap.m.MessageBox.success("No duplicates found!", {
                        title: "Duplicate Check"
                    });
                    return;
                }

                // Get the most recent check date
                const aMostRecent = aContexts.map(ctx => ctx.getObject());
                const latestCheckDate = aMostRecent[0].checkDate;

                // Filter to only include duplicates from the latest check
                const aLatestDuplicates = aMostRecent.filter(dup => {
                    const dupDate = new Date(dup.checkDate).getTime();
                    const latestDate = new Date(latestCheckDate).getTime();
                    // Within 1 second tolerance
                    return Math.abs(dupDate - latestDate) < 1000;
                });

                console.log(`Found ${aLatestDuplicates.length} duplicates from latest check (${latestCheckDate})`);

                if (aLatestDuplicates.length === 0) {
                    sap.m.MessageBox.success("No duplicates found!", {
                        title: "Duplicate Check"
                    });
                } else {
                    // Show popup with latest duplicates only (Coupa-style)
                    this._showDuplicatesDialogEnhanced(aLatestDuplicates);
                }
            });
        },

        /**
         * Handle Duplicate Check completion - show popup with results (LEGACY - reads all history)
         * @private
         * @deprecated Use _handleDuplicateCheckCompletionFromAction instead
         */
        _handleDuplicateCheckCompletion: function () {
            const oView = this.base.getView();
            const oContext = oView.getBindingContext();

            if (!oContext) return;

            // Refresh to get latest data
            oContext.refresh();

            // Read duplicate check results from navigation property
            const oModel = oView.getModel();
            const sDuplicatesPath = oContext.getPath() + "/duplicateChecks";
            const oDuplicatesBinding = oModel.bindList(sDuplicatesPath);

            oDuplicatesBinding.requestContexts().then((aContexts) => {
                const aDuplicates = aContexts.map(ctx => ctx.getObject());

                console.log("Duplicate check results from navigation:", aDuplicates);

                if (!aDuplicates || aDuplicates.length === 0) {
                    MessageBox.success("No duplicates found!", {
                        title: "Duplicate Check"
                    });
                } else {
                    // Show popup with duplicates (Coupa-style)
                    this._showDuplicatesDialogEnhanced(aDuplicates);
                }
            });
        },

        /**
         * Handle model property changes to update ObjectStatus controls
         */
        _onModelPropertyChange: function (oEvent) {
            const sPath = oEvent.getParameter("path");

            // Only react to aebStatus or viesStatus changes
            if (sPath && (sPath.includes("aebStatus") || sPath.includes("viesStatus"))) {
                console.log("🔄 Model property changed:", sPath);
                // Trigger ObjectStatus fix with slight delay to ensure UI is updated
                setTimeout(() => {
                    this._replaceStatusFieldsWithObjectStatus();
                }, 300);
            }
        },

        /**
         * Fix ObjectStatus controls to display correct criticality colors
         */
        _replaceStatusFieldsWithObjectStatus: function () {
            const oView = this.base.getView();

            setTimeout(() => {
                console.log("🔧 _replaceStatusFieldsWithObjectStatus: Starting...");
                const oContext = oView.getBindingContext();
                if (!oContext) {
                    console.warn("⚠️ No binding context found");
                    return;
                }

                // Get the data to read criticality values
                const oData = oContext.getObject();
                console.log("📊 Data:", {
                    aebStatus: oData.aebStatus,
                    aebStatusCriticality: oData.aebStatusCriticality,
                    viesStatus: oData.viesStatus,
                    viesStatusCriticality: oData.viesStatusCriticality
                });

                // Find all ObjectStatus controls by traversing the view tree
                const aObjectStatuses = [];
                const findControls = function (oControl) {
                    if (oControl && oControl.isA && oControl.isA("sap.m.ObjectStatus")) {
                        aObjectStatuses.push(oControl);
                    }
                    if (oControl && oControl.getMetadata) {
                        const aAggregationNames = oControl.getMetadata().getAllAggregations();
                        Object.keys(aAggregationNames).forEach(sName => {
                            const aAggregation = oControl.getAggregation(aAggregationNames[sName].name);
                            if (Array.isArray(aAggregation)) {
                                aAggregation.forEach(findControls);
                            } else if (aAggregation) {
                                findControls(aAggregation);
                            }
                        });
                    }
                };

                findControls(oView);
                console.log(`🔍 Found ${aObjectStatuses.length} ObjectStatus controls`);

                // Fix the status controls
                aObjectStatuses.forEach(function (oObjectStatus) {
                    const sBindingPath = oObjectStatus.getBindingPath("text");
                    console.log(`   - Control with binding: ${sBindingPath}`);

                    if (sBindingPath === "aebStatus") {
                        // Get criticality value from data
                        const nCriticality = oData.aebStatusCriticality;

                        // Map criticality to state
                        let sState = "None";
                        switch (nCriticality) {
                            case 1: sState = "Success"; break;
                            case 2: sState = "Warning"; break;
                            case 3: sState = "Error"; break;
                            default: sState = "None";
                        }

                        // CRITICAL: Set inverted to false to ensure correct icon display
                        // Without this, Success shows red cross and Error shows green checkmark
                        oObjectStatus.setInverted(false);
                        oObjectStatus.setState(sState);
                        console.log(`     ✅ AEB: Set inverted=false, state=${sState}, criticality=${nCriticality}`);
                    } else if (sBindingPath === "viesStatus") {
                        // Get criticality value from data
                        const nCriticality = oData.viesStatusCriticality;

                        // Map criticality to state
                        let sState = "None";
                        switch (nCriticality) {
                            case 1: sState = "Success"; break;
                            case 2: sState = "Warning"; break;
                            case 3: sState = "Error"; break;
                            default: sState = "None";
                        }

                        // CRITICAL: Set inverted to false to ensure correct icon display
                        // Without this, Success shows red cross and Error shows green checkmark
                        oObjectStatus.setInverted(false);
                        oObjectStatus.setState(sState);
                        console.log(`     ✅ VIES: Set inverted=false, state=${sState}, criticality=${nCriticality}`);
                    }
                });
            }, 300); // Reduced from 1500ms to 300ms for faster page load
        },

        _hideStandardButtons: function () {
            try {
                const oView = this.base.getView();
                // Only hide Delete button, keep Edit button visible for approverComments editing
                const aDeleteButtons = oView.$().find("button:contains('Delete')");
                aDeleteButtons.each(function () {
                    const oControl = sap.ui.getCore().byId(this.id);
                    if (oControl && oControl.setVisible) {
                        oControl.setVisible(false);
                    }
                });
            } catch (e) {
                console.error("Error hiding standard buttons:", e);
            }
        },

        /**
         * Setup table row handlers for duplicate checks and subaccounts tables
         * Using event-based approach for reliable handler attachment
         */
        _setupTableRowHandlers: function (nRetryCount) {
            const oView = this.base.getView();
            const that = this;
            const nRetries = nRetryCount || 0;
            const nMaxRetries = 2; // Reduced from 5 to 2

            // Guard: Only run once to prevent duplicate execution during lifecycle events
            if (nRetries === 0 && this._tableHandlersApplied) {
                console.log("⚠️ Table handlers already applied, skipping duplicate execution");
                return;
            }

            // Prevent multiple simultaneous setup attempts (only on first call)
            if (nRetries === 0) {
                if (this._settingUpHandlers) {
                    console.log("⏸️  Table row handler setup already in progress, skipping");
                    return;
                }
                this._settingUpHandlers = true;
            }

            // Use optimized delay
            setTimeout(() => {
                console.log("=== Setting up MDM table row handlers (attempt " + (nRetries + 1) + ") ===");

                // Find all tables
                const aTables = oView.findAggregatedObjects(true, function (oControl) {
                    return oControl.isA("sap.m.Table");
                });

                console.log(`Found ${aTables.length} tables`);

                let nTablesWithBinding = 0;
                aTables.forEach(function (oTable) {
                    const oBinding = oTable.getBinding("items");
                    if (!oBinding) {
                        return;
                    }
                    nTablesWithBinding++;
                });

                console.log(`Tables with binding: ${nTablesWithBinding}/${aTables.length}`);

                // If no tables have bindings yet and we haven't exceeded max retries, try again
                if (nTablesWithBinding === 0 && nRetries < nMaxRetries) {
                    console.log("No tables have bindings yet, will retry in 500ms...");
                    that._setupTableRowHandlers(nRetries + 1);
                    return;
                }

                // Mark setup as complete (either succeeded or max retries reached)
                that._settingUpHandlers = false;

                aTables.forEach(function (oTable) {
                    const oBinding = oTable.getBinding("items");
                    if (!oBinding) {
                        return;
                    }

                    const sPath = oBinding.getPath();
                    console.log("Table binding path:", sPath);

                    // Attach handler for Duplicate Checks table (ONLY)
                    // Note: Child entity tables (addresses, banks, vatIds, emails) no longer use popups
                    // Users can view all data using "Show More/Less per Row" table feature
                    if (sPath && sPath.includes("duplicateChecks")) {
                        console.log("Found duplicateChecks table");

                        // Detach any existing updateFinished handler first
                        oTable.detachUpdateFinished(that._handleDuplicateTableUpdate);

                        // Create named handler function for table updates
                        that._handleDuplicateTableUpdate = function (oEvent) {
                            console.log("[MDM] Duplicate Checks table updated, making BP Numbers clickable");
                            that._makeDuplicateCheckBPNumbersClickable(oTable);
                        };

                        // Attach updateFinished handler to make BP numbers clickable after table loads/updates
                        oTable.attachUpdateFinished(that._handleDuplicateTableUpdate);
                        console.log("✓ Attached updateFinished handler to Duplicate Checks table");

                        // Call immediately if table already has items
                        if (oTable.getItems().length > 0) {
                            console.log("[MDM] Table already has items, making BP Numbers clickable now");
                            that._makeDuplicateCheckBPNumbersClickable(oTable);
                        }
                    }
                });

                // Mark table handlers as applied to prevent duplicate execution
                that._tableHandlersApplied = true;
                console.log("✅ Table handlers setup complete");
            }, 500); // 500ms delay - optimized for faster page load
        },





        /**
         * Make BP Numbers clickable in Duplicate Checks table
         */
        _makeDuplicateCheckBPNumbersClickable: function (oTable) {
            const that = this;
            const aItems = oTable.getItems();
            console.log(`_makeDuplicateCheckBPNumbersClickable: Processing ${aItems.length} items`);

            aItems.forEach((oItem, index) => {
                const aCells = oItem.getCells();
                console.log(`Row ${index}: Found ${aCells.length} cells`);

                // BP Number is in column index 1 (Check Date is column 0)
                if (aCells.length > 1) {
                    const oBpNumberCell = aCells[1];
                    console.log(`Row ${index}: BP Number cell control type:`, oBpNumberCell.getMetadata().getName());

                    const oContext = oItem.getBindingContext();
                    if (oContext) {
                        const bpNumber = oContext.getProperty("existingBpNumber");
                        console.log(`Row ${index}: BP Number from context:`, bpNumber);

                        if (bpNumber) {
                            console.log(`Making BP Number cell clickable: ${bpNumber}`);

                            // Add CSS to make cell look clickable
                            oBpNumberCell.addStyleClass("sapMLink");
                            oBpNumberCell.addStyleClass("sapMLnk");

                            // Find the inner content to add click styling
                            const addClickableStyling = (oControl) => {
                                if (oControl && oControl.$) {
                                    const $elem = oControl.$();
                                    if ($elem && $elem.length > 0) {
                                        $elem.css('cursor', 'pointer');
                                        $elem.css('color', '#0854a0');
                                        $elem.css('text-decoration', 'underline');
                                    }
                                }

                                // Also style all children recursively
                                const aAggs = oControl.getMetadata().getAllAggregations();
                                for (let sAggName in aAggs) {
                                    const aChildren = oControl.getAggregation(sAggName);
                                    if (Array.isArray(aChildren)) {
                                        aChildren.forEach(addClickableStyling);
                                    } else if (aChildren) {
                                        addClickableStyling(aChildren);
                                    }
                                }
                            };

                            addClickableStyling(oBpNumberCell);

                            // Attach click handler to the cell itself
                            oBpNumberCell.attachBrowserEvent("click", function() {
                                console.log(`BP Number cell clicked: ${bpNumber}`);
                                that._onBPNumberPress(bpNumber);
                            });

                            console.log(`✅ BP Number cell made clickable: ${bpNumber}`);
                        } else {
                            console.warn(`Row ${index}: No BP number found in context`);
                        }
                    } else {
                        console.warn(`Row ${index}: No binding context found`);
                    }
                } else {
                    console.warn(`Row ${index}: Not enough cells (${aCells.length})`);
                }
            });
        },

        /**
         * Make SubAccount IDs clickable in SubAccounts table
         */
        _makeSubAccountIDsClickable: function (oTable) {
            const that = this;
            const oView = this.base.getView();
            const oPageContext = oView.getBindingContext();
            const aItems = oTable.getItems();

            if (!oPageContext) return;
            const requestId = oPageContext.getProperty("ID");

            aItems.forEach((oItem) => {
                const aCells = oItem.getCells();
                // SubAccount ID is in column index 0 (first column)
                if (aCells.length > 0) {
                    const oCell = aCells[0];
                    const oContext = oItem.getBindingContext();
                    if (oContext) {
                        const subAccountId = oContext.getProperty("subAccountId");
                        if (subAccountId) {
                            // Replace Text control with Link control
                            that._replaceTextWithLink(oCell, subAccountId, () => {
                                that._onSubAccountIdPress(subAccountId, requestId);
                            });
                        }
                    }
                }
            });
        },

        /**
         * Replace a Text control with a Link control in a table cell
         * Handles both standard VBox controls and Fiori Elements Field macros
         */
        _replaceTextWithLink: function (oCell, sText, fnPress) {
            if (!oCell) return;

            try {
                // For Fiori Elements Field controls, we need to find the inner Text control
                const findAndReplaceTextControl = (oControl) => {
                    // Check if this control is a Text
                    if (oControl && oControl.isA && oControl.isA("sap.m.Text")) {
                        const oParent = oControl.getParent();
                        if (oParent && oParent.removeContent && oParent.addContent) {
                            // Parent uses content aggregation
                            const iIndex = oParent.indexOfContent(oControl);
                            oParent.removeContent(oControl);

                            const oLink = new sap.m.Link({
                                text: sText,
                                press: fnPress
                            });

                            oParent.insertContent(oLink, iIndex);
                            console.log(`Replaced Text with Link: ${sText}`);
                            return true;
                        } else if (oParent && oParent.removeItem && oParent.addItem) {
                            // Parent uses items aggregation
                            const iIndex = oParent.indexOfItem(oControl);
                            oParent.removeItem(oControl);

                            const oLink = new sap.m.Link({
                                text: sText,
                                press: fnPress
                            });

                            oParent.insertItem(oLink, iIndex);
                            console.log(`Replaced Text with Link: ${sText}`);
                            return true;
                        }
                    }

                    // Recursively search in aggregations
                    const aAggregationNames = oControl.getMetadata().getAllAggregations();
                    for (let sAggName in aAggregationNames) {
                        const aChildren = oControl.getAggregation(sAggName);
                        if (Array.isArray(aChildren)) {
                            for (let oChild of aChildren) {
                                if (findAndReplaceTextControl(oChild)) {
                                    return true;
                                }
                            }
                        } else if (aChildren) {
                            if (findAndReplaceTextControl(aChildren)) {
                                return true;
                            }
                        }
                    }
                    return false;
                };

                // Start recursive search from the cell
                if (!findAndReplaceTextControl(oCell)) {
                    console.warn(`Could not find Text control to replace in cell for: ${sText}`);
                }
            } catch (error) {
                console.error("Error replacing text with link:", error, error.stack);
            }
        },

        /**
         * Hide Create buttons on child entity tables when in draft mode
         * This ensures only approverComments can be modified during edit
         * @private
         */
        _hideChildEntityCreateButtons: function () {
            // Guard: Only run once to prevent duplicate execution during lifecycle events
            if (this._childEntityButtonsHidden) {
                console.log("⚠️ Child entity buttons already hidden, skipping duplicate execution");
                return;
            }

            try {
                const oView = this.base.getView();
                const oContext = oView.getBindingContext();

                if (!oContext) {
                    console.log("⏸️  No binding context, skipping Create button hiding");
                    return;
                }

                // Check if we're in draft mode (IsActiveEntity=false)
                const bIsActiveEntity = oContext.getProperty("IsActiveEntity");

                if (bIsActiveEntity === false) {
                    console.log("🔒 Draft mode detected - hiding Create buttons on child entity tables");

                    // Find all MDC tables in the view (Fiori Elements uses sap.ui.mdc.Table)
                    const aTables = oView.findAggregatedObjects(true, function (oControl) {
                        return oControl.isA("sap.ui.mdc.Table");
                    });

                    console.log(`  📋 Found ${aTables.length} MDC tables`);

                    aTables.forEach(function (oTable) {
                        const sTableId = oTable.getId();

                        // Check if this is a child entity table that should have Create button hidden
                        if (sTableId && (
                            sTableId.includes("addresses") ||
                            sTableId.includes("vatIds") ||
                            sTableId.includes("banks") ||
                            sTableId.includes("emails") ||
                            sTableId.includes("duplicateChecks")
                        )) {
                            console.log(`  🔒 Processing table: ${sTableId}`);

                            // MDC Tables have actions aggregation instead of header toolbar
                            const aActions = oTable.getActions();
                            if (aActions && aActions.length > 0) {
                                console.log(`    Found ${aActions.length} actions`);

                                aActions.forEach(function (oAction) {
                                    const sActionId = oAction.getId();

                                    // Hide Create actions based on ID
                                    if (sActionId && sActionId.includes("StandardAction::Create")) {
                                        oAction.setVisible(false);
                                        console.log(`    ✅ Hidden Create action: ${sActionId}`);
                                    }
                                });
                            } else {
                                console.log(`    ⚠️ No actions found for table`);
                            }
                        }
                    });

                    console.log("✅ Create buttons hidden for all child entity tables");

                    // Mark as hidden to prevent duplicate execution
                    this._childEntityButtonsHidden = true;
                } else {
                    console.log("ℹ️  Active entity mode - Create buttons remain visible");
                }
            } catch (error) {
                console.error("❌ Error hiding Create buttons:", error);
            }
        },

        _updateProcessFlow: function () {
            try {
                const oContext = this.base.getView().getBindingContext();
                if (!oContext) return;

                const oData = oContext.getObject();
                if (!oData) return;

                const nodes = [];
                const lanes = [
                    { laneId: "duplicate", iconSrc: "sap-icon://duplicate", text: "Duplicate Check", position: 0 },
                    { laneId: "compliance", iconSrc: "sap-icon://validate", text: "Compliance", position: 1 },
                    { laneId: "approval", iconSrc: "sap-icon://approvals", text: "Approval", position: 2 },
                    { laneId: "integration", iconSrc: "sap-icon://process", text: "Integration", position: 3 }
                ];

                // 1. Duplicate Check Node
                let duplicateState = "Neutral";
                let duplicateText = "Pending";
                if (oData.duplicateCheckResults) {
                    try {
                        const duplicates = JSON.parse(oData.duplicateCheckResults || "[]");
                        if (duplicates.length > 0) {
                            duplicateState = "Warning";
                            duplicateText = "Duplicates Found";
                        } else {
                            duplicateState = "Positive";
                            duplicateText = "No Duplicates";
                        }
                    } catch (e) {
                        // Ignore parse error
                    }
                }
                nodes.push({
                    id: "node1",
                    laneId: "duplicate",
                    title: "Duplicate Check",
                    titleAbbreviation: "Dup Check",
                    children: ["node2"],
                    state: duplicateState,
                    stateText: duplicateText,
                    focused: false
                });

                // 2. Compliance Check Node
                let complianceState = "Neutral";
                let complianceText = "Pending";
                if (oData.aebStatus === 'Pass' && oData.viesStatus === 'Valid') {
                    complianceState = "Positive";
                    complianceText = "Passed";
                } else if (oData.aebStatus === 'Fail' || oData.viesStatus === 'Invalid') {
                    complianceState = "Negative";
                    complianceText = "Failed";
                } else if (oData.aebStatus === 'NotChecked') {
                    complianceState = "Neutral";
                    complianceText = "Not Checked";
                } else {
                    complianceState = "Critical";
                    complianceText = "Review Required";
                }
                nodes.push({
                    id: "node2",
                    laneId: "compliance",
                    title: "Compliance",
                    titleAbbreviation: "Compliance",
                    children: ["node3"],
                    state: complianceState,
                    stateText: complianceText,
                    focused: false
                });

                // 3. Approval Node
                let approvalState = "Neutral";
                let approvalText = oData.status;
                if (oData.status === 'Approved') {
                    approvalState = "Positive";
                } else if (oData.status === 'Rejected') {
                    approvalState = "Negative";
                } else if (oData.status === 'Submitted' || oData.status === 'InReview') {
                    approvalState = "Critical";
                }
                nodes.push({
                    id: "node3",
                    laneId: "approval",
                    title: "Approval",
                    titleAbbreviation: "Approval",
                    children: ["node4"],
                    state: approvalState,
                    stateText: approvalText,
                    focused: false
                });

                // 4. Integration Node
                let integrationState = "Neutral";
                let integrationText = "Pending";
                if (oData.sapInitialStatus === 'Success' && oData.satelliteStatus === 'Success') {
                    integrationState = "Positive";
                    integrationText = "Completed";
                } else if (oData.sapInitialStatus === 'Error' || oData.satelliteStatus === 'Error') {
                    integrationState = "Negative";
                    integrationText = "Error";
                } else if (oData.status === 'Approved') {
                    integrationState = "Critical";
                    integrationText = "Processing";
                }
                nodes.push({
                    id: "node4",
                    laneId: "integration",
                    title: "Integration",
                    titleAbbreviation: "Integration",
                    children: [],
                    state: integrationState,
                    stateText: integrationText,
                    focused: false
                });

                this.oProcessFlowModel.setData({
                    nodes: nodes,
                    lanes: lanes
                });
            } catch (e) {
                console.error("Error updating process flow:", e);
            }
        },

        // Header Action Handlers
        onComplianceCheck: function (oEvent) {
            const oContext = this.base.getView().getBindingContext();
            if (!oContext) return;

            const oOperation = oContext.getModel().bindContext(
                "MDMService.performComplianceCheck(...)",
                oContext
            );
            oOperation.execute().then(function () {
                sap.m.MessageToast.show("Compliance Check completed");
                oContext.refresh();
            }).catch(function (oError) {
                sap.m.MessageBox.error("Compliance Check failed: " + oError.message);
            });
        },

        onApprove: function (oEvent) {
            const oContext = this.base.getView().getBindingContext();
            if (!oContext) return;

            const oOperation = oContext.getModel().bindContext(
                "MDMService.approveRequest(...)",
                oContext
            );
            oOperation.execute().then(function () {
                sap.m.MessageToast.show("Request approved successfully");
                oContext.refresh();
            }).catch(function (oError) {
                sap.m.MessageBox.error("Approval failed: " + oError.message);
            });
        },

        onReject: function (oEvent) {
            const oContext = this.base.getView().getBindingContext();
            if (!oContext) return;

            const oOperation = oContext.getModel().bindContext(
                "MDMService.rejectRequest(...)",
                oContext
            );
            oOperation.execute().then(function () {
                MessageToast.show("Request rejected");
                oContext.refresh();
            }).catch(function (oError) {
                MessageBox.error("Rejection failed: " + oError.message);
            });
        },

        /**
         * Show BP Details in a popup dialog
         * Called when BP Number link is clicked in Duplicate Checks table
         *
         * CAP Best Practice: Use OData V4 Model Context Binding for unbound functions
         */
        _onBPNumberPress: function (bpNumber, oDuplicateData) {
            const that = this;
            const oView = this.base.getView();
            const oModel = oView.getModel();

            console.log("[BP Details] Getting comprehensive SAP Partner details for:", bpNumber);

            if (!bpNumber) {
                MessageToast.show("BP Number not available");
                return;
            }

            // Show loading indicator
            MessageToast.show("Fetching comprehensive partner details...");

            // UI5 Best Practice: Use OData V4 Context Binding for unbound function calls
            const oAction = oModel.bindContext("/getSAPPartnerDetails(...)");
            oAction.setParameter("sapBpNumber", bpNumber);

            oAction.execute().then(function () {
                const oResponse = oAction.getBoundContext().getObject();
                const data = oResponse.value || oResponse;

                console.log("[BP Details] Received comprehensive data:", data);

                // Show comprehensive dialog with all partner information
                that._showBPDetailsDialog(data);

            }).catch(function (oError) {
                console.error("[BP Details] Error fetching SAP Partner details:", oError);
                MessageBox.error("Failed to fetch partner details: " + (oError.message || "Unknown error"));
            });
        },

        /**
         * Create and show BP Details Dialog
         * Updated to match Coupa/Salesforce format with Table controls and SimpleForm
         * @private
         */
        _showBPDetailsDialog: function (oBPData) {
            const aDialogContent = [];

            // Basic Information - SimpleForm with ResponsiveGridLayout
            const oBasicForm = new sap.ui.layout.form.SimpleForm({
                editable: false,
                layout: "ResponsiveGridLayout",
                content: [
                    new sap.ui.core.Title({ text: "1. Basic Information" }),
                    new Label({ text: "SAP BP Number" }),
                    new Text({ text: oBPData.sapBpNumber || "N/A" }),
                    new Label({ text: "Partner Name" }),
                    new Text({ text: oBPData.partnerName || "N/A" }),
                    new Label({ text: "Partner Role" }),
                    new Text({ text: oBPData.partnerRole || "Supplier" }),
                    new Label({ text: "Status" }),
                    new sap.m.ObjectStatus({
                        text: oBPData.status || "Active",
                        state: oBPData.status === 'Blocked' ? 'Error' : 'Success'
                    })
                ]
            });

            // Add Satellite System ID if available
            if (oBPData.satelliteSystemId) {
                oBasicForm.addContent(new Label({ text: "Satellite System ID" }));
                oBasicForm.addContent(new Text({ text: oBPData.satelliteSystemId }));
            }

            // Add Match Information if available (for duplicate checks)
            if (oBPData.matchScore !== undefined) {
                oBasicForm.addContent(new Label({ text: "Match Score" }));
                oBasicForm.addContent(new ObjectStatus({
                    text: oBPData.matchScore + "%",
                    state: oBPData.matchScore > 80 ? "Error" : oBPData.matchScore > 60 ? "Warning" : "Success"
                }));
            }
            if (oBPData.matchType) {
                oBasicForm.addContent(new Label({ text: "Match Type" }));
                oBasicForm.addContent(new Text({ text: oBPData.matchType }));
            }

            aDialogContent.push(oBasicForm);

            // Addresses Table
            if (oBPData.addresses && oBPData.addresses.length > 0) {
                const oAddressTable = new Table({
                    width: "100%",
                    headerText: "2. Addresses (" + oBPData.addresses.length + ")",
                    columns: [
                        new Column({ header: new Text({ text: "Type" }), width: "15%" }),
                        new Column({ header: new Text({ text: "Street" }), width: "25%" }),
                        new Column({ header: new Text({ text: "City" }), width: "20%" }),
                        new Column({ header: new Text({ text: "Postal Code" }), width: "15%" }),
                        new Column({ header: new Text({ text: "Country" }), width: "25%" })
                    ]
                });

                oBPData.addresses.forEach(addr => {
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
            if (oBPData.taxNumbers && oBPData.taxNumbers.length > 0) {
                const oTaxTable = new Table({
                    width: "100%",
                    headerText: "3. Tax Information (" + oBPData.taxNumbers.length + ")",
                    columns: [
                        new Column({ header: new Text({ text: "Country" }), width: "30%" }),
                        new Column({ header: new Text({ text: "Tax Type" }), width: "30%" }),
                        new Column({ header: new Text({ text: "Tax Number" }), width: "40%" })
                    ]
                });

                oBPData.taxNumbers.forEach(tax => {
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
            if (oBPData.bankAccounts && oBPData.bankAccounts.length > 0) {
                const oBankTable = new Table({
                    width: "100%",
                    headerText: "4. Bank Details (" + oBPData.bankAccounts.length + ")",
                    columns: [
                        new Column({ header: new Text({ text: "Bank Name" }), width: "25%" }),
                        new Column({ header: new Text({ text: "Country" }), width: "15%" }),
                        new Column({ header: new Text({ text: "IBAN" }), width: "30%" }),
                        new Column({ header: new Text({ text: "Account" }), width: "15%" }),
                        new Column({ header: new Text({ text: "SWIFT" }), width: "15%" })
                    ]
                });

                oBPData.bankAccounts.forEach(bank => {
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

            // Contact Information - SimpleForm
            if (oBPData.contacts) {
                const oContactForm = new sap.ui.layout.form.SimpleForm({
                    editable: false,
                    layout: "ResponsiveGridLayout",
                    content: [
                        new sap.ui.core.Title({ text: "5. Contact Information" })
                    ]
                });

                if (oBPData.contacts.email) {
                    oContactForm.addContent(new Label({ text: "Email" }));
                    oContactForm.addContent(new Text({ text: oBPData.contacts.email }));
                }
                if (oBPData.contacts.phone) {
                    oContactForm.addContent(new Label({ text: "Phone" }));
                    oContactForm.addContent(new Text({ text: oBPData.contacts.phone }));
                }
                if (oBPData.contacts.fax) {
                    oContactForm.addContent(new Label({ text: "Fax" }));
                    oContactForm.addContent(new Text({ text: oBPData.contacts.fax }));
                }

                aDialogContent.push(oContactForm);
            }

            // Wrap all content in VBox
            const oVBox = new VBox({
                items: aDialogContent,
                width: "100%"
            });

            oVBox.addStyleClass("sapUiSmallMargin");

            // Create dialog - matching Coupa/Salesforce format
            const oDialog = new Dialog({
                title: "Business Partner Details: " + (oBPData.partnerName || ""),
                contentWidth: "900px",
                contentHeight: "700px",
                verticalScrolling: true,
                resizable: true,
                draggable: true,
                content: [oVBox],
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
         * Handle SubAccount ID press - show details popup
         * @param {String} subAccountId - SubAccount ID
         * @param {String} requestId - Request ID
         *
         * CAP Best Practice: Use OData V4 Model Context Binding for unbound functions
         */
        _onSubAccountIdPress: function (subAccountId, requestId) {
            const that = this;
            const oView = this.base.getView();
            const oModel = oView.getModel();

            if (!subAccountId) {
                MessageToast.show("SubAccount ID not available");
                return;
            }

            console.log(`[SubAccount Details] Getting details for: ${subAccountId}, Request: ${requestId}`);

            // CAP Best Practice: Use OData V4 Context Binding for function imports
            // Create operation binding for unbound function
            const oOperation = oModel.bindContext(`/getSubAccountDetails(...)`);

            // Set parameters
            oOperation.setParameter("subAccountId", subAccountId);
            oOperation.setParameter("requestId", requestId);

            // Execute the function
            oOperation.execute().then(function () {
                // Get the result from the bound context
                const oContext = oOperation.getBoundContext();
                if (oContext) {
                    const oResult = oContext.getObject();
                    console.log("[SubAccount Details] Response received:", oResult);
                    that._showSubAccountDetailsDialog(oResult);
                } else {
                    console.error("[SubAccount Details] No context returned");
                    MessageBox.error("Failed to load SubAccount details: No data returned");
                }
            }).catch(function (oError) {
                console.error("[SubAccount Details] Error:", oError);
                MessageBox.error("Failed to load SubAccount details: " + (oError.message || "Unknown error"));
            });
        },

        /**
         * Show SubAccount details in a dialog
         * @param {Object} oSubAccountData - SubAccount data
         * @private
         */
        _showSubAccountDetailsDialog: function (oSubAccountData) {
            const that = this;

            // Create dialog content with better formatting and sections
            const oContent = new VBox({
                items: [
                    // Basic Information Section
                    new Label({
                        text: "Basic Information",
                        design: "Bold"
                    }).addStyleClass("sapUiMediumMarginTop sapUiTinyMarginBottom"),
                    new VBox({
                        items: [
                            new HBox({
                                items: [
                                    new Label({ text: "Sub Account ID:", width: "180px" }),
                                    new Text({ text: oSubAccountData.subAccountId || "N/A" }).addStyleClass("sapUiSmallMarginBegin")
                                ]
                            }).addStyleClass("sapUiTinyMarginBottom"),
                            new HBox({
                                items: [
                                    new Label({ text: "Revenue Stream:", width: "180px" }),
                                    new Text({ text: oSubAccountData.revenueStream || "N/A" }).addStyleClass("sapUiSmallMarginBegin")
                                ]
                            }).addStyleClass("sapUiTinyMarginBottom"),
                            new HBox({
                                items: [
                                    new Label({ text: "Billing Cycle:", width: "180px" }),
                                    new Text({ text: oSubAccountData.billingCycle || "N/A" }).addStyleClass("sapUiSmallMarginBegin")
                                ]
                            }).addStyleClass("sapUiTinyMarginBottom"),
                            new HBox({
                                items: [
                                    new Label({ text: "Currency:", width: "180px" }),
                                    new Text({ text: oSubAccountData.currency || "N/A" }).addStyleClass("sapUiSmallMarginBegin")
                                ]
                            }).addStyleClass("sapUiTinyMarginBottom"),
                            new HBox({
                                items: [
                                    new Label({ text: "Payment Terms:", width: "180px" }),
                                    new Text({ text: oSubAccountData.paymentTerms || "N/A" }).addStyleClass("sapUiSmallMarginBegin")
                                ]
                            }).addStyleClass("sapUiTinyMarginBottom"),
                            new HBox({
                                items: [
                                    new Label({ text: "Dunning Procedure:", width: "180px" }),
                                    new Text({ text: oSubAccountData.dunningProcedure || "N/A" }).addStyleClass("sapUiSmallMarginBegin")
                                ]
                            }).addStyleClass("sapUiTinyMarginBottom")
                        ]
                    }).addStyleClass("sapUiSmallMarginBegin"),

                    // Bank Accounts Section
                    new Label({
                        text: "Bank Accounts",
                        design: "Bold"
                    }).addStyleClass("sapUiMediumMarginTop sapUiTinyMarginBottom"),
                    new Text({
                        text: that._formatSubAccountBanks(oSubAccountData.banks),
                        renderWhitespace: true
                    }).addStyleClass("sapUiSmallMarginBegin sapUiSmallMarginBottom"),

                    // Email Contacts Section
                    new Label({
                        text: "Email Contacts",
                        design: "Bold"
                    }).addStyleClass("sapUiMediumMarginTop sapUiTinyMarginBottom"),
                    new Text({
                        text: that._formatSubAccountEmails(oSubAccountData.emails),
                        renderWhitespace: true
                    }).addStyleClass("sapUiSmallMarginBegin")
                ]
            }).addStyleClass("sapUiSmallMargin");

            // Create dialog with larger dimensions
            const oDialog = new Dialog({
                title: "SubAccount Details - " + (oSubAccountData.subAccountId || ""),
                contentWidth: "850px",
                contentHeight: "650px",
                verticalScrolling: true,
                resizable: true,
                draggable: true,
                content: [oContent],
                beginButton: new Button({
                    text: "Close",
                    type: "Emphasized",
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
         * Format SubAccount banks for display
         * @private
         */
        _formatSubAccountBanks: function (banks) {
            if (!banks || banks.length === 0) return "No bank accounts";

            return banks.map(function (bank) {
                let text = "";
                if (bank.bankName) text += bank.bankName;
                if (bank.accountNumber) text += " - Account: " + bank.accountNumber;
                if (bank.iban) text += "\n  IBAN: " + bank.iban;
                if (bank.swiftCode) text += "\n  SWIFT: " + bank.swiftCode;
                if (bank.bankCountry) text += "\n  Country: " + bank.bankCountry;
                if (bank.isDefault) text += " [DEFAULT]";
                return text || "N/A";
            }).join("\n\n");
        },

        /**
         * Format SubAccount emails for display
         * @private
         */
        _formatSubAccountEmails: function (emails) {
            if (!emails || emails.length === 0) return "No email contacts";

            return emails.map(function (email) {
                let text = email.emailAddress || "N/A";
                if (email.emailType) text += " (" + email.emailType + ")";
                if (email.contactType) text += " [" + email.contactType + "]";
                return text;
            }).join("\n");
        },

        /**
         * Control source-system-specific section visibility and renumber visible sections
         * Following CAP Flexible Programming Model best practice
         * - Salesforce: Show SubAccount, Hide Payment Info, Bank Details & Email Contacts
         * - Coupa: Hide SubAccount, Show Payment Info, Bank Details & Email Contacts
         * - Dynamic renumbering: Visible sections are numbered sequentially (1, 2, 3, 4...) without gaps
         * @private
         */
        _controlSubAccountSectionVisibility: function () {
            try {
                // Guard: Only run once to avoid conflicts with UI5 state management
                if (this._sectionRenumberingApplied) {
                    console.log("⏭️ Section renumbering already applied, skipping");
                    return;
                }

                const oView = this.base.getView();
                const oContext = oView.getBindingContext();

                if (!oContext) {
                    console.log("⚠️ No binding context yet, skipping section visibility check");
                    return;
                }

                const sourceSystem = oContext.getProperty("sourceSystem");
                const isSalesforce = sourceSystem === "Salesforce";
                const isCoupa = sourceSystem === "Coupa";

                console.log(`🎯 Section Visibility Control and Renumbering for: ${sourceSystem}`);

                // Get the ObjectPage control
                const oObjectPage = oView.byId("fe::ObjectPage");
                if (!oObjectPage || !oObjectPage.getSections) {
                    console.warn("ObjectPage control not found");
                    return;
                }

                // Control visibility for all source-system-specific sections
                const aSections = oObjectPage.getSections();
                const visibilityRules = {
                    "SubAccountInfoFacet": isSalesforce,      // G. SubAccount - Salesforce only
                    "PaymentInfoFacet": isCoupa,              // F. Payment Info - Coupa only
                    "BankDetailsFacet": isCoupa,              // D. Bank Details - Coupa only
                    "EmailContactsFacet": isCoupa             // E. Email Contacts - Coupa only
                };

                // First pass: Apply visibility rules
                aSections.forEach(section => {
                    const sectionId = section.getId();

                    // Check each visibility rule
                    Object.keys(visibilityRules).forEach(facetId => {
                        if (sectionId && sectionId.includes(facetId)) {
                            const shouldBeVisible = visibilityRules[facetId];
                            section.setVisible(shouldBeVisible);
                            console.log(`  ✅ ${facetId}: ${shouldBeVisible ? 'SHOW' : 'HIDE'}`);
                        }
                    });
                });

                // Second pass: Renumber visible sections and their corresponding tabs sequentially
                console.log("🔢 Renumbering visible sections and tabs...");

                // Get the IconTabBar to work with tabs
                const oIconTabBar = oView.byId("fe::ObjectPage-anchBar");
                let aTabFilters = [];
                if (oIconTabBar && oIconTabBar.getItems) {
                    aTabFilters = oIconTabBar.getItems().filter(item => {
                        return item.getMetadata && item.getMetadata().getName() === "sap.m.IconTabFilter";
                    });
                } else {
                    console.warn("⚠️ IconTabBar not found or getItems not available, will use DOM manipulation only");
                }

                // Build a map of section ID to tab for matching
                const sectionTabMap = new Map();
                aSections.forEach((section) => {
                    const sectionId = section.getId();
                    const sectionTitle = section.getTitle().replace(/^\d+\.\s+/, ''); // Remove number

                    // Find the tab that matches this section by checking if tab text contains section title
                    const matchingTab = aTabFilters.find(tab => {
                        const tabText = tab.getText().replace(/^\d+\.\s+/, '');
                        return tabText === sectionTitle;
                    });

                    if (matchingTab) {
                        sectionTabMap.set(sectionId, matchingTab);
                    }
                });

                // Now update section titles and their corresponding tabs
                let visibleSectionNumber = 1;
                aSections.forEach((section) => {
                    const sectionId = section.getId();
                    const tab = sectionTabMap.get(sectionId);

                    if (section.getVisible()) {
                        const currentTitle = section.getTitle();
                        const titleWithoutNumber = currentTitle.replace(/^\d+\.\s+/, '');
                        const newTitle = `${visibleSectionNumber}. ${titleWithoutNumber}`;

                        // Update section title
                        section.setTitle(newTitle);

                        // Update the corresponding tab if found
                        if (tab) {
                            tab.setText(newTitle);
                            tab.setVisible(true);
                            console.log(`  📝 Section ${visibleSectionNumber}: ${newTitle} (tab updated)`);
                        } else {
                            console.log(`  📝 Section ${visibleSectionNumber}: ${newTitle} (no matching tab)`);
                        }

                        visibleSectionNumber++;
                    } else {
                        // Hide tabs for hidden sections
                        if (tab) {
                            tab.setVisible(false);
                            console.log(`  🚫 Hidden section: ${section.getTitle()} (tab hidden)`);
                        }
                    }
                });

                console.log(`✅ Renumbered ${visibleSectionNumber - 1} visible sections`);

                // Force UI update - optimized delay for DOM manipulation
                setTimeout(() => {
                    try {
                        // Final strategy: Direct DOM manipulation as last resort
                        // Get all tab text elements and update them directly
                        const tabElements = document.querySelectorAll('.sapMITBText');
                        let visibleTabIndex = 1;

                        aSections.forEach((section) => {
                            if (section.getVisible()) {
                                const sectionTitle = section.getTitle();
                                const titleWithoutNumber = sectionTitle.replace(/^\d+\.\s+/, '');

                                // Find matching tab element by text content
                                tabElements.forEach((tabEl) => {
                                    const tabText = tabEl.textContent.trim();
                                    const tabTextWithoutNumber = tabText.replace(/^\d+\.\s+/, '');

                                    if (tabTextWithoutNumber === titleWithoutNumber) {
                                        const newTabText = `${visibleTabIndex}. ${titleWithoutNumber}`;
                                        tabEl.textContent = newTabText;
                                        console.log(`  🎨 DOM updated tab: ${newTabText}`);
                                    }
                                });

                                visibleTabIndex++;
                            }
                        });

                        console.log("✅ Tab labels updated via DOM manipulation");

                        // Also update section heading elements in the content area
                        const sectionHeadings = document.querySelectorAll('h3.sapMTitle');
                        let visibleHeadingIndex = 1;

                        aSections.forEach((section) => {
                            if (section.getVisible()) {
                                const sectionTitle = section.getTitle();
                                const titleWithoutNumber = sectionTitle.replace(/^\d+\.\s+/, '');

                                // Find matching heading element by text content (strip numbers and table counts)
                                sectionHeadings.forEach((headingEl) => {
                                    const headingText = headingEl.textContent.trim();
                                    // Remove number prefix and table counts like " (1)"
                                    const headingTextWithoutNumber = headingText.replace(/^\d+\.\s+/, '').replace(/\s*\(\d+\)$/, '');

                                    if (headingTextWithoutNumber === titleWithoutNumber) {
                                        // Preserve any record count suffix like " (1)"
                                        const recordCountMatch = headingText.match(/\s*\(\d+\)$/);
                                        const recordCountSuffix = recordCountMatch ? recordCountMatch[0] : '';
                                        const newHeadingText = `${visibleHeadingIndex}. ${titleWithoutNumber}${recordCountSuffix}`;
                                        headingEl.textContent = newHeadingText;
                                        console.log(`  🎨 DOM updated section heading: ${newHeadingText}`);
                                    }
                                });

                                visibleHeadingIndex++;
                            }
                        });

                        console.log("✅ Section headings updated via DOM manipulation");

                        // Mark renumbering as complete to prevent re-execution
                        this._sectionRenumberingApplied = true;
                        console.log("🔒 Section renumbering locked - will not run again");

                    } catch (e) {
                        console.warn("Could not update tabs via DOM:", e);
                        // Even on error, mark as applied to prevent retry loops
                        this._sectionRenumberingApplied = true;
                    }
                }, 400); // Reduced from 500ms to 400ms - optimized for faster page load

            } catch (error) {
                console.error("❌ Error controlling section visibility and renumbering:", error);
            }
        },

        /**
         * Show AEB Trade Compliance Check results in a popup dialog
         * @param {object} oData - Request data containing AEB check results
         * @private
         */
        _showAEBCheckResultsPopup: function (oData) {
            const sStatus = oData.aebStatus || "Not Checked";
            const sDetails = oData.aebCheckDetails || "No details available";
            const sCheckDate = oData.aebCheckDate ? new Date(oData.aebCheckDate).toLocaleString() : "N/A";

            // Determine message type based on status
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
                                    new Text({ text: sStatus }).addStyleClass("sapUiSmallMarginBottom")
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
            const sStatus = oData.viesStatus || "Not Checked";
            const sDetails = oData.viesCheckDetails || "No details available";
            const sCheckDate = oData.viesCheckDate ? new Date(oData.viesCheckDate).toLocaleString() : "N/A";

            // Determine message type based on status
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
                                    new Text({ text: sStatus }).addStyleClass("sapUiSmallMarginBottom")
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
            const sStatus = oData.duplicateCheckStatus || "Not Checked";
            const sCheckDate = oData.duplicateCheckDate ? new Date(oData.duplicateCheckDate).toLocaleString() : "N/A";
            const that = this;

            // Determine message type based on status
            let sState = "Information";
            if (sStatus === "No Duplicates") sState = "Success";
            else if (sStatus === "Duplicates Found") sState = "Warning";

            // Create table for duplicate results if available
            const aTableItems = [];
            if (oData.duplicateChecks && oData.duplicateChecks.length > 0) {
                oData.duplicateChecks.forEach(function (oDup) {
                    aTableItems.push(new ColumnListItem({
                        cells: [
                            new Text({ text: oDup.existingBpNumber || "" }),
                            new Text({ text: oDup.existingBpName || "" }),
                            new Text({ text: oDup.matchScore ? oDup.matchScore + "%" : "N/A" }),
                            new Text({ text: oDup.matchType || "" }),
                            new Text({ text: oDup.matchDetails || "" })
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
                                new Text({ text: sStatus }).addStyleClass("sapUiSmallMarginBottom")
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
                contentWidth: aTableItems.length > 0 ? "800px" : "500px",
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
        },

        /**
         * Show enhanced VIES Check results popup (called from action handler)
         * Displays the same information as shown in the VIES section
         * @param {object} oResult - Result with viesStatus, viesCheckDate, viesCheckDetails
         * @private
         */
        _showVIESCheckResultsPopupEnhanced: function (oResult) {
            const sStatus = oResult.viesStatus || "N/A";
            const sCheckDate = oResult.viesCheckDate || "";
            const sCheckDetails = oResult.viesCheckDetails || "";

            // Determine state based on status
            let sState = "Information";
            if (sStatus === "Valid") sState = "Success";
            else if (sStatus === "Error" || sStatus === "Fail") sState = "Error";
            else if (sStatus === "Invalid" || sStatus === "Warning") sState = "Warning";
            else if (sStatus === "Pass") sState = "Success";
            else if (sStatus === "N/A") sState = "None";

            // Format check date for display
            let sFormattedDate = sCheckDate;
            if (sCheckDate && sCheckDate !== "N/A") {
                try {
                    const oDate = new Date(sCheckDate);
                    const oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                        style: "medium"
                    });
                    sFormattedDate = oDateFormat.format(oDate);
                } catch (e) {
                    // Keep original format if parsing fails
                }
            }

            // Create content - exactly matching the section layout
            const aContent = [
                new VBox({
                    items: [
                        new HBox({
                            items: [
                                new Label({ text: "Status:", width: "150px" }).addStyleClass("sapUiTinyMarginEnd"),
                                new ObjectStatus({
                                    text: sStatus,
                                    state: sState
                                })
                            ]
                        }).addStyleClass("sapUiSmallMarginBottom"),
                        new HBox({
                            items: [
                                new Label({ text: "Check Date:", width: "150px" }).addStyleClass("sapUiTinyMarginEnd"),
                                new Text({ text: sFormattedDate || "–" })
                            ]
                        }).addStyleClass("sapUiSmallMarginBottom"),
                        new HBox({
                            items: [
                                new Label({ text: "Check Details:", width: "150px" }).addStyleClass("sapUiTinyMarginEnd"),
                                new Text({
                                    text: sCheckDetails || "–",
                                    width: "400px",
                                    wrapping: true
                                })
                            ]
                        }).addStyleClass("sapUiSmallMarginBottom")
                    ]
                }).addStyleClass("sapUiSmallMargin")
            ];

            const oDialog = new Dialog({
                title: "VIES VAT Validation Check Results",
                state: sState,
                contentWidth: "600px",
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
        },

        /**
         * Show enhanced AEB Check results popup (called from action handler)
         * @param {object} oResult - Result from performAEBCheck action
         * @private
         */
        _showAEBCheckResultsPopupEnhanced: function (oResult) {
            const sStatus = oResult.status || "Unknown";
            const iRiskScore = oResult.riskScore || 0;
            const sScreeningId = oResult.screeningId || "N/A";
            const sSummary = oResult.summary || "";
            const sMessage = oResult.message || "AEB screening completed";

            // Determine overall status and state based on risk score
            let sOverallStatus = "Pass";
            let sState = "Success";
            if (iRiskScore >= 80) {
                sOverallStatus = "Fail - High Risk";
                sState = "Error";
            } else if (iRiskScore >= 50) {
                sOverallStatus = "Warning - Medium Risk";
                sState = "Warning";
            } else if (iRiskScore >= 30) {
                sOverallStatus = "Pass - Low Risk";
                sState = "Warning";
            }

            const aContent = [
                new VBox({
                    items: [
                        new HBox({
                            items: [
                                new Label({ text: "Overall Status:", width: "150px" }).addStyleClass("sapUiTinyMarginEnd"),
                                new ObjectStatus({
                                    text: sOverallStatus,
                                    state: sState
                                })
                            ]
                        }).addStyleClass("sapUiSmallMarginBottom"),
                        new HBox({
                            items: [
                                new Label({ text: "Risk Score:", width: "150px" }).addStyleClass("sapUiTinyMarginEnd"),
                                new ObjectStatus({
                                    text: iRiskScore + "/100",
                                    state: sState
                                })
                            ]
                        }).addStyleClass("sapUiSmallMarginBottom"),
                        new HBox({
                            items: [
                                new Label({ text: "Risk Level:", width: "150px" }).addStyleClass("sapUiTinyMarginEnd"),
                                new Text({ text: sStatus })
                            ]
                        }).addStyleClass("sapUiSmallMarginBottom"),
                        new HBox({
                            items: [
                                new Label({ text: "Screening ID:", width: "150px" }).addStyleClass("sapUiTinyMarginEnd"),
                                new Text({ text: sScreeningId }).addStyleClass("sapUiSmallMarginBottom")
                            ]
                        }).addStyleClass("sapUiSmallMarginBottom"),
                        new HBox({
                            items: [
                                new Label({ text: "Message:", width: "150px" }).addStyleClass("sapUiTinyMarginEnd"),
                                new Text({ text: sMessage }).addStyleClass("sapUiSmallMarginBottom")
                            ]
                        }).addStyleClass("sapUiSmallMarginBottom")
                    ]
                }).addStyleClass("sapUiSmallMargin")
            ];

            // Add summary if available
            if (sSummary) {
                aContent.push(new VBox({
                    items: [
                        new Label({ text: "Summary:" }).addStyleClass("sapUiSmallMarginBottom"),
                        new Text({
                            text: sSummary,
                            width: "600px"
                        }).addStyleClass("sapUiSmallMarginBottom")
                    ]
                }).addStyleClass("sapUiSmallMargin"));
            }

            const oDialog = new Dialog({
                title: "AEB Sanctions Check Results",
                state: sState,
                contentWidth: "700px",
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
        },

        /**
         * Show enhanced duplicates dialog (Coupa-style with clickable BP numbers)
         * @param {array} aDuplicates - Array of duplicate records
         * @private
         */
        _showDuplicatesDialogEnhanced: function (aDuplicates) {
            const that = this;

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

            aDuplicates.forEach(function (dup) {
                const sBpNumber = dup.existingBpNumber || dup.sapBpNumber;
                oTable.addItem(new ColumnListItem({
                    cells: [
                        // BP Number as clickable Link - shows comprehensive details using Coupa-style dialog
                        sBpNumber && sBpNumber !== "N/A" ?
                            new sap.m.Link({
                                text: sBpNumber,
                                press: function () {
                                    that._onBPNumberPress(sBpNumber, dup);
                                }
                            }) :
                            new Text({ text: "N/A" }),
                        new Text({ text: dup.existingBpName || dup.partnerName || "N/A" }),
                        new Text({ text: dup.vatId || "N/A" }),
                        new Text({ text: dup.street || "N/A" }),
                        new Text({ text: dup.city || "N/A" }),
                        new Text({ text: dup.country || dup.country_code || "N/A" }),
                        new ObjectStatus({
                            text: (dup.matchScore || 0) + "%",
                            state: (dup.matchScore || 0) > 80 ? "Error" :
                                   (dup.matchScore || 0) > 60 ? "Warning" : "Success"
                        })
                    ]
                }));
            });

            const oDialog = new Dialog({
                title: "Potential Duplicates Found (" + aDuplicates.length + ")",
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

        /**
         * Show duplicate partner details from duplicate check data (without backend call)
         * @param {object} oDuplicate - Duplicate data object
         * @private
         */
        _showDuplicateDetailsFromData: function (oDuplicate) {
            const sBpNumber = oDuplicate.existingBpNumber || oDuplicate.sapBpNumber || "N/A";
            const sPartnerName = oDuplicate.existingBpName || oDuplicate.partnerName || "N/A";
            const sVatId = oDuplicate.vatId || "N/A";
            const sStreet = oDuplicate.street || "N/A";
            const sCity = oDuplicate.city || "N/A";
            const sCountry = oDuplicate.country || oDuplicate.country_code || "N/A";
            const iMatchScore = oDuplicate.matchScore || 0;
            const sMatchType = oDuplicate.matchType || "N/A";

            const oDialog = new Dialog({
                title: "Duplicate Partner Details: " + sBpNumber,
                contentWidth: "600px",
                content: [
                    new VBox({
                        items: [
                            new sap.ui.layout.form.SimpleForm({
                                layout: "ResponsiveGridLayout",
                                editable: false,
                                content: [
                                    new Label({ text: "BP Number" }),
                                    new Text({ text: sBpNumber }),
                                    new Label({ text: "Partner Name" }),
                                    new Text({ text: sPartnerName }),
                                    new Label({ text: "Match Score" }),
                                    new ObjectStatus({
                                        text: iMatchScore + "%",
                                        state: iMatchScore > 80 ? "Error" : iMatchScore > 60 ? "Warning" : "Success"
                                    }),
                                    new Label({ text: "Match Type" }),
                                    new Text({ text: sMatchType }),
                                    new Label({ text: "VAT ID" }),
                                    new Text({ text: sVatId }),
                                    new Label({ text: "Street" }),
                                    new Text({ text: sStreet }),
                                    new Label({ text: "City" }),
                                    new Text({ text: sCity }),
                                    new Label({ text: "Country" }),
                                    new Text({ text: sCountry })
                                ]
                            }).addStyleClass("sapUiSmallMargin")
                        ]
                    })
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
         * Show duplicate partner details dialog (same as Coupa implementation)
         * @param {string} sBpNumber - Business partner number
         * @private
         */
        _showDuplicateDetails: function (sBpNumber) {
            const oView = this.base.getView();
            const oModel = oView.getModel();

            MessageToast.show("Fetching partner details...");

            // Call the unbound function to get partner details
            const oAction = oModel.bindContext("/getSAPPartnerDetails(...)");
            oAction.setParameter("sapBpNumber", sBpNumber);

            oAction.execute()
                .then(() => {
                    const oResultContext = oAction.getBoundContext();
                    const oResponse = oResultContext.getObject();
                    const data = oResponse.value || oResponse;

                    console.log("Partner details:", data);

                    if (!data) {
                        MessageBox.error("Partner details not found");
                        return;
                    }

                    this._displayPartnerDetailsDialog(data);
                })
                .catch((oError) => {
                    console.error("Error fetching partner details:", oError);
                    MessageBox.error("Failed to fetch partner details: " + (oError.message || oError));
                });
        },

        /**
         * Display partner details in a comprehensive dialog
         * @param {object} data - Partner details data
         * @private
         */
        _displayPartnerDetailsDialog: function (data) {
            const oDialog = new Dialog({
                title: "Partner Details: " + (data.sapBpNumber || "Unknown"),
                contentWidth: "800px",
                contentHeight: "600px",
                verticalScrolling: true,
                content: [
                    new VBox({
                        items: [
                            // Basic Information
                            new Label({ text: "Basic Information" }).addStyleClass("sapUiSmallMarginTop sapUiTinyMarginBottom"),
                            new sap.ui.layout.form.SimpleForm({
                                layout: "ResponsiveGridLayout",
                                editable: false,
                                content: [
                                    new Label({ text: "BP Number" }),
                                    new Text({ text: data.sapBpNumber || "" }),
                                    new Label({ text: "Partner Name" }),
                                    new Text({ text: data.partnerName || "" }),
                                    new Label({ text: "BP Type" }),
                                    new Text({ text: data.bpType || "" }),
                                    new Label({ text: "Status" }),
                                    new Text({ text: data.status || "" })
                                ]
                            }).addStyleClass("sapUiSmallMarginBottom"),

                            // Addresses
                            new Label({ text: "Addresses" }).addStyleClass("sapUiSmallMarginTop sapUiTinyMarginBottom"),
                            this._createAddressesTable(data.addresses || []),

                            // Tax Numbers
                            new Label({ text: "Tax Numbers" }).addStyleClass("sapUiSmallMarginTop sapUiTinyMarginBottom"),
                            this._createTaxNumbersTable(data.taxNumbers || []),

                            // Bank Accounts
                            new Label({ text: "Bank Accounts" }).addStyleClass("sapUiSmallMarginTop sapUiTinyMarginBottom"),
                            this._createBankAccountsTable(data.bankAccounts || [])
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
         * Create addresses table for partner details dialog
         * @param {array} aAddresses - Array of address records
         * @returns {sap.m.Table} Table control
         * @private
         */
        _createAddressesTable: function (aAddresses) {
            const oTable = new Table({
                columns: [
                    new Column({ header: new Text({ text: "Type" }) }),
                    new Column({ header: new Text({ text: "Street" }) }),
                    new Column({ header: new Text({ text: "City" }) }),
                    new Column({ header: new Text({ text: "Postal Code" }) }),
                    new Column({ header: new Text({ text: "Country" }) })
                ]
            });

            aAddresses.forEach(function (addr) {
                oTable.addItem(new ColumnListItem({
                    cells: [
                        new Text({ text: addr.addressType || "" }),
                        new Text({ text: addr.street || "" }),
                        new Text({ text: addr.city || "" }),
                        new Text({ text: addr.postalCode || "" }),
                        new Text({ text: addr.country || "" })
                    ]
                }));
            });

            return oTable;
        },

        /**
         * Create tax numbers table for partner details dialog
         * @param {array} aTaxNumbers - Array of tax number records
         * @returns {sap.m.Table} Table control
         * @private
         */
        _createTaxNumbersTable: function (aTaxNumbers) {
            const oTable = new Table({
                columns: [
                    new Column({ header: new Text({ text: "Country" }) }),
                    new Column({ header: new Text({ text: "Tax Type" }) }),
                    new Column({ header: new Text({ text: "Tax Number" }) })
                ]
            });

            aTaxNumbers.forEach(function (tax) {
                oTable.addItem(new ColumnListItem({
                    cells: [
                        new Text({ text: tax.country || "" }),
                        new Text({ text: tax.taxType || "" }),
                        new Text({ text: tax.taxNumber || "" })
                    ]
                }));
            });

            return oTable;
        },

        /**
         * Create bank accounts table for partner details dialog
         * @param {array} aBankAccounts - Array of bank account records
         * @returns {sap.m.Table} Table control
         * @private
         */
        _createBankAccountsTable: function (aBankAccounts) {
            const oTable = new Table({
                columns: [
                    new Column({ header: new Text({ text: "Bank Name" }) }),
                    new Column({ header: new Text({ text: "Account Number" }) }),
                    new Column({ header: new Text({ text: "IBAN" }) }),
                    new Column({ header: new Text({ text: "SWIFT" }) })
                ]
            });

            aBankAccounts.forEach(function (bank) {
                oTable.addItem(new ColumnListItem({
                    cells: [
                        new Text({ text: bank.bankName || "" }),
                        new Text({ text: bank.accountNumber || "" }),
                        new Text({ text: bank.iban || "" }),
                        new Text({ text: bank.swift || "" })
                    ]
                }));
            });

            return oTable;
        },


    });
});
