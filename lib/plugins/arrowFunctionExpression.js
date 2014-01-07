(function () {
    'use strict';
    var extend = require('extend');
    var b = require('ast-types').builders;
    return module.exports = function (compiler) {
        return compiler.on('ArrowFunctionExpression', function (node) {
            return extend({}, node, {
                type: 'FunctionExpression',
                body: node.expression ? b.blockStatement([b.returnStatement(node.body)]) : node.body,
                expression: false
            });
        });
    };
}.call(this));