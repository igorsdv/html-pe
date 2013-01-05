/*  Fast, forgiving, relatively standards-compliant HTML parser. */

var decode = require('./encoder.js').decode,
    EventEmitter = require('events').EventEmitter;

var Parser = exports.Parser = function(options) {
    // options
    // <bool> trim (false): trim whitespace in text nodes
    // <bool> decode (true): decode character entities
    EventEmitter.call(this);
    this.trim = options !== void 0 && options.trim !== void 0
        ? options.trim : false;
    this.decode = options !== void 0 && options.decode !== void 0
        ? options.decode : true;
    this.buf = this.text = '';
    this.state = 0;           // 0 text, 1 tag, 2-3 attribute, 4 bogus comment
    this.raw = false;         // script, style, textarea, title
    this.stack = [];          // stack of open elements
};

Parser.prototype = Object.create(EventEmitter.prototype);

Parser.prototype.write = function(chunk) {
    var pos = 0, p, r, s, c,
        str = this.buf + chunk,
        len = str.length,
        state = this.state;

    /*  on EOF: break loop, restart from character pointed to by pos in same
        state with next chunk appended OR finalize in .end() if last chunk
    */

    loop: while (pos < len) {
        switch (state) {
            case 0:     // text
                p = str.indexOf(this.raw === true ? '</' : '<', pos);

                if (p == -1) {
                   this.text += str.substr(pos);
                   pos = len;
                   break loop;
                }

                this.text += str.slice(pos, p);
                pos = p + 1;

                state = 1;
                // fallthrough
            case 1:     // tag
                p = pos, c = str.charAt(p);

                if (c == '/') {
                    // closing tag, possibly inside rawtext

                    c = str.charAt(++p);

                    if (c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z') {
                        // match tag and discard attributes

                        // tag name: /[^\s\/>]+/
                        while (c = str.charAt(++p),
                            c != ' ' && c != '/' && c != '>' &&
                            c != '\n' && c != '\t' && c != '\r') {

                            if (c == '') {
                                // EOF
                                break loop;
                            }
                        }

                        // consume '/' and set name
                        this.name = str.slice(++pos, p).toLowerCase();

                        // console.log('tha name is', this.name)
                        if (this.raw === true) {
                            // close rawtext only if appropriate closing tag
                            if (this.name == this.stack[this.stack.length-1]) {
                                this.raw = false;
                            }
                            else {
                                // inappropriate tag, emit as text
                                this.text += '</';
                                // reset state
                                state = 0;
                                break;
                            }
                        }

                        pos = p;

                        state = 3; // closing tag attribute
                        // fallthrough
                    }
                    else if (this.raw === true) {
                        // emit as text, reset state
                        this.text += '</';
                        state = 0, pos = p;
                        break;
                    }
                    else if (c != '') {
                        // bogus comment
                        state = 4;
                        break;
                    }
                    else {
                        // EOF
                        break loop;
                    }
                }
                else if (c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z') {
                    // open tag

                    // tag name: /[^\s\/>]+/
                    while (c = str.charAt(++p),
                        c != ' ' && c != '/' && c != '>' &&
                        c != '\n' && c != '\t' && c != '\r') {

                        if (c == '') {
                            // EOF
                            break loop;
                        }
                    }

                    this.name = str.slice(pos, p).toLowerCase();
                    this.attributes = {};

                    pos = p;

                    state = 2; // attribute
                    // fallthrough
                }
                else if (c == '!') {
                    // CDATA declaration or comment

                    if (str.substr(++p, 7) == '[CDATA[') {
                        p = str.indexOf(']]>', p + 7);

                        if (p == -1) {
                            // EOF
                            break loop;
                        }

                        // ignore CDATA, reset state
                        state = 0, pos = p + 3;
                    }
                    else if (str.substr(p, 2) == '--') {
                        p = str.indexOf('-->', p);     // <!--> is valid

                        if (p == -1) {
                            // EOF
                            break loop;
                        }

                        // ignore comment, reset state
                        state = 0, pos = p + 3;
                    }
                    else {
                        // bogus comment
                        state = 4;
                    }

                    break;
                }
                else if (c == '?') {
                    // bogus comment
                    state = 4;
                    break;
                }
                else if (c != '') {
                    // emit as text, reset state
                    this.text += '<';
                    state = 0;
                    break;
                }
                else {
                    // EOF
                    break loop;
                }
            case 2:     // opening tag attribute
            case 3:     // closing tag attribute
                p = pos;

                while (c = str.charAt(p), c != '>') {
                    // consume whitespace and discard slashes
                    while (c == ' ' || c == '/' || c == '\n'
                        || c == '\t' || c == '\r') {

                        c = str.charAt(++p);
                    }

                    if (c == '>') {
                        break;
                    }

                    pos = p;    // checkpoint xD

                    // attribute name: /[^\s\/>][^\s\/>=]*/
                    while (c = str.charAt(++p),
                        c != ' ' && c != '=' && c != '>' &&
                        c != '\n' && c != '\t' && c != '\r') {

                        if (c == '') {
                            // EOF
                            break loop;
                        }
                    }

                    if (state == 2) {
                        k = str.slice(pos, p).toLowerCase();
                    }

                    // consume whitespace
                    while (c == ' ' || c == '\n' || c == '\r' || c == '\t') {
                        c = str.charAt(++p);
                    }

                    // attribute value: /=\s*("[^"]*"|'[^']*'|[^"'][^\s>]*)?/
                    if (c != '=')  {
                        // empty attribute
                        if (state == 2) {
                            this.attributes[k] = '';
                        }

                        continue;
                    }

                    // consume whitespace
                    while (c = str.charAt(++p),
                        c == ' ' || c == '\n' || c == '\r' || c == '\t');

                    if (c == '\'' || c == '"') {
                        // quoted value
                        s = ++p;
                        p = str.indexOf(c, s);

                        if (p == -1) {
                            // EOF
                            break loop;
                        }

                        if (state == 2) {
                            this.attributes[k] = this.decode === true
                                ? decode(str.slice(s, p), true)
                                : str.slice(s, p);
                        }

                        ++p; // consume endquote
                    }
                    else {
                        // unquoted value
                        s = p;

                        while (c != ' ' && c != '>' &&
                            c != '\n' && c != '\t' && c != '\r') {

                            c = str.charAt(++p);

                            if (c == '') {
                                // EOF
                                break loop;
                            }
                        }

                        if (state == 2) {
                            this.attributes[k] = this.decode === true
                                ? decode(str.slice(s, p), true)
                                : str.slice(s, p);
                        }
                    }
                }

                pos = p + 1;    // consume '>'

                // emit event
                if (state == 2) {
                    this.open();
                }
                else {
                    this.close();
                }

                // reset state
                state = 0;
                break;
            case 4:     // bogus comment
                p = str.indexOf('>', pos);

                if (p == -1) {
                    // EOF
                    break loop;
                }

                // ignore comment, reset state
                pos = p + 1;
                state = 0;
        }
    }

    this.buf = str.substr(pos);
    this.state = state;
};

Parser.prototype.emitText = function() {
    var t = this.decode === true ? this.trim === true
        ? decode(this.text, false).trim() : decode(this.text, false)
        : this.trim === true ? this.text.trim() : this.text;

    if (t !== '') {
        this.emit('text', t);
        this.text = '';
    }
};

Parser.prototype.end = function() {
    var i, s = this.stack;

    // write buffer if rawtext, else discard
    if (this.raw === true) {
        if (this.state == 1) {
            // the '<' is lost when parsing a tag, so we prepend it
            this.text += '<';
        }

        this.text += this.buf;
        this.raw = false;
    }

    if (this.text !== '') {
        this.emitText();
    }

    for (i = s.length - 1; i >= 0; --i) {
        this.emit('close', s[i]);
    }

    // reset
    this.state = 0, s.length = 0;
    this.buf = '', this.name = '';

    this.emit('end');
};

Parser.prototype.open = function() {
    var n = this.name, s = this.stack;

    // merge consecutive text events
    if (this.text !== '') {
        this.emitText();
    }

    if (n == 'p' && s[s.length - 1] == 'p') {
        this.emit('close', 'p');
        this.emit('open', 'p', this.attributes, false);
    }
    else {
        if (n == 'area' || n == 'base' || n == 'br' || n == 'col'
            || n == 'command' || n == 'embed' || n == 'hr' || n == 'img'
            || n == 'input' || n == 'keygen' || n == 'link' || n == 'meta'
            || n == 'param' || n == 'source' || n == 'track' || n == 'wbr') {
            // close self-closing tags immediately
            this.emit('open', n, this.attributes, true);
        }
        else {
            s[s.length] = n;

            if (n == 'script' || n == 'style' || n == 'textarea'
                || n == 'title') {

                this.raw = true;
            }

            this.emit('open', n, this.attributes, false);
        }
    }
};

Parser.prototype.close = function() {
    var n = this.name, s = this.stack, i, j;

    // merge consecutive text events
    if (this.text !== '') {
        this.emitText()
    }

    for (i = s.length - 1; i >= 0; --i) {
        if (s[i] == n) {
            // match found, close all misnested children
            for (j = s.length - 1; j >= i; --j) {
                this.emit('close', s[j]);
            }

            s.length = i;
            return;
        }
    }

    if (n == 'br') {
        // convert stray </br> to <br />
        this.emit('open', 'br', {}, true);
    }

    // discard if no match
};

Parser.prototype.parse = function(str) {
    this.write(str);
    this.end();
};
