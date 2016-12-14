import { Stack, LinkedList } from '../collections';
import { Option, Destroyable, Opaque } from '../core';
import { Environment } from '../environment';
import { OpSeq, UpdatingOpcode, Opcode, LabelOpcode, ListBlockOpcode } from './opcodes';
import { CompiledBlock, InlineBlock, PartialBlock } from './blocks';
import { EvaluatedArgs, CompiledArgs } from './args';
import { ComponentManager, Component } from '../statements/component';
import { PathReference } from '../references';
import { CompiledExpression } from './expressions';
import { Scope, DynamicScope } from './scope';
import { FrameStack } from './frame';
import { RenderResult } from '../render-result';
import { ElementStack } from '../dom/element-stack';

export interface CapturedFrame {
  // TODO: Brand
}

export interface VMState {
  env: Environment;
  scope: Scope;
  dynamicScope: DynamicScope;
  frame: CapturedFrame;
}

export interface AppendVM {
  updatingOpcodeStack: Stack<LinkedList<UpdatingOpcode>>;
  cacheGroups: Stack<UpdatingOpcode>;
  listBlockStack: Stack<ListBlockOpcode>;
  frame: FrameStack;

  capture(): VMState;
  goto(op: LabelOpcode): void;

  beginCacheGroup(): void;
  commitCacheGroup(): void;

  enter(ops: OpSeq): void;

  enterWithKey(key: string, ops: OpSeq): void;
  enterList(ops: OpSeq): void;
  exit(): void;

  exitList(): void;

  updateWith(opcode: UpdatingOpcode): void;

  stack(): ElementStack;
  scope(): Scope;
  dynamicScope(): DynamicScope;

  pushFrame(
    block: CompiledBlock,
    args?: Option<EvaluatedArgs>,
    callerScope?: Scope
  ): void;

  pushComponentFrame(
    layout: CompiledBlock,
    args: EvaluatedArgs,
    callerScope: Scope,
    component: Component,
    manager: ComponentManager<Component>,
    shadow: ReadonlyArray<string>
  ): void;

  pushEvalFrame(ops: OpSeq): void;

  pushChildScope(): void;
  pushCallerScope(): void;
  pushDynamicScope(): DynamicScope;
  pushRootScope(self: PathReference<any>, size: number): Scope;
  popScope(): void;
  popDynamicScope(): void;

  newDestroyable(d: Destroyable): void;

  /// SCOPE HELPERS

  getSelf(): PathReference<any>;
  referenceForSymbol(symbol: number): PathReference<any>;

  getArgs(): Option<EvaluatedArgs>;

  /// EXECUTION

  resume(opcodes: OpSeq, frame: CapturedFrame): RenderResult;

  execute(opcodes: OpSeq, initialize?: (vm: AppendVM) => void): RenderResult;

  evaluateOpcode(opcode: Opcode): void;

  // Make sure you have opcodes that push and pop a scope around this opcode
  // if you need to change the scope.
  invokeBlock(block: InlineBlock, args: Option<EvaluatedArgs>): void;
  invokePartial(block: PartialBlock): void;

  invokeLayout(
    args: EvaluatedArgs,
    layout: CompiledBlock,
    callerScope: Scope,
    component: Component,
    manager: ComponentManager<Component>,
    shadow: ReadonlyArray<string>
  ): void;

  evaluateOperand(expr: CompiledExpression<any>): void;
  evaluateArgs(args: CompiledArgs): void;

  bindPositionalArgs(symbols: number[]): void;
  bindNamedArgs(names: string[], symbols: number[]): void;
  bindBlocks(names: string[], symbols: number[]): void;
  bindPartialArgs(symbol: number): void;

  bindCallerScope(): void;
  bindDynamicScope(names: ReadonlyArray<string>): void;
}

export interface PublicVM {
  env: Environment;
  getArgs(): Option<EvaluatedArgs>;
  dynamicScope(): DynamicScope;
  getSelf(): PathReference<Opaque>;
  newDestroyable(d: Destroyable): void;
}