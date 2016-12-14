export {
  compile,
  compileLayout,
  equalInnerHTML,
  equalHTML,
  equalTokens,
  generateSnapshot,
  equalSnapshots,
  normalizeInnerHTML,
  isCheckedInputHTML,
  getTextContent,
  strip,
  stripTight,
  trimLines
} from './lib/helpers';

export {
  Attrs,
  BasicComponent,
  EmberishCurlyComponent,
  EmberishGlimmerComponent,
  TestModifierManager,
  TestEnvironment,
  TestDynamicScope,
  equalsElement,
  inspectHooks,
  regex,
  classes
} from './lib/environment';

export {
  VersionedObject,
  testModule,
  template,
  RenderingTest,
  SimpleRootReference
} from './lib/abstract-test-case';

import { Option } from 'glimmer-interfaces';

declare global {
  interface QUnit {
    push(result: boolean, actual: any, expected: any, message: Option<string>): void;
    equiv(left: any, right: any, message?: Option<string>): boolean;
    deepEqual(left: any, right: any, message?: Option<string>): void;
    strictEqual(left: any, right: any, message?: Option<string>): void;
    equal(left: any, right: any, message?: Option<string>): void;
  }
}