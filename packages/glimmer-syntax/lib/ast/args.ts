import { LocatableNode, Expression, Internal as InternalNode, ExpressionNode, Node } from './interfaces';
import { Locatable, Path } from './core';
import Location from './location';
import { JSONObject } from './serialize';

export interface CallNode extends LocatableNode {
  path: Path;
  args: Args;
}

export class Args extends Locatable {
  public type = Expression.Args;

  constructor(
    public positional: Positional,
    public named: Named,
    public internal: Internal,
    loc: Location
  ) {
    super(loc);
  }
}

export class Positional extends Locatable {
  public type = Expression.Positional;

  constructor(
    public expressions: ExpressionNode[],
    loc: Location
  ) {
    super(loc);
  }
}

export class Named extends Locatable {
  public type = Expression.Named;

  constructor(
    public pairs: Pair[],
    loc: Location
  ) {
    super(loc);
  }
}

export class Pair extends Locatable {
  public type = Expression.Pair;

  constructor(
    public key: string,
    public value: ExpressionNode,
    loc: Location
  ) {
    super(loc);
  }
}

export class InternalArgs implements Node {
  public type = InternalNode.Args;

  constructor(public params: JSONObject) {}
}