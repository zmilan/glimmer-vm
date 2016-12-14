import { Option, Dict } from '../core';
import { LinkedListNode, Slice, LinkedList } from '../collections';
import { AppendVM } from './append';
import { UpdatingVM } from './updating';
import { RevisionTag } from '../references';

export interface ExceptionHandler {
  handleException(): void;
}

export interface AbstractOpcode extends LinkedListNode {
  type: string;
  _guid: number;

  prev: Option<AbstractOpcode>;
  next: Option<AbstractOpcode>;

  toJSON(): OpcodeJSON;
}

export interface Opcode extends AbstractOpcode {
  next: Option<Opcode>;
  prev: Option<Opcode>;

  evaluate(vm: AppendVM): void;
}

export interface OpcodeJSON {
  guid: Option<number>;
  type: string;
  deopted?: boolean;
  args?: string[];
  details?: Dict<Option<string>>;
  children?: OpcodeJSON[];
}

export type OpSeq = Slice<Opcode>;
export type OpSeqBuilder = LinkedList<Opcode>;

export interface UpdatingOpcode extends AbstractOpcode {
  tag: RevisionTag;
  next: Option<UpdatingOpcode>;
  prev: Option<UpdatingOpcode>;
  evaluate(vm: UpdatingVM): void;
}

export type UpdatingOpSeq = Slice<UpdatingOpcode>;

/// These two opcodes are special because they're referenced in the
/// interface of the VM

export interface LabelOpcode extends AbstractOpcode {
  tag: RevisionTag;
  type: "label";
}

export interface ListBlockOpcode extends AbstractOpcode {
  tag: RevisionTag;
  type: "list-block";
}