import * as Simple from './simple';
import { Option } from '../core';
import { Bounds } from '../bounds';

export interface TreeConstruction {
  createElement(tag: string, context?: Simple.Element): Simple.Element;
  createElementNS(namespace: Simple.Namespace, tag: string): Simple.Element;
  setAttribute(element: Simple.Element, name: string, value: string, namespace?: string): void;
  createTextNode(text: string): Simple.Text;
  createComment(data: string): Simple.Comment
  insertBefore(parent: Simple.Element, node: Simple.Node, reference: Option<Simple.Node>): void;
  insertHTMLBefore(parent: Simple.Element, html: string, reference: Option<Simple.Node>): Bounds;
}
