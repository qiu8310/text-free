/**
 * 运行 grunt task，并得到其结果
 * 这是个异步的程序，因为 grunt.task.run 是异步的
 */
function runGruntTask(grunt, task, taskTarget, fn, cb) {
  if (typeof taskTarget === 'function') {
    cb = fn;
    fn = taskTarget;
    taskTarget = null;
  }

  var targetsLength,
    targets = Object.keys(grunt.config.getRaw(task) || {})
      .filter(function(target) {
        return !/^_|^options$/.test(target) && (!taskTarget || target === taskTarget);
      });
  targetsLength = targets.length;

  function runCB() {
    if (targetsLength === 0 && (typeof cb === 'function')) {
      cb();
    }
  }

  function handler(key) {
    return function() {
      fn.apply(this, arguments);
      delete global[key];
      key = null;
      targetsLength -= 1;
      runCB();
    };
  }

  runCB();
  targets.forEach(function(target) {
    var key = '__tf-' + Date.now() + Math.random().toString(16).replace('.', '');
    global[key] = handler(key);
    grunt.task.run([task, target, key].join(':'));
  });
}




module.exports = {
  runGruntTask: runGruntTask

};