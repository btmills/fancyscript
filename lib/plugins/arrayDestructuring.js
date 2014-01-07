(function () {
    'use strict';
    var extend = require('extend');
    var escope = require('escope');
    var b = require('ast-types').builders;
    var jsonpath = require('JSONPath').eval;
    return module.exports = function (compiler) {
        var counter = 0;
        compiler.on('VariableDeclaration', { '$.declarations[*].id.type': 'ArrayPattern' }, function (node) {
            var replacement = extend({}, node, { declarations: [] });
            node.declarations.forEach(function (declaration) {
                if (declaration.id.type !== 'ArrayPattern') {
                    replacement.declarations.push(declaration);
                } else {
                    var temp = '$fsadtmp' + counter++;
                    replacement.declarations.push(b.variableDeclarator(b.identifier(temp), declaration.init));
                    declaration.id.elements.forEach(function (id, index) {
                        if (id === null)
                            return false;
                        return replacement.declarations.push(b.variableDeclarator(id, b.memberExpression(b.identifier(temp), b.literal(index), true)));
                    });
                }
            });
            return replacement;
        });
        compiler.on('AssignmentExpression', { '$.left.type': 'ArrayPattern' }, function (node) {
            var temp = '$fsadtmp' + counter++;
            var replacement = b.callExpression(b.functionExpression(null, [b.identifier(temp)], b.blockStatement(node.left.elements.map(function (id, index) {
                    if (id === null)
                        return null;
                    return b.expressionStatement(b.assignmentExpression('=', extend({}, id), b.memberExpression(b.identifier(temp), b.literal(index), true)));
                }).filter(function (stmt) {
                    return stmt !== null;
                }).concat([b.returnStatement(b.arrayExpression(node.left.elements))]))), [extend({}, node.right)]);
            return replacement;
        });
        return compiler.on([
            'FunctionDeclaration',
            'FunctionExpression'
        ], { '$.params[*].type': 'ArrayPattern' }, function (node) {
            var replacement = extend({}, node, { params: [] });
            var temps = {};
            node.params.forEach(function (param) {
                if (param.type !== 'ArrayPattern') {
                    replacement.params.push(param);
                } else {
                    var temp = '$fsadtmp' + counter++;
                    replacement.params.push(b.identifier(temp));
                    temps[temp] = param;
                }
            });
            Object.keys(temps).reverse().forEach(function (temp) {
                var param = temps[temp];
                return replacement.body.body.unshift(b.variableDeclaration('var', param.elements.map(function (id, index) {
                    if (id === null)
                        return null;
                    return b.variableDeclarator(id, b.memberExpression(b.identifier(temp), b.literal(index), true));
                }).filter(function (node) {
                    return node !== null;
                })));
            });
            return replacement;
        });
    };
}.call(this));