import { Position } from '../../../ast/location';
import { Char } from 'simple-html-tokenizer';
import { IR } from '../parser';

export { Position } from '../../../ast/location';

interface Constructor<T> {
  new(...args): T;
}

// export function illegal(t: State<Result>, event: string, ...args: (string | boolean | number)[]): Error {
//   if (args.length) {
//     return new Error(`assert: ${event}(${args.join(', ')}) was not legal in ${t.constructor.name}`);
//   } else {
//     return new Error(`assert: ${event} was not legal in ${t.constructor.name}`);
//   }
// }

/// STATE ///

export interface State {
  'STATE [id=ebd1fd4d-b4bc-4801-8bca-ebf013dc376b]': true;
}

export const STATE = 'STATE [id=ebd1fd4d-b4bc-4801-8bca-ebf013dc376b]';
export type NonEmptyResult = [IR.Tokens];
export const EMPTY: never[] = [];
export type EMPTY = typeof EMPTY;
export type Result = EMPTY | NonEmptyResult | IR.Tokens[];

export interface Next<T extends Result, S extends State> {
  result: T;
  next: S;
};

export type SomeNext = Next<Result, State>;
