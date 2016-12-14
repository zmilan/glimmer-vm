import { OpSeq, Opcode, LabelOpcode } from './opcodes';
import { Option } from '../core';
import { ComponentManager, Component } from '../statements/component';
import { CapturedFrame } from './append';
import { PathReference, Reference } from '../references';
import { EvaluatedArgs } from './args';
import { Blocks } from './blocks';
import { Scope } from './scope';

export interface FrameStack {
  push(ops: OpSeq, component: Component, manager: Option<ComponentManager<Component>>, shadow: Option<ReadonlyArray<string>>): void;
  pop(): void;
  capture(): CapturedFrame;
  restore(frame: CapturedFrame): void;
  getOps(): OpSeq;
  getCurrent(): Opcode;
  setCurrent(op: Opcode): Opcode;
  getOperand<T>(): PathReference<T>;
  setOperand<T>(operand: PathReference<T>): PathReference<T>;
  getImmediate<T>(): T;
  setImmediate<T>(value: T): T;

  // FIXME: These options are required in practice by the existing code, but
  // figure out why.

  getArgs(): Option<EvaluatedArgs>;
  setArgs(args: EvaluatedArgs): EvaluatedArgs;
  getCondition(): Reference<boolean>;
  setCondition(condition: Reference<boolean>): Reference<boolean>;

  getIterator(): ReferenceIterator;
  setIterator(iterator: ReferenceIterator): ReferenceIterator;
  getKey(): Option<string>;
  setKey(key: string): string;
  getBlocks(): Blocks;
  setBlocks(blocks: Blocks): Blocks;
  getCallerScope(): Scope;
  setCallerScope(callerScope: Scope): Scope;
  getComponent(): Component;
  getManager(): ComponentManager<Component>;
  getShadow(): Option<ReadonlyArray<string>>;

  goto(op: LabelOpcode): void;
  hasOpcodes(): boolean;
  nextStatement(): Option<Opcode>;
}
