(function () {
    'use strict';
    var extend = require('extend');
    var b = require('ast-types').builders;
    return module.exports = function (compiler) {
        return compiler.on([
            'FunctionDeclaration',
            'FunctionExpression'
        ], { '$.body.body[-1:].type': 'ExpressionStatement' }, function (node) {
            var replacement = extend({}, node);
            var body = replacement.body.body;
            body[body.length - 1] = b.returnStatement(body[body.length - 1].expression);
            return replacement;
        });
    };
}.call(this));