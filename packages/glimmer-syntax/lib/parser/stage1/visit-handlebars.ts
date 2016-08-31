import * as AST from "./handlebars-ast";
import { Delegate as HTMLDelegate, EventedTokenizer, EntityParser, HTML5NamedCharRefs } from 'simple-html-tokenizer';
import { Location, Position } from '../../ast';
import { dict, unwrap } from 'glimmer-util';

type opaque = {} | void;

export class VisitorState {
  pos: Position = { line: 1, column: 0 };

  start(node: AST.Node | AST.Node[]): this {
    if (Array.isArray(node) && node.length > 1) {
      this.pos = node[0].loc.start;
    } else if (!Array.isArray(node)) {
      this.pos = node.loc.start;
    }
    return this;
  }

  end(node: AST.Node | AST.Node[]): this {
    if (Array.isArray(node) && node.length > 1) {
      this.pos = node[node.length - 1].loc.end;
    } else if (!Array.isArray(node)) {
      this.pos = node.loc.end;
    }
    return this;
  }
}

class Visitor {
  public state = new VisitorState();
  private tokenizer: EventedTokenizer;

  constructor(private program: AST.Program, public delegate: Delegate, public html: HTMLDelegate) {
    this.tokenizer = new EventedTokenizer(html, new EntityParser(HTML5NamedCharRefs));
  }

  visit() {
    return Program.handle(this, this.program);
  }

  htmlContent(content: string) {
    this.tokenizer.tokenizePart(content);
    this.tokenizer.flushData();
  }
}

export default function visit(program: AST.Program, delegate: Delegate, html: HTMLDelegate) {
  let v = new Visitor(program, delegate, html);
  v.visit();
}

export interface Delegate {
  StartProgram(state: VisitorState);
  EndProgram(state: VisitorState);

  StartBlockGroup(state: VisitorState, blockParams: string[]);
  StartBlock(state: VisitorState, name: string);
  EndBlock(state: VisitorState);
  EndBlockGroup(state: VisitorState);

  StartMustache(state: VisitorState, trusted: boolean);
  EndMustache(state: VisitorState);

  StartPartial(state: VisitorState);
  EndPartial(state: VisitorState);

  StartSubExpression(state: VisitorState);
  EndSubExpression(state: VisitorState);

  Args(state: VisitorState, path: number, positional: number, named: number);
  EndArgs(state: VisitorState);
  StartPositional(state: VisitorState);
  EndPositional(state: VisitorState);
  StartNamed(state: VisitorState);
  EndNamed(state: VisitorState);
  StartPair(state: VisitorState);
  EndPair(state: VisitorState);

  Comment(state: VisitorState, comment: string, loc: Location);
  Content(state: VisitorState, content: string, loc: Location);

  Unknown(state: VisitorState, p: string, loc:  Location);
  Path(state: VisitorState, p: number, loc: Location);
  AtPath(state: VisitorState, p: number, loc: Location);
  PathSegment(state: VisitorState, p: string, loc: Location);

  String(state: VisitorState, s: string, loc: Location);
  Number(state: VisitorState, n: number, loc: Location);
  Boolean(state: VisitorState, b: boolean, loc: Location);
  Null(state: VisitorState, loc: Location);
  Undefined(state: VisitorState, loc: Location);
}

interface Handler<T> {
  handle(visitor: Visitor, node: T);
}

let statements = dict<Handler<AST.Statement>>();
let expressions = dict<Handler<AST.Expression>>();
let handlers = dict<Handler<AST.Node>>();

function Statement<N extends AST.Statement>(name: string, handler: Handler<N>) {
  return statements[name + 'Statement'] = handler;
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

    delegate.StartBlockGroup(state.start(node), node.program.blockParams || []);
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

    delegate.StartMustache(state, !node.escaped);

    let { params, hash, path } = node;

    if (params.length === 0 && (!hash || hash.pairs.length === 0)) {
      if (path.parts.length === 1 && !path.data) {
        // ambiguous path or helper
        Unknown.handle(visitor, path);
      } else {
        Path.handle(visitor, node.path);
      }
    } else {
      Args.handle(visitor, node);
    }
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
    visitor.htmlContent(node.value);
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

Expression('StringLiteral', {
  handle(visitor: Visitor, node: AST.String) {
    visitor.delegate.String(visitor.state.start(node), node.value, node.loc);
  }
});

Expression('NumberLiteral', {
  handle(visitor: Visitor, node: AST.Number) {
    visitor.delegate.Number(visitor.state.start(node), node.value, node.loc);
  }
});

Expression('BooleanLiteral', {
  handle(visitor: Visitor, node: AST.Boolean) {
    visitor.delegate.Boolean(visitor.state.start(node), node.value, node.loc);
  }
});

Expression('NullLiteral', {
  handle(visitor: Visitor, node: AST.Null) {
    visitor.delegate.Null(visitor.state.start(node), node.loc);
  }
});

Expression('UndefinedLiteral', {
  handle(visitor: Visitor, node: AST.Undefined) {
    visitor.delegate.Undefined(visitor.state.start(node), node.loc);
  }
});

const Args = Node('Args', {
  handle(visitor: Visitor, node: AST.Call) {
    let { delegate, state } = visitor;

    delegate.Args(state.start(node.params), node.path.parts.length, node.params.length, node.hash ? node.hash.pairs.length : 0);
    node.path.parts.forEach(p => delegate.PathSegment(state, p, node.loc));
    Positional.handle(visitor, node.params);
    if (node.hash) Named.handle(visitor, node.hash);
    delegate.EndArgs(state.end(node));
  }
});

const Path: Handler<AST.Path> = Expression('PathExpression', {
  handle(visitor: Visitor, node: AST.Path) {
    if (node.data) {
      visitor.delegate.AtPath(visitor.state.start(node), node.parts.length, node.loc);
    } else {
      visitor.delegate.Path(visitor.state.start(node), node.parts.length, node.loc);
    }

    node.parts.forEach(p => visitor.delegate.PathSegment(visitor.state, p, node.loc));
  }
});

const AtPath: Handler<AST.Path> = {
  handle(visitor: Visitor, node: AST.Path) {
    let { delegate, state } = visitor;

    visitor.delegate.AtPath(state.start(node), node.parts.length, node.loc);
    node.parts.forEach(p => delegate.PathSegment(state, p, node.loc));
  }
};

const Unknown: Handler<AST.Path> = {
  handle(visitor: Visitor, node: AST.Path) {
    visitor.delegate.Unknown(visitor.state.start(node), node.parts[0], node.loc);
  }
};

const OptionalArgs: Handler<AST.OptionalCall> = {
  handle(visitor: Visitor, node: AST.OptionalCall) {
    let { delegate, state } = visitor;

    delegate.Args(state, node.path.parts.length, unwrap(node.params).length, unwrap(node.hash).pairs.length);

    Path.handle(visitor, node.path);

    if (node.params) {
      Positional.handle(visitor, node.params);
    }

    if (node.hash) {
      Named.handle(visitor, node.hash);
    }
  }
};

const Positional: Handler<AST.Param[]> = {
  handle(visitor: Visitor, params: AST.Param[]) {
    let { delegate, state } = visitor;

    if (params.length > 0) {
      delegate.StartPositional(state.start(params));
      params.forEach(p => expression(visitor, p));
      delegate.EndPositional(state.end(params));
    }
  }
};

const Named: Handler<AST.Hash> = {
  handle(visitor: Visitor, hash: AST.Hash) {
    let { delegate, state } = visitor;

    if (hash.pairs.length > 0) {
      delegate.StartNamed(state.start(hash.pairs));
      hash.pairs.forEach(p => Pair.handle(visitor, p));
      delegate.EndNamed(state.end(hash.pairs));
    }
  }
};

const Pair = Node('Pair', {
  handle(visitor: Visitor, pair: AST.HashPair) {
    let { delegate, state } = visitor;

    delegate.StartPair(state.start(pair));
    delegate.PathSegment(state, pair.key, pair.loc);
    expression(visitor, pair.value);
    delegate.EndPair(state.end(pair));
  }
});