# FancierScript

*Fancier JavaScript, because FancyScript just wasn't fancy enough.*

FancierScript aims to make developing in JavaScript easier and more powerful while remaining "just JavaScript". For a completely different approach with diverse syntax rules, and in the latter case, a powerful standard library, look toward [CoffeeScript](https://github.com/jashkenas/coffee-script/) or [ClojureScript](https://github.com/clojure/clojurescript). FancierScript compiles to plain ES5 JavaScript. Thanks [@tarebyte](https://github.com/tarebyte) for the name.

## Usage

`npm install -g fancierscript` installs the FancierScript binary `fancier` so it can be used globally.

`fancier input.fs` compiles the FancierScript source file `input.fs` to plain JavaScript in `input.js`.

#### Options

- `-b, --bare` Compile without a top-level function wrapper.
- `-o, --out [DIR]` Write all compiled JavaScript files into the specified directory.
- `-r, --repl` Start an interactive FancierScript REPL. Interrupts all other options.
- `-w, --watch` Watch specified files for changes.

## Features

### Strict by default

FancierScript follows strict-mode JavaScript conventions. Unless the `--bare` option is passed, the compiled code is wrapped in an [IIFE](http://benalman.com/news/2010/11/immediately-invoked-function-expression/) (Immediately-Invoked Function Expression) with `"use strict";` inside. For the sake of clarity, other examples will not include the function wrapper and strict mode declaration.

```JavaScript
var a = 42;
```
```JavaScript
(function () {
    "use strict";
    var a = 42;
}).call(this);
```

### Arrow functions

[Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/arrow_functions) in Harmony are a more concise syntax for function expressions, consisting of a parameter list and an automatically-returned expression or a statement block.

```JavaScript
[1, 2, 3, 4].map(x => x * x);
```
```JavaScript
[1, 2, 3, 4].map(function (x) {
    return x * x;
});
```

### Default arguments

Use default arguments to provide a default value within the function's parameter list for any optional arguments.

```JavaScript
function foo(a, b = 42, c, d = bar(), e) { }
```
```JavaScript
function foo(a, b, c, d, e) {
    if (typeof b === 'undefined') { b = 42; }
    if (typeof d === 'undefined') { d = bar(); }
}
```

### Rest parameters

From the [MDN page](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/rest_parameters), rest parameters represent "an indefinite number of arguments as an array." A function declaration or function expression may have a rest parameter as its last argument which will absorb all the rest of the arguments when the function is called.

```JavaScript
fn isEven (...x) {
    x.every(fn (x) { x % 2 === 0 });
}
```
```JavaScript
function isEven() {
    var x = Array.prototype.slice.call(arguments, 0);
    return x.every(function (x) {
        return x % 2 === 0;
    });
}

isEven(2, 4, 6); // true
```

### Spread operator

From the [MDN page](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Spread_operator), the spread operator expands an expression into multiple arguments to a function or multiple elements in array literals. Currently only the former case is supported, but the latter is in progress.

```JavaScript
var arr = ['b', 'c', 'd'];
console.log('a', ...arr, 'e');
```
```JavaScript
var arr = ['b', 'c', 'd'];
console.log.apply(console.log, [].concat(['a'], arr, ['e'])); // a b c d e
```

*Note that support for the spread operator in a call to `Function.prototype.apply` is neither available nor planned. A compelling use case would be needed.*

### Array destructuring

[Array destructuring](http://wiki.ecmascript.org/doku.php?id=harmony:destructuring) can occur in variable declarations, assignment expressions, or function parameters.

```JavaScript
var [a, b] = [11, 42];
console.log([a, b] = [b, a]); // [42, 11]
function show([, second]) {
    console.log(second);
}
show([a, b]); // 11
```
```JavaScript
var $tmp = [11, 42], a = $tmp[0], b = $tmp[1];
console.log(function ($tmp) {
    a = $tmp[0];
    b = $tmp[1];
    return $tmp;
}([b, a]));
function show($tmp) {
    var second = $tmp[1];
    return console.log(second);
}
show([a, b]);
```

### Object destructuring

Like array destructuring, object destructuring is syntactic sugar for more easily creating objects or retrieving values from them. This can occur in variable declarations, function parameter lists, or as a shortcut in object expressions.

```JavaScript
var { name, age: a } = getPerson(); // Declare variables "name" and "a"
var obj = { name, age: a }; // Shortcut to initialize obj.name to variable "name"
function ({ name, age: b}, cb) { }
({ name, age: a }) = getAnotherPerson();
```
```JavaScript
var $tmp = getPerson(), name = $tmp['name'], a = $tmp['age'];
var obj = { name: name, age: a };
function ($tmp2, cb) {
    var name = $tmp2['name'], b = $tmp2['age'];
}
(function ($tmp3) {
    name = $tmp3['name'];
    a = $tmp3['age'];
    return $tmp3;
})(getAnotherPerson());
```

### Automatic return values

If the last statement of a function is an expression contained in an ExpressionStatement, it is automatically returned.

```JavaScript
fn isEven (x) { x % 2 === 0 }
```
```JavaScript
function isEven(x) {
    return x % 2 === 0;
}
```

### `fn` keyword

`fn` is an alias to the `function` keyword and is interchangeable.

```JavaScript
fn hello () {
    conole.log('Hello, world!');
}
```
```JavaScript
function hello () {
    console.log('Hello, world!');
}
```

## Example

```JavaScript
var isEven = (x, ...r) => x % 2 === 0 && (r.length ? isEven(...r) : true)
```
```JavaScript
var isEven = function (x) {
    var r = Array.prototype.slice.call(arguments, 1);
    return x % 2 === 0 && (r.length ? isEven.apply(isEven, [].concat(r)) : true);
}

isEven(2, 4, 6, 7); // false
isEven(2, 4, 6, 8); // true
```

## License

Licensed under the [BSD 3-Clause License](http://opensource.org/licenses/BSD-3-Clause), the full text of which can be read in [LICENSE](LICENSE).
