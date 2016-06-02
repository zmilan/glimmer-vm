import { Opcode } from 'glimmer-runtime';

export class AppendVMDebugger {
  didPushFrame() {
    console.group();
  }

  didPopFrame() {
    console.groupEnd();
  }

  didExecute(opcode: Opcode /* TODO: bounds */) {
    console.debug(opcode.type);
  }
}
