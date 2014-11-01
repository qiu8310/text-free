var path = require('path'),
  fs = require('fs');

// file 格式： [prefix].yyyymmdd-HHMM.json

function getNewestFile(grunt, file) {
  var dir = path.dirname(file),
    base = path.basename(file);

  // 找到一个最新的文件 file
  var prefix, suffix, latest, latestTmp, match;
  prefix = file.split('.');
  suffix = prefix.pop();
  prefix = prefix.join('.');
  file = null;

  grunt.file.recurse(dir, function(abspath, rootdir, subdir, filename) {
    filename = path.join(dir, filename);
    if (filename === base && subdir) {
      return true;
    }
    if (filename.indexOf(prefix) === 0) {
      filename = filename.replace(prefix, '');
      filename = filename.split('.');
      if (filename.pop() === suffix) {
        filename = filename.join('.');
        match = filename.match(/^\.(\d{4})(\d{2})(\d{2})\-(\d{2})(\d{2})$/);
        if (match) {
          latestTmp = new Date(match[1] - 0, match[2] - 0, match[3] - 0, match[4] - 0, match[5] - 0);
          if (!latest || latest < latestTmp) {
            latest = latestTmp;
            file = abspath;
          }
        }
      }
    }
  });
  return file;
}


module.exports = {

  readJSON: function(grunt, file, cycleMinutes) {
    var data = {};
    cycleMinutes = parseInt(cycleMinutes, 10) || 0;

    if (cycleMinutes !== 0) {
      file = file && getNewestFile(grunt, file) || file;
    }

    if (file) {
      data = grunt.file.readJSON(file);
      grunt.log.ok('reading from ' + file + ' ok');
    }
    return data;
  },

  writeJSON: function(grunt, file, data, cycleMinutes) {
    cycleMinutes = parseInt(cycleMinutes, 10) || 0;

    if (cycleMinutes !== 0) {
      var prefix, suffix, stamp = grunt.template.today('yyyymmdd-HHMM');

      prefix = file.split('.');
      suffix = prefix.pop();
      prefix = prefix.join('.');
      file = getNewestFile(grunt, file);

      if (!file || (new Date()) - fs.statSync(file).mtime > cycleMinutes * 60 * 1000) {
        file = prefix + '.' + stamp + '.' + suffix;
      }
    }

    grunt.file.write(file, JSON.stringify(data, null, '\t'));
    grunt.log.ok('writing to ' + file + ' ok');
  }
};