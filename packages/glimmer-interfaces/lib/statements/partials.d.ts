import { Template } from '../tier1/template';

export class PartialDefinition<T> {
  name: string; // for debugging
  template: Template<T>;
}
