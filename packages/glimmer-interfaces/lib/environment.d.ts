import { TemplateMeta } from 'glimmer-wire-format';
import { Reference, PathReference } from './references';
import { Option, Opaque, Destroyable, HasGuid } from './core';
import { EvaluatedArgs } from './vm/args';
import { DynamicScope } from './vm/scope';
import { SymbolTable } from './tier1/symbol-table';
import { ComponentDefinition, ComponentManager } from './statements/component';
import { ModifierManager} from './statements/modifiers';
import { PartialDefinition } from './statements/partials';
import { AttributeManager } from './statements/attributes';
import { TreeConstruction as DOMTreeConstruction } from './dom/tree-construction';
import { Changes as DOMChanges } from './dom/changes';
import * as Simple from './dom/simple';
import { StatementSyntax } from './syntax/core';

export interface Helper {
  (vm: PublicVM, args: EvaluatedArgs, symbolTable: SymbolTable): PathReference<Opaque>;
}

export interface PublicVM {
  env: Environment;
  getArgs(): Option<EvaluatedArgs>;
  dynamicScope(): DynamicScope;
  getSelf(): PathReference<Opaque>;
  newDestroyable(d: Destroyable): void;
}

export interface SuppliedEnvironment {
  iterableFor(reference: Reference<Opaque>, args: EvaluatedArgs): OpaqueIterable;
  protocolForURL(s: string): string;

  hasHelper(helperName: Option<string>[], blockMeta: TemplateMeta): boolean;
  lookupHelper(helperName: Option<string>[], blockMeta: TemplateMeta): Helper;

  hasModifier(modifierName: string[], blockMeta: TemplateMeta): boolean;

  lookupModifier(modifierName: string[], blockMeta: TemplateMeta): ModifierManager<Opaque>;
  hasComponentDefinition(tagName: string[], symbolTable: SymbolTable): boolean;
  getComponentDefinition(tagName: string[], symbolTable: SymbolTable): ComponentDefinition<Opaque>;

  hasPartial(partialName: string, symbolTable: SymbolTable): boolean;
  lookupPartial(PartialName: string, symbolTable: SymbolTable): PartialDefinition<TemplateMeta>;
}

export interface Environment {
  // TODO: Which of these are actually overridable?
  toConditionalReference(reference: Reference<Opaque>): Reference<boolean>;
  getAppendOperations(): DOMTreeConstruction;
  getDOM(): DOMChanges;
  getIdentity(object: HasGuid): string;
  statement(statement: StatementSyntax, symbolTable: SymbolTable): StatementSyntax;

  begin(): void;

  didCreate<T>(component: T, manager: ComponentManager<T>): void;
  didUpdate<T>(component: T, manager: ComponentManager<T>): void;

  scheduleInstallModifier<T>(modifier: T, manager: ModifierManager<T>): void;
  scheduleUpdateModifier<T>(modifier: T, manager: ModifierManager<T>): void;

  didDestroy(d: Destroyable): void;
  commit(): void;

  attributeFor(element: Simple.Element, attr: string, isTrusting: boolean, namespace?: string): AttributeManager;

}