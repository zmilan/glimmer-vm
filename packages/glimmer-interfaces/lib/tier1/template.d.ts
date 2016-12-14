import { PathReference } from '../references';
import { Opaque } from '../core';
import * as Simple from '../dom/simple';
import { Environment } from '../environment';
import { AppendVM } from '../vm/append';
import { DynamicScope } from '../vm/scope';
import { RenderResult } from '../render-result';
import { CompiledBlock, PartialBlock } from '../vm/blocks';
import { SymbolTable } from './symbol-table';
import { SerializedTemplateBlock } from 'glimmer-wire-format';

// TODO: this is a pretty silly kernel interface

/**
 * Environment specific template.
 */
export interface Template<T> {
  /**
   * Template identifier, if precompiled will be the id of the
   * precompiled template.
   */
  id: string;

  /**
   * Template meta (both compile time and environment specific).
   */
  meta: T;

  /**
   * Helper to render template as root entry point.
   */
  render(self: PathReference<Opaque>, appendTo: Simple.Element, dynamicScope: DynamicScope): RenderResult;

  // internal casts, these are lazily created and cached
  asEntryPoint(): EntryPoint;
  asLayout(): Layout;
  asPartial(symbols: SymbolTable): PartialBlock;

  // exposed for visualizer
  _block: SerializedTemplateBlock;
}

export interface TemplateFactory<T, U> {
  /**
   * Template identifier, if precompiled will be the id of the
   * precompiled template.
   */
  id: string;

  /**
   * Compile time meta.
   */
  meta: T;

  /**
   * Used to create an environment specific singleton instance
   * of the template.
   *
   * @param {Environment} env glimmer Environment
   */
  create(env: Environment): Template<T>;
  /**
   * Used to create an environment specific singleton instance
   * of the template.
   *
   * @param {Environment} env glimmer Environment
   * @param {Object} meta environment specific injections into meta
   */
  create(env: Environment, meta: U): Template<T & U>;
}

export interface EntryPoint {
  compile(env: Environment): CompiledBlock;
}


export interface ComponentLayoutBuilder {
  env: Environment;
  tag: ComponentTagBuilder;
  attrs: ComponentAttrsBuilder;

  wrapLayout(layout: Layout);
  fromLayout(layout: Layout);
}

export type FunctionExpression<T> = (VM: AppendVM, symbolTable: SymbolTable) => PathReference<T>;

export interface ComponentTagBuilder {
  static(tagName: string);
  dynamic(tagName: FunctionExpression<string>);
}

export interface ComponentAttrsBuilder {
  static(name: string, value: string);
  dynamic(name: string, value: FunctionExpression<string>);
}

export interface Layout {
  hasNamedParameters: boolean;
  hasYields: boolean;
  named: string[];
  yields: string[];
  hasPartials: boolean;
}

export interface LayoutCompiler {
  compile(builder: ComponentLayoutBuilder): void;
}