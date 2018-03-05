
Install 
``` bash
npm i contego -g 
```


## Get Started
Contego is a simple tool to obfucate code and make it harder for user to read source code of files 
## Usage
$ contego <source dir> <dest dir> -u js|es|null -d true|false -i ^\w\\.js$
- source dir = source directory
- dest dir = destination directory
- -u = use uglify, es for es6 files, js for es5 or below and null for skipping uglify
- -d = debug mode, for extra logging
- -i = ignore regex string, provide regex to ignore any files define by user

## Example

$ contego /Users/pradeep/myproject /Users/pradeep/myprojectdest -u js -d false
