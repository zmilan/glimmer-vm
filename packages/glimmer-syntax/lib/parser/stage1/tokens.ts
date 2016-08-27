type Option<T> = T | null;

export function token(t: Token, kind: TokenKind, flag: TokenFlag, value: number) {

}

export function literal(value: boolean | null | undefined | string | number, constants: string[]): number {
  let l = 0;

  if (typeof value === 'boolean') {
    l  = TokenLiteral.Small << 26;
    l |= (value ? SmallValue.True : SmallValue.False);
  } else if (typeof value === 'string') {
    let pos = constants.length;
    constants.push(value);

    l  = TokenLiteral.String << 26;
    l |= pos;
  } else if (value === null) {
    l  = TokenLiteral.Small;
    l |= SmallValue.Null;
  } else if (value === undefined) {
    l  = TokenLiteral.Small;
    l |= SmallValue.Undefined;
  }

  return l;
}

/*

# Format

Generally, each token is represented by a 32-bit value:

```
4    2  4    22
#### ## #### ######################
---- -- ---- ----------------------
 |   |    |             |
 |   |    |             -- Value
 |   |    -- TokenFlag
 |   -- TokenKind (Start, End, Void, SelfClosing)
 -- Token (0x0 to 0xf)
```

Literals are represented specially:

```
4    2  26
#### ## ##########################
---- -- --------------------------
 |   |   |
 |   |   |
 |   |   -- Value (per TokenLiteral, possibly w/ Cont)
 |   -- TokenLiteral (Number, String, SmallValue)
 -- Token (0x0)
```

# Literal

Token ID: 0x0

## Small Value:

```
true:       0x0 - 0b10 - 0b01
false:      0x0 - 0b10 - 0b00
null:       0x0 - 0b10 - 0b10
undefined:  0x0 - 0b10 - 0b11
```

## String or Number

```
string:     0x0 - 0b00 - 0b0 - ConstantIndex
string:     0x0 - 0b00 - 0b1 - Varint ConstantIndex
smallint:   0x0 - 0b01 - 0b0 - 0b0 - 24-bit integer
smallfloat: 0x0 - 0b01 - 0b0 - 0b1 - 24-bit float
bigint:     0x0 - 0b01 - 0b1 - 0b0 - Varint
bigfloat:   0x0 - 0b01 - 0b1 - 0b1 - Varfloat
```

# Expression

Token ID: 0xf

## Simple Path

```
foo
```

TokenKind: Void
TokenFlag: PATH | CONST
Value: Varint pointing at constant pool

## Dotted Path

```
foo.bar.baz
```

TokenKind: Start
TokenFlag: PATH
Value: Varint

followed by Varint String Literal

## Literal

```
(true)
```

TokenKind: Void
TokenFlag: LIT
Value: [Literal: 22]

## SubExpression: Embedded Path and Literal

```
(foo true)
```

TokenKind: Void
TokenFlag: PATH | LIT
Value: [Path: 6, Literal: 16]

## Embedded Args

TokenKind: Void
TokenFlag: PATH | ARGS
Value: [Path: 6, Positional: 10, Named: 10]

# Arguments

* Path
* Positional as count (followed by count Literal or Expression)
* Named as count (followed by count Pair)

## Pair

* Ident as constant index
* Value as Literal or Expression

*/

export enum Token {
  //                            Represents   Token (4)      TokenKind (2)       TokenFlag (5)       Value (21) or Literal (3) / Value (18)
  Literal           = 0x0,   // Program
  BlockGroup        = 0x1,
  Block             = 0x2,
  Append            = 0x3,
  Partial           = 0x4,
  Positional        = 0x5,  // [Literal]     Positional     Void                 ... same as Literal below (indicates one-element positional)
                            // [Expression]  Positional     Start                NONE                 0
                            // [SubExpr]     Positional     Start                PATH | ARGS          [Path: 6, Positional: 6, Named: 6]
                            // Expression[]  Positional     Start                NONE                 Varint (count)
  Named             = 0x6,  // Id=Expression Named          Void                 NONE                 String
                            // Named[]       Named          Start                NONE                 Varint (count)
  SourceComment     = 0x7,

  Element           = 0x8,
  StartTag          = 0x9,
  EndTag            = 0xa,
  Attribute         = 0xb,
  Data              = 0xc,
  HTMLComment       = 0xd,

  Program           = 0xe,  // literal       Literal         Void                LIT                 TokenLiteral / Defined by TokenLiteral

  SubExpression     = 0xf   // [1]           SubExpression   Void                None                PATH | ARGS         [Path: 6, Positional: 6, Named: 6]
                            // [2]           SubExpression   Start               None                PATH                Varint
                            //

  // [1]: subexpression with one segment path. path / positional / named must be less than 128
  // [2]: subexpression with multi-segment path. Value represents size of path. positional and named follow.
}

export enum TokenKind {
  Start             = 0b00,
  End               = 0b01,
  Void              = 0b10,
  SelfClosing       = 0b11
}

// When Token is Literal, the kind of literal in question
export enum TokenLiteral {
  String            = 0b00, // 18-bit value points at the constant pool
  Number            = 0b01, // 18-bit value is a number (Varint via CONT)
  Small             = 0b10, // 18-bit value is SmallValues
}

export enum SmallValue {
  False             = 0b00,
  True              = 0b01,
  Null              = 0b10,
  Undefined         = 0b11
}

export enum TokenFlag {
  NONE  = 0b00000,
  LIT   = 0b00001, // first 3 bits of value: TokenLiteral, rest: determined by TokenLiteral
  ARGS  = 0b00010, // second and third 6 bits of value: positional / named
  CONST = 0b00100, // 18-bit value points at the constant pool
  PATH  = 0b01000, // first 6 bits of value: single-element path
  CONT  = 0b10000  // variable sized value continues with next byte
}

export default Token;

export enum Namespace {
  HTML,
  SVG,
  MATHML,
  Ambiguous
}

function LAST(n: number, bits: number): number {
  return n & ((1 << bits) - 1);
}

export function MID(n: number, from: number, to: number) {
  return LAST(n >>> from, to - from);
}