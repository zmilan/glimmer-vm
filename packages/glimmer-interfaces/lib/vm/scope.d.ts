import { PathReference } from '../references';
import { Opaque, Option } from '../core';
import { InlineBlock } from './blocks';
import { EvaluatedArgs } from './args';

export interface Scope {
  init(options: { self: PathReference<Opaque> }): this;
  getSelf(): PathReference<Opaque>;
  getSymbol(symbol: number): PathReference<Opaque>;
  getBlock(symbol: number): InlineBlock;
  getPartialArgs(symbol: number): EvaluatedArgs;
  bindSymbol(symbol: number, value: PathReference<Opaque>): void;
  bindBlock(symbol: number, value: InlineBlock): void;
  bindPartialArgs(symbol: number, value: EvaluatedArgs): void;
  bindCallerScope(scope: Scope): void;
  getCallerScope(): Option<Scope>;
  child(): Scope;
}

export interface DynamicScope {
  get(key: string): PathReference<Opaque>;
  set(key: string, reference: PathReference<Opaque>): PathReference<Opaque>;
  child(): DynamicScope;
}