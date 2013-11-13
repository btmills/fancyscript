# FancyScript

FancyScript aims to make developing in JavaScript easier and more powerful while remaining "just JavaScript". For a completely different approach with diverse syntax rules, and in the latter case, a powerful standard library, look toward [CoffeeScript](https://github.com/jashkenas/coffee-script/) or [ClojureScript](https://github.com/clojure/clojurescript). FancyScript compiles to plain ES5 JavaScript. Thanks [@tarebyte](https://github.com/tarebyte) for the name.

## Usage

`npm install -g fancyscript`

`fancy input.fs` compiles the FancyScript source file `input.fs` to plain JavaScript in `input.js`. More options will be added to the compiler later.

## Features

### `fn` keyword

`fn` is an alias to the `function` keyword and is interchangeable.

```JavaScript
fn hello () {
    conole.log('Hello, world!');
}
=>
function hello () {
    console.log('Hello, world!');
}
```

### Automatic return values

If the last statement of a function is an epression contained in an ExpressionStatement, it is automatically returned.

```JavaScript
fn isEven (x) { x % 2 === 0 }
=>
function isEven(x) {
    return x % 2 === 0;
}
```

### Rest parameters

From the [MDN page](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/rest_parameters), rest parameters represent "an indefinite number of arguments as an array." A function declaration or function expression may have a rest parameter as its last argument which will absorb all the rest of the arguments when the function is called.

```JavaScript
fn isEven (...x) {
    x.every(fn (x) { x % 2 === 0 });
}
=>
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
=>
var arr = ['b', 'c', 'd'];
console.log.apply(console.log, [].concat(['a'], arr, ['e'])); // a b c d e
```

*Note that support for the spread operator in a call to `Function.prototype.apply` is neither available nor planned. A compelling use case would be needed.*

## Example

```JavaScript
fn isEven (x, ...r) {
    x % 2 === 0 && (r.length ? isEven(...r) : true)
}
=>
function isEven(x) {
    var r = Array.prototype.slice.call(arguments, 1);
    return x % 2 === 0 && (r.length ? isEven.apply(isEven, [].concat(r)) : true);
}

isEven(2, 4, 6, 7); // false
isEven(2, 4, 6, 8); // true
```
