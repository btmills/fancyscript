(function () {
    'use strict';
    var util = require('util');
    var b = require('ast-types').builders;
    var escodegen = require('escodegen');
    var esprima = require('esprima');
    var estraverse = require('estraverse');
    var extend = require('extend');
    var jsonpath = require('JSONPath').eval;
    var escope = require('escope');
    var plugins = require('./plugins');
    function Compiler() {
        this.stack = [];
        this.node = null;
        this.topics = {};
        this.defaults = { bare: false };
        this.options = extend({}, this.defaults);
        return;
    }
    Compiler.prototype.on = function (topics, filter, callback) {
        if (!Array.isArray(topics))
            topics = [topics];
        if (arguments.length === 2) {
            callback = filter;
            filter = null;
        }
        var self = this;
        return topics.forEach(function (topic) {
            if (!Array.isArray(self.topics[topic]))
                self.topics[topic] = [];
            return self.topics[topic].push({
                filter: filter,
                callback: callback
            });
        });
    };
    function test(filter, node) {
        if (filter == null)
            return true;
        if (typeof filter === 'function')
            return filter(node);
        if (Array.isArray(filter))
            return filter.every(function (path) {
                var res = jsonpath(node, path);
                return res && res.length;
            });
        if (typeof filter === 'object')
            return Object.keys(filter).every(function (path) {
                var expected = filter[path];
                var actual = jsonpath(node, path);
                if (!(actual && actual.length && Array.isArray(actual)))
                    return false;
                if (expected === void 0)
                    return true;
                if (expected instanceof RegExp)
                    return actual.some(expected.test);
                return actual.some(function (val) {
                    return expected === val;
                });
            });
        return true;
    }
    ;
    Compiler.prototype.handle = function (node) {
        if (!Array.isArray(this.topics[node.type]))
            return node;
        var next, replacement;
        var remaining = this.topics[node.type].slice();
        while (remaining.length > 0) {
            replacement = null;
            next = remaining.shift();
            if (test(next.filter, node)) {
                replacement = next.callback(node);
                if (replacement && replacement !== node) {
                    node = replacement;
                    return this.handle(node);
                }
            }
        }
        return replacement || node;
    };
    Compiler.prototype.parse = function (src, options) {
        return esprima.parse(src);
    };
    Compiler.prototype.compile = function (src, options) {
        this.options = extend({}, this.defualts, options);
        var self = this;
        var tree = this.parse(src, options);
        return escodegen.generate(estraverse.replace(tree, {
            enter: function (node, parent) {
                var replacement = self.handle(node);
                self.stack.push(replacement);
                return replacement;
            },
            leave: function (node, parent) {
                return self.stack.pop();
            }
        }));
    };
    var compiler = new Compiler();
    plugins.init(compiler);
    return module.exports = compiler;
}.call(this));