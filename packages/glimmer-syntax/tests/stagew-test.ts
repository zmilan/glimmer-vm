import { Stage1, } from 'glimmer-syntax';
import {
  WireFormatBuilder,
  WireFormatParser,
  WireDelegate
} from './support';

QUnit.module('[glimmer-syntax] wire-format');

eq('<div><p>{{value}}</p></div>', b => {
  b.OpenElement('div');
  b.Directive('flush-element');
  b.OpenElement('p');
  b.Directive('flush-element');
  b.Append(b.Lookup('unknown', ['value']));
  b.Directive('close-element');
  b.Directive('close-element');
});

eq('<div><p>{{{value}}}</p></div>', b => {
  b.OpenElement('div');
  b.Directive('flush-element');
  b.OpenElement('p');
  b.Directive('flush-element');
  b.Append(b.Lookup('unknown', ['value']), true);
  b.Directive('close-element');
  b.Directive('close-element');
});

eq('<div />', b => {
  b.OpenElement('div');
  b.Directive('flush-element');
  b.Directive('close-element');
});

eq('<img><img>', b => {
  b.OpenElement('img');
  b.Directive('flush-element');
  b.Directive('close-element');
  b.OpenElement('img');
  b.Directive('flush-element');
  b.Directive('close-element');
});

eq('<img src="hello.png">', b => {
  b.OpenElement('img');
  b.Attr('static-attr', 'src', b.Value('hello.png'));
  b.Directive('flush-element');
  b.Directive('close-element');
});

eq('<img src="{{name}}.png">', b => {
  b.OpenElement('img');
  b.Attr('static-attr', 'src', b.Value('hello.png'));
  b.Directive('flush-element');
  b.Directive('close-element');
});


function eq(template: string, cb: (b: WireFormatBuilder) => void) {
  QUnit.test(`wire format: ${template}`, assert => {
    let tokens = Stage1.parse(template);
    let delegate = new WireDelegate();
    let parser = new WireFormatParser(tokens, delegate);
    console.group('WireFormatParser');
    parser.parse();
    console.groupEnd();
    let builder = new WireFormatBuilder();
    cb(builder);

    assert.deepEqual(delegate.template(), builder.template());
  });
}