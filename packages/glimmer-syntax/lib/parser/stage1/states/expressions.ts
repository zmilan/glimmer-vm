import { Option } from 'glimmer-util';
import { Position } from '../../../ast/location';
import { State } from './state';
import { Next, Result } from './types';
import { IR } from '../parser';

export class Path extends State<Result> {
  private output: string[] = [];
  private count: number;

  constructor(private ret: State<Result>, private len: number) {
    super();
    this.count = len;
  }

  segment(pos: Position, segment: string): Option<Next<string[], State<Result>>> {
    this.count--;
    this.output.push(segment);
    if (this.count === 0) return { next: this.ret, result: this.output };
    return null;
  }
}

export class RecursiveValues extends State<Result> {
  constructor(private next: State<Result>, private count: number) {
    super();
  }

  path(pos: Position, len: number, ret: State<Result>): Next<[['path', number]], Path> {
    let next = --this.count === 0 ? this.next : this;

    return {
      result: [['path', len]],
      next: new Path(next, len)
    };
  }

  args(pos: Position, path: number, positional: number, named: number): Next<[['args', number, number, number]], Path> {
    let next = --this.count === 0 ? this.next : this;

    return {
      result: [['args', path, positional, named]],
      next: args(next, path, positional, named)
    };
  }
}

export class Params extends RecursiveValues {
}

export class Hash extends RecursiveValues {
  segment(pos: Position, segment: string): Next<string[], Hash> {
    return {
      result: [segment],
      next: this
    };
  }
}

export function args(ret: State<Result>, path: number, positional: number, named: number): Path {
  let next: State<Result> = ret;

  if (named) {
    next = new Hash(next, named);
  }

  if (positional) {
    next = new Params(next, positional);
  }

  return new Path(next, path);
}