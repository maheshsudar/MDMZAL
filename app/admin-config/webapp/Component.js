sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device"
], function (UIComponent, Device) {
    "use strict";

    return UIComponent.extend("com.company.adminconfig.Component", {
        metadata: {
            manifest: "json"
        },

        /**
         * Initialize the application component
         */
        init: function() {
            // Call parent init
            UIComponent.prototype.init.apply(this, arguments);

            // Create device model
            const oDeviceModel = new sap.ui.model.json.JSONModel(Device);
            oDeviceModel.setDefaultBindingMode("OneWay");
            this.setModel(oDeviceModel, "device");
        }
    });
});
