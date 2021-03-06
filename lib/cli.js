(function () {
    'use strict';
    var path = require('path');
    var fs = require('fs');
    var program = require('commander');
    var extend = require('extend');
    var mkdirp = require('mkdirp');
    var fancyscript = require('./fancyscript');
    var pkg = require('../package.json');
    var useWinPathSep = path.sep === '\\';
    var sources = [];
    var notSources = {};
    var watchedDirs = {};
    program.version(pkg.version).usage('[options] <scripts ...>').option('-b, --bare', 'compile without a top-level function wrapper').option('-r, --repl', 'start an interactive FancyScript REPL').option('-o, --out <directory>', 'set output directory', String).option('-w, --watch', 'watch for file changes').parse(process.argv);
    module.exports.run = function () {
        if (program.repl) {
            return require('./repl').start();
        }
        if (program.out) {
            program.out = path.resolve(program.out);
        }
        return program.args.forEach(function (source) {
            source = path.resolve(source);
            return compilePath(source, true, source);
        });
    };
    function isHidden(file) {
        return /^\.|~$/.test(file);
    }
    function isFancyScript(file) {
        return path.extname(file) === '.fancy';
    }
    function compilePath(source, isTopLevel, base) {
        var code, files, stats;
        if (sources.indexOf(source) >= 0 || watchedDirs[source] || !isTopLevel && (notSources[source] || isHidden(source)))
            return;
        try {
            stats = fs.statSync(source);
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.error('File not found: ' + source);
                process.exit(1);
            } else {
                throw err;
            }
        }
        if (stats.isDirectory()) {
            if (path.basename(source) === 'node_modules') {
                notSources[source] = true;
                return;
            }
            if (program.watch) {
                watchDir(source, base);
            }
            try {
                files = fs.readdirSync(source);
            } catch (err) {
                if (err.code === 'ENOENT') {
                    return;
                } else {
                    throw err;
                }
            }
            files.forEach(function (file) {
                return compilePath(path.join(source, file), false, base);
            });
        } else if (isTopLevel || isFancyScript(source)) {
            sources.push(source);
            delete notSources[source];
            if (program.watch) {
                watch(source, base);
            }
            try {
                code = fs.readFileSync(source);
            } catch (err) {
                if (err.code === 'ENOENT') {
                    return;
                } else {
                    throw err;
                }
            }
            compileScript(source, code.toString(), base);
        } else {
            notSources[source] = true;
        }
    }
    function compileScript(file, input, base) {
        if (typeof base === 'undefined') {
            base = null;
        }
        var fsAst, js, jsAst, message;
        var options = compileOptions(file, base);
        try {
            fsAst = fancyscript.parse(input, options);
            jsAst = fancyscript.compile(fsAst, options);
            js = fancyscript.js(jsAst, options);
            writeJs(base, file, js, options.jsPath);
        } catch (err) {
            message = err.stack || err;
            if (program.watch) {
                console.log(message + '\x07');
            } else {
                console.error(message);
                process.exit(1);
            }
        }
    }
    function watch(source, base) {
        var compileTimeout, prevStats, watcher;
        function watchErr(err) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
            if (sources.indexOf(source) < 0) {
                return;
            }
            try {
                rewatch();
                compile();
            } catch (err) {
                removeSource(source, base);
            }
        }
        function compile() {
            clearTimeout(compileTimeout);
            return compileTimeout = setTimeout(function () {
                return fs.stat(source, function (err, stats) {
                    if (err)
                        return watchErr;
                    if (prevStats && stats.size === prevStats.size && stats.mtime.getTime() === prevStats.mtime.getTime())
                        return rewatch();
                    prevStats = stats;
                    return fs.readFile(source, function (err, code) {
                        if (err)
                            return watchErr;
                        compileScript(source, code.toString(), base);
                        return rewatch();
                    });
                });
            }, 25);
        }
        function startWatcher() {
            return watcher = fs.watch(source).on('change', compile).on('error', function (err) {
                if (err.code !== 'EPERM')
                    throw err;
                return removeSource(source, base);
            });
        }
        function rewatch() {
            if (watcher && typeof watcher.close === 'function') {
                watcher.close();
            }
            return startWatcher();
        }
        try {
            startWatcher();
        } catch (err) {
            watchErr(err);
        }
    }
    function watchDir(source, base) {
        var readdirTimeout, watcher;
        function startWatcher() {
            return watcher = fs.watch(source).on('error', function (err) {
                if (err.code !== 'EPERM')
                    throw err;
                return stopWatcher();
            }).on('change', function () {
                clearTimeout(readdirTimeout);
                return readdirTimeout = setTimeout(function () {
                    var files;
                    try {
                        files = fs.readdirSync(source);
                    } catch (err) {
                        if (err.code !== 'ENOENT')
                            throw err;
                        return stopWatcher();
                    }
                    return files.forEach(function (file) {
                        return compilePath(path.join(source, file), false, base);
                    });
                }, 25);
            });
        }
        function stopWatcher() {
            watcher.close();
            return removeSourceDir(source, base);
        }
        watchedDirs[source] = true;
        try {
            startWatcher();
        } catch (err) {
            if (err.code !== 'ENOENT')
                throw err;
        }
    }
    function removeSourceDir(source, base) {
        var sourcesChanged;
        delete watchedDirs[source];
        sourcesChanged = false;
        sources.filter(function (file) {
            return source === path.dirname(file);
        }).forEach(function (file) {
            removeSource(file, base);
            return sourcesChanged = true;
        });
        if (sourcesChanged)
            compileJoin();
    }
    function removeSource(source, base) {
        var index = sources.indexOf(source);
        sources.splice(index, 1);
        sourceCode.splice(index, 1);
        if (!program.join) {
            silentUnlink(outputPath(source, base));
            timeLog('removed ' + source);
        }
    }
    function silentUnlink(path) {
        try {
            fs.unlinkSync(path);
        } catch (err) {
            if (err.code !== 'ENOENT' && err.code !== 'EPERM')
                throw err;
        }
    }
    function baseFileName(file, stripExt, useWinPathSep) {
        if (typeof stripExt === 'undefined') {
            stripExt = false;
        }
        if (typeof useWinPathSep === 'undefined') {
            useWinPathSep = false;
        }
        var pathSep = useWinPathSep ? /\\|\// : /\//;
        var parts = file.split(pathSep);
        file = parts[parts.length - 1];
        if (!(stripExt && file.indexOf('.') >= 0))
            return file;
        parts = file.split('.');
        parts.pop();
        if (parts[parts.length - 1] === 'fs' && parts.length > 1)
            parts.pop();
        return parts.join('.');
    }
    function outputPath(source, base, extension) {
        if (typeof extension === 'undefined') {
            extension = '.js';
        }
        var dir;
        var basename = baseFileName(source, true, useWinPathSep);
        var srcDir = path.dirname(source);
        if (!program.out) {
            dir = srcDir;
        } else if (source === base) {
            dir = program.out;
        } else {
            dir = path.join(program.out, path.relative(base, srcDir));
        }
        return path.join(dir, basename + extension);
    }
    function writeJs(base, sourcePath, js, jsPath) {
        var jsDir = path.dirname(jsPath);
        function compile() {
            if (js.length <= 0)
                js = ' ';
            return fs.writeFile(jsPath, js, function (err) {
                if (err) {
                    console.error(err.message);
                } else if (program.watch) {
                    timeLog('compiled ' + sourcePath);
                }
            });
        }
        return fs.exists(jsDir, function (exists) {
            if (exists) {
                compile();
            } else {
                mkdirp(jsDir, compile);
            }
        });
    }
    function timeLog(message) {
        return console.log(new Date().toLocaleTimeString() + ' - ' + message);
    }
    function compileOptions(filename, base) {
        var cwd, jsPath, jsDir;
        var answer = {
                filename: filename,
                bare: program.bare
            };
        if (filename) {
            if (base) {
                cwd = process.cwd();
                jsPath = outputPath(filename, base);
                jsDir = path.dirname(jsPath);
                answer = extend(answer, {
                    jsPath: jsPath,
                    sourceRoot: path.relative(jsDir, cwd),
                    sourceFiles: [path.relative(cwd, filename)],
                    generatedFile: baseFileName(jsPath, false, useWinPathSep)
                });
            } else {
                answer = extend(answer, {
                    sourceRoot: '',
                    sourceFiles: [baseFileName(filename, false, useWinPathSep)],
                    generatedFile: baseFileName(filename, true, useWinPathSep) + '.js'
                });
            }
        }
        return answer;
    }
}.call(this));