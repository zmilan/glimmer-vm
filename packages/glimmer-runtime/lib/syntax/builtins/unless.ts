import {
  CompileInto,
  SymbolLookup,
  Statement as StatementSyntax
} from '../../syntax';

import * as Syntax from '../core';

import {
  LabelOpcode,
  EnterOpcode,
  PutArgsOpcode,
  TestOpcode,
  JumpIfOpcode,
  JumpOpcode,
  EvaluateOpcode,
  ExitOpcode
} from '../../compiled/opcodes/vm';

import OpcodeBuilderDSL from '../../compiled/opcodes/builder';

import Environment from '../../environment';

export default class UnlessSyntax extends StatementSyntax {
  type = "unless-statement";

  public args: Syntax.Args;
  public templates: Syntax.Templates;
  public isStatic = false;

  constructor({ args, templates }: { args: Syntax.Args, templates: Syntax.Templates }) {
    super();
    this.args = args;
    this.templates = templates;
  }

  prettyPrint() {
    return `#unless ${this.args.prettyPrint()}`;
  }

  compile(dsl: OpcodeBuilderDSL, env: Environment) {
    //        Enter(BEGIN, END)
    // BEGIN: Noop
    //        PutArgs
    //        Test
    //        JumpIf(ELSE)
    //        Evaluate(default)
    //        Jump(END)
    // ELSE:  Noop
    //        Evalulate(inverse)
    // END:   Noop
    //        Exit

    let { args, templates } = this;

    dsl.startLabels();

    dsl.enter('BEGIN', 'END');
    dsl.append(dsl.labelFor('BEGIN'));
    dsl.putArgs({ args });
    dsl.test();

    if (templates.inverse) {
      dsl.jumpIf('ELSE');
      dsl.evaluate({ debug: "default", block: templates.default })
      dsl.jump('END');
      dsl.label('ELSE');
      dsl.evaluate({ debug: "inverse", block: templates.inverse });
    } else {
      dsl.jumpIf('END');
      dsl.evaluate({ debug: "default", block: templates.default });
    }

    dsl.label('END');
    dsl.exit();

    dsl.stopLabels();
  }
}