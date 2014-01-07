(function (fs, path, extend) {

'use strict';

module.exports = {
	init: function (compiler) {
		var plugins = {};
		fs.readdirSync(__dirname).forEach(function (file) {
			if (file === 'index.js') return;

			plugins[path.basename(file, '.js')] = require(path.join(__dirname, file))(compiler);
		});
		return plugins;
	}
};

}).apply(this, ['fs', 'path', 'extend'].map(require));
