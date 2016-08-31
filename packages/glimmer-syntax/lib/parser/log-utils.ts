import { Char } from 'simple-html-tokenizer';
import { Option } from 'glimmer-util';

export interface AssertState<State> {
  assert<S extends State>(state: State, event: string, arity: number): Fallible<S, DuckError<State>>;
}

export interface DuckError<State> {
  actual: State;
  className: string;
  methodName: string;
  arity: number;
}

export interface Ok<T> {
  ok: true;
  val: T;
  unwrap(): T;
}

export interface Err<E> {
  ok: false;
  val: E;
  unwrap(): never;
}

export interface Fallible<T, E> {
  ok: boolean;
  val: T | E;
  unwrap(): T;
}

// type Fallible<T, E> = Ok<T> | Err<E>;

export function Ok<T>(val: T): Ok<T> {
  return {
    ok: true as true,
    val,
    unwrap(): T { return val; }
  };
}

export function Err<E>(val: E): Err<E> {
  return {
    ok: false as false,
    val,
    unwrap(): never { throw val; }
  };
}

export class LogTests<State> {
  duckTypes(state: State, name: string, arity: number, offset = 0): boolean {
    let method = state[name];
    return typeof method === 'function' && method.length === arity + offset /* pos is always the first arg */;
  }

  Has<T extends State>(duckName: string, offset = 0): AssertState<T> {
    return {
      assert: (state: State, event: string, arity: number): Fallible<T, DuckError<State>> => {
        if (event === duckName && this.duckTypes(state, event, arity, offset)) {
          return Ok(state as T);
        } else {
          return Err({ actual: state, className: state.constructor.name, methodName: duckName, arity });
        }
      }
    };
  }
}

export class EventLogger<State> {
  private implementedEvents(obj: Object, out: string[] = []): string[] {
    Object.getOwnPropertyNames(obj).forEach(name => {
      let desc = Object.getOwnPropertyDescriptor(obj, name);
      if (name[0] === name[0].toUpperCase() && typeof desc.value === 'function' && out.indexOf(name) === -1) out.push(name);
    });

    let prototype = Object.getPrototypeOf(obj);
    if (prototype !== null && prototype !== Object.prototype && prototype !== Function.prototype) {
      return this.implementedEvents(prototype, out);
    } else {
      return out;
    }
  }

  transition(name: string, to: State, ...args: (string[] | string | number | boolean | Char)[]) {
    debug('debug', `-> ${to.constructor.name}(ret=${to['ret'] && to['ret'].constructor.name})`, name, ...args);
  }

  output(reason: string, out: Object) {
    console.log(padLeft('', 30) + padLeft(reason, 6) + ' ' + JSON.stringify(out));
  }

  unimpl<T>(name: string, err?: DuckError<State>, arg?: T) {
    if (err) {
      let { methodName, actual } = err;
      console.groupCollapsed(padRight(name, 30) + 'unimplemented');

      let c = actual.constructor.name;
      let expected = arg !== undefined ? `${c}#${methodName}(${JSON.stringify(arg)})` : `${c}#${methodName}()`;

      console.info(padRight(`Expected ${expected}`, 30));
      console.info(padRight(`${c} implemented these events:`, 30));
      this.implementedEvents(actual).forEach(event => {
        let arity = actual[event].length;
        if (arity === 0) console.debug(`${event}()`);
        else console.debug(`${event}(arg)`);
      });

      console.groupEnd();
    } else {
      console.groupCollapsed(padRight(name, 30) + 'unimplemented');
      console.groupEnd();
    }
  }
}

function pad(count: number, padding = " "): string{
  let pad = "";
  for (let i = 0, l = count; i<l; i++) {
    pad += padding;
  }
  return pad;
}

function padRight(s: string, count: number, padding = " ") {
  if (s.length >= count) return s;
  return s + pad(count - s.length, padding);
}

function padLeft(s: string, count: number, padding = " ") {
  if (s.length >= count) return s;
  return pad(count - s.length, padding) + s;
}

function debug(kind: 'debug' | 'warn', to: Option<string>, name: string, ...args: (string[] | string | number | boolean | Char)[]) {
  if (args.length) {
    let a = args.map(a => {
      if (Array.isArray(a)) {
        return `[${a.join(', ')}]`;
      } else if (typeof a === 'object') {
        return a.chars;
      } else {
        return a;
      }
    });

    console[kind](`${padRight(name, 30)}${padRight(to || '', 30)} (${a.join(', ')})`);
  } else {
    console[kind](`${padRight(name, 30)}${padRight(to || '', 30)}`);
  }
}