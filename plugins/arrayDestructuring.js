(function () {

'use strict';

var extend = require('extend');
var escope = require('escope');
var b = require('ast-types').builders;
var jsonpath = require('JSONPath').eval;

module.exports = function (compiler) {

	var run = false;
	var counter = 0;

	// var [a, b] = foo();
	compiler.on('VariableDeclaration', {
		'$.declarations[*].id.type': 'ArrayPattern'
	}, function (node) {
		var replacement = extend({}, node, { declarations: [] });
		node.declarations.forEach(function (declaration) {
			if (declaration.id.type !== 'ArrayPattern') {
				replacement.declarations.push(declaration);
			} else {
				var temp = '$fsadtmp' + counter++;
				replacement.declarations.push(b.variableDeclarator(
					b.identifier(temp),
					declaration.init
				));
				declaration.id.elements.forEach(function (id, index) {
					if (id === null) return false;
					replacement.declarations.push(b.variableDeclarator(
						id,
						b.memberExpression(
							b.identifier(temp),
							b.literal(index),
							true
						)
					));
				});
			}
		});
		return replacement;
	});

	// [a, b] = [b, a];

	// try {...} catch ([a, b]) {...}

	// function ([a, b], c) {...}
	compiler.on(['FunctionDeclaration', 'FunctionExpression'], {
		'$.params[*].type': 'ArrayPattern'
	}, function (node) {
		var replacement = extend({}, node, { params: [] });
		var temps = {};
		node.params.forEach(function (param) {
			if (param.type !== 'ArrayPattern') {
				replacement.params.push(param);
			} else {
				var temp = '$fsadtmp' + counter++;
				replacement.params.push(b.identifier(temp));
				temps[temp] = param;
			}
		});
		Object.keys(temps).forEach(function (temp) {
			var param = temps[temp];
			replacement.body.body.unshift(b.variableDeclaration(
				'var',
				param.elements.map(function (id, index) {
					if (id === null) return null;
					return b.variableDeclarator(
						id,
						b.memberExpression(
							b.identifier(temp),
							b.literal(index),
							true
						)
					);
				}).filter(function (node) { return node !== null; })
			));
		});
		return replacement;
	});

};

}).call(this);




/*
[a, b] = [b, a];
{ type: 'ExpressionStatement',
	expression:
		{ type: 'AssignmentExpression',
			operator: '=',
			left:
			 { type: 'ArrayPattern',
				 elements:
					[ { type: 'Identifier', name: 'a' },
						{ type: 'Identifier', name: 'b' } ] },
			right:
			 { type: 'ArrayExpression',
				 elements:
					[ { type: 'Identifier', name: 'b' },
						{ type: 'Identifier', name: 'a' } ] } } } ] }
*/
