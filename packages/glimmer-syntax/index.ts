export { IR, Stage1 } from './lib/parser/stage1/parser';
export { Token, TokenKind, TokenLiteral, Namespace } from './lib/parser/stage1/tokens';
import * as HBS from './lib/parser/stage1/handlebars-ast';
export { HBS };
import * as Log from './lib/parser/log-utils';
export { Log };
export { HTMLNS } from './lib/ast/dom';