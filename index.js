
const fs = require('fs-extra')
const path = require('path')
const escodegen = require('escodegen')
const confusion = require('confusion')
const esprima = require('esprima')
const uglifyES = require('uglify-es')
const uglifyJS = require('uglify-js')

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
    if (typeof (es) === 'boolean') {
        let resp = null;
        if (es === true) {
            resp = uglifyES.minify({ [filepath]: confused }, { warnings: true })
        } else {
            resp = uglifyJS.minify({ [filepath]: confused }, { warnings: true })
        }
        if (resp.error) {
            throw resp.error
        } else if (resp.warnings) {
            console.warn(resp.warnings)
        }
        return resp.code
    }
    return confused
}

function writeFile(filepath, data) {
    fs.ensureFileSync(filepath)
    fs.writeFileSync(filepath, data, { encoding: 'utf8' })
}


function convertAll(sourcePath, destPath, es = false, error = false, debug = false, ignorRegexStr = undefined) {
    const jsFiles = getAllFiles(sourcePath, destPath, debug, ignorRegexStr)
    try {
        jsFiles.forEach(function (file) {
            let dpath = file.replace(sourcePath, destPath)
            try {
                const contents = contego(file, es, debug)
                if (debug) {
                    console.log(`writing file ${dpath}`)
                }
                writeFile(dpath, contents)
            } catch (e) {
                if (error) {
                    throw e
                }
                console.warn(`error while converting file ${file}`)
                fs.copyFileSync(file, dpath)
            }
        })
    } catch (e) {
        if (error) {
            throw e
        }
        console.warn(`error while converting file ${e.message}`)
    }
    if (debug) {
        console.log(`all js files contego'ed successfully`)
    }
}

var program = require('commander')

program
    .version(require('./package').version, '-v, --version')
    .usage('/Users/pradeep/sourcedir /Users/pradeep/destdir -u js -d false')
    .option('-e, --error [type]', 'throw error [true|false]', 'false')
    .option('-u, --uglify [type]', 'Use uglify, define type of js syntax [js|es|null]', 'es')
    .option('-d, --debug [type]', 'Run in debug mode type of debug [false|true]', 'false')
    .option('-r, --ignore [ignoreRegexString]', 'Regex value to ignore files like ^[a-zA-Z0-9_]+\.js', '')

program
    .arguments('<source_dir> <dest_dir>')
    .action(function (src, dest) {
        if (program.uglify == 'es') {
            program.uglify = true;
        } else if (program.uglify == 'js') {
            program.uglify = false;
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
        convertAll(src, dest, program.uglify, program.error, program.debug, program.ignore)
    })

program.parse(process.argv)

