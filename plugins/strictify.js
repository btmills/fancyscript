(function () {

'use strict';

var b = require('ast-types').builders;
var extend = require('extend');

module.exports = function (compiler) {

	compiler.on('Program', function (node) {
		var running = compiler.options.bare === false &&
			!(node.body.length === 1 &&
				node.body[0].type === 'ExpressionStatement' &&
				node.body[0].expression.type === 'CallExpression');
		return running;
	}, function (node) {
		var replacement = b.program([
			b.expressionStatement(
				b.callExpression(
					b.memberExpression(
						b.functionExpression(
							null, // id
							[], // params
							b.blockStatement( // body
								[ b.expressionStatement(
									b.literal("use strict")
								) ].concat(node.body)
							)
						),
						b.identifier('call'),
						false
					),
					[ b.identifier('this') ]
				)
			)
		]);
		return replacement;
	});

};

}).call(this);
