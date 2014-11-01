var KV = require('lib/kv.js');

describe('KV', function() {


  it('@attributes', function() {

    expect(Object.keys(KV).length).toBe(2);
    expect(Object.keys(KV)).toContain('get');
    expect(Object.keys(KV)).toContain('set');

  });

  beforeEach(function() {
    this.data = {
      person: {
        a: 'Mora',
        b: 'Jack'
      },
      gender: ['man', 'woman'],
      cate: 'person'
    };
  });

  describe('#get', function() {
    it('should return undefined when get not exist key', function() {
      expect(KV.get('not.exist', this.data)).toBeUndefined();
    });

    it('should return default value when set', function() {
      expect(KV.get('not.exist', '', this.data)).toBe('');
      expect(KV.get('person.a.not', 2, this.data)).toBe(2);
      expect(KV.get('person.a.not.exist', false, this.data)).toBe(false);
    });

    it('should return exactly what the key specified', function() {
      expect(KV.get('person', this.data)).toBe(this.data.person);
      expect(KV.get('person.a', this.data)).toBe(this.data.person.a);
    });

    it('should support array number key', function() {
      expect(KV.get('gender.1', this.data)).toBe(this.data.gender[1]);
      expect(KV.get('gender.2', this.data)).toBeUndefined();
      expect(KV.get('gender', this.data)).toBe(this.data.gender);
    });

  });



  describe('#set', function() {
    it('should return false when the key not exist and return true when the key exist', function() {
      expect(KV.set('not.exist', 'foo', this.data)).toBe(false);
      expect(KV.set('cate', 'foo', this.data)).toBe(true);
    });

    it('should return true when use force to set a no-exist key', function() {
      expect(KV.set('foo.bar', 'foo', true, this.data)).toBe(true);
      expect(KV.get('foo.bar', this.data)).toBe('foo');

      expect(KV.set('person.a.b.bar', null, true, this.data)).toBe(true);
      expect(KV.get('person.a.b.bar', this.data)).toBe(null);
    });

    it('should set key to anything', function() {
      KV.set('cate', 3, this.data);
      expect(KV.get('cate', this.data)).toBe(3);
      expect(KV.get('cate', this.data)).not.toBe('3');

      KV.set('person', null, this.data);
      expect(KV.get('person', this.data)).toBe(null);
    });
  });

});