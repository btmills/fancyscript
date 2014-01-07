var extend = require('extend');
var b = require('ast-types').builders;

module.exports = function (compiler) {

	compiler.on(['FunctionDeclaration', 'FunctionExpression'], (node =>
		node.defaults.length > 0
	), node => extend({}, node, {
		defaults: [],
		body: b.blockStatement(
			node.params.map(function (param, index) {
				if (node.defaults[index] == null) return false; // null or undefined

				return b.ifStatement(
					b.binaryExpression(
						'===',
						b.unaryExpression(
							'typeof',
							extend({}, param)
						),
						b.literal('undefined')
					),
					b.blockStatement([
						b.expressionStatement(
							b.assignmentExpression(
								'=',
								extend({}, param),
								extend({}, node.defaults[index])
							)
						)
					])
				);
			}).filter(node =>
				node !== false
			).concat(node.body.body)
		)
	}));

};
