import { parse } from "handlebars/compiler/base";
import { Program } from "../../ast";

export class Stage1 {
  constructor(private input: string) {}

  parse(): Program {
    return parse(this.input);
  }
}