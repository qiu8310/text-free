module.exports = {

  options: {
    browserifyOptions: {
      debug: true
    },

    // set alias
    preBundleCB: function(b) {
      b.plugin(require('remapify'), [
        {
          src: 'lib/*.js',
          expose: ''
          //filter: function(alias, dirname, basename) {}
        }
      ]);
    }
  },


  test: {
    files  : [
      {
        expand: true,
        cwd   : 'test/spec',
        src   : '**/*.js',
        dest  : '.tmp/spec'
      }
    ]
  }
};