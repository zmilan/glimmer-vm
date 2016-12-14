import { Option } from '../core';
import { TemplateMeta } from 'glimmer-wire-format';

export interface SymbolTable {
  size: number;

  initEntryPoint(): this;
  initBlock(locals: string[]): this;
  initLayout(named: string[], yields: string[], hasPartials: boolean): this;
  initPositionals(positionals: string[]): this;
  initNamed(named: string[]): this;
  initYields(yields: string[]): this;
  initPartials(hasPartials: boolean): this;
  getMeta(): Option<TemplateMeta>;
  getYield(name: string): number;
  getNamed(name: string): number;
  getLocal(name: string): number;
  getPartialArgs(): number;
  isTop(): boolean;
}