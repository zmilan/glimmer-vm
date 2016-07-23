declare module "handlebars/compiler/base" {
  import * as AST from "glimmer-syntax/lib/parser/stage1/handlebars-ast";
  export function parse(html: string): AST.Program;
}
