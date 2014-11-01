/**
 *
 * 通过字符串的形式获取或设置 obj 中的值，key 可以用 foo.bar 的形式去获取深层的 obj 中的值
 * obj 支持数组
 *
 * @example
 *  obj = {person: {wang: 'W', li: 'L'}, target: 'foo'}
 *
 *  KV.set('person.wang', 'WW') => true
 *  KV.get('person.li') => 'L'
 *
 *
 * @type {{get: Function, set: Function}}
 */

module.exports = {

  /**
   *
   * @param key
   * @param obj
   * @param defaultVal
   * @returns {*}
   */
  get: function(key, defaultVal, obj) {
    if (arguments.length === 2) {
      obj = defaultVal;
      defaultVal = undefined;
    }
    if (typeof key !== 'string') {
      return defaultVal;
    }

    var ref = obj, keys;
    keys = key.split('.');
    while(true) {
      key = keys.shift();
      if (!key) {
        break;
      }

      if (typeof ref !== 'object' || !(key in ref)) {
        ref = undefined;
        break;
      }

      ref = ref[key];
    }

    return ref === undefined ? defaultVal : ref;
  },


  /**
   *
   * @param key {string}
   * @param val {*}
   * @param force {boolean} [optional]
   * @param obj
   * @returns {boolean}
   */
  set: function(key, val, force, obj) {
    if (typeof key !== 'string') {
      return false;
    }

    if (typeof force === 'object') {
      obj = force;
      force = false;
    }

    var keys = key.trim().split('.'),
      ref = obj,
      isLast;

    while(keys.length > 0) {
      key = keys.shift();
      isLast = !keys.length;

      if (!key) {
        break;
      }


      if (isLast) {
        ref[key] = val;
      } else {
        if (ref && (key in ref) && typeof ref[key] === 'object') {
          ref = ref[key];
        } else {
          if (force) {
            ref = ref[key] = {};
          } else {
            return false;
          }
        }
      }
    }

    return true;
  }
};