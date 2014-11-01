var path = require('path');

module.exports = function(grunt) {

  // https://github.com/firstandthird/load-grunt-config
  require('load-grunt-config')(grunt, {

    // path to config.js files, defaults to grunt dir
    configPath: path.join(process.cwd(), 'config/grunt'),

    // auto grunt.initConfig
    init: true,

    // data passed into config.  Can use with <%= foo %>
    data: {

    },

    // can optionally pass options to load-grunt-tasks.
    // If you set to false, it will disable auto loading tasks.
    loadGruntTasks: false,

    // just in time load grunt tasks
    // https://github.com/shootaroo/jit-grunt#static-mappings
    jitGrunt: {
      customTasksDir: 'plugins/grunt/tasks',

      // here you can pass options to jit-grunt (or just jitGrunt: true)
      staticMappings: {}
    },

    //can post process config object before it gets passed to grunt
    postProcess: function(config) {

    }

  });

};