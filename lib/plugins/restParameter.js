(function () {

'use strict';

var extend = require('extend');
var b = require('ast-types').builders;

module.exports = function (compiler) {

	// TOOD: What about ArrowFunctionExpression?
	compiler.on(['FunctionDeclaration', 'FunctionExpression'], function (node) {
		return node.rest && node.rest.type === 'Identifier';
	}, function (node) {
		var replacement = extend({}, node, { rest: null });
		replacement.body.body.unshift(b.variableDeclaration(
			'var',
			[ b.variableDeclarator(
				b.identifier(node.rest.name),
				b.callExpression(
					b.memberExpression(
						b.memberExpression(
							b.memberExpression(
								b.identifier('Array'),
								b.identifier('prototype'),
								false
							),
							b.identifier('slice'),
							false
						),
						b.identifier('call'),
						false
					),
					[
						b.identifier('arguments'),
						b.literal(node.params.length)
					]
				)
			) ]
		));
		return replacement;
	});

};

}).call(this);
