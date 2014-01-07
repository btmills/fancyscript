var fs = require('fs');
var path = require('path');

module.exports = {
	init: function (compiler) {
		var plugins = {};
		fs.readdirSync(__dirname).filter(file =>
			file !== 'index.js'
		).forEach(file =>
			plugins[path.basename(file, '.js')] = require(path.join(__dirname, file))(compiler)
		);
		return plugins;
	}
};
