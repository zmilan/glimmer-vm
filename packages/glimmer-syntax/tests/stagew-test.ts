import { Stage1, IR } from 'glimmer-syntax';
import { IRBuilder, build } from './support';
import * as WF from 'glimmer-wire-format';

QUnit.module('[glimmer-syntax] wire-format');

eq('<div><p>{{value}}<p></div>', {
  statements: [],
  locals: [],
  named: [],
  yields: [],
  blocks: [],
  meta: {}
});

function eq(template: string, wire: WF.SerializedTemplate) {

}