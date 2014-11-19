/* global __textFreeOptions */

/**
 * NOTE: 工具程序，不考虑性能
 */

(function() {

  var options = __textFreeOptions; // inject 注入的变量
  var prefix = options.injectClassPrefix || '__tf-';
  var tfInjectClassName = prefix + 'inject';
  var postUrl = options.postUrl || '/textfree/update';
  var tfNodes;

  function query(selector, context) {
    selector = selector.replace(/\.([\w\-]+)/g, '.' + prefix + '$1');
    return (context || document).querySelector(selector);
  }

  function isTfStartComment(strOrNode) {
    var matcher;
    if (typeof strOrNode === 'string') {
      matcher = strOrNode.match(new RegExp('<!\\-\\- ' + options.commentStart + ' ([\\w\\.\\_\\-]+) \\-\\->'));
    }

    if (strOrNode.nodeType === 8) {
      matcher = strOrNode.nodeValue.match(new RegExp(' ' + options.commentStart + ' ([\\w\\.\\_\\-]+) '));
    }
    return matcher ? matcher[1] : false;
  }

  function getTfCommentKey(strOrNode) {
    return isTfStartComment(strOrNode);
  }

  function isTfEndComment(strOrNode) {
    if (strOrNode.nodeType && strOrNode.nodeType === 8) {
      return ' ' + options.commentEnd + ' ' === strOrNode.nodeValue;
    }
    return '<!-- ' + options.commentEnd + ' -->' === strOrNode;
  }

  function isTfComment(strOrNode) {
    return isTfEndComment(strOrNode) || isTfStartComment(strOrNode);
  }

  /**
   * 取出 tf 字段，去除所有 html 标签
   * @param html [String]
   * @returns object {origin: [String], striped: [String], texts: [Array]}
   *
   * 在浏览器上，会把 <、> 等符号转义成 &lt;、&gt;，注意展示给用户编辑的时候要取消转义
   */
  function tf(html) {
    var data = {origin: html};

    // 去除首尾换行
    html = html.trim();

    // 把 html 标签中的所有引号及其内容去掉 （因为标签属性可能包含 < 或 > 字符）
    // html 中不支持反斜线（\）转义
    // 引号前后如果出现了 < ，表示是在标签内，就把引号内及其内的内容全去掉
    var run = true;
    var handler = function () {
      run = true;
      return arguments[1];
    };
    while (run) {
      run = false;
      html = html.replace(/(<\w[^"']+)(?:(?:"[^"]*")|(?:'[^']*'))/g, handler);
    }

    // 将所有 html 标签去掉
    html = html.replace(/<\/?[\w][^>]*>/g, '');

    // 把非 tf 注释去掉
    html = html.replace(/<!\-\-.*?\-\->/g, function (word) {
      return isTfComment(word) ? word : '';
    });

    // 该处理的都处理了，现在把 html 分段
    var result = [],
      index = 0,
      tfKey = false,
      htmlLength = html.length;
    html.replace(/<!\-\-\s*(.*?)\s*\-\->/g, function (word, key, i) {
      if (isTfStartComment(word)) {
        tfKey = getTfCommentKey(word);
        if (index !== i) {
          result.push({
            text: html.substring(index, i),
            type: 'normal'
          });
        }

      } else if (isTfEndComment(word)) {
        if (index !== i) {
          result.push({
            text: html.substring(index, i),
            type: 'tf',
            key: tfKey
          });
          tfKey = false;
        }
      }

      index = i + word.length;

      return '';
    });


    if (index < htmlLength) {
      result.push({
        text: html.substr(index),
        type: 'normal'
      });
    }

    data.striped = html;
    data.texts = result;
    data.text = result.reduce(function (last, current) {
      return last + current.text;
    }, '');

    return data;
  }


  /**
   * 遍历所有节点，找到含有 tf comment 的父节点，
   *
   * 向其注入 inject class
   *
   */
  function injectClassToTfParentNode() {
    var nodes = [];
    [].slice.call(document.all)
      .filter(function (node) {
        return node.nodeType === Node.ELEMENT_NODE && // 只处理 ELEMENT_NODE
        ['SCRIPT', 'STYLE', 'TEXTAREA', 'HEAD', 'HTML', 'META', 'TITLE']
          .indexOf(node.nodeName.toUpperCase()) === -1; // 去掉特殊节点
      })
      .forEach(function (node) {
        var flag = 0, tfKey;
        [].slice.call(node.childNodes).forEach(function (childNode) {
          if (isTfStartComment(childNode) && flag === 0) {
            tfKey = getTfCommentKey(childNode);
            flag = 1;
          } else if (isTfEndComment(childNode) && flag === 1) {

            node.classList.add(tfInjectClassName);

            // 重置为 0，继续向后查找
            flag = 0;

          } else if (flag === 1 && tfKey) {
            nodes.push({key: tfKey, node: childNode});
          }
        });

      });
    return nodes;
  }


  /**
   * 向 html 中的 class 插入前缀
   */
  function prefixHtmlClass(html) {
    return html.replace(/class="([\w\-\s]+)"/gi, function (word, classes) {
      classes = prefix + classes.trim().split(/\s+/).join(' ' + prefix);
      return 'class="' + classes + '"';
    });
  }


  /**
   * 向 style 中的 class 插入前缀
   *
   */
  function prefixStyleClass(style) {
    return style.replace(/(\.[^}]*?)\{/gi, function (word, selector) {
      return selector.replace(/\.([\w\-]+)/g, '.' + prefix + '$1') + ' {';
    });
  }

  /**
   *  向文档里添加 CSS 代码
   */
  function insertCSSCode(code) {
    code = prefixStyleClass(code);

    var s = document.createElement('style');
    s.type = 'text/css';
    s.media = 'screen';
    if (s.styleSheet) {     // for ie
      s.styleSheet.cssText = code;
    } else {                 // for w3c
      s.appendChild(document.createTextNode(code));
    }
    (document.getElementsByTagName('head')[0]).appendChild(s);
  }


  /**
   * 将 tf 返回的对象组装成 html
   */
  function tfToHtml(tfObj) {
    var result = [];
    tfObj.texts.forEach(function (item) {
      var attr = 'class="' + item.type + '-text"';
      attr += item.type === 'tf' ? ' contentEditable="true"' : '';
      result.push('<span ' + attr + '>' + item.text + '</span>');
    });
    return result.join('');
  }


  /**
   * 将一个 node 的某些样式复制到另一个 node 上去
   *
   */
  function copyFontStyle(fromNode, toNode) {
    // 将 originNode 上的字体相关属性 copy 到 wrap 上
    var fromStyle = window.getComputedStyle(fromNode, null);
    'fontFamily,fontSize,fontStyle,fontWeight,textAlign'.split(',').forEach(function (key) {
      if (fromStyle[key]) {
        toNode.style[key] = fromStyle[key];
      }
    });
  }


  insertCSSCode([
    '.mask {position: fixed; top: 0; left: 0; right: 0; bottom: 0;background: rgba(0, 0, 0, .7);}',
    '.wrap {background: white; border-radius: 6px; padding: 20px; ' +
    'position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);}',
    '.content {text-align: center; padding: 15px 0 30px;}',
    '.normal-text {background-color: #eee; color: #999;}',
    '.control {text-align: center;}',
    '.btn {display: inline-block;padding: 6px 12px;margin-bottom: 0; font-size: 14px;font-weight: 400;' +
    'line-height: 1.42857143;text-align: center;white-space: nowrap;vertical-align: middle;' +
    'cursor: pointer;-webkit-user-select: none;user-select: none;background-image: none;' +
    'border: 1px solid transparent;border-radius: 4px;}',
    '.btn.disabled, .btn[disabled] {pointer-events: none; cursor: not-allowed; opacity: .65;}',
    '.btn:focus {outline: none;}',
    '.btn-ok {color: #fff;background-color: #428bca;border-color: #357ebd;}',
    '.btn-ok:hover {color: #fff;background-color: #3071a9;border-color: #285e8e;}',
    '.btn-cancel {color: #333;background-color: #fff;border-color: #ccc;}',
    '.btn-cancel:hover {color: #333;background-color: #e6e6e6;border-color: #adadad;}'
  ].join('\n'));


  /**
   * 监听 tf node 的点击事件
   */
  var documentClickHandler = function (e) {
    if (e.target.classList.contains(tfInjectClassName)) {
      var tfObj = tf(e.target.innerHTML), width, dom;
      var handler = function (e) {
        if (!e.target.classList.contains(prefix + 'btn')) {
          return false;
        }
        query('.control', dom).removeEventListener('click', handler, false);

        if (e.target.classList.contains(prefix + 'btn-cancel')) {
          dom.parentNode.removeChild(dom);
        } else if (e.target.classList.contains(prefix + 'btn-ok')) {

          // 获取 formData
          var formData = new FormData(), updateData = {};
          [].slice.call(query('.content', dom).children).forEach(function (el, index) {
            var item = tfObj.texts[index], val;
            if (item && item.type === 'tf') {
              val = el.textContent;
              if (item.text !== val) {
                updateData[item.key] = val;
                formData.append(item.key, val);
              }
            }
          });

          // 本地无刷新更新

          tfNodes.forEach(function (item) {
            for (var tfKey in updateData) {
              if (item.key === tfKey) {
                item.node.nodeValue = updateData[tfKey];
              }
            }
          });


          // 提交 formData
          if (Object.keys(updateData).length) {
            e.target.classList.add(prefix + 'disabled');
            var xhr = new XMLHttpRequest();
            xhr.open('POST', postUrl, true);
            xhr.onload = function () {
              if (this.status === 200) {
                var data = JSON.parse(this.response);
                if (data.status === 0) {
                  dom.parentNode.removeChild(dom);
                } else {
                  window.alert(data.msg);
                  e.target.classList.remove(prefix + 'disabled');
                }
              } else {
                window.alert('Network error!');
              }
            };
            xhr.send(formData);
          }

        }


        e.preventDefault();
        e.stopPropagation();
      };

      width = Math.min(document.documentElement.clientWidth - 60, 600);


      dom = document.createElement('div');
      dom.className = prefix + 'mask';
      dom.innerHTML = prefixHtmlClass('<div class="wrap" style="width:' + width + 'px;">' +
      '<div class="content">' + tfToHtml(tfObj) + '</div>' +
      '<div class="control">' +
      '<button class="btn btn-ok">确认</button>&nbsp;&nbsp;' +
      '<button class="btn btn-cancel">取消</button>' +
      '</div>' +
      '</div>');

      document.body.appendChild(dom);

      copyFontStyle(e.target, query('.content', dom));
      query('.control', dom).addEventListener('click', handler, false);
    }
  };

  document.addEventListener('click', documentClickHandler, false);


  var domReady = false;
  function domReadyHandler() {
    domReady = true;
  }
  document.addEventListener('DOMContentLoaded', domReadyHandler, false);
  window.addEventListener('load', domReadyHandler, false);
  if (document.readyState === "complete") { domReadyHandler(); }

  window.__tfUpdateNodes = function() {
    if (!domReady) {
      setTimeout(function() {
        window.__tfUpdateNodes();
      }, 500);
      return ;
    }
    [].slice.call(document.querySelectorAll(tfInjectClassName)).forEach(function(el) {
      el.classList.remove(tfInjectClassName);
    });
    tfNodes = injectClassToTfParentNode();
    window.console.info('textFree: view updated! You can manual update with: __tfUpdateNodes()');
  };

  window.__tfUpdateNodes();

})();