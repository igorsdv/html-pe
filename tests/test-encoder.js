var html = require('../lib/html.js'),
    assert = require('assert');

assert.equal(html.encode('<p>Métro & "moi"</p>'),
    '&lt;p&gt;Métro &amp; &quot;moi&quot;&lt;/p&gt;');
assert.equal(html.encode('\t<p>Métro & \u00ac moi</p>', true),
    '&#9;&lt;p&gt;M&#233;tro &amp; &#172; moi&lt;/p&gt;');
console.log('encoder: pass');

// decoding tests inculded in parser tests
