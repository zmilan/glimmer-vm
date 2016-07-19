import { Constructor, Option, Stack, unwrap, voidMap } from 'glimmer-util';
import { HbsToLoc, locFromHBS, SourceLocation, Location as GlimmerLocation, SourceFile, Position } from '../ast';
import { parseElementBlockParams, unwrapMustache } from "../utils";

import { builders as b, StatementNode, ExpressionNode, Node as INode } from "../builders";
import * as Node from "../builders";
import { fromHBS as hbs } from "../builders";
import * as HBS from "../parser/handlebars-ast";

import {
  EventedTokenizer as Tokenizer,
  Delegate,
  DelegateOptions,
  Position as HTMLPosition,
  Char
} from "simple-html-tokenizer";

import {
  INITIAL,
  LocatableToken,
  LocatableTokenBuilder,
  SerializedTreeToken,
  Location,
  SerializedLocation,
  TokenBuilder,
  DataToken,
  DataTokenBuilder,
  CommentToken,
  CommentTokenBuilder,
  OpenedElementBuilder,
  ElementBuilder,
  ElementToken,
  OpenTagBuilder,
  OpenTagToken,
  CloseTagBuilder,
  CloseTagToken,
  TagNameToken,
  TagNameTokenBuilder,
  Attribute,
  AttributeBuilder,
  AttributeNameToken,
  AttributeNameTokenBuilder,
  loc,
  locToJSON
} from './tokens';

import ElementStack from './element-stack';

import {
  ElementType,
  TreeElement,
  TreeToken
} from './types';

import {
  ParserState,
  InitialState
} from './parser';

export function pos(p: HTMLPosition): Position {
  return Position.fromHBS(p);
}

export default class HTMLParser implements Delegate {
  protected elementStack: ElementStack;
  private token: TokenBuilder = INITIAL;
  public state: ParserState = InitialState.INSTANCE;
  // originalInsertionMode is stored on Text and InTableText

  constructor(p: HTMLPosition = { line: 1, column: 0 }) {
    this.elementStack = new ElementStack(new TemplateContents(new LocationBuilder(pos(p))));
  }

  get currentElement(): TemplateContents | OpenedElementBuilder {
    return this.elementStack.current;
  }

  finalize(p: HTMLPosition): TemplateContentsToken {
    return this.elementStack.finalize(p);
  }

  appendElement(token: OpenedElementBuilder) {
    this.elementStack.pushElement(token);
  }

  appendLeaf(token: DataToken | CommentToken) {
    this.currentElement.append(token);
  }

  closeElement(p: HTMLPosition, tag: CloseTagToken) {
    let elementBuilder = this.elementStack.popElement();
    let element = elementBuilder.finalize(pos(p), tag);
    this.currentElement.append(element);
  }

  beginData(p: Position): void {
    this.state.beginData(this, pos(p));
  }

  appendToData(p: Position, char: Char): void {
    this.state.appendToData(this, pos(p), char);
  }

  finishData(p: Position): void {
    this.state.finishData(this, pos(p));
  }

  openStartTag(p: Position): void {
    this.state.openStartTag(this, pos(p));
  }

  openEndTag(p: Position): void {
    this.state.openEndTag(this, pos(p));
  }

  beginTagName(p: Position): void {
    this.state.beginTagName(this, pos(p));
  }

  appendToTagName(p: Position, char: string): void {
    this.state.appendToTagName(this, pos(p), char);
  }

  finishTagName(p: Position): void {
    this.state.finishTagName(this, pos(p));
  }

  beginAttributeName(p: Position): void {
    this.state.beginAttributeName(this, pos(p));
  }

  appendToAttributeName(p: Position, char: string): void {
    this.state.appendToData(this, pos(p), char);
  }

  finishAttributeName(p: Position): void {
    this.state.finishAttributeName(this, pos(p));
  }

  voidAttributeValue(p: Position): void {
    this.state.voidAttributeValue(this, pos(p));
  }

  beginWholeAttributeValue(p: Position): void {
    this.state.beginWholeAttributeValue(this, pos(p));
  }

  beginAttributeValue(p: Position, quoted: boolean): void {
    this.state.beginAttributeValue(this, pos(p), quoted);
  }

  appendToAttributeValue(p: Position, char: Char): void {
    this.state.appendToAttributeValue(this, pos(p), char);
  }

  finishAttributeValue(p: Position, quoted: boolean): void {
    this.state.finishAttributeValue(this, pos(p));
  }

  finishWholeAttributeValue(p: Position): void {
    this.state.finishWholeAttributeValue(this, pos(p));
  }

  finishTag(p: Position, selfClosing: boolean): void {
    this.state.finishTag(this, pos(p), selfClosing);
  }

  whitespace(p: Position, char: string): void {
    this.state.whitespace(this, pos(p), char);
  }

  beginComment(p: Position): void {
    this.state.beginComment(this, pos(p));
  }

  appendToCommentData(p: Position, char: string): void {
    this.state.appendToCommentData(this, pos(p), char);
  }

  finishComment(p: Position): void {
    this.state.finishComment(this, pos(p));
  }
}

import { LocationBuilder } from './tokens';

type ElementName = string;

export class TemplateContents extends LocatableTokenBuilder {
  protected children: TreeToken[] = [];

  get last() {
    return this.children[this.children.length - 1];
  }

  append(child: TreeToken) {
    this.children.push(child);
  }

  finalize(p: HTMLPosition): TemplateContentsToken {
    return new TemplateContentsToken(this.loc.finalize(pos(p)), this.children)
  }
}

export interface SerializedTemplateContentsToken {
  type: 'template-contents';
  loc: SerializedLocation;
  children: SerializedTreeToken[];
}

export class TemplateContentsToken extends LocatableToken {
  constructor(loc: Location, public children: TreeToken[]) {
    super(loc);
  }

  toJSON(): SerializedTemplateContentsToken {
    return {
      type: 'template-contents',
      loc: locToJSON(this.loc),
      children: this.children.map(c => c.toJSON())
    }
  }

  toHTML(): string {
    return this.children.map(c => c.toHTML()).join('');
  }
}
