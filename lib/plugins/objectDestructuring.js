(function () {
    'use strict';
    var extend = require('extend');
    var b = require('ast-types').builders;
    return module.exports = function (compiler) {
        var counter = 0;
        compiler.on('VariableDeclaration', { '$.declarations[*].id.type': 'ObjectPattern' }, function (node) {
            var replacement = extend({}, node, { declarations: [] });
            node.declarations.forEach(function (declaration) {
                if (declaration.id.type !== 'ObjectPattern') {
                    replacement.declarations.push(declaration);
                } else {
                    var temp = '$fsodtmp' + counter++;
                    replacement.declarations.push(b.variableDeclarator(b.identifier(temp), declaration.init));
                    declaration.id.properties.forEach(function (prop) {
                        return replacement.declarations.push(b.variableDeclarator(prop.value, b.memberExpression(b.identifier(temp), b.literal(prop.key.name), true)));
                    });
                }
            });
            return replacement;
        });
        compiler.on('AssignmentExpression', { '$.left.type': 'ObjectPattern' }, function (node) {
            var temp = '$fsodtmp' + counter++;
            var replacement = b.callExpression(b.functionExpression(null, [b.identifier(temp)], b.blockStatement(node.left.properties.map(function (prop) {
                    return b.expressionStatement(b.assignmentExpression('=', extend({}, prop.value), b.memberExpression(b.identifier(temp), b.literal(prop.key.name), true)));
                }).concat([b.returnStatement(b.identifier(temp))]))), [extend({}, node.right)]);
            return replacement;
        });
        return compiler.on([
            'FunctionDeclaration',
            'FunctionExpression'
        ], { '$.params[*].type': 'ObjectPattern' }, function (node) {
            var replacement = extend({}, node, { params: [] });
            var temps = {};
            node.params.forEach(function (param) {
                if (param.type !== 'ObjectPattern') {
                    replacement.params.push(param);
                } else {
                    var temp = '$fsodtmp' + counter++;
                    replacement.params.push(b.identifier(temp));
                    temps[temp] = param;
                }
            });
            Object.keys(temps).reverse().forEach(function (temp) {
                var param = temps[temp];
                return replacement.body.body.unshift(b.variableDeclaration('var', param.properties.map(function (prop, index) {
                    return b.variableDeclarator(prop.value, b.memberExpression(b.identifier(temp), b.literal(prop.key.name), true));
                })));
            });
            return replacement;
        });
    };
}.call(this));