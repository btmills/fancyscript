var esprima = require('esprima');
var jsdiff = require('json-diff');
var fancyscript = require('../fancyscript');

var passed = 0;
var failed = 0;

function test(message, fs, js, options) {
	options = options || {
		bare: true
	};
	try {
		var compiled = fancyscript.compile(fs, options);
		var expected = esprima.parse(js);

		var diff = jsdiff.diffString(expected, esprima.parse(compiled));
		if (!diff || diff === ' undefined\n') {
			passed += 1;
		} else {
			console.log(compiled);
			failed += 1;
			console.log(message);
			console.log(diff);
		}
	} catch (ex) {
		console.log(message, ex.message);
		failed += 1;
	}
}

test('strict',
	'var foo = 42;',
	'(function () {' +
		"'use strict';" +
		'var foo = 42;' +
	'}).call(this);',
	{ bare: false }
);

test('fn keyword',
	'fn hello() {}',
	'function hello() {}'
);

test('automatic return',
	'function bar() { 42 }',
	'function bar() { return 42; }'
);

test('arrow function expression',
	'var foo = (x) => 2 * x',
	'var foo = function (x) { return 2 * x; }'
);

test('rest parameter',
	'function foo(x, ...r) { return r.length; }',
	'function foo(x) {' +
		'var r = Array.prototype.slice.call(arguments, 1);' +
		'return r.length;' +
	'}'
);

test('spread argument',
	'foo(a, b, ...bar);',
	'foo.apply(foo, [].concat([a], [b], bar));'
);

test('array destructuring variable declarations',
	'var [a, , b] = [1, 2, 3], c = 4, [d, e] = foo(); var [f] = car;',
	'var $fsadtmp0 = [1, 2, 3], a = $fsadtmp0[0], b = $fsadtmp0[2], c = 4, $fsadtmp1 = foo(), d = $fsadtmp1[0], e = $fsadtmp1[1]; var $fsadtmp2 = car, f = $fsadtmp2[0];'
);

test('array destructuring function parameters',
	'function foo(a, [b, , c], d) {}',
	'function foo(a, $fsadtmp3, d) {' +
		'var b = $fsadtmp3[0], c = $fsadtmp3[2];' +
	'}'
);

test('array destructuring assignment',
	'[a, b] = [b, a];',
	'(function ($fsadtmp4) {' +
		'a = $fsadtmp4[0];' +
		'b = $fsadtmp4[1];' +
		'return [a, b];' +
	'})([b, a]);'
);

console.log([passed, 'of', passed + failed, 'passed'].join(' '));
