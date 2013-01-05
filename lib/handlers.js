/*  Basic handlers: DOM and Printer */

var htmldom = require('./dom.js');

var Text = htmldom.Text,
    Element = htmldom.Element;

var Handler = exports.Handler = new Function;

// provide these methods to create new handlers
Handler.prototype.listen = function(parser) {
    parser.on('open', this.onopen.bind(this));
    parser.on('close', this.onclose.bind(this));
    parser.on('text', this.ontext.bind(this));
    parser.on('end', this.onend.bind(this));
};

var DOM = exports.DOM = function(callback) {
    // current node; root node
    this.cn = this.document = new Element;
    this.cb = callback;
};

DOM.prototype = Object.create(Handler.prototype);

DOM.prototype.onopen = function(name, attributes, empty) {
    // append node to current node's children
    var node = new Element(name, attributes);
    node.parent = this.cn;
    this.cn.children[this.cn.children.length] = node;
    // set current node if not self-closing
    if (empty === false) {
        this.cn = node;
    }
};

DOM.prototype.onclose = function(name) {
    this.cn = this.cn.parent;
};

DOM.prototype.ontext = function(text) {
    // append text node to current node's children
    var node = new Text(text);
    node.parent = this.cn;
    this.cn.children[this.cn.children.length] = node;
};

DOM.prototype.onend = function() {
    // end: call callback
    this.cb(this.document);
};

DOM.prototype.reset = function() {
    this.cn = this.document = new Element;
};

var Printer = exports.Printer = function() {
    this.indent = 0;
};

Printer.prototype = Object.create(Handler.prototype);

Printer.prototype.onopen = function(name, attributes, close) {
    for (var i = 0; i < this.indent; i++) {
        process.stdout.write(' ');
    };

    process.stdout.write('<' + name);

    for (var k in attributes) {
        process.stdout.write(' ' + k + '="' + attributes[k] + '"');
    }

    process.stdout.write((close ? ' /' : '') + '>\n');
    if (!close)
        this.indent++;
};

Printer.prototype.ontext = function(text) {
    for (var i = 0; i < this.indent; i++) {
        process.stdout.write(' ');
    };

    process.stdout.write(text + '\n');
};

Printer.prototype.onclose = function(name) {
    this.indent--;

    for (var i = 0; i < this.indent; i++) {
        process.stdout.write(' ');
    };

    process.stdout.write('</' + name + '>\n');
};

Printer.prototype.onend = new Function;
