

var defaultConfig = {
  postUrl: '/textfree/update',
  commentStart: 'tfStart',
  commentEnd: 'tfEnd',
  injectClassPrefix: '__tf-', // 当用 connect 插件时，会 inject 一些 CSS 样式，让 CSS 样式以此开头
  htmlFileExts: ['html', 'htm'],
  noComment: false,  // 如果为 true，则不会在 html 文件中注入 comment，在部署的时候可以配置为 true TODO 去掉这个 ？
  jsonFile: 'tf/data.json',
  jsonFileCycleMinutes: 10, // 10分钟之后就重新写一个新的 jsonFile 文件，只有设置成0才会覆盖最开始的那个文件
  tplStartTag: '{%',
  tplEndTag: '%}'
};



module.exports = function(userOption) {
  userOption = userOption || {};

  Object.keys(defaultConfig).forEach(function(key) {
    if (!(key in userOption)) {
      userOption[key] = defaultConfig[key];
    }
  });

  if (!Array.isArray(userOption.htmlFileExts)) {
    userOption.htmlFileExts = userOption.htmlFileExts.trim().split(/\s+|\s*,\s*/);
  }

  if (userOption.noComment) {
    userOption.htmlFileExts = [];
  }

  return userOption;
};

module.exports.defaultConfig = defaultConfig;