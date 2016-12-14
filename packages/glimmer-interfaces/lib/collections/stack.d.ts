import { Option } from '../core';

export interface Stack<T> {
  current: Option<T>;

  push(item: T): void;
  pop(): Option<T>;
  isEmpty(): boolean;
}