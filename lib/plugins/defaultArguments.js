(function () {
    'use strict';
    var extend = require('extend');
    var b = require('ast-types').builders;
    return module.exports = function (compiler) {
        return compiler.on([
            'FunctionDeclaration',
            'FunctionExpression'
        ], function (node) {
            return node.defaults.length > 0;
        }, function (node) {
            return extend({}, node, {
                defaults: [],
                body: b.blockStatement(node.params.map(function (param, index) {
                    if (node.defaults[index] == null)
                        return false;
                    return b.ifStatement(b.binaryExpression('===', b.unaryExpression('typeof', extend({}, param)), b.literal('undefined')), b.blockStatement([b.expressionStatement(b.assignmentExpression('=', extend({}, param), extend({}, node.defaults[index])))]));
                }).filter(function (node) {
                    return node !== false;
                }).concat(node.body.body))
            });
        });
    };
}.call(this));