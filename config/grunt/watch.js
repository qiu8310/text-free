module.exports = {

  jshintDev: {
    files: ['<%= jshint.dev.src %>'],
    tasks: ['jshint:dev']
  },

  jshintTest: {
    files: ['<%= jshint.test.src %>'],
    tasks: ['jshint:test']
  },

  karma: {
    files: ['test/spec/**/*.js', 'lib/**/*.js'],
    tasks: ['browserify:test', 'karma']
  }

};