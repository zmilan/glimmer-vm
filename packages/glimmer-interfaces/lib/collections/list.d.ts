import { Option, Destroyable } from '../core';

export interface LinkedListNode {
  next: Option<LinkedListNode>;
  prev: Option<LinkedListNode>;
}

// FIXME: Too big
export interface LinkedList<T extends LinkedListNode> extends Slice<T> {
  head(): Option<T>;
  tail(): Option<T>;
  clear(): void;
  isEmpty(): boolean;
  toArray(): T[];
  splice(start: T, end: T, reference: T): void;
  spliceList(list: LinkedList<T>, reference: T): void;
  nextNode(node: T): T;
  prevNode(node: T): T;
  forEachNode(callback: (node: T) => void): void;
  contains(needle: T): boolean;
  insertBefore(node: T, reference: Option<T>): T;
  append(node: T): T;
  pop(): Option<T>;
  prepend(node: T): T;
  remove(node: T): T;
}

export interface Slice<T extends LinkedListNode> {
  head(): Option<T>;
  tail(): Option<T>;
  nextNode(node: T): Option<T>;
  prevNode(node: T): Option<T>;
  forEachNode(callback: (node: T) => void): void;
  toArray(): T[];
  isEmpty(): boolean;
  contains(needle: T): boolean;
}