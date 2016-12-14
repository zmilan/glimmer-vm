import * as Simple from './dom';
import { Option, Destroyable } from './core';

export interface Bounds {
  // a method to future-proof for wormholing; may not be needed ultimately
  parentElement(): Simple.Element;
  firstNode(): Option<Simple.Node>;
  lastNode(): Option<Simple.Node>;
}

export interface Cursor {
  element: Simple.Element;
  nextSibling: Option<Simple.Node>;
}

export default Bounds;

export interface DestroyableBounds extends Bounds, Destroyable {}