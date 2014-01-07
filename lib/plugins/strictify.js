(function () {
    'use strict';
    var b = require('ast-types').builders;
    var extend = require('extend');
    return module.exports = function (compiler) {
        return compiler.on('Program', function (node) {
            return compiler.options.bare === false && !(node.body.length === 1 && node.body[0].type === 'ExpressionStatement' && node.body[0].expression.type === 'CallExpression');
        }, function (node) {
            return b.program([b.expressionStatement(b.callExpression(b.memberExpression(b.functionExpression(null, [], b.blockStatement([b.expressionStatement(b.literal('use strict'))].concat(node.body))), b.identifier('call'), false), [b.identifier('this')]))]);
        });
    };
}.call(this));