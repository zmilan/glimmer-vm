function escapeString(str: string) {
  str = str.replace(/\\/g, "\\\\");
  str = str.replace(/"/g, '\\"');
  str = str.replace(/\n/g, "\\n");
  return str;
}

export { escapeString };

function string(str: string) {
  return '"' + escapeString(str) + '"';
}

export { string };

function array(a: Object) {
  return "[" + a + "]";
}

export { array };

export function hash(pairs: Object[]) {
  return "{" + pairs.join(", ") + "}";
}

export function repeat(chars: string[], times: number) {
  let str = "";
  while (times--) {
    str += chars;
  }
  return str;
}
