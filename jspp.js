(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['acorn', 'escodegen'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory(require('acorn'), require('escodegen'));
	} else {
		root.jspp = factory(root.acorn, root.escodegen);
	}
})(this, function (acorn, escodegen) {

	'use strict';

	var compile = function (src) {
		return escodegen.generate(acorn.parse(src));
	};

	return {
		compile: compile
	};

});
