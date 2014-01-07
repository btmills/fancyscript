(function () {
    'use strict';
    var extend = require('extend');
    var b = require('ast-types').builders;
    return module.exports = function (compiler) {
        compiler.on('CallExpression', { '$.arguments[*].type': 'SpreadElement' }, function (node) {
            var args = [];
            node['arguments'].forEach(function (arg) {
                if (arg.type === 'SpreadElement') {
                    args.push(arg.argument);
                } else {
                    args.push(b.arrayExpression([arg]));
                }
            });
            return b.callExpression(b.memberExpression(node.callee, b.identifier('apply'), false), [
                node.callee,
                b.callExpression(b.memberExpression(b.arrayExpression([]), b.identifier('concat'), false), args)
            ]);
        });
        return compiler.on('NewExpression', { '$.arguments[*].type': 'SpreadElement' }, function (node) {
            var args = [];
            node['arguments'].forEach(function (arg) {
                if (arg.type === 'SpreadElement') {
                    args.push(arg.argument);
                } else {
                    args.push(b.arrayExpression([arg]));
                }
            });
            return b.newExpression(b.callExpression(b.memberExpression(b.memberExpression(b.memberExpression(b.identifier('Function'), b.identifier('prototype'), false), b.identifier('bind'), false), b.identifier('apply'), false), [
                node.callee,
                b.callExpression(b.memberExpression(b.arrayExpression([b.literal(null)]), b.identifier('concat'), false), args)
            ]), []);
        });
    };
}.call(this));