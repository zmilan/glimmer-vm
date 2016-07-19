import { Expression } from './interfaces';
import { Locatable } from './core';
import Location from './location';

export type LiteralType = number | boolean | string | null | undefined;

abstract class Literal<T extends LiteralType> extends Locatable {
  constructor(public value: T, loc: Location) {
    super(loc);
  }
}

export class String extends Literal<string> {
  public type = Expression.String;
}

export class Boolean extends Literal<boolean> {
  public type = Expression.Boolean;
}

export class Number extends Literal<number> {
  public type = Expression.Number;
}

export class Null extends Literal<null> {
  public type = Expression.Null;
}

export class Undefined extends Literal<undefined> {
  public type = Expression.Undefined;
}