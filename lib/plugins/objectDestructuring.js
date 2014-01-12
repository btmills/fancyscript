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
        return compiler.on([
            'FunctionDeclaration',
            'FunctionExpression'
        ], function (node) {
            return node.params.some(function (param) {
                return param.type === 'ObjectPattern';
            });
        }, function (node) {
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