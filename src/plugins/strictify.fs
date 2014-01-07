var b = require('ast-types').builders;
var extend = require('extend');

module.exports = function (compiler) {

	compiler.on('Program', (node) => (compiler.options.bare === false &&
		!(node.body.length === 1 &&
			node.body[0].type === 'ExpressionStatement' &&
			node.body[0].expression.type === 'CallExpression'
		)
	), (node) => b.program([
		b.expressionStatement(
			b.callExpression(
				b.memberExpression(
					b.functionExpression(
						null,
						[],
						b.blockStatement(
							[
								b.expressionStatement(
									b.literal('use strict')
								)/*,
								...node.body*/
							].concat(node.body)
						)
					),
					b.identifier('call'),
					false
				),
				[ b.identifier('this') ]
			)
		)
	]));

};
