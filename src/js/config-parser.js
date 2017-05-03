'use strict';

/**
 * Creates an instance of ConfigurationParser class.
 *
 * @constructor
 * @param {object=} config - The configuration object to be parsed.
 */
function ConfigParser(config) {
    this._config = {};
    this._modules = {};
    this._conditionalModules = {};

    this._parseConfig(config);
}

ConfigParser.prototype = {
    constructor: ConfigParser,

    /**
     * Adds a module to the configuration.
     *
     * @param {object} module The module which should be added to the configuration. Should have the following
     *     properties:
     *     <ul>
     *         <strong>Obligatory properties</strong>:
     *         <li>name (String) The name of the module</li>
     *         <li>dependencies (Array) The modules from which it depends</li>
     *     </ul>
     *
     *     <strong>Optional properties:</strong>
     *     The same as those which config parameter of {@link Loader#define} method accepts.
     * @return {Object} The added module
     */
    addModule: function(module) {
        // Module might be added via configuration or when it arrives from the server.
        // If it arrives from the server, it will have already a definition. In this case,
        // we will overwrite the existing properties with those, provided from the module definition.
        // Otherwise, we will just add it to the map.
        var moduleDefinition = this._modules[module.name];

        if (moduleDefinition) {
            for (var key in module) {
                if (Object.prototype.hasOwnProperty.call(module, key)) {
                    moduleDefinition[key] = module[key];
                }
            }
        } else {
            this._modules[module.name] = module;
        }

        this._registerConditionalModule(module);

        return this._modules[module.name];
    },

    /**
     * Returns the current configuration.
     *
     * @return {object} The current configuration.
     */
    getConfig: function() {
        return this._config;
    },

    /**
     * Returns map with all currently registered conditional modules and their triggers.
     *
     * @return {object} Map with all currently registered conditional modules.
     */
    getConditionalModules: function() {
        return this._conditionalModules;
    },

    /**
     * Returns map with all currently registered modules.
     *
     * @return {object} Map with all currently registered modules.
     */
    getModules: function() {
        return this._modules;
    },

    /**
     * Maps module names to their aliases. Example:
     * __CONFIG__.maps = {
     *      liferay: 'liferay@1.0.0'
     * }
     *
     * When someone does require('liferay/html/js/ac.es',...),
     * if the module 'liferay/html/js/ac.es' is not defined,
     * then a corresponding alias will be searched. If found, the name will be replaced,
     * so it will look like user did require('liferay@1.0.0/html/js/ac.es',...).
     *
     * Additionally, modules can define a custom map to alias module names just in the context
     * of that module loading operation. When present, the contextual module mapping will take
     * precedence over the general one.
     *
     * @protected
     * @param {array|string} module The module which have to be mapped or array of modules.
     * @param {?object} contextMap Contextual module mapping information relevant to the current load operation
     * @return {array|string} The mapped module or array of mapped modules.
     */
    mapModule: function(module, contextMap) {
        if (!this._config.maps && !contextMap) {
            return module;
        }

        var maps = {};

        if (this._config.maps) {
            this._mix(maps, this._config.maps);
        }

        if (contextMap) {
            this._mix(maps, contextMap);
        }

        var modules;

        if (Array.isArray(module)) {
            modules = module;
        } else {
            modules = [module];
        }

        for (var i = 0; i < modules.length; i++) {
            var tmpModule = modules[i];

            var found = false;

            for (var alias in maps) {
                /* istanbul ignore else */
                if (Object.prototype.hasOwnProperty.call(maps, alias)) {
                    var aliasValue = maps[alias];

                    if (aliasValue.value && aliasValue.exactMatch) {
                        if (modules[i] === alias) {
                            modules[i] = aliasValue.value;

                            found = true;
                            break;
                        }
                    } else {
                        if (aliasValue.value) {
                            aliasValue = aliasValue.value;
                        }

                        if (tmpModule === alias || tmpModule.indexOf(alias + '/') === 0) {
                            tmpModule = aliasValue + tmpModule.substring(alias.length);
                            modules[i] = tmpModule;

                            found = true;
                            break;
                        }
                    }
                }
            }

            /* istanbul ignore else */
            if(!found && typeof maps['*'] === 'function') {
                modules[i] = maps['*'](tmpModule);
            }
        }

        return Array.isArray(module) ? modules : modules[0];
    },

    /**
     * Adds all properties from the supplier to the receiver.
     * The function will add all properties, not only these owned by the supplier.
     *
     * @private
     * @method _mix
     * @param {Object} receiver The object which will receive properties.
     * @param {Object} supplier The object which provides properties.
     */
    _mix: function(receiver, supplier) {
        var hasOwnProperty = Object.prototype.hasOwnProperty;

        for (var key in supplier) {
            if (hasOwnProperty.call(supplier, key)) {
                receiver[key] = supplier[key];
            }
        }
    },

    /**
     * Parses configuration object.
     *
     * @protected
     * @param {object} config Configuration object to be parsed.
     * @return {object} The created configuration
     */
    _parseConfig: function(config) {
        for (var key in config) { /* istanbul ignore else */
            if (Object.prototype.hasOwnProperty.call(config, key)) {
                if (key === 'modules') {
                    this._parseModules(config[key]);
                } else {
                    this._config[key] = config[key];
                }
            }
        }

        return this._config;
    },

    /**
     * Parses a provided modules configuration.
     *
     * @protected
     * @param {object} modules Map of modules to be parsed.
     * @return {object} Map of parsed modules.
     */
    _parseModules: function(modules) {
        for (var key in modules) { /* istanbul ignore else */
            if (Object.prototype.hasOwnProperty.call(modules, key)) {
                var module = modules[key];

                module.name = key;

                this.addModule(module);
            }
        }

        return this._modules;
    },

    /**
     * Registers conditional module to the configuration.
     *
     * @protected
     * @param {object} module Module object
     */
    _registerConditionalModule: function(module) {
        // Create HashMap of all modules, which have conditional modules, as an Array.
        if (module.condition) {
            var existingModules = this._conditionalModules[module.condition.trigger];

            if (!existingModules) {
                this._conditionalModules[module.condition.trigger] = existingModules = [];
            }

            existingModules.push(module.name);
        }
    }
};