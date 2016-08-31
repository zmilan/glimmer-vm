import { WireFormatDelegate } from './wire-parser';
import * as WF from 'glimmer-wire-format';
import { HTMLNS, IR, Log } from 'glimmer-syntax';
import { Class, Constructor, Stack, unwrap } from 'glimmer-util';

type  UNPUT = "UNPUT [id=bdedc8e0-eeb2-4922-9ffa-e75e0ce8bdde]";
type  PUSH = "PUSH [id=bdedc8e0-eeb2-4922-9ffa-e75e0ce8bdde]";
type  POP = "POP [id=bdedc8e0-eeb2-4922-9ffa-e75e0ce8bdde]";
const UNPUT: UNPUT = "UNPUT [id=bdedc8e0-eeb2-4922-9ffa-e75e0ce8bdde]";
const PUSH: PUSH = "PUSH [id=bdedc8e0-eeb2-4922-9ffa-e75e0ce8bdde]";
const POP: POP = "POP [id=bdedc8e0-eeb2-4922-9ffa-e75e0ce8bdde]";
const EMPTY: never[] = [];
type  EMPTY = typeof EMPTY;
type  Return = WF.Statement;
type  Instruction = UNPUT | PUSH | POP;
type  Result = WF.Statement[] | Instruction;

function isInstruction(s: Return | Instruction): s is Instruction {
  return s === UNPUT || s === PUSH || s === POP;
}

class Next<R extends Result, S extends State> {
  constructor(public result: R, public next: State, public transition: Transition) {}
}
type SomeNext = Next<Result, State>;

const enum Transition {
  Enter,
  Return,
  Noop
}

interface StateFactory<S> {
  create(ret: State): S;
}

function creating<S extends State, T>(StateClass: { new(ret: State, arg: T): S }, arg: T): StateFactory<S>;
function creating<S extends State, T, U>(StateClass: { new(ret: State, arg: T, arg2: U): S }, arg: T, arg2: U): StateFactory<S>;

function creating(StateClass, arg, arg2?): StateFactory<State> {
  if (arg2 !== undefined) {
    return {
      create(ret) { return new StateClass(ret, arg, arg2); }
    };
  } else {
    return {
      create(ret) { return new StateClass(ret, arg); }
    };
  }

}

class State {
  static logger = new Log.EventLogger<State>();
  static asserts = new Log.LogTests<State>();
  protected NOOP: Next<EMPTY, this> = new Next(EMPTY, this, Transition.Noop);
  constructor(public ret: State) {}

  static create<T extends State>(this: Class<T> & Constructor<T>, ret: State): T {
    return new this(ret);
  }

  static assert<T extends State>(this: Class<T> & typeof State, state: State, event: string, arity: number): Log.Fallible<T, Log.DuckError<State>> {
    if (state instanceof (this as any)) {
      if (this.asserts.duckTypes(state, event, arity)) return Log.Ok(state as T);
    }

    return Log.Err({ actual: state, className: this.name, methodName: event, arity });
  }

  continue<R extends Instruction>(result: R): Next<R, this>;
  continue<R extends Return>(): Next<EMPTY, this>;
  continue<R extends Return>(result: R): Next<[R], this>;
  continue<R1 extends Return, R2 extends Return>(r1: R1, r2: R2): Next<[R1, R2], this>;
  continue<R1 extends Return, R2 extends Return, R3 extends Return>(r1: R1, r2: R2, r3: R3): Next<[R1, R2, R3], this>;

  continue(...result): Next<Result, this> {
    if (result.length === 0) return this.NOOP;
    if (result.length === 1 && isInstruction(result[0])) {
      return new Next(result[0], this, Transition.Noop);
    } else {
      return new Next(result, this, Transition.Noop);
    }
  }

  next<S extends State>(StateClass: StateFactory<S>): Next<EMPTY, S>;
  next<R extends Return, S extends State>(StateClass: StateFactory<S>, result: R): Next<[R], S>;
  next<R1 extends Return, R2 extends Return, S extends State>(StateClass: StateFactory<S>, r1: R1, r2: R2): Next<[R1, R2], S>;
  next<R1 extends Return, R2 extends Return, R3 extends Return, S extends State>(StateClass: StateFactory<S>, r1: R1, r2: R2, r3: R3): Next<[R1, R2, R3], S>;

  next(StateClass, ...result) {
    return new Next(result, StateClass.create(this), Transition.Enter);
  }

  returning<S extends State>(StateClass: StateFactory<S>): Next<EMPTY, S>;
  returning<R extends Instruction, S extends State>(StateClass: StateFactory<S>, result: R): Next<R, S>;
  returning<R extends Return, S extends State>(StateClass: StateFactory<S>, result: R): Next<[R], S>;
  returning<R1 extends Return, R2 extends Return, S extends State>(StateClass: StateFactory<S>, r1: R1, r2: R2): Next<[R1, R2], S>;
  returning<R1 extends Return, R2 extends Return, R3 extends Return, S extends State>(StateClass: StateFactory<S>, r1: R1, r2: R2, r3: R3): Next<[R1, R2, R3], S>;

  returning(StateClass, ...result) {
    if (result.length === 1 && result[0] === UNPUT) {
      return new Next(UNPUT, StateClass.create(this.ret), Transition.Enter);
    } else {
      return new Next(result as any, StateClass.create(this.ret), Transition.Enter);
    }
  }

  return<R extends Return, S extends State>(this: { ret: S }): Next<EMPTY, S>;
  return<R extends Return, S extends State>(this: { ret: S }, result: R): Next<[R], S>;
  return<R1 extends Return, R2 extends Return, S extends State>(this: { ret: S }, r1: R1, r2: R2): Next<[R1, R2], S>;
  return<R1 extends Return, R2 extends Return, R3 extends Return, S extends State>(this: { ret: S }, r1: R1, r2: R2, r3: R3): Next<[R1, R2, R3], S>;

  return(...result) {
    return new Next(result, this.ret, Transition.Return);
  }
}

class ContentParent extends State {
  ElementStart(): Next<EMPTY, OpenElement> {
    return this.next(OpenElement);
  }

  Append(trusted: boolean): Next<EMPTY, Append> {
    return this.next(creating(Append, trusted));
  }
}

class Template extends ContentParent {
  ProgramStart(): Next<PUSH, Template> {
    return this.continue(PUSH);
  }
}

class Append extends State {
  public ret: ContentParent;

  constructor(ret: ContentParent, private trusted: boolean) {
    super(ret);
  }

  Unknown(): Next<EMPTY, AppendUnknown> {
    return this.returning(creating(AppendUnknown, this.trusted));
  }
}

class AppendUnknown extends State {
  public ret: ContentParent;

  constructor(ret: ContentParent, private trusted: boolean) {
    super(ret);
  }

  Constant(value: string) {
    return this.return(['append', ['unknown', [value]], this.trusted]);
  }
}

class OpenElement extends State {
  Constant(tagName: string): Next<[WF.Statements.OpenElement], NamedOpenElement> {
    return this.returning(NamedOpenElement, ['open-element', tagName, []]);
  }
}

class NamedOpenElement extends State {
  public ret: OpenElement;

  OpenTagEnd(kind: IR.OpenTagKind): Next<Result, Element> {
    if (kind === 'self-closing' || kind === 'void') {
      return this.return(['flush-element'], ['close-element']);
    } else {
      return this.returning(Element, ['flush-element']);
    }
  }

  Attr(kind: IR.AttributeKind): Next<EMPTY, Attribute> {
    return this.next(Attribute);
  }
}

class Attribute extends State {
  Constant(s: string): Next<EMPTY, NamedAttribute> {
    return this.returning(creating(NamedAttribute, s));
  }
}

class NamedAttribute extends State {
  public ret: NamedOpenElement;

  constructor(ret: NamedOpenElement, private name: string) {
    super(ret);
  }

  Data(): Next<EMPTY, SimpleAttributeValue> {
    return this.returning(creating(SimpleAttributeValue, this.name));
  }

  Append(trusting: boolean): Next<UNPUT, ProgramAttributeValue> {
    return this.returning(creating(ProgramAttributeValue, this.name, trusting), UNPUT);
  }
}

class SimpleAttributeValue extends State {
  public ret: NamedAttribute;

  constructor(ret: NamedAttribute, private name: string) {
    super(ret);
  }

  Constant(value: string): Next<[WF.Statements.Attr<'static-attr'>], NamedAttribute> {
    return this.return(['static-attr', this.name, value, HTMLNS]);
  }
}

class ProgramAttributeValue extends ContentParent {

}

class Element extends ContentParent {
  public ret: ContentParent;

  ElementEnd(): Next<[WF.Statements.CloseElement], ContentParent> {
    return this.return(['close-element']);
  }
}

export class WireDelegateFrame {
  private output: WF.Statement[] = [];

  push(s: WF.Statement[]) {
    this.output.push(...s);
  }

  block(): WF.Statement[] {
    return this.output;
  }
}

export class WireDelegate implements WireFormatDelegate {
  private frames = new Stack<WireDelegateFrame>();
  private current: State = new Template(null as any);
  static logger = new Log.EventLogger<State>();
  private logger = WireDelegate.logger;

  private get output(): WireDelegateFrame {
    return unwrap(this.frames.current);
  }

  private write(s: WF.Statement[]) {
    this.output.push(s);
  }

  private process<A extends Log.AssertState<State>, T>(assertion: A, name: string, arg?: T) {
    let { ok, val: state } = assertion.assert(this.current, name, arg === undefined ? 0 : 1);

    if (ok) {
      let { next, result }: SomeNext = arg !== undefined ? state[name](arg) : state[name]();
      let { current } = this;
      this.current = next;
      this.logger.transition(name, next);
      if (result === UNPUT) {
        this.process(assertion, name, arg);
      } else if (result === PUSH) {
        this.logger.output('pushed', []);
        this.frames.push(new WireDelegateFrame());
      } else if (result === POP) {
        this.logger.output('popped', []);
        // TODO: handle pop correctly
        this.frames.pop();
      } else if (result.length > 0) {
        this.logger.output('result', result);
        this.write(result);
      }
    } else {
      this.logger.unimpl(name, state as Log.DuckError<State>, arg);
    }
  }

  template(): WF.SerializedTemplate {
    return {
      statements: this.output.block(),
      locals: [],
      named: [],
      yields: [],
      blocks: [],
      meta: {}
    };
  }

  Constant(s: IR.Constant): void { this.process(State, 'Constant', s); }
  ProgramStart(): void { this.process(State, 'ProgramStart'); }
  ProgramEnd(): void { this.process(State, 'ProgramEnd'); }
  ElementStart(): void { this.process(State, 'ElementStart'); }
  ElementEnd(): void { this.process(State, 'ElementEnd'); }
  AttrStart(): void { this.process(State, 'AttrStart'); }
  AttrEnd(): void { this.process(State, 'AttrEnd'); }
  Append(trusted: boolean): void { this.process(State, 'Append', trusted); }
  ArgsStart(): void { this.process(State, 'ArgsStart'); }
  ArgsEnd(): void { this.process(State, 'ArgsEnd'); }
  PositionalStart(): void { this.process(State, 'PositionalStart'); }
  PositionalEnd(): void { this.process(State, 'PositionalEnd'); }
  NamedStart(): void { this.process(State, 'NamedStart'); }
  NamedEnd(): void { this.process(State, 'NamedEnd'); }
  Data(): void { this.process(State, 'Data'); }
  Comment(): void { this.process(State, 'Comment'); }
  Unknown(): void { this.process(State, 'Unknown'); }
  BlockGroupStart(): void { this.process(State, 'BlockGroupStart'); }
  BlockGroupEnd(): void { this.process(State, 'BlockGroupEnd'); }
  BlockStart(): void { this.process(State, 'BlockStart'); }
  Locals(count: number): void { this.process(State, 'Locals', count); }
  OpenTagEnd(kind: IR.OpenTagKind): void { this.process(State, 'OpenTagEnd', kind); }
  Attr(kind: IR.AttributeKind): void { this.process(State, 'Attr', kind); }
  Path(segments: number): void { this.process(State, 'Path', segments); }
  AtPath(segments: number): void { this.process(State, 'AtPath', segments); }
}
