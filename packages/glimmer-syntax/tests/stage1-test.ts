import { Stage1, IR } from 'glimmer-syntax';
import { IRBuilder, build } from './support';

QUnit.module("[glimmer-syntax] Stage 1",  {});

function eq(template: string, callback: (b: IRBuilder) => void) {
  QUnit.test(`template: ${template}`, assert => {
    let parser = new Stage1(template);
    let actual = parser.parse();

    assert.deepEqual(actual, build(callback));
  });
}

eq('{{simple}}', b => {
  b.append(b.unknown('simple'));
  b.unknown('simple');
});

eq('{{simple.path}}', b => {
  b.append(b.path('simple.path'));
});

eq('{{simple pos}}', b => {
  b.append(b.args(
    'simple',
    [b.path('pos')]
  ));
});

eq('{{simple pos.path}}', b => {
  b.append(b.args(
    'simple',
    [b.path('pos.path')]
  ));
});

eq('{{simple named=path}}', b => {
  b.append(b.args(
    'simple',
    { named: b.path('path') }
  ));
});

eq('{{simple named=dotted.path}}', b => {
  b.append(b.args(
    'simple',
    { named: b.path('dotted.path') }
  ));
});

eq('{{simple pos.path named=dotted.path}}', b => {
  b.append(b.args(
    'simple',
    [b.path('pos.path')],
    { named: b.path('dotted.path') }
  ));
});

eq('{{simple named1=(name path.arg) named2=some.path}}', b => {
  b.append(b.args(
    'simple',
    {
      named1: b.args('name', [b.path('path.arg')]),
      named2: b.path('some.path')
    }
  ));
});

eq("<p></p>", b => {
  b.openElement('p');
  b.closeTag();
  b.closeElement();
});

eq("<p>hello world</p>", b => {
  b.openElement('p');
  b.closeTag();
  b.data('hello world');
  b.closeElement();
});

eq("<img><img><p>hello</p>", b => {
  b.openElement('img');
  b.voidTag();
  b.openElement('img');
  b.voidTag();
  b.openElement('p');
  b.closeTag();
  b.data('hello');
  b.closeElement();
});

eq("<img><p/><img><p /><p>hello</p>", b => {
  b.openElement('img');
  b.voidTag();
  b.openElement('p');
  b.selfClosingTag();
  b.openElement('img');
  b.voidTag();
  b.openElement('p');
  b.selfClosingTag();
  b.openElement('p');
  b.closeTag();
  b.data('hello');
  b.closeElement();
});

eq("<p>hello {{world}}</p>", b => {
  b.openElement('p');
  b.closeTag();
  b.data('hello ');
  b.append(b.unknown('world'));
  b.closeElement();
});

eq("<p>{{simple}}</p>", b => {
  b.openElement('p');
  b.closeTag();
  b.append(b.unknown('simple'));
  b.closeElement();
});

eq("<p>{{simple.path}}</p>", b => {
  b.openElement('p');
  b.closeTag();
  b.append(b.path('simple.path'));
  b.closeElement();
});

eq("<p class='ohai'>{{simple}}</p>", b => {
  b.openElement('p');
  b.openAttr('single', 'class');
  b.data('ohai');
  b.closeAttr();
  b.closeTag();
  b.append(b.unknown('simple'));
  b.closeElement();
});

eq("<p class='{{ohai}}'>{{simple}}</p>", b => {
  b.openElement('p');
  b.openAttr('single', 'class');
  b.append(b.unknown('ohai'));
  b.closeAttr();
  b.closeTag();
  b.append(b.unknown('simple'));
  b.closeElement();
});

eq("<a href='{{url}}.html'>{{content}}</a>", b => {
  b.openElement('a');
  b.openAttr('single', 'href');
  b.append(b.unknown('url'));
  b.data('.html');
  b.closeAttr();
  b.closeTag();
  b.append(b.unknown('content'));
  b.closeElement();
});

eq('{{#if truthy}}{{person.name}}{{/if}}', b => {
  b.openBlockGroup(b.args('if', [b.path('truthy')]));
  b.openBlock('default');
  b.append(b.path('person.name'));
  b.closeBlock();
  b.closeBlockGroup();
});

eq('{{#with some.path as |p|}}<div>{{p}}</div>{{/with}}', b => {
  b.openBlockGroup(b.args('with', [b.path('some.path')]));
  b.openBlock('default', ['p']);
  b.openElement('div');
  b.closeTag();
  b.append(b.unknown('p'));
  b.closeElement();
  b.closeBlock();
  b.closeBlockGroup();
});

eq('{{#if truthy}}name: {{format-name person.name}}; age: {{format-number (minus person.birthday today)}}{{/if}}', b => {
  b.openBlockGroup(b.args('if', [b.path('truthy')]));
  b.openBlock('default');
  b.data('name: ');
  b.append(b.args('format-name', [b.path('person.name')]));
  b.data('; age: ');
  b.append(b.args('format-number', [b.args('minus', [b.path('person.birthday'), b.path('today')])]));
  b.closeBlock();
  b.closeBlockGroup();
});

eq('{{#if truthy}}<p>name: {{format-name person.name}};</p> age: {{format-number (minus person.birthday today)}}{{/if}}', b => {
  b.openBlockGroup(b.args('if', [b.path('truthy')]));
  b.openBlock('default');
  b.openElement('p');
  b.closeTag();
  b.data('name: ');
  b.append(b.args('format-name', [b.path('person.name')]));
  b.data(';');
  b.closeElement();
  b.data(' age: ');
  b.append(b.args('format-number', [b.args('minus', [b.path('person.birthday'), b.path('today')])]));
  b.closeBlock();
  b.closeBlockGroup();
});
