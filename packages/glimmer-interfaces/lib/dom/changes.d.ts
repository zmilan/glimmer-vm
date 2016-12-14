import * as Simple from './simple';
import { Bounds } from '../bounds';
import { Option } from '../core';

export interface Changes {
  // TODO: Pare this down to not include the helper methods
  setAttribute(element: Simple.Element, name: string, value: string): void;
  setAttributeNS(element: Simple.Element, namespace: string, name: string, value: string): void;
  removeAttribute(element: Simple.Element, name: string): void;
  removeAttributeNS(element: Simple.Element, namespace: string, name: string): void;
  createTextNode(text: string): Simple.Text;
  createComment(data: string): Simple.Comment;
  createElement(tag: string, context?: Simple.Element): Simple.Element;
  insertHTMLBefore(_parent: Simple.Element, nextSibling: Simple.Node, html: string): Bounds;
  insertNodeBefore(parent: Simple.Element, node: Simple.Node, reference: Simple.Node): Bounds;
  insertTextBefore(parent: Simple.Element, nextSibling: Simple.Node, text: string): Simple.Text;
  insertBefore(element: Simple.Element, node: Simple.Node, reference: Option<Simple.Node>): void;
  insertAfter(element: Simple.Element, node: Simple.Node, reference: Simple.Node): void;
}