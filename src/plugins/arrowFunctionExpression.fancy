var extend = require('extend');
var b = require('ast-types').builders;

module.exports = function (compiler) {

	compiler.on('ArrowFunctionExpression', node =>
		extend({}, node, {
			type: 'FunctionExpression',
			body: node.expression ?
			      b.blockStatement([ b.returnStatement(node.body) ]) :
			      node.body,
			expression: false
		})
	);

};
