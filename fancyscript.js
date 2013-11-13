(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['acorn', 'astgen', 'escodegen', 'estraverse'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory.call({}, require('acorn'), require('astgen'), require('escodegen'), require('estraverse'));
	} else {
		root.jspp = factory.call({}, root.acorn, root.astgen, root.escodegen, root.estraverse);
	}
})(this, function (acorn, ast, escodegen, estraverse) {

	'use strict';

	function compileRestParameter (node) {
		if (node.rest === null) return node;

		var rest = node.rest.name;
		node.rest = null;
		var length = node.params.length;
		node.body.body.unshift(ast.variableDeclaration(
			'var',
			[ ast.variableDeclarator(
				ast.identifier(rest),
				ast.callExpression(
					ast.memberExpression(
						ast.memberExpression(
							ast.memberExpression(
								ast.identifier('Array'),
								ast.identifier('prototype'),
								false
							),
							ast.identifier('slice'),
							false
						),
						ast.identifier('call'),
						false
					),
					[
						ast.identifier('arguments'),
						ast.literal(length)
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

		body[body.length - 1] = ast.returnStatement(
			ast.validate(body[body.length - 1].expression)
		);

		return node;
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
			return arg.type === 'SpreadExpression';
		})) {
			return node;
		}

		var args = [];
		node.arguments.forEach(function (arg) {
			if (arg.type === 'SpreadExpression') {
				args.push(ast.validate(arg.argument));
			} else {
				args.push(ast.arrayExpression([
					ast.validate(arg)
				]));
			}
		});

		if (node.type === 'CallExpression') {
			return ast.callExpression(
				ast.memberExpression(
					ast.validate(node.callee),
					ast.identifier('apply'),
					false
				),
				[
					ast.validate(node.callee),
					ast.callExpression(
						ast.memberExpression(
							ast.arrayExpression([]),
							ast.identifier('concat'),
							false
						),
						args
					)
				]
			);
		} else if (node.type === 'NewExpression') {
			return ast.newExpression(
				ast.callExpression(
					ast.memberExpression(
						ast.memberExpression(
							ast.memberExpression(
								ast.identifier('Function'),
								ast.identifier('prototype'),
								false
							),
							ast.identifier('bind'),
							false
						),
						ast.identifier('apply'),
						false
					),
					[
						ast.validate(node.callee),
						ast.callExpression(
							ast.memberExpression(
								ast.arrayExpression([
									ast.literal(null)
								]),
								ast.identifier('concat'),
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

	var compile = function (src) {
		var tree = acorn.parse(src);
		tree = estraverse.replace(tree, {
			enter: function (node) {
				var res = node;

				switch (node.type) {
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
