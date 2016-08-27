import { Position } from '../../../ast/location';
import { assert } from 'glimmer-util';
import { Char } from 'simple-html-tokenizer';
import { State, SomeState, illegal } from './state';
import { ContentParent } from './content-parent';
import { Next, SomeNext, Result } from './types';
import * as Types from './types';
import { IR } from '../parser';

export class Data extends State<[string]> {
  constructor(private constructors: Types.Constructors, private ret: State<Result>, private data = '') {
    super();
  }

  addEntity(pos: Position, char: Char): SomeNext {
    if (typeof char === 'string') {
      this.data += char;
    } else {
      this.data += char.chars;
    }

    return { next: this, result: [] };
  }

  finish(pos: Position): Next<[string], SomeState> {
    return {
      result: [this.data],
      next: this.ret
    };
  }
}

export class TagName {
  constructor(private name = '') {}

  addChar(char: string) {
    this.name  += char;
  }

  finish(): string {
    return name;
  }
}

export class AttributeName extends State<Result> implements Types.AttributeName {
  constructor(private constructors: Types.Constructors, private ret: NamedStartTag, private name = '') {
    super();
  }

  addChar(pos: Position, char: string) {
    this.name += char;
  }

  finish(pos: Position): Next<Result, WholeAttributeValue> {
    let next = new WholeAttributeValue(this.constructors, this.name, this.ret);
    return { next, result: [] };
  }

  finishVoid(pos: Position): Next<Result, NamedStartTag> {
    return {
      result: [['attr', 'void'], this.name],
      next: this.ret
    };
  }
}

export class WholeAttributeValue extends State<Result> implements Types.WholeAttributeValue {
  private quote: IR.AttributeKind = 'none';

  constructor(private constructors: Types.Constructors, private name: string, private ret: NamedStartTag) {
    super();
  }

  whitespace(pos: Position, quote: string) {
    if (this.quote !== 'none' || quote.match(/\s/) || quote === '=') {
      return;
    }

    assert(quote === '"' || quote === "'", "Attribute value whitespace must be a quote character");

    if (quote === '"') {
      this.quote = 'double';
    } else if (quote === "'") {
      this.quote = 'single';
    } else {
      throw illegal(this, 'whitespace', quote);
    }
  }

  finish(pos: Position): Next<Result, AttributeValue> {
    return {
      result: [['attr', this.quote], this.name, ['program:start']],
      next: new AttributeValue(this.constructors, this.ret)
    };
  }
}

export class AttributeValue extends ContentParent {
  constructor(constructors: Types.Constructors, private ret: State<IR.Token[]>) {
    super(constructors);
  }

  addEntity(pos: Position, entity: Char): SomeNext {
    return {
      result: [['data']],
      next: new Data(this.constructors, this, typeof entity === 'string' ? entity : entity.chars)
    };
  }

  finish(pos: Position): SomeNext {
    return {
      result: [['program:end']],
      next: this.ret
    };
  }
}

export class Tag extends State<Result> {
  protected name = "";

  constructor(protected constructors: Types.Constructors, protected ret: State<Result>) {
    super();
  }

  addChar(pos: Position, char: string) {
    this.name += char;
  }

  beginName() {}
}

export class StartTag extends Tag implements Types.StartTag {
  finish(pos: Position): Next<[string], NamedStartTag> {
    return { result: [this.name], next: new NamedStartTag(pos, this.constructors, this.name, this.ret) };
  }
}

export class EndTag extends Tag implements Types.EndTag {
  finish(pos: Position): Next<Result, NamedEndTag> {
    return { result: [], next: new NamedEndTag(pos, this.constructors, this.name, this.ret) };
  }
}

export class NamedTag extends State<Result> {
  constructor(private pos: Position, protected constructors: Types.Constructors, protected name: string, protected ret: State<Result>) {
    super();
  }

  finish(pos: Position): Next<Result, Types.Initial> {
    throw illegal(this, 'finish');
  }
}

export class NamedStartTag extends NamedTag implements Types.NamedStartTag {
  finish(pos: Position): Next<[['open-tag:end', 'open' | 'self-closing' | 'void']], SomeState> {
    return { next: this.ret, result: [['open-tag:end', 'open']] };
  }

  beginAttributeName(pos: Position): AttributeName {
    return new AttributeName(this.constructors, this);
  }
}

export class NamedEndTag extends NamedTag implements Types.NamedEndTag {
  finish(pos: Position): Next<[['element:end']], Types.Initial> {
    return { next: this.ret, result: [['element:end']] };
  }
}