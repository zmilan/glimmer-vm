import b from "../builders";
import { appendChild, parseElementBlockParams } from "../utils";

const voidMap: {
  [tagName: string]: boolean
} = Object.create(null);

let voidTagNames = "area base br col command embed hr img input keygen link meta param source track wbr";
voidTagNames.split(" ").forEach(tagName => {
  voidMap[tagName] = true;
});

export default {
  reset() {
    this.currentNode = null;
  },

  // Comment

  beginComment() {
    this.currentNode = b.comment("");
    this.currentNode.loc = {
      source: null,
      start: b.pos(this.tagOpenLine, this.tagOpenColumn),
      end: null
    };
  },

  appendToCommentData(pos, char) {
    this.currentNode.value += char;
  },

  finishComment() {
    this.currentNode.loc.end = b.pos(this.tokenizer.line, this.tokenizer.column);

    appendChild(this.currentElement(), this.currentNode);
  },

  // Data

  beginData() {
    this.currentNode = b.text();
    this.currentNode.loc = {
      source: null,
      start: b.pos(this.tokenizer.line, this.tokenizer.column),
      end: null
    };
  },

  appendToData(pos, char) {
    this.currentNode.chars += char;
  },

  finishData() {
    this.currentNode.loc.end = b.pos(this.tokenizer.line, this.tokenizer.column);

    appendChild(this.currentElement(), this.currentNode);
  },

  // Tags - basic

  tagOpen() {
    this.tagOpenLine = this.tokenizer.line;
    this.tagOpenColumn = this.tokenizer.column;
  },

  openStartTag() {
    this.currentNode = {
      type: 'StartTag',
      name: "",
      attributes: [],
      modifiers: [],
      comments: [],
      selfClosing: false,
      loc: null
    };
  },

  openEndTag() {
    this.currentNode = {
      type: 'EndTag',
      name: "",
      attributes: [],
      modifiers: [],
      comments: [],
      selfClosing: false,
      loc: null
    };
  },

  finishTag(pos) {
    let { line, column } = this.tokenizer;

    let tag = this.currentNode;
    tag.loc = b.loc(this.tagOpenLine, this.tagOpenColumn, line, column);

    if (tag.type === 'StartTag') {
      this.finishStartTag();

      if (voidMap[tag.name] || tag.selfClosing) {
        this.finishEndTag(pos, true);
      }
    } else if (tag.type === 'EndTag') {
      this.finishEndTag(pos, false);
    }
  },

  finishStartTag() {
    let { name, attributes, modifiers, comments } = this.currentNode;

    let loc = b.loc(this.tagOpenLine, this.tagOpenColumn);
    let element = b.element(name, attributes, modifiers, [], comments, loc);
    this.elementStack.push(element);
  },

  finishEndTag(pos, isVoid) {
    let tag = this.currentNode;

    let element = this.elementStack.pop();
    let parent = this.currentElement();

    validateEndTag(tag, element, isVoid);

    element.loc.end.line = this.tokenizer.line;
    element.loc.end.column = this.tokenizer.column;

    parseElementBlockParams(element);
    appendChild(parent, element);
  },

  markTagAsSelfClosing() {
    this.currentNode.selfClosing = true;
  },

  // Tags - name

  appendToTagName(pos, char) {
    this.currentNode.name += char;
  },

  // Tags - attributes

  beginAttribute() {
    let tag = this.currentNode;
    if (tag.type === 'EndTag') {
       throw new Error(
        `Invalid end tag: closing tag must not have attributes, ` +
        `in \`${tag.name}\` (on line ${this.tokenizer.line}).`
      );
    }

    this.currentAttribute = {
      name: "",
      parts: [],
      isQuoted: false,
      isDynamic: false,
      start: b.pos(this.tokenizer.line, this.tokenizer.column),
      valueStartLine: null,
      valueStartColumn: null
    };
  },

  appendToAttributeName(pos, char) {
    this.currentAttribute.name += char;
  },

  beginAttributeValue(pos, isQuoted) {
    this.currentAttribute.isQuoted = isQuoted;
    this.currentAttribute.valueStartLine = this.tokenizer.line;
    this.currentAttribute.valueStartColumn = this.tokenizer.column;
  },

  appendToAttributeValue(pos, char) {
    let parts = this.currentAttribute.parts;
    let lastPart = parts[parts.length - 1];

    if (lastPart && lastPart.type === 'TextNode') {
      lastPart.chars += char;

      // update end location for each added char
      lastPart.loc.end.line = this.tokenizer.line;
      lastPart.loc.end.column = this.tokenizer.column;
    } else {
      // initially assume the text node is a single char
      let loc = b.loc(
        this.tokenizer.line, this.tokenizer.column,
        this.tokenizer.line, this.tokenizer.column
      );

      // correct for `\n` as first char
      if (char === '\n') {
        loc.start.line -= 1;
        loc.start.column = lastPart ? lastPart.loc.end.column : this.currentAttribute.valueStartColumn;
      }

      let text = b.text(char, loc);
      parts.push(text);
    }
  },

  finishAttributeValue() {
    let { name, parts, isQuoted, isDynamic, valueStartLine, valueStartColumn } = this.currentAttribute;
    let value = assembleAttributeValue(parts, isQuoted, isDynamic, this.tokenizer.line);
    value.loc = b.loc(
      valueStartLine, valueStartColumn,
      this.tokenizer.line, this.tokenizer.column
    );

    let loc = b.loc(
      this.currentAttribute.start.line, this.currentAttribute.start.column,
      this.tokenizer.line, this.tokenizer.column
    );

    let attribute = b.attr(name, value, loc);

    this.currentNode.attributes.push(attribute);
  },

  reportSyntaxError(message) {
    throw new Error(`Syntax error at line ${this.tokenizer.line} col ${this.tokenizer.column}: ${message}`);
  }
};

function assembleAttributeValue(parts, isQuoted, isDynamic, line) {
  if (isDynamic) {
    if (isQuoted) {
      return assembleConcatenatedValue(parts);
    } else {
      if (parts.length === 1 || (parts.length === 2 && parts[1].chars === '/')) {
        return parts[0];
      } else {
        throw new Error(
          `An unquoted attribute value must be a string or a mustache, ` +
          `preceeded by whitespace or a '=' character, and ` +
          `followed by whitespace, a '>' character, or '/>' (on line ${line})`
        );
      }
    }
  } else {
    return parts.length > 0 ? parts[0] : b.text("");
  }
}

function assembleConcatenatedValue(parts) {
  for (let i = 0; i < parts.length; i++) {
    let part = parts[i];

    if (part.type !== 'MustacheStatement' && part.type !== 'TextNode') {
      throw new Error("Unsupported node in quoted attribute value: " + part.type);
    }
  }

  return b.concat(parts);
}

function validateEndTag(tag, element, selfClosing) {
  let error;

  if (voidMap[tag.name] && !selfClosing) {
    // EngTag is also called by StartTag for void and self-closing tags (i.e.
    // <input> or <br />, so we need to check for that here. Otherwise, we would
    // throw an error for those cases.
    error = "Invalid end tag " + formatEndTagInfo(tag) + " (void elements cannot have end tags).";
  } else if (element.tag === undefined) {
    error = "Closing tag " + formatEndTagInfo(tag) + " without an open tag.";
  } else if (element.tag !== tag.name) {
    error = "Closing tag " + formatEndTagInfo(tag) + " did not match last open tag `" + element.tag + "` (on line " +
            element.loc.start.line + ").";
  }

  if (error) { throw new Error(error); }
}

function formatEndTagInfo(tag) {
  return "`" + tag.name + "` (on line " + tag.loc.end.line + ")";
}
