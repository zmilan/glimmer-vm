import * as Types from './types';
import { Result } from './types';
import { ContentParent } from './content-parent';

export class Block extends ContentParent implements Types.State<Result> {
  constructor(constructors: Types.Constructors, private ret: Types.BlockGroup) {
    super(constructors);
  }
}