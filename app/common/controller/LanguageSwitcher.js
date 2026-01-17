sap.ui.define([
    "sap/ui/base/Object",
    "sap/ui/core/Locale",
    "sap/ui/core/library",
    "sap/m/MessageToast"
], function(BaseObject, Locale, coreLibrary, MessageToast) {
    "use strict";

    /**
     * Language Switcher Controller Mixin
     * Provides language switching functionality for Fiori applications
     *
     * Usage:
     * 1. Include this file in your controller
     * 2. Call LanguageSwitcher.init(this) in onInit()
     * 3. Add LanguageSwitcher fragment to your view
     */
    return {
        /**
         * Initialize language switcher
         * @param {sap.ui.core.mvc.Controller} oController - The controller instance
         */
        init: function(oController) {
            this._oController = oController;
            this._oView = oController.getView();

            // Create app model if it doesn't exist
            var oAppModel = this._oView.getModel("app");
            if (!oAppModel) {
                oAppModel = new sap.ui.model.json.JSONModel({
                    currentLanguage: this._getCurrentLanguage()
                });
                this._oView.setModel(oAppModel, "app");
            } else {
                oAppModel.setProperty("/currentLanguage", this._getCurrentLanguage());
            }

            // Check for URL parameter on init
            this._checkUrlParameter();
        },

        /**
         * Get current language from various sources
         * Priority: URL param > localStorage > browser setting
         * @returns {string} Language code (en or de)
         * @private
         */
        _getCurrentLanguage: function() {
            // 1. Check URL parameter
            var oUriParams = new URLSearchParams(window.location.search);
            var sUrlLang = oUriParams.get('sap-language');
            if (sUrlLang) {
                var sNormalized = this._normalizeLanguage(sUrlLang);
                if (sNormalized) {
                    this._saveLanguagePreference(sNormalized);
                    return sNormalized;
                }
            }

            // 2. Check localStorage
            try {
                var sStoredLang = localStorage.getItem('userLanguage');
                if (sStoredLang && (sStoredLang === 'en' || sStoredLang === 'de')) {
                    return sStoredLang;
                }
            } catch (e) {
                // localStorage not available
            }

            // 3. Check browser/UI5 configuration
            var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
            return this._normalizeLanguage(sCurrentLocale) || 'en';
        },

        /**
         * Normalize language code to supported language (en or de)
         * @param {string} sLanguage - Language code (e.g., "en-US", "de-DE", "fr")
         * @returns {string|null} Normalized language code or null if not supported
         * @private
         */
        _normalizeLanguage: function(sLanguage) {
            if (!sLanguage) return null;

            var sLang = sLanguage.toLowerCase().substring(0, 2);

            // Only support 'de', everything else defaults to 'en'
            if (sLang === 'de') {
                return 'de';
            } else if (sLang === 'en' || sLang === 'fr' || sLang === 'es' || sLang === 'it') {
                // Supported languages that fallback to English
                return 'en';
            }

            // Default fallback
            return 'en';
        },

        /**
         * Check URL parameter and apply language if present
         * @private
         */
        _checkUrlParameter: function() {
            var oUriParams = new URLSearchParams(window.location.search);
            var sUrlLang = oUriParams.get('sap-language');

            if (sUrlLang) {
                var sNormalized = this._normalizeLanguage(sUrlLang);
                if (sNormalized) {
                    this._applyLanguage(sNormalized, false); // false = don't reload
                }
            }
        },

        /**
         * Save language preference to localStorage
         * @param {string} sLanguage - Language code
         * @private
         */
        _saveLanguagePreference: function(sLanguage) {
            try {
                localStorage.setItem('userLanguage', sLanguage);
            } catch (e) {
                // localStorage not available
                console.warn('Could not save language preference:', e);
            }
        },

        /**
         * Apply language change
         * @param {string} sLanguage - Language code (en or de)
         * @param {boolean} bReload - Whether to reload the page
         * @private
         */
        _applyLanguage: function(sLanguage, bReload) {
            // Update app model
            var oAppModel = this._oView.getModel("app");
            if (oAppModel) {
                oAppModel.setProperty("/currentLanguage", sLanguage);
            }

            // Save preference
            this._saveLanguagePreference(sLanguage);

            // Update URL parameter without reload
            var oUriParams = new URLSearchParams(window.location.search);
            oUriParams.set('sap-language', sLanguage.toUpperCase());

            var sNewUrl = window.location.pathname + '?' + oUriParams.toString();

            if (bReload) {
                // Reload page with new language
                window.location.href = sNewUrl;
            } else {
                // Update URL without reload (for initial load)
                window.history.replaceState(null, '', sNewUrl);
            }
        },

        /**
         * Language change event handler
         * @param {sap.ui.base.Event} oEvent - Change event
         */
        onLanguageChange: function(oEvent) {
            var sNewLanguage = oEvent.getParameter("selectedItem").getKey();
            var oResourceBundle = this._oView.getModel("i18n").getResourceBundle();

            // Show loading message
            var sMessage = sNewLanguage === 'de'
                ? 'Sprache wird auf Deutsch umgestellt...'
                : 'Switching language to English...';
            MessageToast.show(sMessage);

            // Apply language with reload
            setTimeout(function() {
                this._applyLanguage(sNewLanguage, true);
            }.bind(this), 500);
        },

        /**
         * Get current language
         * @returns {string} Current language code
         */
        getCurrentLanguage: function() {
            return this._getCurrentLanguage();
        }
    };
});
