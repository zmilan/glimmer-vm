export interface JSONObject {
  [index: string]: JSON;
}

export interface JSONArray extends Array<JSON> {
  [index: number]: JSON;
}

export type JSON = JSONObject | JSONArray | number | string | boolean | null;

export interface SerializableTo<T extends JSON> {
  toJSON(): T;
}

export type Serializable = SerializableTo<JSON>;

export interface SerializableNode<T extends JSON> extends Node, SerializableTo<T> {}
