var option = require('lib/option.js');


describe('option', function() {

  it('@attributes', function() {
    expect(typeof option).toBe('function');
    expect(option.defaultConfig).toBeDefined();
  });


  beforeEach(function() {
    this.config = option.defaultConfig;
  });


  it('should return a copy of defaultConfig', function() {
    expect(option()).not.toBe(this.config);
    expect(option()).toEqual(this.config);
  });


  it('should update defaultConfig', function() {
    var keys = Object.keys(option.defaultConfig);
    var key = keys[0];
    if (key) {
      var obj = {};
      obj[key] = '123';
      var rtn = option(obj);

      expect(rtn[key]).toBe('123');
    }

  });



});