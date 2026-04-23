"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var defaultConfig = {
    printWidth: 100,
    singleQuote: true,
    singleAttributePerLine: true,
    semi: false,
    trailingComma: 'es5',
    tabWidth: 4,
    jsxSingleQuote: false,
    overrides: [
        {
            files: '*.md',
            options: {
                tabWidth: 2,
            },
        },
        {
            files: '*.yml',
            options: {
                tabWidth: 2,
            },
        },
    ],
};
/**
 * Define the prettier config, given the plugins to use
 *
 * @param plugins A list of plugins to use. If you provide a plugin here, you need to have it
 *   installed in your project (through your package.json file)
 */
function defineConfig() {
    var plugins = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        plugins[_i] = arguments[_i];
    }
    var config = __assign({}, defaultConfig);
    if (plugins) {
        config.plugins = plugins;
    }
    return config;
}
exports.default = defineConfig;
