import { AppendVM as VM } from '../vm/append';
import { PathReference } from '../references';

export interface CompiledExpression<T> {
  type: string;
  evaluate(vm: VM): PathReference<T>;
  toJSON(): string;
}
