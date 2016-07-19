import { Expect } from './expect';

export class Assert {
  constructor(private expect: Expect) {}

  assert() {
    ok(true);
  }
}