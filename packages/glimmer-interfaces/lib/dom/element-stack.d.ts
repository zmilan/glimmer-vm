import { Cursor, Bounds, DestroyableBounds } from '../bounds';
import { Option, Destroyable } from '../core';
import * as Simple from '../dom';
import { Environment } from '../environment';
import { LinkedList, LinkedListNode } from '../collections';
import { TreeConstruction } from '../dom/tree-construction';
import { ElementOperations } from '../dom/element-operations';
import { Changes as DOMChanges } from '../dom/changes';
import { PathReference } from '../references';

export interface Tracker extends DestroyableBounds {
  openElement(element: Simple.Element): void;
  closeElement(): void;
  newNode(node: Simple.Node): void;
  newBounds(bounds: Bounds): void;
  newDestroyable(d: Destroyable): void;
  finalize(stack: ElementStack): void;
}

export interface UpdatableTracker extends Tracker {
  reset(env: Environment): void;
}

export interface ElementStack extends Cursor {
  nextSibling: Option<Simple.Node>;
  dom: TreeConstruction;
  updateOperations: DOMChanges;
  constructing: Option<Simple.Element>;
  operations: Option<ElementOperations>;
  element: Simple.Element;
  env: Environment;

  expectConstructing(method: string): Simple.Element;
  expectOperations(method: string): ElementOperations;

  block(): Tracker;
  popElement(): void;
  pushSimpleBlock(): Tracker;
  pushUpdatableBlock(): UpdatableTracker;
  pushBlockList(list: LinkedList<LinkedListNode & Bounds & Destroyable>): Tracker;
  popBlock(): Tracker;
  openElement(tag: string, operations: this['operations']): Simple.Element;

  flushElement(): void;

  pushRemoteElement(element: Simple.Element): void;
  popRemoteElement(): void;

  newDestroyable(d: Destroyable): void;
  newBounds(bounds: Bounds): void;

  appendText(string: string): Simple.Text;
  appendComment(string: string): Simple.Comment;
  setStaticAttribute(name: string, value: string): void;
  setStaticAttributeNS(namespace: string, name: string, value: string): void;
  setDynamicAttribute(name: string, reference: PathReference<string>, isTrusting: boolean): void;
  setDynamicAttributeNS(namespace: string, name: string, reference: PathReference<string>, isTrusting: boolean): void;

  closeElement(): void;
}