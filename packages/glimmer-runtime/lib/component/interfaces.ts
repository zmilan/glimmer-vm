import { EvaluatedArgs } from '../compiled/expressions/args';
import { FunctionExpression } from '../compiled/expressions/function';
import { Layout, CompiledBlock } from '../compiled/blocks';

import Environment, { DynamicScope } from '../environment';
import { ElementOperations } from '../builder';
import * as Simple from '../dom/interfaces';

import { Destroyable, Opaque } from 'glimmer-util';
import { PathReference, RevisionTag } from 'glimmer-reference';
import {
  Bounds,
  Component,
  ComponentClass,
  ComponentManager,
  ComponentDefinition as IComponentDefinition
} from 'glimmer-interfaces';

export interface ComponentLayoutBuilder {
  env: Environment;
  tag: ComponentTagBuilder;
  attrs: ComponentAttrsBuilder;

  wrapLayout(layout: Layout);
  fromLayout(layout: Layout);
}

export interface ComponentTagBuilder {
  static(tagName: string);
  dynamic(tagName: FunctionExpression<string>);
}

export interface ComponentAttrsBuilder {
  static(name: string, value: string);
  dynamic(name: string, value: FunctionExpression<string>);
}

const COMPONENT_DEFINITION_BRAND = 'COMPONENT DEFINITION [id=e59c754e-61eb-4392-8c4a-2c0ac72bfcd4]';

export function isComponentDefinition(obj: any): obj is ComponentDefinition<Opaque> {
  return typeof obj === 'object' && obj && obj[COMPONENT_DEFINITION_BRAND];
}

export abstract class ComponentDefinition<T> implements IComponentDefinition<T> {
  public name: string; // for debugging
  public manager: ComponentManager<T>;
  public ComponentClass: ComponentClass;

  private ['COMPONENT DEFINITION [id=e59c754e-61eb-4392-8c4a-2c0ac72bfcd4]'] = true;

  constructor(name: string, manager: ComponentManager<T>, ComponentClass: ComponentClass) {
    this.name = name;
    this.manager = manager;
    this.ComponentClass = ComponentClass;
  }
}
