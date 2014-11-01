var tf = require('../lib/text-free.js'),
  RW = require('../lib/rw.js'),
  xOption = require('../lib/option.js');

module.exports = function(grunt) {

  grunt.registerMultiTask( 'textFree', 'Replace specified format text with defined json data', function(command) {

    var options = xOption(this.options());

    // TF connect 插件专用的
    if (command && command.indexOf('__') === 0 && (typeof global[command] === 'function')) {
      global[command].call(this, options);
      return true;
    }

    var data = RW.readJSON(grunt, options.jsonFile, options.jsonFileCycleMinutes);

    this.files.forEach(function(fSet) {
      fSet.src.forEach(function(file) {

        var ext = file.split('.').pop();
        var content = grunt.file.read(file);

        options.isHtml = options.htmlFileExts.indexOf(ext) >= 0;
        grunt.file.write(fSet.dest, tf(content, data, options));
        grunt.log.ok('write to ' + fSet.dest + ' ok');

      });
    });
  });

};