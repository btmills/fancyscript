(function () {
    'use strict';
    var fs = require('fs');
    var path = require('path');
    return module.exports = {
        init: function (compiler) {
            var plugins = {};
            fs.readdirSync(__dirname).filter(function (file) {
                return file !== 'index.js';
            }).forEach(function (file) {
                return plugins[path.basename(file, '.js')] = require(path.join(__dirname, file))(compiler);
            });
            return plugins;
        }
    };
}.call(this));