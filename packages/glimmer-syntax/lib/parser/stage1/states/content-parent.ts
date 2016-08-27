import { Position } from '../../../ast/location';
import { State } from './state';
import { Next, Result } from './types';
import * as Types from './types';
import { Mustache } from './mustache';
import { StartTag, EndTag, Data } from './html';
import { BlockGroup } from './block-group';
import { IR } from '../parser';

export class ContentParent extends State<IR.Tokens[]> {
  constructor(protected constructors: Types.Constructors) {
    super();
  }

  blockGroup(pos: Position): Next<[['block-group']], Types.BlockGroup> {
    return {
      next: new this.constructors.BlockGroup(this.constructors, this),
      result: [['block-group']]
    };
  }

  beginData(): Next<[['data']], Types.Data> {
    return {
      result: [['data']],
      next: new this.constructors.Data(this.constructors, this)
    };
  }

  beginMustache(pos: Position, ret: State<Result>): Next<[['append']], Types.Mustache> {
    return { result: [['append']], next: new this.constructors.Mustache(this.constructors, ret) };
  }

  openStart(pos: Position): Next<[['element:start']], Types.StartTag> {
    return { result: [['element:start']], next: new this.constructors.StartTag(this.constructors, this) };
  }

  openEnd(pos: Position): Types.EndTag {
    return new this.constructors.EndTag(this.constructors, this);
  }
}