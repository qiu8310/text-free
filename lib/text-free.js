module.exports = function(content, data, option) {
  var TagCtrl = require('./tag-ctrl.js');

  return (new TagCtrl(content, option)).exec(data, option);
};