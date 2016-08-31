declare module "handlebars/compiler/base" {
  import { HBS as AST } from "glimmer-syntax";
  export function parse(html: string): AST.Program;
}
