var extend = require('extend');
var b = require('ast-types').builders;

module.exports = function (compiler) {

	// callee(a, ...b, c)
	// => callee.apply(callee, Array.prototype.concat([a], b, [c]))
	// callee.call(scope, a, ...b, c)
	// => callee.apply(scope, Array.prototype.concat([a], b, [c]))
	// callee.apply not supported
	// new Thing(a, ...b, c)
	// => new (Function.prototype.bind.apply(Thing, [null].concat([a], b, [c])))

	compiler.on('CallExpression', {
		'$.arguments[*].type': 'SpreadElement'
	}, function (node) {
		var args = [];
		node['arguments'].forEach(function (arg) {
			if (arg.type === 'SpreadElement') {
				args.push(arg.argument);
			} else {
				args.push(b.arrayExpression([ arg ]));
			}
		});

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
	});

	compiler.on('NewExpression', {
		'$.arguments[*].type': 'SpreadElement'
	}, function (node) {
		var args = [];
		node['arguments'].forEach(function (arg) {
			if (arg.type === 'SpreadElement') {
				args.push(arg.argument);
			} else {
				args.push(b.arrayExpression([ arg ]));
			}
		});

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
	});

};
