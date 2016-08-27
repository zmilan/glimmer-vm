import * as Types from './state';
import { EMPTY, Result, Position } from './state';
import { IR } from '../parser';
import { Char } from 'simple-html-tokenizer';
import { isVoidTag } from 'glimmer-util';

export { EMPTY, Result, Position } from './state';

interface Constructor<T> {
  new(...args): T;
}

interface Class<T> {
  name: string;
  prototype: T;
}

interface StateFactory<S> {
  create(ret: State): S;
}

function create<S extends State, T>(StateClass: { new(ret: State, arg: T): S }, arg: T): StateFactory<S> {
  return {
    create(ret: State): S {
      return new StateClass(ret, arg);
    }
  };
}

const enum Transition {
  Enter,
  Return,
  Noop
}

export type Event =
    'StartProgram'
  | 'EndProgram'
  | 'StartBlockGroup'
  | 'FinishBlockGroup'
  | 'StartBlock'
  | 'FinishBlock'
  | 'BeginMustache'
  | 'FinishMustache'
  | 'OpenStartTag'
  | 'OpenEndTag'
  | 'FinishTag'
  | 'SelfClosing'
  | 'BeginTagName'
  | 'AppendToTagName'
  | 'FinishTagName'
  | 'BeginAttributeName'
  | 'AppendToAttributeName'
  | 'FinishAttributeName'
  | 'BeginWholeAttributeValue'
  | 'BeginAttributeValue'
  | 'AppendToAttributeValue'
  | 'FinishAttributeValue'
  | 'FinishWholeAttributeValue'
  | 'Args'
  | 'FinishArgs'
  | 'StartPositional'
  | 'FinishPositional'
  | 'StartNamed'
  | 'FinishNamed'
  | 'StartPair'
  | 'FinishPair'
  | 'Path'
  | 'AtPath'
  | 'PathSegment'
  | 'Unknown'
  | 'Whitespace'
  | 'BeginData'
  | 'FinishData'
  | 'BeginComment'
  | 'FinishComment'
  | 'AddChar'
  | 'AddEntity'
  ;

export interface Ok<T> {
  ok: true;
  val: T;
  unwrap(): T;
}

export interface Err<E> {
  ok: false;
  val: E;
  unwrap(): never;
}

type Fallible<T, E> = Ok<T> | Err<E>;

export function Ok<T>(val: T): Ok<T> {
  return {
    ok: true as true,
    val,
    unwrap(): T { return val; }
  };
}

function Err<E>(val: E): Err<E> {
  return {
    ok: false as false,
    val,
    unwrap(): never { throw val; }
  };
}

export interface AssertState {
  assert<S extends State>(state: State, event: Event, arity: number): Fallible<S, DuckError>;
}

export interface DuckError {
  actual: State;
  className: string;
  methodName: string;
  arity: number;
}

function duckTypes(state: State, name: Event, arity: 0 | 1): boolean {
  let method = state[name];
  return typeof method === 'function' && method.length === arity + 1 /* pos is always the first arg */;
}

function Has<T extends State>(duckName: Event): AssertState {
  return {
    assert(state: State, event: Event, arity: 0 | 1): Fallible<T, DuckError> {
      if (event === duckName && duckTypes(state, event, arity)) return Ok(state as T);
      return Err({ actual: state, className: state.constructor.name, methodName: duckName, arity });
    }
  };
}

export class State {
  static assert<T extends State>(this: Class<T>, state: State, event: Event, arity: 0 | 1): Fallible<T, DuckError> {
    if (state instanceof (this as any)) {
      if (duckTypes(state, event, arity)) return Ok(state as T);
    }

    return Err({ actual: state, className: this.name, methodName: event, arity });
  }

  static create<T extends State>(this: Class<T> & Constructor<T>, ret: State): T {
    return new this(ret);
  }

  public 'STATE [id=ebd1fd4d-b4bc-4801-8bca-ebf013dc376b]': true = true;
  protected NOOP: Next<EMPTY, this> = new Next(EMPTY, this, Transition.Noop);
  constructor(public ret: State) {}

  Whitespace(pos: Position, char: string): Next<EMPTY, this> {
    return this.NOOP;
    // default behavior is to ignore whitespace
  }

  enter(): Result {
    return EMPTY;
  }

  exit(): Result {
    return EMPTY;
  }

  transition(to: State, transition: Transition): { enter: Result, exit: Result } {
    let out: { enter: IR.Tokens[], exit: IR.Tokens[] } = { enter: [], exit: [] };

    switch (transition) {
      case Transition.Noop:
        break;
      case Transition.Enter:
        out.enter.push(...to.enter());
        break;
      case Transition.Return:
        out.exit.push(...this.exit());
        break;
    }

    return out as { enter: Result, exit: Result };
  }

  continue<R extends IR.Tokens>(): Next<EMPTY, this>;
  continue<R extends IR.Tokens>(result: R): Next<[R], this>;
  continue<R1 extends IR.Tokens, R2 extends IR.Tokens>(r1: R1, r2: R2): Next<[R1, R2], this>;
  continue<R1 extends IR.Tokens, R2 extends IR.Tokens, R3 extends IR.Tokens>(r1: R1, r2: R2, r3: R3): Next<[R1, R2, R3], this>;

  continue(...result: IR.Tokens[]): Next<Result, this> {
    if (result.length === 0) return this.NOOP;
    return new Next(result as [IR.Tokens], this, Transition.Noop);
  }

  next<S extends State>(StateClass: StateFactory<S>): Next<EMPTY, S>;
  next<R extends IR.Tokens, S extends State>(StateClass: StateFactory<S>, result: R): Next<[R], S>;
  next<R1 extends IR.Tokens, R2 extends IR.Tokens, S extends State>(StateClass: StateFactory<S>, r1: R1, r2: R2): Next<[R1, R2], S>;
  next<R1 extends IR.Tokens, R2 extends IR.Tokens, R3 extends IR.Tokens, S extends State>(StateClass: StateFactory<S>, r1: R1, r2: R2, r3: R3): Next<[R1, R2, R3], S>;

  next<R extends Result, S extends State>(StateClass: StateFactory<S>, ...result: IR.Tokens[]): Next<R, S> {
    return new Next(result as R, StateClass.create(this) as S, Transition.Enter);
  }

  returning<R extends IR.Tokens, S extends State>(StateClass: StateFactory<S>): Next<EMPTY, S>;
  returning<R extends IR.Tokens, S extends State>(StateClass: StateFactory<S>, result: R): Next<[R], S>;
  returning<R1 extends IR.Tokens, R2 extends IR.Tokens, S extends State>(StateClass: StateFactory<S>, r1: R1, r2: R2): Next<[R1, R2], S>;
  returning<R1 extends IR.Tokens, R2 extends IR.Tokens, R3 extends IR.Tokens, S extends State>(StateClass: StateFactory<S>, r1: R1, r2: R2, r3: R3): Next<[R1, R2, R3], S>;

  returning<S extends State>(StateClass: StateFactory<S>, ...result: IR.Tokens[]): Next<Result, S> {
    return new Next(result as any, StateClass.create(this.ret), Transition.Enter);
  }

  return<R extends IR.Tokens, S extends State>(this: { ret: S }): Next<EMPTY, S>;
  return<R extends IR.Tokens, S extends State>(this: { ret: S }, result: R): Next<[R], S>;
  return<R1 extends IR.Tokens, R2 extends IR.Tokens, S extends State>(this: { ret: S }, r1: R1, r2: R2): Next<[R1, R2], S>;
  return<R1 extends IR.Tokens, R2 extends IR.Tokens, R3 extends IR.Tokens, S extends State>(this: { ret: S }, r1: R1, r2: R2, r3: R3): Next<[R1, R2, R3], S>;

  return<R extends Types.NonEmptyResult, S extends State>(this: { ret: S }, ...result: IR.Tokens[]): Next<Result, S> {
    return new Next(result as R, this.ret, Transition.Return);
  }
}

export class Next<T extends Result, S extends State> {
  constructor(public result: T, public next: S, public transition: Transition) {}
}

export abstract class Expression extends State {
  Args(pos: Position): Next<[['args:start']], Args> {
    return this.next(Args, ['args:start']);
  }

  Path(pos: Position, len: number): Next<[['path', number]], Path> {
    return this.next(create(Path, len), ['path', len]);
  }

  Unknown(pos: Position): Next<[['unknown']], Unknown> {
    return this.next(Unknown, ['unknown']);
  }
}

export abstract class ContentParent extends State {
  StartBlockGroup(pos: Position, locals: string[]): Next<[IR.BlockGroupStart], BlockGroup> {
    return this.next(create(BlockGroup, locals), IR.BlockGroupStart);
  }

  BeginData(pos: Position): Next<[IR.Data], Data> {
    return this.next(Data, IR.Data);
  }

  BeginComment(pos: Position): Next<[IR.Comment], Comment> {
    return this.next(Comment, IR.Comment);
  }

  OpenStartTag(pos: Position): Next<[IR.ElementStart], StartTag> {
    return this.next(StartTag, IR.ElementStart);
  }

  BeginMustache(pos: Position): Next<[IR.Append], Mustache> {
    return this.next(Mustache, IR.Append);
  }
}

export class BlockGroup extends Expression {
  public ret: ContentParent;

  constructor(ret: ContentParent, private locals: string[]) {
    super(ret);
  }

  StartBlock(pos: Position, name: string): Next<[IR.BlockStart, IR.Constant], Block> {
    return this.next(create(Block, this.locals), IR.BlockStart(this.locals.length), name);
  }

  FinishBlockGroup(pos: Position): Next<[IR.BlockGroupEnd], ContentParent> {
    return this.return(IR.BlockGroupEnd);
  }
}

export interface HasStartProgram extends State {
  StartProgram(pos: Position): Next<Result, State>;
}

export const HasStartProgram = Has('StartProgram');


export interface HasEndProgram extends State {
  EndProgram(pos: Position): Next<Result, State>;
}

export const HasEndProgram = Has('EndProgram');

export class Block extends ContentParent {
  public ret: BlockGroup;

  constructor(ret: BlockGroup, private locals: string[]) {
    super(ret);
  }

  enter(): Result {
    return this.locals;
  }

  StartProgram(pos: Position) {
    return this.continue();
  }

  EndProgram(pos: Position) {
    return this.continue();
  }

  FinishBlock(pos: Position): Next<[IR.BlockEnd], BlockGroup> {
    return this.return(IR.BlockEnd);
  }
}

export class Template extends ContentParent {
  StartProgram(pos: Position): Next<[IR.ProgramStart], this> {
    return this.continue(IR.ProgramStart);
  }

  EndProgram(pos: Position): Next<[IR.ProgramEnd], this> {
    return this.continue(IR.ProgramEnd);
  }
}

export abstract class Chars extends State {
  constructor(ret: State, protected data = '') {
    super(ret);
  }

  AddChar(pos: Position, char: string): Next<EMPTY, this> {
    this.data += char;
    return this.continue();
  }

  AddEntity(pos: Position, entity: Char): Next<EMPTY, this> {
    if (typeof entity === 'string') {
      this.data += entity;
    } else {
      this.data += entity.chars;
    }

    return this.continue();
  }
}

export class Data extends Chars {
  public ret: ContentParent;

  FinishData(pos: Position): Next<[IR.Constant], ContentParent> {
    return this.return(this.data);
  }
}

export class Comment extends Chars {}

export abstract class Tag extends Chars {
  BeginTagName(pos: Position): Next<EMPTY, this> {
    return this.continue();
  }

  AppendToTagName(pos: Position, char: string): Next<EMPTY, this> {
    this.AddChar(pos, char);
    return this.continue();
  }

  abstract FinishTagName(pos: Position): Next<Result, NamedTag>;
}

export class StartTag extends Tag {
  public ret: ContentParent;

  FinishTagName(pos: Position): Next<[IR.Constant], NamedStartTag> {
    return this.returning(create(NamedStartTag, this.data), this.data);
  }
}

export class EndTag extends Tag {
  public ret: ContentParent;

  FinishTagName(pos: Position): Next<EMPTY, NamedEndTag> {
    return this.returning(NamedEndTag);
  }
}

export abstract class NamedTag extends State {
  abstract FinishTag(pos: Position): Next<Result, State>;
}

export class NamedStartTag extends NamedTag {
  public ret: ContentParent;

  constructor(ret: ContentParent, protected name: string) {
    super(ret);
  }

  isVoidTag(): boolean {
    return isVoidTag(this.name);
  }

  BeginAttributeName(pos: Position): Next<EMPTY, AttributeName> {
    return this.next(AttributeName);
  }

  SelfClosing(pos: Position): Next<[IR.OpenTagEnd<'self-closing'>], ContentParent> {
    return this.return(IR.OpenTagEnd('self-closing'));
  }

  FinishTag(pos: Position): Next<[IR.OpenTagEnd<'open'>], Element> | Next<[IR.OpenTagEnd<'void'>], ContentParent> {
    if (isVoidTag(this.name)) {
      return this.return(IR.OpenTagEnd('void'));
    } else {
      return this.returning(Element, IR.OpenTagEnd('open'));
    }
  }
}

export class NamedEndTag extends NamedTag {
  public ret: ContentParent;

  FinishTag(pos: Position): Next<[IR.ElementEnd], ContentParent> {
    return this.return(IR.ElementEnd);
  }
}

export class AttributeName extends Chars {
  public ret: NamedStartTag;

  AppendToAttributeName(pos: Position, char: string): Next<EMPTY, this> {
    return this.AddChar(pos, char);
  }

  FinishAttributeName(pos: Position): Next<EMPTY, WholeAttributeValue> {
    return this.returning(create(WholeAttributeValue, this.data));
  }
}

export type Quote = 'single' | 'double' | 'void' | 'none';

export class WholeAttributeValue extends State {
  private quote: Quote = 'none';
  public ret: NamedStartTag;

  constructor(ret: NamedStartTag, private name: string) {
    super(ret);
  }

  Whitespace(pos: Position, char: string): Next<EMPTY, this> {
    if (char === '"') {
      this.quote = 'double';
    } else if (char === "'") {
      this.quote = 'single';
    } else if (!char.match(/^\s$/) && char !== '=') {
      throw new Error(`Invalid ${char} whitespace character in WholeAttributeValue`);
    }

    return super.Whitespace(pos, char);
  }

  BeginAttributeValue(pos: Position): Next<[['attr', Quote], string], AttributeValue> {
    return this.returning(create(AttributeValue, this.name), ['attr', this.quote], this.name);
  }
}

export interface HasAppendToAttributeValue extends State {
  AppendToAttributeValue(pos: Position, char: Char): Next<EMPTY, AttributeData>;
}

export const HasAppendToAttributeValue = Has('AppendToAttributeValue');

export class AttributeValue extends ContentParent {
  public ret: NamedStartTag;

  enter(): Result {
    return [['attr:start']];
  }

  exit(): Result {
    return [['attr:end']];
  }

  AppendToAttributeValue(pos: Position, char: Char): Next<[IR.Unput], AttributeData> {
    return this.next(AttributeData, ['unput']);
  }

  FinishWholeAttributeValue(pos: Position): Next<EMPTY, NamedStartTag> {
    return this.return();
  }

  FinishAttributeValue(pos: Position): Next<EMPTY, this> {
    return this.continue();
  }
}

export interface HasFinishAttributeValue {
  FinishAttributeValue(pos: Position): Next<[IR.Constant], AttributeValue>;
}

export const HasFinishAttributeValue = Has('FinishAttributeValue');

export class AttributeData extends Data {
  public ret: AttributeValue;

  enter(): Result {
    return [['data']];
  }

  AppendToAttributeValue(pos: Position, char: Char): Next<EMPTY, this> {
    return this.AddEntity(pos, char);
  }

  FinishAttributeValue(pos: Position): Next<[IR.Constant], AttributeValue> {
    return this.return(this.data);
  }
}

export class Element extends ContentParent {
  public ret: ContentParent;

  OpenEndTag(pos: Position): Next<EMPTY, EndTag> {
    return this.returning(EndTag);
  }
}

export interface HasArgs extends State {
  Args(pos: Position): Next<[['args:start']], Args>;
}

export const HasArgs = Has('Args');

export interface HasPath extends State {
  Path(pos: Position, count: number): Next<[['path', number]], Path>;
}

export const HasPath = Has('Path');

export interface HasPathSegment<N extends State> extends State {
  PathSegment(pos: Position, segment: string): Next<[string], N>;
}

export const HasPathSegment = Has('PathSegment');

export class Mustache extends Expression implements HasArgs {
  public ret: ContentParent;

  FinishMustache(pos: Position): Next<EMPTY, ContentParent> {
    return this.return();
  }
}

export class Unknown extends State {
  public ret: State;

  PathSegment(pos: Position, segment: string): Next<[string], State> {
    return this.return(segment);
  }
}

export class Args extends Expression implements HasPath {
  StartPositional(pos: Position): Next<[['positional:start']], Positional> {
    return this.next(Positional, ['positional:start']);
  }

  StartNamed(pos: Position): Next<[['named:start']], Named> {
    return this.next(Named, ['named:start']);
  }

  FinishArgs(pos: Position): Next<[['args:end']], State> {
    return this.return(['args:end']);
  }
}

export class Positional extends Expression {
  public ret: Args;

  FinishPositional(pos: Position): Next<[['positional:end']], Args> {
    return this.return(['positional:end']);
  }
}

export class Named extends State {
  public ret: Args;

  StartPair(pos: Position): Next<EMPTY, Pair> {
    return this.next(Pair);
  }

  FinishNamed(pos: Position): Next<[['named:end']], Args> {
    return this.return(['named:end']);
  }
}

export class Pair extends State {
  public ret: Named;

  PathSegment<T extends string>(pos: Position, segment: T): Next<[T], NamedPair> {
    return this.returning(NamedPair, segment);
  }
}

export class NamedPair extends Expression {
  public ret: Named;

  FinishPair(pos: Position): Next<EMPTY, Named> {
    return this.return();
  }
}

export class Path extends State {
  constructor(ret: State, private count: number) {
    super(ret);
  }

  PathSegment(pos: Position, s: string): Next<[string], State> {
    if (--this.count === 0) {
      return this.return(s);
    } else {
      return this.continue(s);
    }
  }
}