import { Dict, Option } from 'glimmer-util';

type JsonValue =
    string
  | number
  | boolean
  | JsonObject
  | JsonArray
  ;

interface JsonObject extends Dict<JsonValue> {}
interface JsonArray extends Array<JsonValue> {}

// This entire file is serialized to disk, so all strings
// end up being interned.
export type str = string;
export type TemplateReference = number;
export type YieldTo = str;

function is<T extends any[]>(variant: string): (value: any[]) => value is T {
  return function(value: any[]): value is T {
    return value[0] === variant;
  };
}

export namespace Core {
  type Expression = Expressions.Expression;

  export type Path          = str[];
  export type Params        = Expression[];
  export type Hash          = [str[], Expression[]];
}

export namespace Expressions {
  type Path = Core.Path;
  type Params = Core.Params;
  type Hash = Core.Hash;

  export type KeywordName    = 'has-block' | 'has-block-params';
  export type Keyword<N extends KeywordName>
                             = [KeywordName, str];

  export type LookupName     = 'arg' | 'get' | 'self-get' | 'unknown';
  export type Lookup<N extends LookupName>
                             = [LookupName, Path];

  export type Unknown        = Lookup<'unknown'>;
  export type Arg            = Lookup<'arg'>;
  export type Get            = Lookup<'get'>;
  export type SelfGet        = Lookup<'self-get'>;
  export type HasBlock       = Keyword<'has-block'>;
  export type HasBlockParams = Keyword<'has-block-params'>;
  export type Value          = str | number | boolean | null; // tslint:disable-line
  export type Undefined      = ['undefined'];

  export type Expression =
      Unknown
    | Arg
    | Get
    | SelfGet
    | Concat
    | Keyword<KeywordName>
    | Helper
    | Undefined
    | Value
    ;

  export interface Concat extends Array<any> {
    [0]: 'concat';
    [1]: Params;
  }

  export interface Helper extends Array<any> {
    [0]: 'helper';
    [1]: Path;
    [2]: Params;
    [3]: Hash;
  }

  export const isUnknown        = is<Unknown>('unknown');
  export const isArg            = is<Arg>('arg');
  export const isGet            = is<Get>('get');
  export const isSelfGet        = is<SelfGet>('self-get');
  export const isConcat         = is<Concat>('concat');
  export const isHelper         = is<Helper>('helper');
  export const isHasBlock       = is<HasBlock>('has-block');
  export const isHasBlockParams = is<HasBlockParams>('has-block-params');
  export const isUndefined      = is<Undefined>('undefined');

  export function isPrimitiveValue(value: any): value is Value {
    if (value === null) {
      return true;
    }
    return typeof value !== 'object';
  }
}

export type Expression = Expressions.Expression;

export namespace Statements {
  type Expression = Expressions.Expression;
  type Params = Core.Params;
  type Hash = Core.Hash;
  type Path = Core.Path;

  export type DirectiveName = 'flush-element' | 'close-element';
  export type Directive<N extends DirectiveName>
                            = [N];
  export type DataName      = 'text' | 'comment';
  export type Data<N extends DataName>
                            = [N, string];
  export type AttrName      = 'static-attr' | 'dynamic-attr' | 'trusting-attr'
  export type Attr<N extends AttrName>
                            = [N, string, Expression, string /* namespace */];
  export type ArgName       = 'static-arg' | 'dynamic-arg';
  export type Arg<N extends ArgName>
                            = [N, string, Expression];
  export type SomeArg<N extends AttrName | ArgName>
                            = [N, string, Expression];

  export type Text          = Data<'text'>;
  export type Append        = ['append', Expression, boolean];
  export type Comment       = Data<'comment'>;
  export type Modifier      = ['modifier', Path, Params, Hash];
  export type Block         = ['block', Path, Params, Hash, TemplateReference, Option<TemplateReference>];
  export type OpenElement   = ['open-element', str, str[]];
  export type FlushElement  = Directive<'flush-element'>;
  export type CloseElement  = Directive<'close-element'>;
  export type StaticAttr    = Attr<'static-attr'>;
  export type DynamicAttr   = Attr<'dynamic-attr'>;
  export type TrustingAttr  = Attr<'trusting-attr'>;
  export type DynamicArg    = Arg<'dynamic-arg'>;
  export type StaticArg     = Arg<'static-arg'>;
  export type Yield         = ['yield', YieldTo, Params];

  export const isText         = is<Text>('text');
  export const isAppend       = is<Append>('append');
  export const isComment      = is<Comment>('comment');
  export const isModifier     = is<Modifier>('modifier');
  export const isBlock        = is<Block>('block');
  export const isOpenElement  = is<OpenElement>('open-element');
  export const isFlushElement = is<FlushElement>('flush-element');
  export const isCloseElement = is<CloseElement>('close-element');
  export const isStaticAttr   = is<StaticAttr>('static-attr');
  export const isDynamicAttr  = is<DynamicAttr>('dynamic-attr');
  export const isYield        = is<Yield>('yield');
  export const isDynamicArg   = is<DynamicArg>('dynamic-arg');
  export const isStaticArg    = is<StaticArg>('static-arg');
  export const isTrustingAttr = is<TrustingAttr>('trusting-attr');

  export type Statement =
      Append
    | Modifier
    | Block
    | OpenElement
    | Yield
    | Directive<DirectiveName>
    | Data<DataName>
    | Attr<AttrName>
    | Arg<ArgName>
    ;
}

export type Statement = Statements.Statement;

export interface BlockMeta {
  moduleName?: string;
}

export interface SerializedBlock {
  statements: Statements.Statement[];
  locals: string[];
}

export interface SerializedTemplate extends SerializedBlock {
  named: string[];
  yields: string[];
  blocks: SerializedBlock[];
  meta: BlockMeta;
}
