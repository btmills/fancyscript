(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['acorn', 'escodegen'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory(require('acorn'), require('escodegen'), require('estraverse'));
	} else {
		root.jspp = factory(root.acorn, root.escodegen, root.estraverse);
	}
})(this, function (acorn, escodegen, estraverse) {

	'use strict';

	function compileRestParameter (node) {
		var rest = node.rest;
		node.rest = null;
		var length = node.params.length;
		node.body.body.unshift({
			type: 'VariableDeclaration',
			kind: 'var',
			declarations: [
				{
					type: 'VariableDeclarator',
					id: rest,
					init: {
						type: 'CallExpression',
						callee: {
							type: 'MemberExpression',
							computed: false,
							object: {
								type: 'MemberExpression',
								computed: false,
								object: {
									type: 'MemberExpression',
									computed: false,
									object: {
										type: 'Identifier',
										name: 'Array'
									},
									property: {
										type: 'Identifier',
										name: 'prototype'
									}
								},
								property: {
									type: 'Identifier',
									name: 'slice'
								}
							},
							property: {
								type: 'Identifier',
								name: 'call'
							}
						},
						arguments: [
							{
								type: 'Identifier',
								name: 'arguments'
							},
							{
								type: 'Literal',
								value: length,
								raw: String(length)
							}
						]
					}
				}
			]
		});
		return node;
	}

	var compile = function (src) {
		var ast = acorn.parse(src);
		ast = estraverse.replace(ast, {
			enter: function (node) {
				if ((node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration') && node.rest !== null) {
					return compileRestParameter(node);
				}
			}
		});
		return escodegen.generate(ast);
	};

	return {
		compile: compile
	};

});
