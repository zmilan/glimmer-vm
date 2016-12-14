export * from './lib/core';
export * from './lib/bounds';
export * from './lib/component';

export { RenderResult } from './lib/render-result';
import * as SimpleDOM from './lib/dom/simple';
export { SimpleDOM };
export { PublicVM } from './lib/vm';

// All of these exports are used in the test environment, so this
// is a starting point for an enumeration of exposed interfaces
export { EvaluatedArgs, EvaluatedNamedArgs, EvaluatedPositionalArgs } from './lib/vm/args';
export { Environment } from './lib/environment';
export { CompiledBlock, InlineBlock } from './lib/vm/blocks';
export { Scope, DynamicScope } from './lib/vm/scope';
export { Changes as DOMChanges } from './lib/dom/changes';
export { TreeConstruction as DOMTreeConstruction } from './lib/dom/tree-construction';
export { Template, Layout } from './lib/tier1/template';
export { SymbolTable } from './lib/tier1/symbol-table';