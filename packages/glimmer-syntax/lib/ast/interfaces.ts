import Location from './location';

export interface Node {
  type: number;
}

export interface LocatableNode extends Node {
  loc: Location;
}

export enum Statement {
  Program = 1,
  Element,
  ElementModifier,
  TagName,
  Attr,
  Text,
  Block,
  Partial,
  Comment,
  Mustache
}

export interface StatementNode extends LocatableNode {
  type: Statement;
}

export enum Expression {
  Ident = 100,
  Path,
  Args,
  Concat,
  Positional,
  Sexpr,
  Named,
  Pair,
  String,
  Boolean,
  Number,
  Null,
  Undefined
}

export interface ExpressionNode extends LocatableNode {
  type: Expression;
}

export enum Internal {
  Args = 200
}