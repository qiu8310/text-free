/* jshint -W024 */

var middleWare = require('./middle-ware.js');
var replace = require('../lib/text-free.js');
var TagCtrl = require('../lib/tag-ctrl.js');
var KV = require('../lib/kv.js');

var path = require('path');


function connectHelper(grunt, webRootDirs, fn) {
  if (!Array.isArray(webRootDirs)) { webRootDirs = [webRootDirs]; }

  return function(connect) {
    var result = [];

    result.push(middleWare(grunt, webRootDirs));

    if (typeof fn === 'function') {
      fn.call(result, result);
    }

    webRootDirs.forEach(function(dir) {
      result.push(connect.static(path.resolve(dir)));
    });
    return result;
  };
}





module.exports = {
  middleWare: middleWare,
  connectHelper: connectHelper,

  replace: replace,
  TagCtrl: TagCtrl,
  KV: KV
};