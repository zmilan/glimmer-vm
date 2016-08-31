import * as WF from 'glimmer-wire-format';
import { Dict, Option } from 'glimmer-util';
import { HTMLNS } from 'glimmer-syntax';

class BlockBuilder {
  statements: WF.Statement[];
  locals: string[];

  toJSON(): WF.SerializedBlock {
    return {
      statements: this.statements,
      locals: this.locals
    };
  }
}

namespace Statements {
  abstract class ToWire<T extends WF.Statement> {
    isStatement = true;
    abstract toJSON(): T;
  }

  export type Stmt = ToWire<WF.Statement>;

  export class Append extends ToWire<WF.Statements.Append> {
    constructor(private expr: Expressions.Expr, private trusted: boolean) {
      super();
    }

    toJSON(): WF.Statements.Append {
      return [
        'append',
        this.expr.toJSON(),
        this.trusted
      ];
    }
  }

  export class Modifier extends ToWire<WF.Statements.Modifier> {
    constructor(private args: Expressions.Args) {
      super();
    }

    toJSON(): WF.Statements.Modifier {
      let [, path, positional, named] = this.args.toJSON();
      return [
        'modifier',
        path,
        positional,
        named
      ];
    }
  }

  export class Block extends ToWire<WF.Statements.Block> {
    constructor(private args: Expressions.Args, private template: number, private inverse: Option<number>) {
      super();
    }

    toJSON(): WF.Statements.Block {
      let [, path, positional, named] = this.args.toJSON();

      return [
        'block',
        path,
        positional,
        named,
        this.template,
        this.inverse
      ];
    }
  }

  export class OpenElement extends ToWire<WF.Statements.OpenElement> {
    constructor(private tag: string, private locals: string[]) {
      super();
    }

    toJSON(): WF.Statements.OpenElement {
      return [
        'open-element',
        this.tag,
        this.locals
      ];
    }
  }

  export class Data<N extends WF.Statements.DataName> extends ToWire<WF.Statements.Data<N>> {
    constructor(private name: N, private value: string) {
      super();
    }

    toJSON(): WF.Statements.Data<N> {
      return [this.name, this.value];
    }
  }

  export class Yield extends ToWire<WF.Statements.Yield> {
    constructor(private to: string, private positional: Core.Positional) {
      super();
    }

    toJSON(): WF.Statements.Yield {
      return ['yield', this.to, this.positional.toJSON()];
    }
  }

  export class Directive<N extends WF.Statements.DirectiveName> extends ToWire<WF.Statements.Directive<N>> {
    constructor(private kind: N) {
      super();
    }

    toJSON(): WF.Statements.Directive<N> {
      return [this.kind];
    }
  }

  export class Attr<N extends WF.Statements.AttrName> extends ToWire<WF.Statements.Attr<N> & WF.Statements.SomeArg<N>> {
    constructor(private kind: N, private name: string, private value: Expressions.Expr, private namespace: string) {
      super();
    }

    toJSON(): WF.Statements.Attr<N> {
      return [this.kind, this.name, this.value.toJSON(), this.namespace];
    }
  }

  export class Arg<N extends WF.Statements.ArgName> extends ToWire<WF.Statements.Arg<N> & WF.Statements.SomeArg<N>> {
    constructor(private kind: N, private name: string, private value: Expressions.Expr) {
      super();
    }

    toJSON(): WF.Statements.Arg<N> {
      return [this.kind, this.name, this.value.toJSON()];
    }
  }
}

namespace Expressions {
  export interface ToWire<T extends WF.Expression> {
    toJSON(): T;
  }

  export type Expr = ToWire<WF.Expression>;

  export class Path implements ToWire<WF.Expressions.Get> {
    constructor(private parts: string[]) {}
    toJSON(): WF.Expressions.Get {
      return ['get', new Core.Path(this.parts).toJSON()];
    }
  }

  export class Args implements ToWire<WF.Expressions.Helper> {
    constructor(
      private path: Core.Path,
      private positional: Core.Positional,
      private named: Core.Named
    ) {}

    toJSON(): WF.Expressions.Helper {
      return [
        'helper',
        this.path.toJSON(),
        this.positional.toJSON(),
        this.named.toJSON()
      ];
    }
  }

  export class Keyword<N extends WF.Expressions.KeywordName> implements ToWire<WF.Expressions.Keyword<N>> {
    constructor(private type: N, private value: string) {}
    toJSON(): WF.Expressions.Keyword<N> {
      return [this.type, this.value];
    }
  }

  export class Lookup<N extends WF.Expressions.LookupName> implements ToWire<WF.Expressions.Lookup<N>> {
    constructor(private type: N, private parts: string[]) {}
    toJSON(): WF.Expressions.Lookup<N> {
      return [this.type, new Core.Path(this.parts).toJSON()];
    }
  }

  export class Undefined implements ToWire<WF.Expressions.Undefined> {
    toJSON(): WF.Expressions.Undefined {
      return ['undefined'];
    }
  }

  export class Value implements ToWire<WF.Expressions.Value> {
    constructor(private val: WF.Expressions.Value) {}
    toJSON(): WF.Expressions.Value {
      return this.val;
    }
  }

}

namespace Core {
  export interface ToWire<T> {
    toJSON(): T;
  }

  export class Path implements ToWire<WF.Core.Path> {
    constructor(private parts: string[]) {}
    toJSON(): string[] {
      return this.parts;
    }
  }

  export class Positional implements ToWire<WF.Core.Params> {
    constructor(private exprs: ToWire<WF.Expression>[]) {}
    toJSON(): WF.Expression[] {
      return this.exprs.map(e => e.toJSON());
    }
  }

  export class Named implements ToWire<WF.Core.Hash> {
    constructor(private exprs: Dict<ToWire<WF.Expression>>) {}
    toJSON(): WF.Core.Hash {
      let exprs = this.exprs;
      let names: string[] = Object.keys(exprs);
      let values: WF.Expression[] = [];

      names.forEach(k => {
        values.push(exprs[k].toJSON());
      });

      return [names, values];
    }
  }
}

export class WireFormatBuilder {
  private output: WF.Statement[] = [];

  constructor() {}

  template(): WF.SerializedTemplate {
    return {
      statements: this.output,
      locals: [],
      named: [],
      yields: [],
      blocks: [],
      meta: {}
    };
  }

  // statements

  private push(s: Statements.Stmt): void {
    this.output.push(s.toJSON());
  }

  Data<N extends WF.Statements.DataName>(kind: N, value: string): void {
    this.push(new Statements.Data(kind, value));
  }

  Directive<N extends WF.Statements.DirectiveName>(kind: N): void {
    this.push(new Statements.Directive(kind));
  }

  Attr<N extends WF.Statements.AttrName>(kind: N, name: string, value: Expressions.Expr, namespace = HTMLNS): void {
    this.push(new Statements.Attr(kind, name, value, namespace));
  }

  Arg<N extends WF.Statements.ArgName>(kind: N, name: string, value: Expressions.Expr): void {
    this.push(new Statements.Arg(kind, name, value));
  }

  Append(expr: Expressions.Expr, trusted = false): void {
    this.push(new Statements.Append(expr, trusted));
  }

  Modifer(args: Expressions.Args) {
    this.push(new Statements.Modifier(args));
  }

  Block(args: Expressions.Args, template: number, inverse: number): void {
    this.push(new Statements.Block(args, template, inverse));
  }

  OpenElement(tag: string, locals: string[] = []): void {
    this.push(new Statements.OpenElement(tag, locals));
  }

  // expressions

  Lookup<N extends WF.Expressions.LookupName>(kind: N, parts: string[]): Expressions.Lookup<N> {
    return new Expressions.Lookup(kind, parts);
  }

  Keyword(kind: WF.Expressions.KeywordName, value: string) {
    return new Expressions.Keyword(kind, value);
  }

  Args(path: Core.Path, positional: Core.Positional, named: Core.Named): Expressions.Args {
    return new Expressions.Args(path, positional, named);
  }

  Value(val: WF.Expressions.Value): Expressions.Value {
    return new Expressions.Value(val);
  }

  Undefined(): Expressions.Undefined {
    return new Expressions.Undefined();
  }
}

export function wireFormatBuild(cb: (b: WireFormatBuilder) => void) {
  let b = new WireFormatBuilder();
  cb(b);
  return b.template();
}