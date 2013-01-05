var parser = require('./parser.js'),
    encoder = require('./encoder.js'),
    handlers = require('./handlers.js'),
    dom = require('./dom.js');

module.exports = {
    Parser: parser.Parser,
    DOM: handlers.DOM,
    Printer: handlers.Printer,
    Handler: handlers.Handler,
    Text: dom.Text,         // text node
    Element: dom.Element,   // element node
    encode: encoder.encode,
    decode: encoder.decode
};
