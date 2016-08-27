import { IR } from 'glimmer-syntax';
import { Dict, isVoidTag } from 'glimmer-util';

type Option<T> = T | null;

export interface Entity {
  entity: string;
  decoded: string;
}

type Chars = Entity | string;
export type Content  = Chars | Chars[];

export class IRBuilder {
  tokens: IR.Tokens[] = [IR.ProgramStart];

  push(tokens: IR.Tokens[]) {
    this.tokens.push(...tokens);
  }

  openBlockGroup(args: Exprs.Args) {
    this.tokens.push(IR.BlockGroupStart, ...args.toJSON());
  }

  openBlock(name: string, blockParams: string[] = []) {
    this.tokens.push(IR.BlockStart(blockParams.length), name, ...blockParams);
  }

  closeBlock() {
    this.tokens.push(IR.BlockEnd);
  }

  closeBlockGroup() {
    this.tokens.push(IR.BlockGroupEnd);
  }

  append(expr: Exprs.Expr) {
    this.tokens.push(IR.Append, ...expr.toJSON());
  }

  openElement(tagName: string) {
    this.tokens.push(IR.ElementStart, tagName);
  }

  openAttr(kind: IR.AttributeKind, name: string) {
    this.tokens.push(IR.Attribute(kind), name, IR.AttrStart);
  }

  closeAttr() {
    this.tokens.push(IR.AttrEnd);
  }

  closeTag() {
    this.tokens.push(IR.OpenTagEnd('open'));
  }

  selfClosingTag() {
    this.tokens.push(IR.OpenTagEnd('self-closing'));
  }

  voidTag() {
    this.tokens.push(IR.OpenTagEnd('void'));
  }

  closeElement() {
    this.tokens.push(IR.ElementEnd);
  }

  data(data: string) {
    this.tokens.push(IR.Data, data);
  }

  // expressions

  string(v: string): Exprs.Expr {
    return new Exprs.String(v);
  }

  args(path: string): Exprs.Args;
  args(path: string, positional: [Exprs.Expr]): Exprs.Args;
  args(path: string, named: Dict<Exprs.Expr>): Exprs.Args;
  args(path: string, positional: [Exprs.Expr], named: Dict<Exprs.Expr>): Exprs.Args;
  args(path: string, positional?: [Exprs.Expr] | Dict<Exprs.Expr>, named?: Dict<Exprs.Expr>): Exprs.Args {
    let p: Exprs.Positional;
    let n: Exprs.Named;

    if (positional === undefined) {
      p = new Exprs.Positional(null);
      n = new Exprs.Named(null);
    } else if (Array.isArray(positional)) {
      p = new Exprs.Positional(positional as [Exprs.Expr]);

      if (named && typeof named === 'object') {
        n = new Exprs.Named(named as Dict<Exprs.Expr>);
      } else {
        n = new Exprs.Named(null);
      }
    } else if (positional && typeof positional === 'object') {
      p = new Exprs.Positional(null);
      n = new Exprs.Named(positional);
    } else {
      throw new TypeError(`Invalid arguments to 'args'`);
    }

    return new Exprs.Args(new Exprs.Path(path.split('.')), p, n);
  }

  path(p: string): Exprs.Path {
    return new Exprs.Path(p.split('.'));
  }

  unknown(s: string): Exprs.Unknown {
    return new Exprs.Unknown(s);
  }

  finish(): IR.Tokens[] {
    return [...this.tokens, IR.ProgramEnd];
  }
}

namespace Exprs {
  export interface Expr {
    toJSON(): IR.Tokens[];
  }

  export class Args implements Expr {
    constructor(private path: Path, private positional: Positional, private named: Named) {}
    toJSON(): IR.Tokens[] {
      return [
        IR.ArgsStart,
        ...this.path.toJSON(),
        ...this.positional.toJSON(),
        ...this.named.toJSON(),
        IR.ArgsEnd
      ];
    }
  }

  export class Positional implements Expr {
    constructor(private exprs: Option<[Expr]>) {}
    toJSON(): IR.Tokens[] {
      if (this.exprs) {
        let out: IR.Tokens[] = [IR.PositionalStart];
        this.exprs.forEach(e => out.push(...e.toJSON()));
        out.push(IR.PositionalEnd);
        return out;
      } else {
        return [];
      }
    }
  }

  export class Named implements Expr {
    constructor(private exprs: Option<Dict<Expr>> = null) {}
    toJSON(): IR.Tokens[] {
      let { exprs } = this;

      if (exprs) {
        let keys = Object.keys(exprs);

        let out: IR.Tokens[] = [IR.NamedStart];
        keys.forEach(key => {
          out.push(key);
          out.push(...(exprs as Dict<Expr>)[key].toJSON());
        });
        out.push(IR.NamedEnd);
        return out;
      } else {
        return [];
      }
    }
  }

  export class Path implements Expr {
    constructor(private parts: string[]) {}
    toJSON(): IR.Tokens[] {
      return [IR.Path(this.parts.length), ...this.parts];
    }
  }

  export class Unknown implements Expr {
    constructor(private unknown: string) {}
    toJSON(): IR.Tokens[] {
      return [IR.Unknown, this.unknown];
    }
  }

  export class String implements Expr {
    constructor(private string: string) {}
    toJSON(): IR.Tokens[] {
      return [this.string];
    }
  }
}

export function build(callback: (b: IRBuilder) => void) {
  let b = new IRBuilder();
  callback(b);
  return b.finish();
}

export interface Builder {
  whitespace(ws: string): this;
  content(data: string): this;
  entity(source: string, actual: string): this;
  comment(text: string, options?: { closing: boolean }): this;
  openTag(name: string): this;
  closeTag(options?: { whitespace: string }): this;
  selfClosing(options?: { whitespace: string }): this;
  voidTag(): this;
  attr(name: string, value: Option<Content>, options?: { quote: 'single' | 'double' | null }): this;
  unbalanced(): this;
}

export function entity(entity: string, decoded: string): Entity {
  return { entity, decoded };
}