import { Option } from 'glimmer-util';
import { Char } from 'simple-html-tokenizer';
import { Position } from '../../../ast/location';
import { IR } from '../parser';

export type Result = IR.Tokens[];
export type Next<T extends Result, S extends State<Result>> = { result: T, next: S };
export type SomeNext = Next<Result, State<Result>>;

export interface State<S extends Result> {
  finish(pos: Position): Next<Result, State<Result>>;
  openStart(pos: Position): Next<[['element:start']], StartTag>;
  openEnd(pos: Position): EndTag;
  blockGroup(pos: Position): Next<[['block-group']], Initial>;
  block(pos: Position, name: string): Next<[['block', number], string], Block>;
  beginMustache(pos: Position, ret: State<Result>): Next<[['append']], Mustache>;
  unknown(pos: Position, name: string): Next<[['unknown']], UnknownMustache>;
  args(pos: Position, path: number, positional: number, named: number): Next<[['args', number, number, number]], Path>;
  atPath(pos: Position, len: number);
  path(pos: Position, len: number, ret: State<Result>): Next<[['path', number]], Path>;
  segment(pos: Position, s: string): Option<Next<string[], State<Result>>>;
  beginName(pos: Position);
  beginAttributeName(pos: Position): AttributeName;
  appendToAttributeName(pos: Position, char: string);
  whitespace(pos: Position, char: string);
  beginData(pos: Position): Next<[['data']], Data>;
  finishData(pos: Position): Next<[string], State<Result>>;
  addChar(pos: Position, char: string);
  addEntity(pos: Position, char: Char);
}

export interface Initial extends State<Result> {}

export interface NamedStartTag extends State<[['open-tag:end', 'open' | 'self-closing' | 'void']]> {
  finish(pos: Position): Next<[['open-tag:end', 'open' | 'self-closing' | 'void']], Initial>;
}

export interface NamedEndTag extends State<[['element:end']]> {
  finish(pos: Position): Next<[['element:end']], Initial>;
}

export interface Attribute extends State<Result> {
  toTuple(): Result;
}

export interface AttributeName extends State<Result> {
  finish(pos: Position): Next<Result, WholeAttributeValue>;
  finishVoid(pos: Position): Next<Result, NamedStartTag>;
}

export interface AttributeValue extends State<Result> {
  beginMustache(pos: Position, ret: State<Result>): Next<[['append']], Mustache>;
  whitespace(pos: Position, quote: '"' | "'");
  addEntity(pos: Position, char: Char);
  markVoid();
}

export interface WholeAttributeValue extends State<Result> {

}

export interface Data extends State<[string]> {}

export interface StartTag extends State<[string]> {}
export interface EndTag extends State<Result> {}

export interface BlockGroup extends State<Result> {}
export interface Block extends State<Result> {}

export interface MustacheExpression extends State<Result> {}
export interface Mustache extends State<Result> {}
export interface UnknownMustache extends MustacheExpression {}

export interface Path extends State<Result> {}

type SomeState = State<Result>;

interface Constructor<T extends SomeState> {
  new(...args): T;
}

export interface Constructors {
  Block: Constructor<Block>;
  BlockGroup: Constructor<BlockGroup>;
  Data: Constructor<Data>;
  Mustache: Constructor<Mustache>;
  StartTag: Constructor<StartTag>;
  EndTag: Constructor<EndTag>;
}
