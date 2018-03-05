
Install 
``` bash
npm i contego -g 
```


## Get Started
Contego is a simple tool to obfucate++ your js code and make it harder for user to read source files 
## Usage
``` bash
$ contego source_dir dest_dir -u true|false -d true|false -i ^\w+\.test.js$
```
- **source_dir** = source directory
- **dest_dir** = destination directory
- **-u** = use uglify, true or false
- **-d** = debug mode,true or false for extra logging
- **-i** = ignore files regex string, provide regex to ignore any files defined by user

## Example
``` bash
$ contego /Users/pradeep/myproject /Users/pradeep/myprojectdest -u true -d false
```