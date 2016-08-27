
import { Location } from '../../../ast/location';

class Located<T> {
  constructor(public loc: Location, public value: T) {}
}
