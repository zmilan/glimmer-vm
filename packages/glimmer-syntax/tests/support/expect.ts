import { Builder, Content, entity } from './builder';

type Option<T> = T | null;

interface Token {
  type: string;
}

abstract class CharsToken implements Token {
  abstract type: string;
  constructor(protected chars: Content) {}
}

class WhitespaceToken extends CharsToken {
  public type = "whitespace";
}

class DataToken extends CharsToken {
  public type = "data";
}

class CommentToken extends CharsToken {
  public type = "comment";

  constructor(data: string, protected closing: boolean) {
    super(data);
  }
}

class OpenTagToken extends CharsToken {
  public type = "open-tag";
}

class CloseTagToken implements Token {
  public type = "close-tag";

  constructor(protected ws: string) {}
}

class SelfClosingToken implements Token {
  public type = "self-closing";

  constructor(protected ws: string) {}
}

class VoidTag implements Token {
  public type = 'void';
}

class VoidAttr extends CharsToken {
  public type = 'void-attr';
}

class Attr implements Token {
  public type = 'attr';

  constructor(protected name: string, protected value: Content, protected quote: Option<'single' | 'double'>) {}
}

export class Expect implements Builder {
  private expected: Token[] = [];
  private expectBalanced = true;

  constructor(private message: string, private input: string) {}

  whitespace(ws: string): this {
    this.expected.push(new WhitespaceToken(ws));
    return this;
  }

  content(data: string): this {
    this.expected.push(new DataToken(data));
    return this;
  }

  entity(source: string, decoded: string): this {
    this.expected.push(new DataToken(entity(source, decoded)));
    return this;
  }

  comment(text: string, { closing } = { closing: true }): this {
    this.expected.push(new CommentToken(text, closing));
    return this;
  }

  openTag(name: string): this {
    this.expected.push(new OpenTagToken(name));
    return this;
  }

  closeTag({ whitespace } = { whitespace: '' }): this {
    this.expected.push(new CloseTagToken(whitespace));
    return this;
  }

  selfClosing({ whitespace } = { whitespace: ' ' }): this {
    this.expected.push(new SelfClosingToken(whitespace));
    return this;
  }

  voidTag(): this {
    this.expected.push(new VoidTag());
    return this;
  }

  attr(name: string, value: Option<Content>, { quote }: { quote: Option<'single' | 'double'> } = { quote: 'double' }): this {
    if (value) {
      this.expected.push(new Attr(name, value, quote))
    } else {
      this.expected.push(new VoidAttr(name));
    }

    return this;
  }

  unbalanced(): this {
    this.expectBalanced = false;
    return this;
  }
}

export function expect(message: string, input: string) {
  return new Expect(message, input);
}