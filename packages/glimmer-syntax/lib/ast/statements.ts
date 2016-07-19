import {
  Statement,
  StatementNode
} from './interfaces';
import {
  Args,
  CallNode
} from './args';
import {
  Ident,
  Path,
  Locatable,
} from './core';
import Location from './location';

export class Mustache extends Locatable implements StatementNode, CallNode {
  public type = Statement.Mustache;

  constructor(
    public path: Path,
    public args: Args,
    public trusting: boolean,
    loc: Location
  ) {
    super(loc);
  }
}

export class Block extends Locatable implements StatementNode, CallNode {
  public type = Statement.Block;

  constructor(
    public path: Path,
    public args: Args,
    public program: Program,
    public inverse: Program,
    loc: Location
  ) {
    super(loc);
  }
}

export class Program extends Locatable {
  public type = Statement.Program;

  constructor(
    public body: StatementNode[],
    public blockParams: Ident[],
    loc: Location
  ) {
    super(loc);
  }
}