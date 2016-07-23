import * as AST from "./handlebars-ast";
import { Location, Position } from '../../ast';
import { dict } from 'glimmer-util';

type opaque = {} | void;

export class VisitorState {
  pos: Position = { line: 1, column: 0 };

  start(node: AST.Node | AST.Node[]): this {
    if (Array.isArray(node)) {
      this.pos = node[0].loc.start;
    } else {
      this.pos = node.loc.start;
    }
    return this;
  }

  end(node: AST.Node | AST.Node[]): this {
    if (Array.isArray(node)) {
      this.pos = node[node.length - 1].loc.end;
    } else {
      this.pos = node.loc.end;
    }    return this;
  }
}

export default class Visitor {
  public state = new VisitorState();
  constructor(private program: AST.Program, public delegate: Delegate) {}

  visit() {
    return Program.handle(this, this.program);
  }
}

interface Delegate {
  StartProgram(state: VisitorState);
  EndProgram(state: VisitorState);

  StartBlockGroup(state: VisitorState);
  StartBlock(state: VisitorState, name: string);
  EndBlock(state: VisitorState);
  EndBlockGroup(state: VisitorState);

  StartMustache(state: VisitorState);
  EndMustache(state: VisitorState);

  StartPartial(state: VisitorState);
  EndPartial(state: VisitorState);

  StartSubExpression(state: VisitorState);
  EndSubExpression(state: VisitorState);

  StartArgs(state: VisitorState);
  EndArgs(state: VisitorState);

  StartPositional(state: VisitorState);
  EndPositional(state: VisitorState);
  NoPositional(state: VisitorState);

  StartNamed(state: VisitorState);
  EndNamed(state: VisitorState);
  StartPair(state: VisitorState, name: string);
  EndPair(state: VisitorState);
  NoNamed(state: VisitorState);

  Comment(state: VisitorState, comment: string, loc: Location);
  Content(state: VisitorState, content: string, loc: Location);

  Path(state: VisitorState, p: AST.Path, loc: Location);
  String(state: VisitorState, s: string, loc: Location);
  Number(state: VisitorState, n: number, loc: Location);
  Boolean(state: VisitorState, b: boolean, loc: Location);
  Null(state: VisitorState, loc: Location);
  Undefined(state: VisitorState, loc: Location);
}

interface Handler<T> {
  handle(visitor: Visitor, node: T);
}

// function statement(visitor: Visitor, s: AST.Statement) {
//   if (AST.isBlock(s)) Block.handle(visitor, s);
// }

// function expression(visitor: Visitor, e: AST.Expression) {
//   if (AST.isSubExpression(e))
// }

let statements = dict<Handler<AST.Statement>>();
let expressions = dict<Handler<AST.Expression>>();
let handlers = dict<Handler<AST.Node>>();

function Statement<N extends AST.Statement>(name: string, handler: Handler<N>) {
  return statements[name] = handler;
}

function Expression<N extends AST.Expression>(name: string, handler: Handler<N>) {
  return expressions[name] = handler;
}

function Node<N extends AST.Node>(name: string, handler: Handler<N>) {
  return handlers[name] = handler;
}

function statement<N extends AST.Statement>(v: Visitor, node: N) {
  statements[node.type].handle(v, node);
}

function expression<N extends AST.Expression>(v: Visitor, node: N) {
  expressions[node.type].handle(v, node);
}

const Program = Node('Program', {
  handle(visitor: Visitor, node: AST.Program): void {
    visitor.delegate.StartProgram(visitor.state.start(node));
    node.body.forEach(b => statement(visitor, b));
    visitor.delegate.EndProgram(visitor.state.end(node));
  }
});

Statement('Block', {
  handle(visitor: Visitor, node: AST.Block): void {
    let { delegate, state } = visitor;

    delegate.StartBlockGroup(state.start(node));
    Args.handle(visitor, node);
    delegate.StartBlock(state.start(node.program), 'default');
    Program.handle(visitor, node.program);
    delegate.EndBlock(state.end(node.program));
    if (node.inverse) {
      delegate.StartBlock(state.start(node.inverse), 'inverse');
      Program.handle(visitor, node.inverse);
      delegate.EndBlock(state.end(node.inverse));
    }
    delegate.EndBlockGroup(state.end(node));
  }
});

Statement('Partial', {
  handle(visitor: Visitor, node: AST.Partial) {
    let { delegate, state } = visitor;

    delegate.StartPartial(state.start(node));
    OptionalArgs.handle(visitor, Object.assign({}, node, { path: node.name }));
  }
});

Statement('Mustache', {
  handle(visitor: Visitor, node: AST.Mustache) {
    let { delegate, state } = visitor;

    delegate.StartMustache(state);
    Args.handle(visitor, node);
    delegate.EndMustache(state);
  }
});

Statement('Comment', {
  handle(visitor: Visitor, node: AST.Comment) {
    visitor.delegate.Comment(visitor.state.start(node), node.value, node.loc);
  }
});

Statement('Content', {
  handle(visitor: Visitor, node: AST.Content) {
    visitor.delegate.Content(visitor.state.start(node), node.value, node.loc);
  }
});

Expression('SubExpression', {
  handle(visitor: Visitor, node: AST.SubExpression) {
    let { delegate, state } = visitor;

    delegate.StartSubExpression(state.start(node));
    Args.handle(visitor, node);
    delegate.EndSubExpression(state.end(node));
  }
});

Expression('String', {
  handle(visitor: Visitor, node: AST.String) {
    visitor.delegate.String(visitor.state.start(node), node.value, node.loc);
  }
});

Expression('Number', {
  handle(visitor: Visitor, node: AST.Number) {
    visitor.delegate.Number(visitor.state.start(node), node.value, node.loc);
  }
});

Expression('Boolean', {
  handle(visitor: Visitor, node: AST.Boolean) {
    visitor.delegate.Boolean(visitor.state.start(node), node.value, node.loc);
  }
});

Expression('Null', {
  handle(visitor: Visitor, node: AST.Null) {
    visitor.delegate.Null(visitor.state.start(node), node.loc);
  }
});

Expression('Undefined', {
  handle(visitor: Visitor, node: AST.Undefined) {
    visitor.delegate.Undefined(visitor.state.start(node), node.loc);
  }
});

const Args = Node('Args', {
  handle(visitor: Visitor, node: AST.Call) {
    let { delegate, state } = visitor;

    delegate.StartArgs(state.start(node.params));
    delegate.Path(state.start(node), node.path, node.path.loc);
    Positional.handle(visitor, node.params);
    Named.handle(visitor, node.hash);
    delegate.EndArgs(state.end(node.hash.pairs));
  }
});

Expression('Path', {
  handle(visitor: Visitor, node: AST.Path) {
    visitor.delegate.Path(visitor.state.start(node), node, node.loc);
  }
});

const OptionalArgs: Handler<AST.OptionalCall> = {
  handle(visitor: Visitor, node: AST.OptionalCall) {
    let { delegate, state } = visitor;

    delegate.Path(state, node.path, node.path.loc);

    if (node.params) {
      Positional.handle(visitor, node.params);
    } else {
      delegate.NoPositional(state);
    }

    if (node.hash) {
      Named.handle(visitor, node.hash);
    } else {
      delegate.NoPositional(state);
    }

    delegate.EndArgs(state);
  }
};

const Positional: Handler<AST.Param[]> = {
  handle(visitor: Visitor, params: AST.Param[]) {
    let { delegate, state } = visitor;

    if (params.length === 0) {
      delegate.NoPositional(state);
    } else {
      delegate.StartPositional(state.start(params));
      params.forEach(p => expression(visitor, p));
      delegate.EndPositional(state.end(params));
    }
  }
};

const Named: Handler<AST.Hash> = {
  handle(visitor: Visitor, hash: AST.Hash) {
    let { delegate, state } = visitor;

    if (hash.pairs.length === 0) {
      delegate.NoNamed(state);
    } else {
      delegate.StartNamed(state.start(hash.pairs));
      hash.pairs.forEach(p => Pair.handle(visitor, p));
      delegate.EndNamed(state.end(hash.pairs));
    }
  }
};

const Pair = Node('Pair', {
  handle(visitor: Visitor, pair: AST.HashPair) {
    let { delegate, state } = visitor;

    delegate.StartPair(state.start(pair), pair.key);
    expression(visitor, pair.value);
    delegate.EndPair(state.end(pair));
  }
});