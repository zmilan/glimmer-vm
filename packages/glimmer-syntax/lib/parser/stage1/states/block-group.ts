import { State } from './state';
import { Next, Result } from './types';
import * as Types from './types';
import { Position } from '../../../ast/location';
import { args } from './expressions';
import { Block } from './block';
import { IR } from '../parser';

export class BlockGroup extends State<IR.Tokens[]> implements Types.BlockGroup {
  constructor(private constructors: Types.Constructors, private ret: State<Result>) {
    super();
  }

  args(pos: Position, path: number, positional: number, named: number): Next<[['args', number, number, number]], Types.Path> {
    return {
      result: [['args', path, positional, named]],
      next: args(this, path, positional, named)
    };
  }

  block(pos: Position, name: string): Next<[['block', number], string], Types.Block> {
    return {
      result: [['block', 0], name],
      next: new this.constructors.Block(this.constructors, this)
    };
  }
}
