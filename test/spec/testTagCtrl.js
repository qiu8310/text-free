var TagCtrl = require('lib/tag-ctrl.js');


describe('TextReplace', function() {

  var ctrl,
    startTag, tfTag, firstTag;

  beforeEach(function() {
    var tpl =
      '{%ha%}<div>' +
      '<h1><span style="color:red;">Yes</span> {% start %} No</h1>' +
      '<p>Boss: {% person.boss %}</p> <textarea>{% tf|process:a %}</textarea>' +
      '</div>';

    ctrl = new TagCtrl(tpl);
    firstTag = ctrl.firstTag();
    startTag = ctrl.tags[1];
    tfTag = ctrl.tags[3];
  });

  it('should work', function() {
    expect(ctrl).toBeDefined();
    expect(firstTag).toBeDefined();
    expect(startTag).toBeDefined();
    expect(tfTag).toBeDefined();

    expect(firstTag.startIndex).toBe(0);
    expect(firstTag.endIndex).toBe(6);

    expect(startTag.raw).toBe('{% start %}');
    expect(startTag.key).toBe('start');

    expect(tfTag.raw).toBe('{% tf|process:a %}');
    expect(tfTag.key).toBe('tf');
    expect(tfTag.processes).toEqual([{name: 'process', params: ['a']}]);
  });


  it('should can expand', function() {

    expect(startTag.backward('>')).toBe(true);
    expect(startTag.raw).toBe('> {% start %}');

    expect(tfTag.expand('textarea', /^(?:>\s*|\s*<\/)$/)).toBe(true);
    expect(tfTag.raw).toBe('textarea>{% tf|process:a %}</textarea');

  });

  it('should support RegExp when backward', function() {
    expect(startTag.backward(/>/)).toBe(true);
    expect(startTag.backward(/</)).toBe(false);
    expect(startTag.backward(/</, /^\/span$/)).toBe(true);
  });

  it('should support RegExp when forward', function() {
    expect(startTag.forward(/No/, /^\s*$/)).toBe(true);
    expect(startTag.forward(/>/)).toBe(false);
    expect(startTag.forward(/>/, /^<\/h1$/)).toBe(true);
  });

  it('should support RegExp when expend', function() {
    expect(tfTag.expand(/textarea/, /^(?:>\s*|\s*<\/)$/)).toBe(true);
  });



  it('should exec when no params', function() {
    var str = '<div><h1><span style="color:red;">Yes</span>  No</h1><p>Boss: </p> <textarea></textarea></div>';
    expect(ctrl.exec()).toBe(str);
  });

  it('should exec with params', function() {
    var str = '<div><h1><span style="color:red;">Yes</span>  No</h1><p>Boss: qiu</p> <textarea>tt-ff</textarea></div>';
    expect(ctrl.exec({
      person: {
        boss: 'qiu'
      },
      tf: 'tt-ff'
    })).toBe(str);
  });

  it('should support isHtml option', function() {
    var str = '<div><h1><span style="color:red;">Yes</span>  No</h1>' +
      '<p>Boss: <!-- tfStart person.boss -->qiu<!-- tfEnd --></p> <textarea>tt-ff</textarea></div>';
    expect(ctrl.exec({
      person: {
        boss: 'qiu'
      },
      tf: 'tt-ff'
    }, {isHtml: true})).toBe(str);
  });


});