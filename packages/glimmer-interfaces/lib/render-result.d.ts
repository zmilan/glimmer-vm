import * as Simple from './dom';
import { LinkedList } from './collections';
import { Option } from './core';
import { UpdatingOpcode, ExceptionHandler } from './vm/opcodes';
import { DestroyableBounds } from './bounds';

export interface RenderResult extends DestroyableBounds, ExceptionHandler {
  rerender(options: { alwaysRevalidate: boolean }): void;
  parentElement(): Simple.Element;
  firstNode(): Option<Simple.Node>;
  lastNode(): Option<Simple.Node>;
  opcodes(): LinkedList<UpdatingOpcode>;
  handleException(): void;
  destroy(): void;
}
