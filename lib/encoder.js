/*  HTML character entity encoder and decoder */

var named = require('./named.json'),        // named entities
    special = require('./special.json');    // special numerical entities

// encode characters in the set &<>"' as character entities
exports.encode = function(str, ascii) {
    // <bool> ascii: also encode non-ASCII and non-printable characters
    var p = 0, s, res = '', pos, len = str.length;

    for (pos = 0; pos < len; pos++) {
        c = str.charAt(pos);

        if (c == '&') {
            s = '&amp;';
        }
        else if (c == '<') {
            s = '&lt;';
        }
        else if (c == '>') {
            s = '&gt;';
        }
        else if (c == '"') {
            s = '&quot;'
        }
        else if (c == '\'') {
            s = '&#39;';
        }
        else if (ascii === true && (c > "~" || c < " ")) {
            s = '&#' + c.charCodeAt(0) + ';';
        }
        else {
            continue;
        }

        res += str.slice(p, pos) + s, p = pos + 1;
    }

    return res + str.substr(p);
};

// decode numerical and named character entities
exports.decode = function(str, attr) {
    // <bool> attr: str is an html attribute value (see below)
    var pos = 0, res = '',
        p, c, s, base;

    loop: while (pos < str.length) {
        p = str.indexOf('&', pos);

        if (p == -1) {
            res += str.substr(pos);
            break;
        }

        res += str.slice(pos, p);
        c = str.charAt(++p);

        if (c == '#') {
            // numerical entity
            c = str.charAt(++p);

            if (s = c, c == 'x' || c == 'X') {
                // hexadecimal
                pos = ++p, base = 16;   // consume 'x'

                while(c = str.charAt(p),
                    c >= '0' && c <= '9' || c >= 'a' && c <= 'f'
                    || c >= 'A' && c <= 'F') {

                    ++p;
                }
            }
            else {
                // decimal
                pos = p, base = 10;

                while (c >= '0' && c <= '9') {
                    c = str.charAt(++p);
                }
            }

            if (pos == p) {
                // no characters consumed, abort
                res += base == 10 ? '&#' : '&#' + s;
                continue;
            }

            i = parseInt(str.slice(pos, p), base);

            if (special[i] !== void 0) {
                res += special[i];
            }
            else if (i >= 0xD800 && i <= 0xDFFF || i > 0x10FFFF) {
                // illegal, issue replacement character
                res += '\uFFFD';
            }
            else {
                res += String.fromCharCode(i);
            }

            // consume ';' and set position
            pos = str.charAt(++p) == ';' ? p + 1 : p;
        }
        else {
            // named entity
            pos = p;
            // maximum length of an entity that does not end in a semicolon: 6
            p = str.indexOf(';', pos) + 1 || pos + 6;

            do {
                // the minimum length of an entity is 2
                if (p < pos + 2) {
                    // no match
                    res += '&';
                    continue loop;
                }

                s = str.slice(pos, p--);

            } while (named[s] === void 0);

            /*  "If the character reference is being consumed as part of an
                attribute, and the last character matched is not a SEMICOLON
                character, and the next character is either a EQUALS SIGN
                character or an alphanumeric ASCII character, then, for
                historical reasons, all the characters that were matched after
                the AMPERSAND character must be unconsumed."
            */

            res += attr === true && str.charAt(p) != ';'
                && (c = str.charAt(p + 1), c >= 'a' && c <= 'z'
                || c >= 'A' && c <= 'Z' || c == '=' || c >= '0' && c <= '9')
                ? '&' + s : named[s];

            pos = p + 1;
        }
    }

    return res;
};
