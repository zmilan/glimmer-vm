export interface Position {
  line: number;
  column: number;
}

export interface Location {
  source: string;
  start: Position;
  end: Position;
}

export default Location;