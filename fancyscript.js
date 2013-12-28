(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['ast-types', 'escodegen', 'esprima', 'estraverse', 'extend'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory.call({}, require('ast-types'), require('escodegen'), require('esprima'), require('estraverse'), require('extend'));
	} else {
		root.fancyscript = factory.call({}, root.types, root.escodegen, root.esprima, root.estraverse, root.extend);
	}
})(this, function (types, escodegen, esprima, estraverse, extend) {

	var b = types.builders;

	'use strict';

	function compileRestParameter (node) {
		if (node.rest === null) return node;

		var rest = node.rest.name;
		node.rest = null;
		var length = node.params.length;
		node.body.body.unshift(b.variableDeclaration(
			'var',
			[ b.variableDeclarator(
				b.identifier(rest),
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
						b.literal(length)
					]
				)
			) ]
		));
		return node;
	}

	function compileAutomaticReturn (node) {
		var body = node.body.body; // Function.body/BlockStatement.body

		if (!body.length ||
			body[body.length - 1].type !== 'ExpressionStatement')
			return node;

		body[body.length - 1] = b.returnStatement(
			body[body.length - 1].expression
		);

		return node;
	}

	function compileArrowFunctionExpression (node) {
		return extend({}, node, {
			type: 'FunctionExpression',
			body: node.expression ?
			      b.blockStatement([ b.returnStatement(node.body) ]) :
			      node.body,
			expression: false
		});
	}

	function compileSpreadExpressionArgument (node) {
		/*
		 * callee(a, ...b, c)
		 * => callee.apply(callee, Array.prototype.concat([a], b, [c]))
		 * callee.call(scope, a, ...b, c)
		 * => callee.apply(scope, Array.prototype.concat([a], b, [c]))
		 * callee.apply not supported
		 * new Thing(a, ...b, c)
		 * => new (Function.prototype.bind.apply(Thing, [null].concat([a], b, [c])))
		 */
		if (!node.arguments.some(function (arg) {
			return arg.type === 'SpreadElement';
		})) {
			return node;
		}

		var args = [];
		node.arguments.forEach(function (arg) {
			if (arg.type === 'SpreadElement') {
				args.push(arg.argument);
			} else {
				args.push(b.arrayExpression([
					arg
				]));
			}
		});

		if (node.type === 'CallExpression') {
			return b.callExpression(
				b.memberExpression(
					node.callee,
					b.identifier('apply'),
					false
				),
				[
					node.callee,
					b.callExpression(
						b.memberExpression(
							b.arrayExpression([]),
							b.identifier('concat'),
							false
						),
						args
					)
				]
			);
		} else if (node.type === 'NewExpression') {
			return b.newExpression(
				b.callExpression(
					b.memberExpression(
						b.memberExpression(
							b.memberExpression(
								b.identifier('Function'),
								b.identifier('prototype'),
								false
							),
							b.identifier('bind'),
							false
						),
						b.identifier('apply'),
						false
					),
					[
						node.callee,
						b.callExpression(
							b.memberExpression(
								b.arrayExpression([
									b.literal(null)
								]),
								b.identifier('concat'),
								false
							),
							args
						)
					]
				),
				[]
			);
		}
	}

	var compile = function (src, options) {
		var tree = esprima.parse(src);
		tree = estraverse.replace(tree, {
			enter: function (node) {
				var res = node;

				switch (node.type) {
					case 'ArrowFunctionExpression':
						res = compileArrowFunctionExpression(res);
						// Fall through
					case 'FunctionExpression': // Fall through
					case 'FunctionDeclaration':
						res = compileRestParameter(res);
						res = compileAutomaticReturn(res);
						break;
					case 'CallExpression': // Fall through
					case 'NewExpression':
						res = compileSpreadExpressionArgument(res);
						break;
				}

				return res;
			}
		});
		return escodegen.generate(tree);
	};

	return {
		compile: compile
	};

});
