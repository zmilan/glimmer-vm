import * as Simple from './simple';
import { PathReference } from '../references';
import { AppendVM } from '../vm/append';

export interface ElementOperations {
  addStaticAttribute(element: Simple.Element, name: string, value: string): void;
  addStaticAttributeNS(element: Simple.Element, namespace: string, name: string, value: string): void;
  addDynamicAttribute(element: Simple.Element, name: string, value: PathReference<string>, isTrusting: boolean): void;
  addDynamicAttributeNS(element: Simple.Element, namespace: string, name: string, value: PathReference<string>, isTrusting: boolean): void;
  flush(element: Simple.Element, vm: AppendVM): void;
}