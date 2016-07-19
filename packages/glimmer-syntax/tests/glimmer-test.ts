import {
  Assert,
  Expect,
  expect as expectation,
  entity
} from './support/index';

QUnit.module("[glimmer-syntax] Glimmer AST")

function expect(message: string, input: string): Expect {
  let e = expectation(message, input);
  QUnit.test(message, assert => {
    new Assert(e).assert();
  });
  return e;
}

expect('text content', 'hello world')
  .content('hello world');

expect('comment content', '<!-- hello world -->')
  .comment(' hello world ');

expect('simple element', '<p>hello</p>')
  .openTag('p')
  .content('hello')
  .closeTag();

expect('nested element', 'a<div>before<p>hello</p>after</div>z')
  .content('a')
  .openTag('div')
  .content('before')
  .openTag('p')
  .content('hello')
  .closeTag()
  .content('after')
  .closeTag()
  .content('z');

expect('simple element with attr', '<p id="simple">hello</p>')
  .openTag('p')
  .attr('id', 'simple', { quote: 'double' })
  .content('hello')
  .closeTag();

expect("A simple tag with trailing spaces", "<div   \t\n></div>")
  .openTag('div')
  .whitespace('  \t\n')
  .closeTag();

expect("An unclosed tag", '<div>')
  .unbalanced();

expect("Nested tags", "<div><p><span>hi</span></p></div>")
  .openTag('div')
  .openTag('p')
  .openTag('span')
  .content('hi')
  .closeTag()
  .closeTag()
  .closeTag();

expect("A simple closing tag with trailing spaces", "<div></div   \t\n>")
  .openTag('div')
  .closeTag({ whitespace: '  \t\n' });

expect("A pair of hyphenated tags", "<x-foo></x-foo>")
  .openTag('x-foo')
  .closeTag();

expect("A tag with a single-quoted attribute", "<div id='foo'></div>")
  .openTag('div')
  .attr('id', 'foo', { quote: 'single' })
  .closeTag();

expect("A tag with a double-quoted attribute", '<div id="foo"></div>')
  .openTag('div')
  .attr('id', 'foo', { quote: 'double' })
  .closeTag();

expect("A tag with a double-quoted empty", '<div id=""></div>')
  .openTag('div')
  .attr('id', '', { quote: 'double' })
  .closeTag();

expect("A tag with unquoted attribute", '<div id=foo></div>')
  .openTag('div')
  .attr('id', 'foo')
  .closeTag();

expect("A tag with valueless attributes", '<div foo bar></div>')
  .openTag('div')
  .attr('foo', null)
  .attr('bar', null)
  .closeTag();

expect("A tag with multiple attributes", `<div id=foo class="bar baz" href='bat'></div>`)
  .openTag('div')
  .attr('id', 'foo')
  .attr('class', 'bar baz', { quote: 'double' })
  .attr('href', 'bat', { quote: 'single' })
  .closeTag();

expect("A tag with capitalization in attributes", '<svg viewBox="0 0 0 0"></svg>')
  .openTag('svg')
  .attr('viewBox', '0 0 0 0', { quote: 'double' })
  .closeTag();

expect("A tag with capitalization in the tag", "<linearGradient></linearGradient>")
  .openTag('linearGradient')
  .closeTag();

expect("DIVERGENCE: A self-closing tag", '<img />')
  .openTag('img')
  .selfClosing();

expect("void tags", '<img>')
  .openTag('img');

expect("DIVERGENCE: A self-closing tag with valueless attributes", '<input disabled />')
  .openTag('input')
  .attr('disabled', null)
  .selfClosing();

expect("DIVERGENCE: A self-closing tag with valueless attributes", '<input disabled/>')
  .openTag('input')
  .attr('disabled', null)
  .selfClosing({ whitespace: '' });


expect("A tag with / in the middle", '<img / src="foo.png">')
  .openTag('img')
  .whitespace(' /')
  .attr('src', 'foo.png', { quote: 'double' });


expect("An opening and closing tag with some content", "<div id='foo' class='{{bar}} baz'>Some content</div>")
  .openTag('div')
  .attr('id', 'foo', { quote: 'single' })
  .attr('class', '{{bar}} baz', { quote: 'single' })
  .content('Some content')
  .closeTag();

expect("A comment", `<!-- hello -->`)
  .comment(' hello ');

expect("A (buggy) comment with no ending --", `<!-->`)
  .comment('', { closing: false });

expect("A comment that immediately closes", `<!---->`)
  .comment('');

expect("A comment that contains a -", `<!-- A perfectly legal - appears -->`)
  .comment(' A perfectly legal - appears ');

expect("A (buggy) comment that contains two --", `<!-- A questionable -- appears -->`)
  .comment(' A questionable -- appears ');

expect("Character references are expanded", "&quot;Foo &amp; Bar&quot; &lt; &#60;&#x3c; &#x3C; &LT; &NotGreaterFullEqual; &Borksnorlax; &nleqq;")
  .entity("&quot;", `"`)
  .content("Foo ")
  .entity("&amp;", "&")
  .content(" Bar")
  .entity("&quot;", `"`)
  .content(" ")
  .entity("&lt;", "<")
  .content(" ")
  .entity("&#60;", "<")
  .entity("&#x3c;", "<")
  .content(" ")
  .entity("&#x3C;", "<")
  .content(" ")
  .entity("&LT;", "<")
  .content(" ")
  .entity("&NotGreaterFullEqual;", "≧̸")
  .content(" &Borksnorlax; ")
  .entity("&nleqq;", "≦̸");

expect("Character refs in attributes", "<div title='&quot;Foo &amp; Bar&quot; &blk12; &lt; &#60;&#x3c; &#x3C; &LT; &NotGreaterFullEqual; &Borksnorlax; &nleqq;'></div>")
  .openTag('div')
  .attr('title', [
    entity('&quot;', `"`),
    "Foo ",
    entity("&amp;", "&"),
    " Bar",
    entity("&quot;", `"`),
    " ",
    entity("&blk12;", "▒"),
    " ",
    entity("&lt;", "<"),
    " ",
    entity("&#60;", "<"),
    entity("&#x3c;", "<"),
    " ",
    entity("&#x3C;", "<"),
    " ",
    entity("&LT;", "<"),
    " ",
    entity("&NotGreaterFullEqual;", "≧̸"),
    " &Borksnorlax; ",
    entity("&nleqq;", "≦̸")
  ], { quote: 'single' })
  .closeTag();


expect("Carriage returns are replaced with line feeds", "\r\r\n\r\r\n\n")
  .content("\n\n\n\n\n")

expect("interleaved start-tag and chars", "Chars<div>Chars</div>")
  .content("Chars")
  .openTag("div")
  .content("Chars")
  .closeTag()

expect("void tags", "<img src='ohai'>")
  .openTag('img')
  .attr('src', 'ohai', { quote: 'single' })
  .voidTag();

expect("self-closing tags", "<img src='ohai' />")
  .openTag('img')
  .attr('src', 'ohai', { quote: 'single' })
  .selfClosing();

expect("start tag after ref", "&lt;<div></div>&gt;")
  .entity('&lt;', '<')
  .openTag('div')
  .closeTag()
  .entity('&gt;', '>')
