(function () {
    'use strict';
    var extend = require('extend');
    var b = require('ast-types').builders;
    return module.exports = function (compiler) {
        return compiler.on('ObjectExpression', { '$.properties[*].shorthand': true }, function (node) {
            var replacement = extend({}, node);
            replacement.properties.forEach(function (prop) {
                return prop.shorthand = false;
            });
            return replacement;
        });
    };
}.call(this));