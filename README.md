# html-pe

`html-pe` is for those who expect accuracy from their HTML parser, but are
unwilling to compromise on performance. This parser handles a variety of edge
cases as prescribed by the HTML5 standard and remains performant thanks to
optimizations such as avoiding regular expressions.

Chunked parsing is supported, and an efficient HTML entity encoder/decoder is
included.

## Installation

`npm install html-pe`

## Usage

```javascript
var html = require('html-pe');

var parser = new html.Parser();

// parse chunks
parser.write('<p style="color:red">foo');
parser.write('</p>');
parser.end();

// parse entire string
parser.parse('<div id="main">bar</div>');
```

Optionally, an `options` object may be passed to the constructor (default values
shown):

```javascript
var parser = new html.Parser({
    trim: false,    // trim whitespace in text nodes
    decode: true    // decode HTML character entities in attribute values and text nodes
});
```

### Event Handling

The parser is an `EventEmitter` and emits the following events:

```javascript
// opening tag
parser.on('open', function (name, attributes, empty) {
    // <string> name
    // <object> attributes
    // <bool> empty: is this an empty (self-closing) tag
});

// text node
parser.on('text', function (text) {
    // <string> text
});

// closing tag
parser.on('close', function (name) {
    // <string> name
});

// end
parser.on('end', function () {});
```

Two handlers are provided:

```javascript
var dom = new html.DOM(function (document) {
   // <object> document
});
dom.listen(parser);
// ...
dom.reset();

var printer = new html.Printer();
printer.listen(parser);
```

The `Printer` handler pretty-prints the parsed HTML to the console. The `DOM`
handler passes a `document` object to its callback, which is detailed below.
Follow the structure in `handlers.js` to create new handlers.

### DOM Manipulation

The `DOM` handler will parse `<div id="main">hello <b>world</b></div>` into the
following `document`:

```javascript
{
    type: 'element',
    parent: {},
    name: '',
    attributes: {},
    children: [{
        type: 'element',
        parent : [Circular],
        name: 'div',
        attributes: {
            id: 'main'
        },
        children: [{
            type: 'text',
            parent: [Circular],
            text: 'hello '
        },
        {
            type: 'element',
            parent: [Circular],
            name: 'b',
            attributes: {},
            children: [{
                type: 'text',
                parent: [Circular],
                text: 'world'
            }]
        }]
    }]
}
```

Nodes are either `Element` nodes or `Text` nodes. All nodes have a `textContent`
property. `Element` nodes provide the DOM navigation methods `getElementById`,
`getElementsByName`, `getElementsByClassName`, and `getElementsByTagName`. Two
primitive methods are also available: `getElementsBy(test)` and
`getElementBy(test)` where `test` is a function of type `Element -> bool`. For
example, this is how `getElementsBy` is used to implement
`getElementsByTagName`:

```javascript
var Element = html.Element;

Element.prototype.getElementsByTagName = function (name) {
    return this.getElementsBy(function (elem) {
        return elem.name == name;
    });
}
```

See `dom.js` for details.

### HTML Character Entity Encoder/Decoder

```javascript
var html = require('html-pe');

html.encode('<p id="main">Hello &amp; world!</p>',
            false   // encode &<>"' only (default)
           );
// '&lt;p id=&quot;main&quot;&gt;Hello &amp;amp; world!&lt;/p&gt;'
html.encode('<p>здравствуйте!</p>',
            true    // also encode all non-ASCII and non-printable characters
           );
// '&lt;p&gt;&#1079;&#1076;&#1088;&#1072;&#1074;&#1089;&#1090;&#1074;&#1091;&#1081;&#1090;&#1077;!&lt;/p&gt;'

html.decode('It&apos;s &not me');
// 'It\'s ¬ me'
```

See `encoder.js` for details.

## Performance

`html-pe` has slightly worse performance than
[htmlparser2](https://github.com/fb55/node-htmlparser). A benchmark is available
in `tests/bench.js`.

## License

MIT. See `LICENSE`.
