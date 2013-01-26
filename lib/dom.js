/*  Basic DOM methods */

var Node = function(type) {
    this.type = type;   // 'element' or 'text'
    this.parent = {};
};

var Text = exports.Text = function(text) {
    Node.call(this, 'text');
    this.text = text;
};

var Element = exports.Element = function(name, attributes) {
    Node.call(this, 'element');
    this.name = name || '';
    this.attributes = attributes || '';
    this.children = [];
};

Text.prototype = Object.create(Node.prototype);
Element.prototype = Object.create(Node.prototype);

Node.prototype.__defineGetter__('textContent', function() {
    var text = '';

    if (this.type == 'text') {
        return this.text;
    }

    for (var i = 0; i < this.children.length; i++) {
        text += this.children[i].textContent;
    }

    return text;
});

Element.prototype.getElementsBy = function(test) {
    // test: element -> bool
    // recursively filter element's children by test
    var elems = [], children = this.children;

    for (var i = 0; i < children.length; i++) {
        if (children[i].type != 'element') {
            continue;
        }

        if (test(children[i]) === true) {
            elems[elems.length] = children[i];
        }

        if (children[i].children.length > 0) {
            elems = elems.concat(children[i].getElementsBy(test));
        }
    }
    return elems;
};

Element.prototype.getElementBy = function(test) {
    // test: element -> bool
    // equivalent to getElementsBy(test)[0]
    var elem, children = this.children;

    for (var i = 0; i < children.length; i++) {
        if (children[i].type != 'element') {
            continue;
        }

        if (test(children[i]) === true) {
            return children[i];
        }

        if (children[i].children.length > 0 &&
            (elem = children[i].getElementBy(test), elem !== void 0)) {

            return elem;
        }
    }

    return void 0;
};

Element.prototype.getElementById = function(id) {
    return this.getElementBy(function(elem) {
        return elem.attributes.id ? elem.attributes.id == id : false;
    });
};

Element.prototype.getElementsByName = function(name) {
    return this.getElementsBy(function(elem) {
        return elem.attributes.name ? elem.attributes.name == name : false;
    });
};

Element.prototype.getElementsByClassName = function(name) {
    return this.getElementsBy(function(elem) {
        return elem.attributes['class'] ?
            elem.attributes['class'].split(' ').indexOf(name) != -1 : false;
    });
};

Element.prototype.getElementsByTagName = function(name) {
    return this.getElementsBy(function(elem) {
        return elem.name == name;
    });
};
