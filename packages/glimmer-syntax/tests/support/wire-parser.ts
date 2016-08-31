import { IR } from 'glimmer-syntax';
import * as WF from 'glimmer-wire-format';

export interface WireFormatDelegate {
  Constant(s: IR.Constant): void;
  ProgramStart(): void;
  ProgramEnd(): void;
  ElementStart(): void;
  ElementEnd(): void;
  AttrStart(): void;
  AttrEnd(): void;
  Append(trusted: boolean): void;
  ArgsStart(): void;
  ArgsEnd(): void;
  PositionalStart(): void;
  PositionalEnd(): void;
  NamedStart(): void;
  NamedEnd(): void;
  Data(): void;
  Comment(): void;
  Unknown(): void;
  BlockGroupStart(): void;
  BlockGroupEnd(): void;
  BlockStart(): void;
  Locals(count: number): void;
  OpenTagEnd(kind: IR.OpenTagKind): void;
  Attr(kind: IR.AttributeKind): void;
  Path(segments: number): void;
  AtPath(segments: number): void;
}

export class WireFormatParser {
  static parse(template: string): WF.SerializedTemplate {
    throw 'unimpl';
  }

  static parseTokens(tokens: IR.Tokens[], delegate: WireFormatDelegate) {
    let p = new WireFormatParser(tokens, delegate);
    p.parse();
  }

  private pos = 0;
  constructor(private input: IR.Tokens[], private parser: Object) {}

  parse() {
    let { input, parser } = this;
    let len = input.length;

    for (; this.pos < len; this.pos++) {
      let [kind, args] = IR.kind(input[this.pos]);
      parser[kind](...args);
    }
  }
}