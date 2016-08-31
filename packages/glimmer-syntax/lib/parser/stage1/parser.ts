import { parse } from "handlebars/compiler/base";
import { Location, Position } from "../../ast";
import visit, { Delegate as HandlebarsDelegate, VisitorState } from './visit-handlebars';
import { Delegate as HTMLDelegate, Char } from 'simple-html-tokenizer';
import * as States from './states';
import { State, Result, Event } from './states';
import { EventLogger, AssertState, DuckError } from '../log-utils';

export namespace IR {
  export type  ProgramStart      = ['ProgramStart'];
  export const ProgramStart      = ['ProgramStart'] as ProgramStart;
  export type  ProgramEnd        = ['ProgramEnd'];
  export const ProgramEnd        = ['ProgramEnd'] as ProgramEnd;
  export type  ElementStart      = ['ElementStart'];
  export const ElementStart      = ['ElementStart'] as ElementStart;
  export type  ElementEnd        = ['ElementEnd'];
  export const ElementEnd        = ['ElementEnd'] as ElementEnd;
  export type  AttrStart         = ['AttrStart'];
  export const AttrStart         = ['AttrStart'] as AttrStart;
  export type  AttrEnd           = ['AttrEnd'];
  export const AttrEnd           = ['AttrEnd'] as AttrEnd;

  export type  ArgsStart         = ['ArgsStart'];
  export const ArgsStart         = ['ArgsStart'] as ArgsStart;
  export type  ArgsEnd           = ['ArgsEnd'];
  export const ArgsEnd           = ['ArgsEnd'] as ArgsEnd;
  export type  PositionalStart   = ['PositionalStart'];
  export const PositionalStart   = ['PositionalStart'] as PositionalStart;
  export type  PositionalEnd     = ['PositionalEnd'];
  export const PositionalEnd     = ['PositionalEnd'] as PositionalEnd;
  export type  NamedStart        = ['NamedStart'];
  export const NamedStart        = ['NamedStart'] as NamedStart;
  export type  NamedEnd          = ['NamedEnd'];
  export const NamedEnd          = ['NamedEnd'] as NamedEnd;

  export type  Data              = ['Data'];
  export const Data              = ['Data'] as Data;
  export type  Comment           = ['Comment'];
  export const Comment           = ['Comment'] as Comment;

  export type  Unknown           = ['Unknown'];
  export const Unknown           = ['Unknown'] as Unknown;
  export type  BlockGroupStart   = ['BlockGroupStart'];
  export const BlockGroupStart   = ['BlockGroupStart'] as BlockGroupStart;
  export type  BlockGroupEnd     = ['BlockGroupEnd'];
  export const BlockGroupEnd     = ['BlockGroupEnd'] as BlockGroupEnd;
  export type  BlockEnd          = ['BlockEnd'];
  export const BlockEnd          = ['BlockEnd'] as BlockEnd;

  export type  Unput             = ['Unput']; // special operation from the tokenizer
  export const Unput             = ['Unput'] as Unput;

  export type  Append            = ['Append', boolean];
  export const Append            = (trusted: boolean): Append => ['Append', trusted];
  export type  OpenTagEnd<T extends OpenTagKind>
                                 = ['OpenTagEnd', T];
  export const OpenTagEnd        = <T extends OpenTagKind>(kind: T): OpenTagEnd<T> => ['OpenTagEnd', kind];
  export type  Attr<T extends AttributeKind>
                                 = ['Attr', T];
  export const Attr              = <T extends AttributeKind>(kind: T): Attr<T> => ['Attr', kind];
  export type  BlockStart        = ['BlockStart', number];
  export const BlockStart        = (len: number): BlockStart => ['BlockStart', len];
  export type  Path              = ['Path',  number];
  export const Path              = (len: number): Path => ['Path', len];
  export type  AtPath            = ['AtPath',  number];
  export const AtPath            = (len: number): AtPath => ['AtPath', len];
  export type  Locals            = ['Locals', number];
  export const Locals            = (len: number): Locals => ['Locals', len];

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
    | Attr<AttributeKind>
    | Data
    | Comment
    | Constant
    | Unput
    ;

    export type TokenName =
      'ProgramStart'
    | 'ProgramEnd'
    | 'ElementStart'
    | 'ElementEnd'
    | 'AttrStart'
    | 'AttrEnd'
    | 'Append'
    | 'OpenTagEnd'
    | 'Path'
    | 'AtPath'
    | 'Locals'
    | 'ArgsStart'
    | 'ArgsEnd'
    | 'PositionalStart'
    | 'PositionalEnd'
    | 'NamedStart'
    | 'NamedEnd'
    | 'Unknown'
    | 'BlockGroupStart'
    | 'BlockGroupEnd'
    | 'BlockStart'
    | 'BlockEnd'
    | 'Attr'
    | 'Data'
    | 'Comment'
    | 'Constant'
    | 'Unput'
    ;

  export function kind(t: Tokens): [TokenName, (string | number | boolean)[]] {
    if (typeof t === 'string') {
      return ['Constant', [t]];
    } else if (Array.isArray(t) && t.length > 0) {
      return [t[0], t.slice(1)];
    } else {
      throw new Error(`Unexpected token ${JSON.stringify(t)}`);
    }
  }
}

function isUnput(result: Result): result is [['Unput']] {
  return result.length === 1 && Array.isArray(result[0]) && result[0].length === 1 && result[0][0] === 'Unput';
}

export class Stage1 implements HandlebarsDelegate, HTMLDelegate {
  static parse(input: string): IR.Tokens[] {
    let parser = new Stage1(input);
    return parser.parse();
  }

  private output: States.Result = [];
  private tag: State = new States.Template(null as any);
  private logger = new EventLogger<State>();
  constructor(private input: string) {}

  private push(reason: string, result: Result) {
    if (result.length !== 0) {
      this.logger.output(reason, result);
      this.output.push.apply(this.output, result);
    }
  }

  private process<E extends Event, A extends AssertState<State>, T>(assertion: A, name: E, pos: Position, arg?: T): void {
    let { ok, val: state } = assertion.assert(this.tag, name, arg === undefined ? 0 : 1);

    if (ok) {
      let { next, result, transition: t } = arg !== undefined ? state[name as string](pos, arg) : state[name as string](pos);
      let unput = isUnput(result);

      let current = this.tag;
      this.tag = next;
      this.logger.transition(name, next);
      if (!unput) this.push('result', result);
      let { enter, exit } = current.transition(next, t);
      this.push('exit', exit);
      this.push('enter', enter);

      if (unput) this.process(assertion, name, pos, arg);
    } else {
      this.logger.unimpl(name, state as DuckError<State>, arg);
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

  StartMustache(state: VisitorState, trusted: boolean) {
    this.process(States.ContentParent, 'BeginMustache', state.pos, trusted);
  }

  EndMustache(state: VisitorState) {
    this.process(States.Mustache, 'FinishMustache', state.pos);
  }

  StartPartial(state: VisitorState) {
    this.logger.unimpl('StartPartial');
  }

  EndPartial(state: VisitorState) {
    this.logger.unimpl('EndPartial');
  }

  StartSubExpression(state: VisitorState) {
    this.logger.unimpl('StartSubExpression');
  }

  EndSubExpression(state: VisitorState) {
    this.logger.unimpl('EndSubExpression');
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
    this.logger.unimpl('Comment');
  }

  Content(state: VisitorState, content: string, loc: Location) {
    this.logger.unimpl('Content');
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
    this.logger.unimpl('String');
  }

  Number(state: VisitorState, n: number, loc: Location) {
    this.logger.unimpl('Number');
  }

  Boolean(state: VisitorState, b: boolean, loc: Location) {
    this.logger.unimpl('Boolean');
  }

  Null(state: VisitorState, loc: Location) {
    this.logger.unimpl('Null');
  }

  Undefined(state: VisitorState, loc: Location) {
    this.logger.unimpl('Undefined');
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
    this.logger.unimpl('FinishComment');
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
    this.logger.unimpl('VoidAttributeValue');
  }

  beginWholeAttributeValue(pos: Position) {
    this.logger.unimpl('BeginWholeAttributeValue');
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