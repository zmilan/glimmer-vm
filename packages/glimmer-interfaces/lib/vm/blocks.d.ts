import { Option, Dict } from '../core';
import { LinkedListNode, LinkedList, Slice } from '../collections';
import { VM } from '../vm';
import { OpSeq } from './opcodes';
import { Environment } from '../environment';

export interface Blocks {
  type: "blocks";

  default: Option<InlineBlock>;
  inverse: Option<InlineBlock>;
}

export interface InlineBlock {
  hasPositionalParameters(): boolean;
  compile(env: Environment): CompiledBlock;
}

// TODO: Brand?
export type PartialBlock = InlineBlock;

export interface CompiledBlock {
  ops: OpSeq;
  symbols: number;
}
