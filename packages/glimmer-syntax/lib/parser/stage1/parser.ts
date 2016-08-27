import { parse } from "handlebars/compiler/base";
import { Location, Position } from "../../ast";
import visit, { Delegate as HandlebarsDelegate, VisitorState } from './visit-handlebars';
import { Delegate as HTMLDelegate, Char } from 'simple-html-tokenizer';
import * as States from './states/concrete';
import { State, Next, Result, AssertState, Event, DuckError } from './states/concrete';

import { Option, isVoidTag } from 'glimmer-util';

function unimpl<T>(name: string, err?: DuckError, arg?: T) {
  if (err) {
    let { methodName, actual } = err;
    console.groupCollapsed(padRight(name, 30) + 'unimplemented');

    let c = actual.constructor.name;
    let expected = arg ? `${c}#${methodName}(arg)` : `${c}#${methodName}()`;

    console.info(padRight(`Expected ${expected}`, 30));
    console.info(padRight(`${c} implemented these events:`, 30));
    implementedEvents(actual).forEach(event => {
      let arity = actual[event].length;
      if (arity === 0) console.debug(`${event}(${arg})`);
      else console.debug(`${event}()`);
    });

    console.groupEnd();
  } else {
    console.groupCollapsed(padRight(name, 30) + 'unimplemented');
    console.groupEnd();
  }
}

function event(name: string, ...args: (string[] | string | number | boolean | Char)[]) {
  debug('debug', null, name, ...args);
}

function transition(name: string, to: States.State, ...args: (string[] | string | number | boolean | Char)[]) {
  debug('debug', `-> ${to.constructor.name}(ret=${to['ret'] && to['ret'].constructor.name})`, name, ...args);
}

function pad(count: number, padding = " "): string{
  let pad = "";
  for (let i = 0, l = count; i<l; i++) {
    pad += padding;
  }
  return pad;
}

function padRight(s: string, count: number, padding = " ") {
  if (s.length >= count) return s;
  return s + pad(count - s.length, padding);
}

function padLeft(s: string, count: number, padding = " ") {
  if (s.length >= count) return s;
  return pad(count - s.length, padding) + s;
}

function output(reason: string, out: Result) {
  console.log(padLeft('', 30) + padLeft(reason, 6) + ' ' + JSON.stringify(out));
}

function debug(kind: 'debug' | 'warn', to: Option<string>, name: string, ...args: (string[] | string | number | boolean | Char)[]) {
  if (args.length) {
    let a = args.map(a => {
      if (Array.isArray(a)) {
        return `[${a.join(', ')}]`;
      } else if (typeof a === 'object') {
        return a.chars;
      } else {
        return a;
      }
    });

    console[kind](`${padRight(name, 30)}${padRight(to || '', 30)} (${a.join(', ')})`);
  } else {
    console[kind](`${padRight(name, 30)}${padRight(to || '', 30)}`);
  }
}

export namespace IR {
  export type  ProgramStart      = ['program:start'];
  export const ProgramStart      = ['program:start'] as ProgramStart;
  export type  ProgramEnd        = ['program:end'];
  export const ProgramEnd        = ['program:end'] as ProgramEnd;
  export type  ElementStart      = ['element:start'];
  export const ElementStart      = ['element:start'] as ElementStart;
  export type  ElementEnd        = ['element:end'];
  export const ElementEnd        = ['element:end'] as ElementEnd;
  export type  AttrStart         = ['attr:start'];
  export const AttrStart         = ['attr:start'] as AttrStart;
  export type  AttrEnd           = ['attr:end'];
  export const AttrEnd           = ['attr:end'] as AttrEnd;
  export type  Append            = ['append'];
  export const Append            = ['append'] as Append;

  export type  ArgsStart         = ['args:start'];
  export const ArgsStart         = ['args:start'] as ArgsStart;
  export type  ArgsEnd           = ['args:end'];
  export const ArgsEnd           = ['args:end'] as ArgsEnd;
  export type  PositionalStart   = ['positional:start'];
  export const PositionalStart   = ['positional:start'] as PositionalStart;
  export type  PositionalEnd     = ['positional:end'];
  export const PositionalEnd     = ['positional:end'] as PositionalEnd;
  export type  NamedStart        = ['named:start'];
  export const NamedStart        = ['named:start'] as NamedStart;
  export type  NamedEnd          = ['named:end'];
  export const NamedEnd          = ['named:end'] as NamedEnd;

  export type  Data              = ['data'];
  export const Data              = ['data'] as Data;
  export type  Comment           = ['comment'];
  export const Comment           = ['comment'] as Comment;

  export type  Unknown           = ['unknown'];
  export const Unknown           = ['unknown'] as Unknown;
  export type  BlockGroupStart   = ['block-group:start'];
  export const BlockGroupStart   = ['block-group:start'] as BlockGroupStart;
  export type  BlockGroupEnd     = ['block-group:end'];
  export const BlockGroupEnd     = ['block-group:end'] as BlockGroupEnd;
  export type  BlockEnd          = ['block:end'];
  export const BlockEnd          = ['block:end'] as BlockEnd;

  export type  Unput = ['unput']; // special operation from the tokenizer

  export type  OpenTagEnd<T extends OpenTagKind>
                                 = ['open-tag:end', T];
  export const OpenTagEnd        = <T extends OpenTagKind>(kind: T): OpenTagEnd<T> => ['open-tag:end', kind];
  export type  Attribute<T extends AttributeKind>
                                 = ['attr', AttributeKind];
  export const Attribute         = <T extends AttributeKind>(kind: T): Attribute<T> => ['attr', kind];
  export type  BlockStart        = ['block:start', number];
  export const BlockStart        = (len: number): BlockStart => ['block:start', len];
  export type  Path              = ['path',  number];
  export const Path              = (len: number): Path => ['path', len];
  export type  AtPath            = ['at-path',  number];
  export const AtPath            = (len: number): AtPath => ['at-path', len];
  export type  Locals            = ['locals', number];
  export const Locals            = (len: number): Locals => ['locals', len];

  export type  OpenTagKind       = 'open' | 'self-closing' | 'void';
  export type  AttributeKind     = 'single' | 'double' | 'none' | 'void';
  export type  Constant          = string;

  export type  Tokens =
      ProgramStart
    | ProgramEnd
    | ElementStart
    | ElementEnd
    | AttrStart
    | AttrEnd
    | Append
    | OpenTagEnd<OpenTagKind>
    | Path
    | AtPath
    | Locals
    | ArgsStart
    | ArgsEnd
    | PositionalStart
    | PositionalEnd
    | NamedStart
    | NamedEnd
    | Unknown
    | BlockGroupStart
    | BlockGroupEnd
    | BlockStart
    | BlockEnd
    | Attribute<AttributeKind>
    | Data
    | Comment
    | Constant
    | Unput
    ;
}

function isUnput(result: Result): result is [['unput']] {
  return result.length === 1 && Array.isArray(result[0]) && result[0].length === 1 && result[0][0] === 'unput';
}

function implementedEvents(obj: Object, out: string[] = []): string[] {
  Object.getOwnPropertyNames(obj).forEach(name => {
    let desc = Object.getOwnPropertyDescriptor(obj, name);
    if (name[0] === name[0].toUpperCase() && typeof desc.value === 'function' && out.indexOf(name) === -1) out.push(name);
  });

  let prototype = Object.getPrototypeOf(obj);
  if (prototype !== null && prototype !== Object.prototype && prototype !== Function.prototype) {
    return implementedEvents(prototype, out);
  } else {
    return out;
  }
}

export class Stage1 implements HandlebarsDelegate, HTMLDelegate {
  private output: States.Result = [];
  private tag: State = new States.Template(null as any);
  constructor(private input: string) {}

  private push(reason: string, result: Result) {
    if (result.length !== 0) {
      output(reason, result);
      this.output.push.apply(this.output, result);
    }
  }

  private process<E extends Event, A extends AssertState, T>(assertion: A, name: E, pos: Position, arg?: T): void {
    let { ok, val: state } = assertion.assert(this.tag, name, arg === undefined ? 0 : 1);

    if (ok) {
      let { next, result, transition: t } = arg ? state[name as string](pos, arg) : state[name as string](pos);
      let unput = isUnput(result);

      let current = this.tag;
      this.tag = next;
      transition(name, next);
      if (!unput) this.push('result', result);
      let { enter, exit } = current.transition(next, t);
      this.push('exit', exit);
      this.push('enter', enter);

      if (unput) this.process(assertion, name, pos, arg);
    } else {
      unimpl(name, state as DuckError, arg);
      // throw new Error(`Expected ${className}#${methodName}(${arity} args) when dispatching ${name}.\n\n${className} implements these events: ${implementedEvents(this.tag).join(', ')}`);
    }
  }

  parse(): States.Result {
    let p = parse(this.input);
    visit(p, this, this);
    return this.output;
  }

  StartProgram(state: VisitorState) {
    this.process(States.HasStartProgram, 'StartProgram', state.pos);
  }

  EndProgram(state: VisitorState) {
    this.process(States.HasEndProgram, 'EndProgram', state.pos);
  }

  StartBlockGroup(state: VisitorState, blockParams: string[]) {
    this.process(State, 'StartBlockGroup', state.pos, blockParams);
  }

  StartBlock(state: VisitorState, name: string) {
    this.process(State, 'StartBlock', state.pos, name);
  }

  EndBlock(state: VisitorState) {
    this.process(State, 'FinishBlock', state.pos);
  }

  EndBlockGroup(state: VisitorState) {
    this.process(State, 'FinishBlockGroup', state.pos);
  }

  StartMustache(state: VisitorState) {
    this.process(States.ContentParent, 'BeginMustache', state.pos);
  }

  EndMustache(state: VisitorState) {
    this.process(States.Mustache, 'FinishMustache', state.pos);
  }

  StartPartial(state: VisitorState) {
    unimpl('StartPartial');
  }

  EndPartial(state: VisitorState) {
    unimpl('EndPartial');
  }

  StartSubExpression(state: VisitorState) {
    unimpl('StartSubExpression');
  }

  EndSubExpression(state: VisitorState) {
    unimpl('EndSubExpression');
  }

  Args(state: VisitorState, path: number) {
    this.process(States.HasArgs, 'Args', state.pos);
    this.process(States.Args, 'Path', state.pos, path);
  }

  EndArgs(state: VisitorState) {
    this.process(States.Args, 'FinishArgs', state.pos);
  }

  StartPositional(state: VisitorState) {
    this.process(States.Args, 'StartPositional', state.pos);
  }

  EndPositional(state: VisitorState) {
    this.process(States.Positional, 'FinishPositional', state.pos);
  }

  StartNamed(state: VisitorState) {
    this.process(States.Args, 'StartNamed', state.pos);
  }

  EndNamed(state: VisitorState) {
    this.process(States.Named, 'FinishNamed', state.pos);
  }

  StartPair(state: VisitorState) {
    this.process(States.Named, 'StartPair', state.pos);
  }

  EndPair(state: VisitorState) {
    this.process(States.NamedPair, 'FinishPair', state.pos);
  }

  Comment(state: VisitorState, comment: string, loc: Location) {
    unimpl('Comment');
  }

  Content(state: VisitorState, content: string, loc: Location) {
    unimpl('Content');
  }

  Unknown(state: VisitorState, p: string, loc: Location) {
    this.process(States.Mustache, 'Unknown', state.pos);
    this.process(States.Unknown, 'PathSegment', state.pos, p);
  }

  AtPath(state: VisitorState, len: number, loc: Location) {
    this.process(State, 'AtPath', state.pos, len);
  }

  Path(state: VisitorState, len: number, loc: Location) {
    this.process(States.HasPath, 'Path', state.pos, len);
  }

  PathSegment(state: VisitorState, s: string, loc: Location) {
    this.process(States.HasPathSegment, 'PathSegment', state.pos, s);
  }

  String(state: VisitorState, s: string, loc: Location) {
    unimpl('String');
  }

  Number(state: VisitorState, n: number, loc: Location) {
    unimpl('Number');
  }

  Boolean(state: VisitorState, b: boolean, loc: Location) {
    unimpl('Boolean');
  }

  Null(state: VisitorState, loc: Location) {
    unimpl('Null');
  }

  Undefined(state: VisitorState, loc: Location) {
    unimpl('Undefined');
  }

  // HTML
  beginData(pos: Position) {
    this.process(States.ContentParent, 'BeginData', pos);
  }

  appendToData(pos: Position, char: Char) {
    this.process(States.Data, 'AddEntity', pos, char);
  }

  finishData(pos: Position) {
    this.process(States.Data, 'FinishData', pos);
  }

  whitespace(pos: Position, char: string) {
    this.process(State, 'Whitespace', pos, char);
  }

  appendToCommentData(pos: Position, char: string) {
    this.process(States.Comment, 'AddChar', pos, char);
  }

  beginComment(pos: Position) {
    this.process(States.ContentParent, 'BeginComment', pos);
  }

  finishComment(pos: Position) {
    this.process(States.Comment, 'FinishComment', pos);
    unimpl('FinishComment');
  }

  openStartTag(pos: Position) {
    this.process(States.ContentParent, 'OpenStartTag', pos);
  }

  openEndTag(pos: Position) {
    this.process(States.Element, 'OpenEndTag', pos);
  }

  beginTagName(pos: Position) {
    this.process(States.Tag, 'BeginTagName', pos);
  }

  appendToTagName(pos: Position, char: string) {
    this.process(States.Tag, 'AppendToTagName', pos, char);
  }

  finishTagName(pos: Position) {
    this.process(States.Tag, 'FinishTagName', pos);
  }

  finishTag(pos: Position, selfClosing: boolean) {
    if (selfClosing) {
      this.process(States.NamedStartTag, 'SelfClosing', pos);
    } else {
      this.process(States.NamedTag, 'FinishTag', pos);
    }
  }

  beginAttributeName(pos: Position) {
    this.process(States.NamedStartTag, 'BeginAttributeName', pos);
  }

  appendToAttributeName(pos: Position, char: string) {
    this.process(States.AttributeName, 'AppendToAttributeName', pos, char);
  }

  finishAttributeName(pos: Position) {
    this.process(States.AttributeName, 'FinishAttributeName', pos);
  }

  voidAttributeValue(pos: Position) {
    unimpl('VoidAttributeValue');
  }

  beginWholeAttributeValue(pos: Position) {
    unimpl('BeginWholeAttributeValue');
  }

  beginAttributeValue(pos: Position, quoted: boolean) {
    this.process(States.WholeAttributeValue, 'BeginAttributeValue', pos);
  }

  appendToAttributeValue(pos: Position, char: Char) {
    this.process(States.HasAppendToAttributeValue, 'AppendToAttributeValue', pos, char);
  }

  finishAttributeValue(pos: Position, quoted: boolean) {
    this.process(States.HasFinishAttributeValue, 'FinishAttributeValue', pos);
  }

  finishWholeAttributeValue(pos: Position) {
    this.process(States.AttributeValue, 'FinishWholeAttributeValue', pos);
  }
}