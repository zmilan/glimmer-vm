import {
  Expression,
  ExpressionNode,
} from './interfaces';
import {
  Args,
  CallNode
} from './args';
import {
  Path,
  Locatable
} from './core';
import Location from './location';

export class Sexpr extends Locatable implements ExpressionNode, CallNode {
  public type = Expression.Sexpr;

  constructor(
    public path: Path,
    public args: Args,
    loc: Location
  ) {
    super(loc);
  }
}