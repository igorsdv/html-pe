var html = require('../lib/html.js'),
    assert = require('assert');

var parser = new html.Parser(),
    DOM = new html.DOM(new Function),
    printer = new html.Printer();

// uncomment to log parsed html
// printer.listen(parser);

DOM.listen(parser);

DOM.cb = function(document) {
    assert.ok(document.children.length == 1);
    assert.equal(document.children[0].name, 'div');
    assert.deepEqual(document.children[0].attributes, {
        style: 'color:red'
    });
    assert.equal(document.children[0].children[0].text, 'foo ');
    console.log('chunked parsing: pass');
};
parser.write('<di');
parser.write('v style="');
parser.write('color:red');
parser.write('">foo </');
parser.write('div>');
parser.end();

DOM.reset();

DOM.cb = function(document) {
    assert.ok(document.children.length == 1);
    assert.equal(document.children[0].name, 'p');
    assert.deepEqual(document.children[0].attributes, {
        '=': '=foo',
        'bar': 'x\'y\'z>'
    });
    assert.equal(document.children[0].children[0].text, 'bar');
    console.log('improper syntax: pass');
};
parser.parse('<p = ==foo bar="x\'y\'z>">bar');

DOM.reset();

DOM.cb = function(document) {
    assert.ok(document.children.length == 1);
    assert.equal(document.children[0].name, 'textarea');
    assert.equal(document.children[0].children[0].text,
        '<div></div></</</div');
    console.log('closing rawtext elements: pass');
};
parser.parse('<textarea><div></div></</</div</textarea>');

DOM.reset();

DOM.cb = function(document) {
    assert.equal(document.children[0].text, 'abcd');
    console.log('comments and bogus comments: pass')
};
parser.parse('<!doctype html>a<!-->b<![CDATA[baz]]>c<?foo bar=etc>d');

DOM.reset();

DOM.cb = function (document) {
    assert.ok(document.children.length == 3);
    assert.equal(document.children[0].name, 'meta');
    assert.equal(document.children[1].name, 'p');
    assert.equal(document.children[1].children[0].text, 'one');
    assert.equal(document.children[2].name, 'p');
    assert.equal(document.children[2].children[0].text, 'two');
    assert.equal(document.children[2].children[1].name, 'br');
    console.log(
        'self-closing tags, consecutive paragraphs, stray linebreaks: pass');
};
parser.parse('<meta /><p>one<p>two</br></p>');

DOM.reset();

DOM.cb = function(document) {
    assert.deepEqual(document.children[0].attributes, {
        foo: '&notbar&not=bar\u00acbar'
    });
    assert.equal(document.children[0].children[0].text, '\u2209\u00acbar');
    console.log('escaped entities in attribute values and text nodes: pass');
};
parser.parse('<p foo=&notbar&not=bar&not;bar>&notin;&notbar</p>');

DOM.reset();

// testing options
parser = new html.Parser({
    trim: true,
    decode: false
});

DOM.listen(parser);
// printer.listen(parser);

DOM.cb = function(document) {
    assert.deepEqual(document.children[0].attributes, {
        foo: '&not;bar'
    });
    assert.equal(document.children[0].children[0].text, '&not;baz');
    console.log('trim/decode options: pass');
}
parser.parse('<p foo=&not;bar>   &not;baz </p>');
