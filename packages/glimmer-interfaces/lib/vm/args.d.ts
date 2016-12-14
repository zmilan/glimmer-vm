import { RevisionTag, PathReference } from '../references';
import { Opaque, Dict, Option } from '../core';
import { Blocks } from './blocks';
import { AppendVM } from './append';
import { CompiledExpression } from './expressions';

export interface CompiledArgs {
  positional: CompiledPositionalArgs,
  named: CompiledNamedArgs,
  blocks: Blocks
  evaluate(vm: AppendVM): EvaluatedArgs;
}

export interface CompiledPositionalArgs {
  length: number;
  evaluate(vm: AppendVM): EvaluatedPositionalArgs;
  toJSON(): string;
}

export interface CompiledNamedArgs {
  length: number;
  keys: ReadonlyArray<string>,
  values: ReadonlyArray<CompiledExpression<Opaque>>
  evaluate(vm: AppendVM): EvaluatedNamedArgs;
  toJSON(): string;
}

export interface EvaluatedArgs {
  tag: RevisionTag;
  positional: EvaluatedPositionalArgs;
  named: EvaluatedNamedArgs;
  blocks: Blocks;
}

export interface EvaluatedPositionalArgs {
  at(index: number): PathReference<Opaque>;
  value(): ReadonlyArray<Opaque>;
}

export interface EvaluatedNamedArgs {
  tag: RevisionTag;
  length: number;

  map(): Dict<PathReference<Opaque>>;
  get(key: string): PathReference<Opaque>;
  has(key: string): boolean;
  value(): Dict<Opaque>;
}
