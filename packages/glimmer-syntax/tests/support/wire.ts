import { IR } from 'glimmer-syntax';
import * as WF from 'glimmer-wire-format';
import { Dict, Option } from 'glimmer-util';

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
  interface ToWire<T extends WF.Statement> {
    toJSON(): T;
  }

  export type Stmt = ToWire<WF.Statement>;

  class Text implements ToWire<WF.Statements.Text> {
    constructor(private string: string) {}
    toJSON(): WF.Statements.Text {
      return ['text', this.string];
    }
  }

  class Append implements ToWire<WF.Statements.Append> {
    constructor(private expr: Expressions.Expr, private trusted: boolean) {}
    toJSON(): WF.Statements.Append {
      return [
        'append',
        this.expr.toJSON(),
        this.trusted
      ];
    }
  }

  class Comment implements ToWire<WF.Statements.Comment> {
    constructor(private str: string) {}
    toJSON(): WF.Statements.Comment  {
      return ['comment', this.str];
    }
  }

  class Modifier implements ToWire<WF.Statements.Modifier> {
    constructor(private args: Expressions.Args) {}
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

  export class Block implements ToWire<WF.Statements.Block> {
    constructor(private args: Expressions.Args, private template: number, private inverse: Option<number>) {}
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
}

namespace Expressions {
  interface ToWire<T extends WF.Expression> {
    toJSON(): T;
  }

  export type Expr = ToWire<WF.Expression>;

  export class Unknown implements ToWire<WF.Expressions.Unknown> {
    constructor(private name: string) {}
    toJSON(): WF.Expressions.Unknown {
      return ['unknown', [this.name]];
    }
  }

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
}

namespace Core {
  interface ToWire<T> {
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
    toJSON(): Dict<WF.Expression> {
      let out: Dict<WF.Expression> = {};
      Object.keys(this.exprs).forEach(k => {
        out[k] = this.exprs[k].toJSON();
      });
      return out;
    }
  }
}

export class WireFormatBuilder {
  constructor(private input: IR.Tokens[]) {}
}
