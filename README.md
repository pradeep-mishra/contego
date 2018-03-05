
Install 
``` bash
npm i contego -g 
```


## Get Started
Contego is a simple tool to obfucate code and make it harder for user to read source code of js files 
## Usage
$ contego source_dir dest_dir -u true|false -d true|false -i ^\w\\.js$
- source_dir = source directory
- dest_dir = destination directory
- -u = use uglify, true or false
- -d = debug mode,true or false for extra logging
- -i = ignore regex string, provide regex to ignore any files define by user

## Example

$ contego /Users/pradeep/myproject /Users/pradeep/myprojectdest -u true -d false
