var esprima = require('esprima');
var jsdiff = require('json-diff');
var fancyscript = require('../fancyscript');

var passed = 0;
var failed = 0;

function test(message, fs, js) {
	try {
		var compiled = esprima.parse(fancyscript.compile(fs));
		var expected = esprima.parse(js);

		var diff = jsdiff.diffString(expected, compiled);
		if (!diff || diff === ' undefined\n') {
			passed += 1;
		} else {
			failed += 1;
			console.log(message);
			console.log(diff);
		}
	} catch (ex) {
		console.log(message, ex.message);
		failed += 1;
	}
}

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

console.log([passed, 'of', passed + failed, 'passed'].join(' '));
