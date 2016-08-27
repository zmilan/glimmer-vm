import { Position } from '../../../ast/location';
import { Path } from './expressions';
import { State, illegal } from './state';
import { Constructors, Next, SomeNext, Result } from './types';
import { args } from './expressions';

export class MustacheExpression extends State<Result> {
  finish(pos: Position): SomeNext {
    throw illegal(this, 'finish');
  }
}

export class Mustache extends State<Result> {
  constructor(private constructors: Constructors, private ret: State<Result>) {
    super();
  }

  unknown(pos: Position, name: string): Next<[['unknown']], UnknownMustache> {
    return {
      result: [['unknown']],
      next: new UnknownMustache(this.ret, name)
    };
  }

  args(pos: Position, path: number, positional: number, named: number): Next<[['args', number, number, number]], Path> {
    return {
      result: [['args', path, positional, named]],
      next: args(this.ret, path, positional, named)
    };
  }

  finish(pos: Position): SomeNext {
    return { next: this.ret, result: [] };
  }
}

export class UnknownMustache extends MustacheExpression {
  constructor(private ret: State<Result>, private name: string) {
    super();
  }

  segment(pos: Position, s: string): Next<string[], State<Result>> {
    return {
      next: this.ret,
      result: [s]
    };
  }
}
