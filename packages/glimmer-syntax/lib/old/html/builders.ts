import { Option, unwrap } from 'glimmer-util';
import { Position, Location } from '../parser/handlebars-ast';

import { CharsToken } from './tokens';

interface Constructor<T> {
  new(...args: any[]): T;
}

export class TokenBuilder {
  as<T extends TokenBuilder>(type: Constructor<T>): Option<T> {
    if (this instanceof type) {
      return this as any as T;
    } else {
      return null;
    }
  }

  unwrapAs<T extends TokenBuilder>(type: Constructor<T>): T {
    return unwrap(this.as<T>(type));
  }
}

export class LocatableTokenBuilder extends TokenBuilder {
  constructor(public loc: LocationBuilder) {
    super();
  }
}

export class SourceSpan {
  constructor(public start: Position, public end: Position, public source = "<unknown>") {}
}

export class LocationBuilder {
  constructor(private start: Position) {}

  fork(): LocationBuilder {
    return new LocationBuilder({ line: this.start.line, column: this.start.column });
  }

  finalize(end: Position): Location {
    return new SourceSpan(this.start, end);
  }
}

export function loc(pos: Position) {
  return new LocationBuilder(pos);
}

export const INITIAL = new TokenBuilder();

export class CharsTokenBuilder<T extends CharsToken> extends LocatableTokenBuilder {
  static start(pos: Position) {
    return new this(new LocationBuilder(pos));
  }

  protected chars: string = '';
  protected TokenType: { new(loc: Location, chars?: string): T };

  appendToData(pos: Position, chars: Char) {
    if (typeof chars === 'string') {
      this.chars += chars;
    } else {
      this.chars += chars.chars;
    }
  }

  finalize(end: Position): T {
    return new this.TokenType(this.loc.finalize(end), this.chars);
  }
}
