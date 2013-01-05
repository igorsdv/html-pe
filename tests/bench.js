var html = require('../lib/html.js'),
    htmlparser = require('htmlparser2');

function htmlpe() {
    var parser = new html.Parser({
        decode: false
    });

    var DOM = new html.DOM(function() {
        console.timeEnd('html-pe');
        setTimeout(htmlparser2, 1);
    });

    DOM.listen(parser);
    console.time('html-pe');

    for (var i = 0; i < 300000; i++) {
        parser.write('<p foo="bar">baz</p>');
    }

    parser.end();
}

function htmlparser2() {
    var handler = new htmlparser.DomHandler(function() {
        console.timeEnd('htmlparser2');
        setTimeout(htmlpe, 1);
    });
    var parser = new htmlparser.Parser(handler);

    console.time('htmlparser2');

    for (var i = 0; i < 300000; i++) {
        parser.write('<p foo="bar">baz</p>');
    }

    parser.end();
}

console.log('Parse and construct a DOM for 300,000 elements');
setTimeout(htmlpe, 1);
