type Option<T> = T | null;

export interface Entity {
  entity: string,
  decoded: string
}

type Chars = Entity | string;
export type Content  = Chars | Chars[];

export interface Builder {
  whitespace(ws: string): this;
  content(data: string): this;
  entity(source: string, actual: string): this;
  comment(text: string, options?: { closing: boolean }): this;
  openTag(name: string): this;
  closeTag(options?: { whitespace: string }): this;
  selfClosing(options?: { whitespace: string }): this;
  voidTag(): this;
  attr(name: string, value: Option<Content>, options?: { quote: 'single' | 'double' | null }): this;
  unbalanced(): this;
}

export function entity(entity: string, decoded: string): Entity {
  return { entity, decoded };
}