import { LinkedListNode } from '../collections';
import { Option, Opaque } from '../core';
import { Environment } from '../environment';
import { SymbolTable } from '../tier1/symbol-table';
import { Opcode, OpSeq } from '../vm/opcodes';
import { ComponentDefinition } from '../statements/component';
import { CompiledExpression } from '../tier1/compiled';
import { Args } from './args';

export type StaticDefinition = ComponentDefinition<Opaque>;
export type DynamicDefinition = ExpressionSyntax<ComponentDefinition<Opaque>>;

export interface ComponentBuilder {
  static(definition: ComponentDefinition<Opaque>, args: Args, symbolTable: SymbolTable, shadow?: string[]): void;
  dynamic(definitionArgs: Args, definition: DynamicDefinition, args: Args, symbolTable: SymbolTable, shadow?: string[]): void;
}

export interface SymbolLookup {
  getLocalSymbol(name: string): number;
  hasLocalSymbol(name: string): boolean;
  getNamedSymbol(name: string): number;
  hasNamedSymbol(name: string): boolean;
  getBlockSymbol(name: string): number;
  hasBlockSymbol(name: string): boolean;
  getPartialArgsSymbol(): number;
  hasPartialArgsSymbol(): boolean;
}

export interface CompileInto {
  append(op: Opcode): void;
}

export interface StatementCompilationBuffer extends CompileInto, SymbolLookup {
  component: ComponentBuilder;
  toOpSeq(): OpSeq;
}

export interface StatementSyntax extends LinkedListNode {
  type: string;
  next: Option<StatementSyntax>;
  prev: Option<StatementSyntax>;

  clone(): this;
  compile(opcodes: StatementCompilationBuffer, env: Environment, symbolTable: SymbolTable): void;
  scan(scanner: BlockScanner): StatementSyntax;
}

export interface ExpressionSyntax<T> {
  type: string;
  compile(dsl: SymbolLookup, env: Environment, symbolTable: SymbolTable): CompiledExpression<T>;
}