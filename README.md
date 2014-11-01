# text-free

> Update html content in browser
> Replace text in any text file


## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install text-free --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('text-free');
```

### use with connect

    var TF = require('text-free');
    grunt.loadNpmTasks('text-free');
    
    function getConnectMiddleWares(webRootDirs) {
      return TF.connectHelper(grunt, webRootDirs);
    }
    
    
    grunt.initConfig({
      textFree: {
        dist: {
          files: [{
            expand: true,
            cwd: 'app',
            src: '{,*/}*.{html,css,js}',
            dest: 'dist'
          }]
        }
      },
    
      connect: {
        dev: {
          options: {
            open: false,
            middleware: getConnectMiddleWares(['app'])
          }
        }
      }
    })



## textFree task
_Run this task with the `grunt textFree` command._

### Options


  
#### commentStart
Type: `String`  
Default: `'tfStart'`

Text-Free HTML comment start tag, e.g `<!-- tfStart some.key -->`

#### commentEnd
Type: `String`  
Default: `'tfEnd'`

Text-Free HTML comment end tag, e.g `<!-- tfEnd -->`

#### tplStartTag
Type: `String`  
Default: `'{%'`

Text-Free text file start tag

#### tplEndTag
Type: `String`  
Default: `'%}'`

Text-Free text file end tag

#### injectClassPrefix
Type: `String`  
Default: `'__tf-'`

The class inject in your HTML will be prefix with this

#### htmlFileExts
Type: `Array`  
Default: `['html', 'htm']`

Specify html file extensions, if match, grunt will auto inject html comment in it

#### noComment
Type: `Boolean`  
Default: `false`

If true, then no comment will inject to html file

#### jsonFile
Type: `String`  
Default: `null`

Specify the json data file


#### jsonFileCycleMinutes
Type: `Number`  
Default: `10`

if 0, then original jsonFile will be overwrite; if > 0, then won't overwrite original jsonFile, and write to a new file with the format `[prefix].yyyymmdd-HHMM.json` 

