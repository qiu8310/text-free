/**
 * Reference: Compression Code
 * https://github.com/expressjs/compression/blob/master/index.js
 *
 */

var xOption = require('../lib/option.js'),
  tf = require('../lib/text-free.js'),
  KV = require('../lib/kv.js'),
  RW = require('../lib/rw.js'),
  utils = require('../lib/utils.js'),
  path = require('path');

var onHeaders = require('on-headers');


module.exports = function(grunt, serverDirs) {

  if (!grunt.task.exists('textFree')) {
    throw new Error('Gruntfile no textFree task');
  }

  // 跑出 grunt 中配置的数据来
  var fileFilters = {};
  utils.runGruntTask(grunt, 'textFree', function(options) {
    var files = [], datas = {}, data;
    options = xOption(options);
    data = datas[options.jsonFile] || RW.readJSON(grunt, options.jsonFile, options.jsonFileCycleMinutes);
    datas[options.jsonFile] = data;

    fileFilters[this.target] = {
      files: files,
      options: options,
      data: data
    };
    this.files.forEach(function(fSet) {
      fSet.src.forEach(function(src) {
        files.push(src);
      });
    });
  }, function() {
    /*console.log('filters:', fileFilters); */
  });


  /**
   * 根据 request url 找到对应的文件
   *
   */
  function findFileByRequestUrl(url) {
    var result;
    serverDirs.some(function(dir) {
      if (grunt.file.exists(dir, url)) {
        result = path.join(dir, url);
        return true;
      }
    });
    return result;
  }

  /**
   * 过滤 request url
   * @param req
   * @returns {boolean}
   */
  function filter(url) {
    var file = findFileByRequestUrl(url),
      result = false;

    Object.keys(fileFilters).some(function(target) {
      var f = fileFilters[target];
      if (f.files.indexOf(file) >= 0 || f.options.postUrl === url) {
        result = f;
        return true;
      }
    });

    return result;
  }


  /**
   * 向 html 中插入一段 js 脚本
   *
   * JS 脚本插入在 </body> 上面，如果不存在，则不插入
   */
  function inject(htmlContent, options) {
    if (htmlContent.indexOf('</body>') > 0) {
      var content = grunt.file.read(path.join(__dirname, 'inject.js'));
      content = content.replace('__textFreeOptions;', JSON.stringify(options) + ';');
      var injectContent = '<script>'+ content +'</script>';
      return htmlContent.replace('</body>', injectContent + '</body>');
    } else {
      return htmlContent + '<script>window.__tfUpdateNodes && window.__tfUpdateNodes();</script>';
    }
  }

  function getPostData(post) {
    // 解析 formData TODO: 找一个开源的处理程序
    var sep = post.split('\r\n')[0],
      params = {};
    post = post.split(sep);
    post.pop();
    post.shift();
    post.forEach(function(item) {
      var key, val;
      item = item.trim().split('\r\n\r\n');
      key = item.shift();
      val = item.join('\r\n\r\n');
      key = key.match(/name="([\w\-\_\.]*)"/);
      if (key) {
        params[key[1]] = val;
      }
    });
    return params;
  }

  return function(req, res, next) {
    var url = req.url,
      urlExt;

    // 访问根目录
    if (url.charAt(url.length - 1) === '/') { url += 'index.html'; }
    urlExt = url.split('.').pop();

    // 不用处理就跳到下一个处理程序
    var fileFilter = filter(url);
    if (!fileFilter) { next(); return true; }

    var options = fileFilter.options,
      data = fileFilter.data;

    grunt.verbose.writeln('tf request: ' + url);

    // 更新源数据请求
    if (url === options.postUrl) {
      var post = [];

      req.on('data', function(chunk) {
        if (chunk && chunk.length) { post.push(chunk.toString()); }
      });

      req.on('end', function(chunk) {
        if (chunk && chunk.length) { post.push(chunk.toString()); }
        var params = getPostData(post.join('').trim());
        var result = {status: 0, msg: 'ok'};

        // 将 params 写回到 源文件
        Object.keys(params).forEach(function(key) {
          if (false === KV.set(key, params[key], data)) {
            result.status = '404';
            result.msg = 'you key [' + key + '] was not exist';
            return false;
          }
        });

        RW.writeJSON(grunt, options.jsonFile, data, options.jsonFileCycleMinutes);

        // 返回结果
        res.end(JSON.stringify(result));
      });


      return false;
    }


    // 防止 304
    req.headers['if-none-match'] = 'no-match-for-this';
    req.headers['if-modified-since'] = new Date(1);


    req.on('close', function() {
      res.write = res.end = function(){};
    });

    function transformChunk(chunk) {
      if (chunk && chunk.length) {
        options.isHtml = options.htmlFileExts.indexOf(urlExt) >= 0;
        var content = tf(chunk.toString(), data, options);
        return options.isHtml ? inject(content, options) : content;
      }

      return chunk;
    }

    var _write = res.write, _end = res.end,
      _writeHead = res.writeHead, _setHeader = res.setHeader;

    res.write = function(chunk, encoding) {
      _write.call(res, transformChunk(chunk), encoding);
    };

    res.end = function(chunk, encoding) {
      _end.call(res, transformChunk(chunk), encoding);
    };

    res.writeHead = function() {
      _writeHead.apply(res, arguments);
    };

    res.setHeader = function() {
      _setHeader.apply(res, arguments);
    };

    onHeaders(res, function() {
      res.removeHeader('Content-Length');
    });

    next();

  };
};