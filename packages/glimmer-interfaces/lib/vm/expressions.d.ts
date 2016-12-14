import { AppendVM } from './append';
import { PathReference } from '../references'

export interface CompiledExpression<T> {
  type: string;
  evaluate(vm: AppendVM): PathReference<T>;
  toJSON(): string;
}
