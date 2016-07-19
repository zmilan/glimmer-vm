import {
  Statement,
  StatementNode
} from './interfaces';
import {
  Ident,
  Locatable
} from './core';
import Location from './location';
import { Mustache, Program } from './statements';

export const HTMLNS:   Namespace = "http://www.w3.org/1999/xhtml";
export const SVGNS:    Namespace = "http://www.w3.org/2000/svg";
export const MATHMLNS: Namespace = "http://www.w3.org/1998/Math/MathML";

export type Namespace =
    "http://www.w3.org/1999/xhtml"
  | "http://www.w3.org/2000/svg"
  | "http://www.w3.org/1998/Math/MathML";

export class Element extends Locatable implements StatementNode {
  public type = Statement.Element;

  constructor(
    public tagName: TagName,
    public attributes: Attr[],
    public modifiers: Mustache[],
    public program: Program,
    loc: Location
  ) {
    super(loc);
  }
}

export class TagName extends Locatable {
  public type = Statement.TagName;

  constructor(
    public name: Ident,
    public namespace: Namespace,
    loc: Location
  ) {
    super(loc);
  }
}

export type AttrValue = Text | Concat | Mustache;

export class Attr extends Locatable implements StatementNode {
  public type = Statement.Attr;

  constructor(
    public name: Ident,
    public value: AttrValue,
    loc: Location
  ) {
    super(loc);
  }
}

export class Text extends Locatable implements StatementNode {
  public type = Statement.Text;

  constructor(
    public chars: string,
    loc: Location
  ) {
    super(loc);
  }
}

export class Comment extends Locatable implements StatementNode {
  public type = Statement.Comment;

  constructor(
    public chars: string,
    loc: Location
  ) {
    super(loc);
  }
}

export class Concat extends Locatable {
  public type = Statement.Comment;

  constructor(
    public parts: StatementNode[],
    loc: Location
  ) {
    super(loc);
  }
}