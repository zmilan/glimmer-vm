import { Opaque } from '@glimmer/util';
import { Tag, Reference, ReferenceIterator, IterationArtifacts, VersionedPathReference } from '@glimmer/reference';
import { APPEND_OPCODES, Op } from '../../opcodes';

class IterablePresenceReference implements Reference<boolean> {
  public tag: Tag;
  private artifacts: IterationArtifacts;

  constructor(artifacts: IterationArtifacts) {
    this.tag = artifacts.tag;
    this.artifacts = artifacts;
  }

  value(): boolean {
    return !this.artifacts.isEmpty();
  }
}

APPEND_OPCODES.add(Op.PutIterator, vm => {
  let stack = vm.stack;
  let listRef = stack.pop<VersionedPathReference<Opaque>>();
  let key = stack.pop<VersionedPathReference<string>>();
  let iterable = vm.env.iterableFor(listRef, key.value());
  let iterator = new ReferenceIterator(iterable);

  stack.push(iterator);
  stack.push(new IterablePresenceReference(iterator.artifacts));
});

APPEND_OPCODES.add(Op.EnterList, (vm, { op1: start }) => {
  vm.enterList(start);
});

APPEND_OPCODES.add(Op.ExitList, vm => vm.exitList());

APPEND_OPCODES.add(Op.Iterate, (vm, { op1: breaks }) => {
  let stack = vm.stack;
  let item = stack.peek<ReferenceIterator>().next();

  if (item) {
    let tryOpcode = vm.iterate(item.memo, item.value);
    vm.enterItem(item.key, tryOpcode);
  } else {
    vm.goto(breaks);
  }
});
