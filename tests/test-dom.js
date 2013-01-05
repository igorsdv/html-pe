var html = require('../lib/html.js'),
    assert = require('assert');

var parser = new html.Parser(),
    DOM = new html.DOM(function(document) {
        assert.equal(document.textContent, 'foobarbazwopwam');
        assert.equal(document.getElementBy(function(el) {
            return el.attributes['id'] == 'main';
        }).name, 'p');
        assert.ok(document.getElementsBy(function(el) {
            return el.attributes['name'] == 'mu';
        }).length == 3);
        console.log('textContent, getElement[s]By: pass');
        assert(document.children[0].children[0].parent == document.children[0]
            && document.children[0].children[1].parent == document.children[0]);
        console.log('parent: pass');
    });

DOM.listen(parser);

parser.write('<div name="mu">foo');
parser.write('<p id="main" name="mu">bar</p>baz</div>');
parser.write('<a id="main" name="mu">wop</a>wam');
parser.end();
