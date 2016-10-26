import { Opaque } from "glimmer-util";

import {
  Statement as StatementSyntax,
  Expression as ExpressionSyntax
} from '../../syntax';

import SymbolTable from '../../symbol-table';

import OpcodeBuilderDSL from '../../compiled/opcodes/builder';

import * as Syntax from '../core';
import Environment from '../../environment';

export class StaticPartialSyntax extends StatementSyntax {
  public type = "static-partial";

  constructor(private name: Syntax.Value<any>) {
    super();
  }

  compile(dsl: OpcodeBuilderDSL, env: Environment, symbolTable: SymbolTable) {
    let name = String(this.name.inner());

    if (!env.hasPartial(name, symbolTable)) {
      throw new Error(`Compile Error: ${name} is not a partial`);
    }

    let definition = env.lookupPartial(name, symbolTable);

    dsl.putPartialDefinition(definition);
    dsl.evaluatePartial();
  }
}

export class DynamicPartialSyntax extends StatementSyntax {
  public type = "dynamic-partial";

  constructor(private name: ExpressionSyntax<Opaque>) {
    super();
  }

  compile(dsl: OpcodeBuilderDSL) {
    let { name } = this;

    dsl.putValue(name);
    dsl.test('simple');

    dsl.dynamicBlock(null, dsl => {
      dsl.jumpUnless('END');
      dsl.putDynamicPartialDefinition();
      dsl.evaluatePartial();
    });
  }
}
