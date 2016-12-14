import { Blocks } from '../vm/blocks';
import { SymbolLookup, ExpressionSyntax } from './core';
import { Environment } from '../environment';
import { SymbolTable } from '../tier1/symbol-table';
import { CompiledArgs, CompiledPositionalArgs, CompiledNamedArgs } from '../vm/args';
import { Opaque } from '../core';

export interface Args {
  type: "args";

  positional: PositionalArgs,
  named: NamedArgs,
  blocks: Blocks

  compile(compiler: SymbolLookup, env: Environment, symbolTable: SymbolTable): CompiledArgs;
}

export interface PositionalArgs {
  type: "positional";

  length: number;

  slice(start?: number, end?: number): PositionalArgs;
  at(index: number): ExpressionSyntax<Opaque>;
  compile(compiler: SymbolLookup, env: Environment, symbolTable: SymbolTable): CompiledPositionalArgs;
}

export interface NamedArgs {
  type: "named";

  length: number;

  at(key: string): ExpressionSyntax<Opaque>;
  has(key: string): boolean;
  compile(compiler: SymbolLookup, env: Environment, symbolTable: SymbolTable): CompiledNamedArgs;
}
