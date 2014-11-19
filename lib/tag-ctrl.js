var KV = require('./kv.js');
var CONST = require('./variable.js');
var util = require('util');

function Tag(ctrl, raw, key, index) {
  var keys = key.trim().split('|');

  this.key = keys.shift();
  this.processes = keys.map(function(process) {
    var parts = process.split(':');
    return {
      name: parts.shift().toLowerCase(),
      params: parts
    };
  });

  this.isFrist = false;
  this.isLast = false;

  this.ctrl = ctrl;
  this.raw = raw;
  this.rawReplace = null; // 这个值为 null 时表示保持原来的 raw

  this.startIndex = index;
  this.endIndex = index + raw.length;

  this.nextTag = null; // 下一个 tag
  this.prevTag = null; // 上一个 tag
}

// 包括 toIndex 所指的字符，找不到就返回 null
Tag.prototype.goTo = function(toIndex, expect, rAllowed) {
  var content = this.ctrl.content;
  if (toIndex >= this.startIndex && toIndex < this.endIndex) {
    return null;
  }

  var reverse = this.startIndex > toIndex;
  var str = reverse ? content.substring(toIndex, this.startIndex) :
    content.substring(this.endIndex, toIndex + 1);

  rAllowed = rAllowed ? rAllowed : /^\s*$/;


  var raw, index, middleWord, find = null;


  if (expect instanceof RegExp) {

    var handler = function() {
      index = arguments[arguments.length - 2];
      middleWord = reverse ?
        raw.substr(index + arguments[0].length) :
        raw.substring(0, index);
      if (rAllowed.test(middleWord)) {
        find = {
          expectWord: arguments[0],
          middleWord: middleWord
        };
      }
    };

    raw = str;
    while (true) {
      index = false;
      raw.replace(expect, handler);

      // 如果正则表达示是 global 的话也没必要再匹配了
      if (expect.global || !reverse || index === false) {
        break;
      }

      raw = raw.substr(index + 1);
    }

  } else if (typeof expect === 'string') {
    raw = reverse ? reverseStr(str) : str;
    index = raw.indexOf(reverse ? reverseStr(expect) : expect);

    if (index >= 0) {
      middleWord = raw.substring(0, index);
      middleWord = reverse ? reverseStr(middleWord) : middleWord;

      if (rAllowed.test(middleWord)) {
        find = {
          expectWord: expect,
          middleWord: middleWord
        };
      }
    }
  }


  if (find) {
    find.word = reverse ? find.expectWord + find.middleWord : find.middleWord + find.expectWord;
  }

  return find;
};


Tag.prototype.goToNext = function(expect, rAllowed) {
  var index = this.nextTag ? this.nextTag.startIndex - 1 : this.ctrl.contentLength - 1;
  return this.goTo(index, expect, rAllowed);
};

Tag.prototype.goToPrev = function(expect, rAllowed) {
  var index = this.prevTag ? this.prevTag.endIndex : 0;
  return this.goTo(index, expect, rAllowed);
};

// 向两边扩展
Tag.prototype.expand = function(expect, rAllowed) {
  var leftFind = this.goToPrev(expect, rAllowed),
    rightFind = this.goToNext(expect, rAllowed);

  if (leftFind && leftFind.expectWord === rightFind.expectWord) {
    this.raw = leftFind.word + this.raw + rightFind.word;
    this.startIndex -= leftFind.word.length;
    this.endIndex += rightFind.word.length;
    return true;
  }

  return false;
};

// 向右扩展
Tag.prototype.forward = function(expect, rAllowed) {
  var find = this.goToNext(expect, rAllowed);

  if (find) {
    this.raw = this.raw + find.word;
    this.endIndex += find.word.length;
  }

  return !!find;
};

// 向左扩展
Tag.prototype.backward = function(expect, rAllowed) {
  var find = this.goToPrev(expect, rAllowed);

  if (find) {
    this.raw = find.word + this.raw;
    this.startIndex -= find.word.length;
  }

  return !!find;
};




/**
 * 将 content 中的 {% foo.bar|process %} 这种结构全找出来
 * process 可以对这一区域内的文本进一步处理
 */
function TagCtrl(content, options) {
  options = require('./option.js')(options);

  var self = this,
    tplStartTag = options.tplStartTag,
    tplEndTag = options.tplEndTag;

  this.content = content;
  this.contentLength = content.length;
  this.options = options;
  this.tags = [];

  // 全局匹配  "{% foo.bar|process:param_1:param_2|another_process %}
  var rTpl = new RegExp(escapeReg(tplStartTag) + '(.*?)' + escapeReg(tplEndTag), 'g');


  // 处理 content, 找到每个标签所在的位置
  this.content.replace(rTpl, function(raw, key, index) {
    self.addTag(new Tag(self, raw, key, index));
  });


  // 标记首尾 tag
  [this.firstTag(), this.lastTag()].forEach(function(tag, index) {
    if (tag) {
      tag.isFrist = index === 0;
      tag.isLast = index === 1;
    }
  });

}


TagCtrl.prototype.firstTag = function() {
  return this.tags.length > 0 ? this.tags[0] : null;
};

TagCtrl.prototype.lastTag = function() {
  return this.tags.length > 0 ? this.tags[this.tags.length - 1] : null;
};

TagCtrl.prototype.addTag = function (tag) {
  var last = this.lastTag();

  tag.prevTag = last;
  if (last) {
    last.nextTag = tag;
  }

  this.tags.push(tag);
};


TagCtrl.processes = [];
TagCtrl.addProcess = function(key, fn, context) {
  if (typeof key === 'function') {
    fn = key;
    key = '*';
  }
  TagCtrl.processes.push({
    key: key.toLowerCase(),
    fn: fn,
    context: context
  });
};



TagCtrl.prototype.exec = function(data, options) {
  var self = this;
  data = data || {};
  options = options || {};

  this.tags.forEach(function(tag) {
    tag.rawReplace = KV.get(tag.key, '', data);
    TagCtrl.processes.forEach(function(tcp) {
      if (tcp.key === '*') {
        tcp.fn.call(tcp.context || self, tag, tag.rawReplace, options);
      }
    });
    tag.processes.forEach(function(p) {
      TagCtrl.processes.filter(function(tcp) { return tcp.key === p.name; })
        .forEach(function(tcp) {
          tcp.fn.call(tcp.context || self, tag, tag.rawReplace, options);
        });
    });

  });


  // 得到替换后的内容
  var content = [], start = 0, replace;
  if (this.tags.length === 0) {
    return this.content;
  }

  this.tags.forEach(function(tag) {
    content.push(self.content.substring(start, tag.startIndex));
    replace = tag.rawReplace === null ? tag.raw : tag.rawReplace;
    if (typeof replace !== 'string') {
      replace = replace.toString ? replace.toString() : replace + '';
    }
    content.push(replace);
    start = tag.endIndex;

    if (tag.isLast) {
      content.push(self.content.substr(start));
    }
  });
  return content.join('');
};




/*********************************************/
/****************  处理程序 *******************/
/*********************************************/
/**
 *  HTML 的处理程序
 *
 */
TagCtrl.addProcess('*', (function() {
  var rNoComment = [], noCommentZone = null;
  CONST.noHtmlCommentTags.forEach(function(htmlTag) {
    rNoComment.push('<\\/?' + htmlTag + '[^>]*>');
  });

  // 注释里也不能再添加注释
  rNoComment.push('<!\\-\\-|\\-\\->');
  rNoComment = new RegExp(rNoComment.join('|'), 'ig');

  function getNoCommentZone(content) {
    if (noCommentZone) {
      return noCommentZone;
    }

    var last = {};

    noCommentZone = [];
    content.replace(rNoComment, function(word, index) {
      var htmlTag = word.replace(/<\/?(\w+)[^>]*>/, '$1');
      if (htmlTag.indexOf('--') !== -1) { htmlTag = 'comment'; }

      if (!('start' in last)) {
        last.htmlTag = htmlTag;
        last.start = index;
      } else if (!('end' in last)) {
        last.end = index + word.length;
        noCommentZone.push(last);
        last = {};
      }
      return word;
    });

    return noCommentZone;
  }


  return function(tag, val, options) {
    // val 是空的不需要插入 html 注释
    if (!options.isHtml || !val || val === '') {
      return false;
    }
    var ctrl = tag.ctrl;

    // 特殊标签中不注释
    if(getNoCommentZone(ctrl.content).some(function(z) {
        return z.start < tag.startIndex && tag.endIndex < z.end;
      })) {
      return false;
    }

    // 在 < > 之间也不注释
    var left = tag.goToPrev('<', /^[^>]*$/),
      right = tag.goToNext('>', /^[^<]*$/);
    if (left && right) {
      return false;
    }

    tag.rawReplace = util.format('<!-- %s %s -->%s<!-- %s -->',
      ctrl.options.commentStart, tag.key, val, ctrl.options.commentEnd);

    return true;
  };
})());


/**
 * 去除 tag 外的引号
 * 尽量不要用正则，会比较慢
 */
TagCtrl.addProcess('unquote', function(tag, val, options) {
  return tag.expand('"') || tag.expand('\'');
});


TagCtrl.addProcess('json', function(tag, val, options) {
  tag.rawReplace = JSON.stringify(val);
  return true;
});


/*********************************************/
/****************  功能函数 *******************/
/*********************************************/
function escapeReg(str) {
  return '\\' + str.split('').join('\\');
}

function reverseStr(str) {
  return str.split('').reverse().join('');
}


module.exports = TagCtrl;