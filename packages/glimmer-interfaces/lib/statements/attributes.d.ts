import { Environment } from '../environment';
import * as Simple from '../dom/simple';
import { Opaque } from  '../core';

export interface AttributeManager {
  setAttribute(env: Environment, element: Simple.Element, value: Opaque, namespace?: Simple.Namespace): void;
  updateAttribute(env: Environment, element: Simple.Element, value: Opaque, namespace?: Simple.Namespace): void;
}