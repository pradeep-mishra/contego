#!/usr/bin/env node

const fs = require('fs-extra')
const path = require('path')
const escodegen = require('escodegen')
const confusion = require('confusion')
const esprima = require('esprima')
const uglifyES = require('uglify-es')

function getAllFiles(sourcePath, destPath, debug = false, ignoreRegex = undefined) {
    let cabinet = [];
    let files = fs.readdirSync(sourcePath)
    if (ignoreRegex) {
        ignoreRegex = new RegExp(ignoreRegex, 'i')
    }
    files.forEach(function (name) {
        let fullpath = path.join(sourcePath, name)
        try {
            let stat = fs.lstatSync(fullpath)
            if (stat.isDirectory()) {
                if (name.match(/node_modules|\.git/i)) {
                    return true;
                }
                if (ignoreRegex && name.match(ignoreRegex)) {
                    return true;
                }
                let newDest = fullpath.replace(sourcePath, destPath)
                cabinet = cabinet.concat(getAllFiles(fullpath, newDest, debug, ignoreRegex))
            } else if (stat.isFile()) {
                //console.log('file', fullpath)
                if (path.extname(name) === '.js') {
                    //console.log('pushing', fullpath)
                    cabinet.push(fullpath)
                } else {
                    //console.log('copying', fullpath, sourcePath, destPath)
                    let dpath = fullpath.replace(sourcePath, destPath)
                    if (debug) {
                        console.log(`copying file ${fullpath} to ${dpath}`)
                    }
                    fs.copyFileSync(fullpath, dpath)
                }
            }
        } catch (e) {
        }
    });
    return cabinet;
}

function contego(filepath, es = false, debug = false) {
    if (debug) {
        console.log(`reading file ${filepath}`)
    }
    let contents = fs.readFileSync(filepath, { encoding: 'utf8' })
    if (debug) {
        console.log(`converting file ${filepath}`)
    }

    let ast = esprima.parse(contents)
    let obfuscated = confusion.transformAst(ast, confusion.createVariableName)
    let confused = escodegen.generate(obfuscated)
    return confused
}

function uglify(filepath, code, es = false, debug = false) {
    if (es === true) {
        let opts = {
            warnings: debug,
            compress: {
                drop_debugger: true,
                dead_code: true,
                passes: 2
            }
        }
        let resp = uglifyES.minify({ [filepath]: code }, opts)
        if (resp.error) {
            throw resp.error
        } else if (resp.warnings) {
            console.warn(resp.warnings, filepath)
        }
        return resp.code
    }
    return code
}


function writeFile(filepath, data) {
    fs.ensureFileSync(filepath)
    fs.writeFileSync(filepath, data, { encoding: 'utf8' })
}


function convertAll(sourcePath, destPath, opts = { es: false, error: false, debug: false, ignorRegexStr: undefined }) {
    let es = opts.es
    let error = opts.error
    let debug = opts.debug
    let ignorRegexStr = opts.ignorRegexStr
    const jsFiles = getAllFiles(sourcePath, destPath, debug, ignorRegexStr)
    jsFiles.forEach(function (file) {
        let dpath = file.replace(sourcePath, destPath)
        try {
            let contents = contego(file, es, debug)
            if (contents) {
                contents = uglify(file, contents, es, debug)
            }
            if (debug) {
                console.log(`writing file ${dpath}`)
            }
            writeFile(dpath, contents)
        } catch (e) {
            if (error) {
                throw e
            }
            try {
                let contents = fs.readFileSync(file, { encoding: 'utf8' })
                contents = uglify(file, contents, es, debug)
                writeFile(dpath, contents)
            } catch (e) {
                console.warn(`failed to convert ${file}  \n${e.message}`)
                console.info(`copying as it is`)
                fs.copyFileSync(file, dpath)
            }
        }
    })
    console.log(`all js files contego'ed successfully`)
}

var program = require('commander')

program
    .version(require('./package').version, '-v, --version')
    .usage('/Users/pradeep/sourcedir /Users/pradeep/destdir -u js -d false')
    .option('-e, --error [type]', 'Throw error [true|false]', 'false')
    .option('-u, --uglify [type]', 'Use uglify [true|false]', 'true')
    .option('-d, --debug [type]', 'Run in debug mode type of debug [true|false]', 'false')
    .option('-r, --ignore [ignoreRegexString]', 'Regex value to ignore files like ^[a-zA-Z0-9_]+\.js', '')

program
    .arguments('<source_dir> <dest_dir>')
    .action(function (src, dest) {
        if (program.uglify == 'false') {
            program.uglify = false;
        } else {
            program.uglify = true;
        }
        if (!program.ignore) {
            program.ignore = undefined;
        }
        if (program.error == 'true') {
            program.error = true;
        } else {
            program.error = false;
        }
        if (program.debug == 'true') {
            program.debug = true;
        } else {
            program.debug = false;
        }
        src = src.replace(/\/+$/, '')
        dest = dest.replace(/\/+$/, '')
        convertAll(src, dest, {
            es: program.uglify,
            error: program.error,
            debug: program.debug,
            ignorRegexStr: program.ignore
        })
    })

program.parse(process.argv)

