(function () {
    'use strict';
    var fs = require('fs');
    var path = require('path');
    var vm = require('vm');
    var nodeRepl = require('repl');
    var FancyScript = require('./fancyscript');
    function addMultilineHandler(repl) {
        var $fsodtmp0 = repl, rli = $fsodtmp0['rli'], inputStream = $fsodtmp0['inputStream'], outputStream = $fsodtmp0['outputStream'];
        var initialPrompt = repl.prompt.replace(/^[^> ]*/, function (x) {
                return x.replace(/./g, '-');
            });
        var continuationPrompt = repl.prompt.replace(/^[^> ]*>?/, function (x) {
                return x.replace(/./g, '.');
            });
        var enabled = false;
        var buffer = '';
        var nodeLineListener = rli.listeners('line')[0];
        rli.removeListener('line', nodeLineListener);
        rli.on('line', function (cmd) {
            if (enabled) {
                buffer += '' + cmd + '\n';
                rli.setPrompt(continuationPrompt);
                rli.prompt(true);
            } else {
                nodeLineListener(cmd);
            }
            return;
        });
        return inputStream.on('keypress', function (char, key) {
            if (!(key && key.ctrl && !key.meta && !key.shift && key.name === 'v')) {
                return;
            }
            if (enabled) {
                if (!buffer.match(/\n/)) {
                    enabled = !enabled;
                    rli.setPrompt(repl.prompt);
                    rli.prompt(true);
                    return;
                }
                if (rli.line !== null && !rli.line.match(/^\s*$/)) {
                    return;
                }
                enabled = !enabled;
                rli.line = '';
                rli.cursor = 0;
                rli.output.cursorTo(0);
                rli.output.clearLine(1);
                buffer = buffer.replace(/\n/g, '\uff00');
                rli.emit('line', buffer);
                buffer = '';
            } else {
                enabled = !enabled;
                rli.setPrompt(initialPrompt);
                rli.prompt(true);
            }
            return;
        });
    }
    function addHistory(repl, filename, maxSize) {
        try {
            var stat = fs.statSync(filename);
            var size = Math.min(maxSize, stat.size);
            var readFd = fs.openSync(filename, 'r');
            var buffer = new Buffer(size);
            if (size) {
                fs.readSync(readFd, buffer, 0, size, stat.size - size);
            }
            repl.rli.history = buffer.toString().split('\n').reverse();
            if (stat.size > maxSize) {
                repl.rli.history.pop();
            }
            if (repl.rli.history[0] === '') {
                repl.rli.history.shift();
            }
            repl.rli.historyIndex = -1;
        } catch (e) {
            repl.rli.history = [];
        }
        var fd = fs.openSync(filename, 'a');
        var lastLine = repl.rli.history[0];
        repl.rli.addListener('line', function (code) {
            if (code && code !== lastLine) {
                lastLine = code;
                fs.writeSync(fd, '' + code + '\n');
            }
        });
        repl.rli.on('exit', function () {
            return fs.closeSync(fd);
        });
        var original_clear = repl.commands['.clear'].action;
        repl.commands['.clear'].action = function () {
            repl.outStream.write('Clearing history...\n');
            repl.rli.history = [];
            fs.closeSync(fd);
            fd = fs.openSync(filename, 'w');
            lastLine = undefined;
            return original_clear.call(this);
        };
        return repl.commands['.history'] = {
            help: 'Show command history',
            action: function () {
                repl.outputStream.write('' + repl.rli.history.slice().reverse().join('\n') + '\n');
                return repl.displayPrompt();
            }
        };
    }
    return module.exports = {
        start: function (opts) {
            if (typeof opts === 'undefined') {
                opts = {};
            }
            opts.prompt || (opts.prompt = 'fancy> ');
            if (opts.ignoreUndefined == null) {
                opts.ignoreUndefined = true;
            }
            if (opts.historyFile == null) {
                opts.historyFile = path.join(process.env.HOME, '.fancy_history');
            }
            if (opts.historyMaxInputSize == null) {
                opts.historyMaxInputSize = 10 * 1024;
            }
            opts['eval'] || (opts['eval'] = function (input, context, filename, cb) {
                input = input.replace(/\uFF00/g, '\n');
                input = input.replace(/^\(([\s\S]*)\n\)$/m, '$1');
                if (/^\s*$/.test(input)) {
                    return cb(null);
                }
                try {
                    var inputAst = FancyScript.parse(input, {
                            filename: filename,
                            raw: true
                        });
                    var jsAst = FancyScript.compile(inputAst, { bare: true });
                    var js = FancyScript.js(jsAst);
                    return cb(null, vm.runInContext(js, context, filename));
                } catch (err) {
                    return cb('\x1b[0;31m' + err.constructor.name + ': ' + err.message + '\x1b[0m');
                }
            });
            var repl = nodeRepl.start(opts);
            repl.on('exit', function () {
                return repl.outputStream.write('\n');
            });
            addMultilineHandler(repl);
            if (opts.historyFile) {
                addHistory(repl, opts.historyFile, opts.historyMaxInputSize);
            }
            return repl;
        }
    };
}.call(this));