import { Position, Delegate, Char } from 'simple-html-tokenizer';
import { TokenizerDelegate } from './tokenizer-delegate';
import { Option, unwrap } from 'glimmer-util';
import { HTMLNS, ElementType, TreeElement, TreeToken } from './types';
import { Location as PhysicalLocation } from '../parser/handlebars-ast';

export const COLLAPSED: Location = "COLLAPSED [d2a7ffd1-5023-4eeb-935b-ae95f732d836]";

export type Location = PhysicalLocation | "COLLAPSED [d2a7ffd1-5023-4eeb-935b-ae95f732d836]";

export interface SerializedLocation {
  start: { line: number, column: number };
  end: { line: number, column: number };
}

export function locToJSON(l: Location): SerializedLocation {
  if (l === COLLAPSED) {
    throw new Error("Cannot convert a collapsed location to JSON");
  } else {
    let { start, end } = l as PhysicalLocation;
    return { start: { line: start.line, column: start.column }, end: { line: end.line, column: end.column } };
  }
}

export interface SerializedLocatableToken {
  type: string;
  loc: SerializedLocation;
}

export class LocatableToken {
  constructor(public loc: Location) {}
}

export class CharsToken extends LocatableToken {
  constructor(public loc: PhysicalLocation, public chars: string) {
    super(loc);
  }
}

export class DataTokenBuilder extends CharsTokenBuilder<DataToken> {
  protected TokenType = DataToken;
}

export interface SerializedDataToken extends SerializedLocatableToken {
  type: 'data';
  chars: string;
}

export class DataToken extends CharsToken {
  toJSON(): SerializedDataToken {
    return {
      type: 'data',
      loc: locToJSON(this.loc),
      chars: this.chars
    }
  }

  toHTML(): string {
    return this.chars;
  }
}

export class CommentTokenBuilder extends CharsTokenBuilder<CommentToken> {
  protected TokenType = CommentToken;
}

export interface SerializedCommentToken extends SerializedLocatableToken {
  type: 'comment';
  chars: string;
}

export class CommentToken extends CharsToken {
  toJSON(): SerializedCommentToken {
    return {
      type: 'comment',
      loc: locToJSON(this.loc),
      chars: this.chars
    }
  }

  toHTML(): string {
    return `<!--${this.chars}-->`;
  }
}

export const SELF_CLOSING: TreeChildren = "SELF_CLOSING [b05f9a4e-5713-4177-8aa9-29c08c7cce59]";
export type SELF_CLOSING = "SELF_CLOSING [b05f9a4e-5713-4177-8aa9-29c08c7cce59]";
export type TreeChildren = SELF_CLOSING | TreeToken[];

export class ElementBuilder extends LocatableTokenBuilder {
  finalize(openTag: OpenTagToken): OpenedElementBuilder {
    return new OpenedElementBuilder(this.loc, openTag);
  }
}

export class OpenedElementBuilder extends LocatableTokenBuilder {
  protected children: TreeToken[] = [];

  constructor(loc: LocationBuilder, public openTag: OpenTagToken) {
    super(loc);
  }

  append(child: TreeToken) {
    this.children.push(child);
  }

  finalize(end: Position, closeTag: CloseTagToken): ElementToken {
    let loc = this.loc.finalize(end);
    return new ElementToken(loc, this.openTag, closeTag, this.children);
  }
}

export type SerializedTreeToken = SerializedElementToken | SerializedDataToken | SerializedCommentToken;

export interface SerializedElementToken extends SerializedLocatableToken {
  type: 'element';
  openTag: SerializedOpenTagToken;
  closeTag: Option<SerializedCloseTagToken>;
  children: Option<SerializedTreeToken[]>;
}

export class ElementToken extends LocatableToken {
  constructor(loc: Location, public openTag: OpenTagToken, public closeTag: CloseTagToken, public children: TreeChildren) {
    super(loc);
  }

  toJSON(): SerializedElementToken {
    let children: Option<TreeToken[]> = this.children === SELF_CLOSING ? null : this.children as TreeToken[];

    return {
      type: 'element',
      loc: locToJSON(this.loc),
      openTag: this.openTag.toJSON(),
      closeTag: this.closeTag.toJSON(),
      children: children && children.map(c => c.toJSON())
    };
  }

  toHTML(): string {
    let children = this.children;
    let out = this.openTag.toHTML(children === SELF_CLOSING);
    if (children !== SELF_CLOSING) {
      let c = children as TreeToken[];
      out += c.map(child => child.toHTML()).join('');
      out += this.closeTag.toHTML();
    }
    return out;
  }
}

export class OpenTagBuilder extends LocatableTokenBuilder implements ElementType {
  private attributes: Attribute[] = [];

  constructor(public loc: LocationBuilder, private tagName: TagNameToken) {
    super(loc);
  }

  get name(): string {
    return this.tagName.chars;
  }

  get namespace(): string {
    return this.tagName.namespace;
  }

  attr(attribute: Attribute) {
    this.attributes.push(attribute);
  }

  matches(target: ElementType): boolean {
    let tagName = this.tagName;
    return this.tagName.name === target.name && this.tagName.namespace === target.namespace;
  }

  selfClosing(pos: Position): ElementToken {
    let loc = this.loc.finalize(pos);
    return new ElementToken(loc, new OpenTagToken(loc, this.tagName, this.attributes), new CloseTagToken(COLLAPSED, this.tagName), []);
  }

  finalize(pos: Position): OpenTagToken {
    let loc = this.loc.finalize(pos);
    return new OpenTagToken(loc, this.tagName, this.attributes);
  }
}

export interface SerializedOpenTagToken extends SerializedLocatableToken {
  type: 'open-tag';
  tagName: SerializedTagNameToken;
  attributes: SerializedAttribute[];
}

export class OpenTagToken extends LocatableToken implements ElementType {
  constructor(loc: Location, public tagName: TagNameToken, public attributes: Attribute[]) {
    super(loc);
  }

  get name(): string {
    return this.tagName.chars;
  }

  get namespace(): string {
    return this.tagName.namespace;
  }

  toJSON(): SerializedOpenTagToken {
    return {
      type: 'open-tag',
      loc: locToJSON(this.loc),
      tagName: this.tagName.toJSON(),
      attributes: this.attributes.map(a => a.toJSON())
    }
  }

  toHTML(selfClosing: boolean): string {
    let attrs = this.attributes.map(a => ` ${a.toHTML()}`).join('');
    return `<${this.tagName}${attrs}${selfClosing ? ' /' : ''}>`;
  }
}

export class CloseTagBuilder extends LocatableTokenBuilder implements ElementType {
  constructor(loc: LocationBuilder, public tagName: TagNameToken) {
    super(loc);
  }

  finalize(pos: Position): CloseTagToken {
    return new CloseTagToken(this.loc.finalize(pos), this.tagName);
  }

  get name(): string {
    return this.tagName.chars;
  }

  get namespace(): string {
    return this.tagName.namespace;
  }
}

export interface SerializedCloseTagToken extends SerializedLocatableToken {
  type: 'close-tag';
  tagName: SerializedTagNameToken;
}

export class CloseTagToken extends LocatableToken implements ElementType {
  constructor(loc: Location, public tagName: TagNameToken) {
    super(loc);
  }

  get name(): string {
    return this.tagName.chars;
  }

  get namespace(): string {
    return this.tagName.namespace;
  }

  toJSON(): Option<SerializedCloseTagToken> {
    if (this.loc === COLLAPSED) {
      return null;
    } else {
      return {
        type: 'close-tag',
        loc: locToJSON(this.loc),
        tagName: this.tagName.toJSON()
      }
    }
  }

  toHTML(): string {
    return `</${this.tagName.chars}>`;
  }
}

export class TagNameTokenBuilder extends CharsTokenBuilder<TagNameToken> {
  protected TokenType = TagNameToken;
}

export interface SerializedTagNameToken extends SerializedLocatableToken {
  type: 'tag-name';
  namespace: Option<string>;
  name: string;
}

export class TagNameToken extends CharsToken implements ElementType {
  public namespace = HTMLNS;

  constructor(loc: PhysicalLocation, chars: string = '') {
    super(loc, chars);
  }

  ns(namespace: string) {
    this.namespace = namespace;
  }

  get name(): string {
    return this.chars;
  }

  toJSON(): SerializedTagNameToken {
    return {
      type: 'tag-name',
      loc: locToJSON(this.loc),
      name: this.name,
      namespace: this.namespace === HTMLNS ? null : this.namespace
    }
  }

  toHTML(): string {
    return this.chars;
  }
}

export type SINGLE_QUOTE = "'";
export type DOUBLE_QUOTE = '"';
export type QUOTE = SINGLE_QUOTE | DOUBLE_QUOTE;

export class AttributeBuilder extends LocatableTokenBuilder {
  private _quote: Option<QUOTE> = null;

  quote(kind: QUOTE) {
    this._quote = kind;
  }

  finalize(end: Position, name: AttributeNameToken, value: AttributeValueToken): Attribute {
    return new Attribute(this.loc.finalize(end), name, value, this._quote);
  }
}

export interface SerializedAttribute extends SerializedLocatableToken {
  type: 'attribute';
  name: SerializedAttributeNameToken;
  value: Option<SerializedAttributeValueToken>;
  quote: Option<QUOTE>;
}

export class Attribute extends LocatableToken {
  constructor(loc: Location, public name: AttributeNameToken, public value: AttributeValueToken, public quote: Option<QUOTE>) {
    super(loc);
  }

  toJSON(): SerializedAttribute {
    return {
      type: 'attribute',
      loc: locToJSON(this.loc),
      name: this.name.toJSON(),
      value: this.value.loc === COLLAPSED ? null : this.value.toJSON(),
      quote: this.quote
    }
  }

  toHTML(): string {
    let val = this.value.toHTML();

    if (!val) {
      return this.name.toHTML();
    } else {
      let quote = this.quote || '';
      return `${this.name.toHTML()}=${quote}${this.value.toHTML()}${quote}`
    }
  }
}

export class AttributeNameTokenBuilder extends CharsTokenBuilder<AttributeNameToken> {
  protected TokenType = AttributeNameToken;
}

export interface SerializedAttributeNameToken extends SerializedLocatableToken {
  type: 'attribute-name';
  chars: string
}

export class AttributeNameToken extends CharsToken {
  toJSON(): SerializedAttributeNameToken {
    return {
      type: 'attribute-name',
      loc: locToJSON(this.loc),
      chars: this.chars
    }
  }

  toHTML(): string {
    return this.chars;
  }
}

export class AttributeValueTokenBuilder extends LocatableTokenBuilder {
  protected TokenType = AttributeValueToken;

  beginInner(pos: Position): InnerAttributeValueTokenBuilder {
    return new InnerAttributeValueTokenBuilder(loc(pos));
  }

  finalize(pos: Position, inner: InnerAttributeValueToken) {
    return new AttributeValueToken(this.loc.finalize(pos), inner);
  }
}

export interface SerializedAttributeValueToken extends SerializedLocatableToken {
  type: 'attribute-value';
  inner: Option<SerializedInnerAttributeValueToken>;
}

export class AttributeValueToken extends LocatableToken {
  static voidValue(): AttributeValueToken {
    return new AttributeValueToken(COLLAPSED, null);
  }

  constructor(loc: Location, public inner: Option<InnerAttributeValueToken>) {
    super(loc);
  }

  toJSON(): Option<SerializedAttributeValueToken> {
    if (this.loc === COLLAPSED) {
      return null;
    }

    return {
      type: 'attribute-value',
      loc: locToJSON(this.loc),
      inner: this.inner && this.inner.toJSON()
    }
  }

  toHTML(): string {
    if (this.loc === COLLAPSED || this.inner === null) {
      return '';
    } else {
      return this.inner.toHTML();
    }
  }
}

export class InnerAttributeValueTokenBuilder extends CharsTokenBuilder<InnerAttributeValueToken> {
  constructor(loc: LocationBuilder) {
    super(loc);
  }

  finalize(pos: Position): InnerAttributeValueToken {
    return new InnerAttributeValueToken(this.loc.finalize(pos), this.chars);
  }
}

export interface SerializedInnerAttributeValueToken extends SerializedLocatableToken {
  type: 'inner-attribute-value';
  chars: string;
}

export class InnerAttributeValueToken extends CharsToken {
  constructor(loc: PhysicalLocation, chars: string) {
    super(loc, chars);
  }

  toJSON(): SerializedInnerAttributeValueToken {
    return {
      type: 'inner-attribute-value',
      loc: locToJSON(this.loc),
      chars: this.chars
    }
  }

  toHTML(): string {
    return this.chars;
  }
}