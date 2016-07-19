import {
  LocatableNode,
  Expression
} from './interfaces';

import {
  Location
} from './location';

export abstract class Locatable implements LocatableNode {
  abstract type: number;
  constructor(public loc: Location) {}
}

export class Path extends Locatable {
  public type = Expression.Path;

  constructor(
    public original: string,
    public parts: string[],
    public data: boolean,
    public loc: Location) {
      super(loc);
    }
}

export class Ident extends Locatable {
  public type = Expression.Ident;
  public original: string;

  constructor(public path: string, loc: Location) {
    super(loc);
    this.original = path;
  }
}
