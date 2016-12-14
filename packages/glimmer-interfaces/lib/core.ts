export type Opaque = {} | void | null | undefined;
export type Option<T> = T | null;
export type Maybe<T> = Option<T> | undefined;

export type TSISSUE<T, S extends string> = T;
export type FIXME<T, S extends string> = T;
export type TRUST<T, S extends string> = any;

export interface Destroyable {
  destroy(): void;
}

export interface Dict<T> {
  [index: string]: T;
}

export interface HasGuid {
  _guid: number;
}