module.exports = {
  options: {
    jshintrc: '.jshintrc',
    reporter: require('jshint-stylish')
  },

  dev: {
   src: [
     'script/*.js',
     'lib/*.js',
     'tasks/*.js',
     '*.js',
     'config/**/*.js'
   ]
  },

  test: {
    options: {
      jshintrc: 'test/.jshintrc'
    },
    src: [
      'test/spec/**/*.js'
    ]
  }
};