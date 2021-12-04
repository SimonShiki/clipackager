// Implements a superset of JSON that supports certain non-standard things such as Infinity

class JSONParser {
  constructor(source) {
    this.source = source;
    this.index = 0;
  }
  parse() {
    return this.parseValue();
  }
  lineInfo() {
    let line = 0;
    let column = 0;
    for (let i = 0; i < this.index; i++) {
      if (this.source[i] === '\n') {
        line++;
        column = 0;
      } else {
        column++;
      }
    }
    return { line: line + 1, column: column + 1 };
  }
  error(message) {
    const { line, column } = this.lineInfo();
    throw new SyntaxError(`JSONParser: ${message} (Line ${line} Column ${column})`);
  }
  char() {
    return this.charAt(this.index);
  }
  charAt(index) {
    if (index >= this.source.length) {
      this.error('Unexpected end of input');
    }
    return this.source[index];
  }
  next() {
    this.index++;
  }
  expect(char) {
    if (this.char() !== char) {
      this.error(`Expected '${char}' but found '${this.char()}'`);
    }
    this.next();
  }
  peek(length = 1, offset = 1) {
    if (this.index + offset + length > this.source.length) {
      return '';
    }
    if (length === 1) {
      return this.charAt(this.index + offset);
    }
    let result = '';
    for (let i = 0; i < length; i++) {
      result += this.charAt(this.index + offset + i);
    }
    return result;
  }
  skipWhitespace() {
    while (/\s/.test(this.char())) {
      this.next();
    }
  }
  parseValue() {
    this.skipWhitespace();
    const char = this.char();
    switch (char) {
      case '"': return this.parseString();
      case '{': return this.parseObject();
      case '[': return this.parseList();
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
      case '-':
        return this.parseNumber();
      default: return this.parseWord();
    }
  }
  parseWord() {
    if (this.peek(4, 0) === 'null') {
      for (let i = 0; i < 4; i++) {
        this.next();
      }
      return null;
    }
    if (this.peek(4, 0) === 'true') {
      for (let i = 0; i < 4; i++) {
        this.next();
      }
      return true;
    }
    if (this.peek(5, 0) === 'false') {
      for (let i = 0; i < 5; i++) {
        this.next();
      }
      return false;
    }
    // Non-standard extensions
    if (this.peek(8, 0) === 'Infinity') {
      for (let i = 0; i < 8; i++) {
        this.next();
      }
      return Infinity;
    }
    if (this.peek(3, 0) === 'NaN') {
      for (let i = 0; i < 3; i++) {
        this.next();
      }
      return NaN;
    }
    this.error(`Unknown word (starts with ${this.char()})`);
  }
  parseNumber() {
    // Non-standard extension
    if (this.peek(9, 0) === '-Infinity') {
      for (let i = 0; i < 9; i++) {
        this.next();
      }
      return -Infinity;
    }
    let number = '';
    while (true) {
      number += this.char();
      if (/[\d.e+-]/i.test(this.peek())) {
        this.next();
      } else {
        break;
      }
    }
    this.next();
    const value = +number;
    if (Number.isNaN(value)) {
      this.error(`Not a number: ${number}`);
    }
    return value;
  }
  parseString() {
    this.expect('"');
    let result = '';
    if (this.char() === '"') {
      this.next();
      return '';
    }
    while (true) {
      const char = this.char();
      if (char === '\\') {
        this.next();
        switch (this.char()) {
          case '"':
            result += '"';
            break;
          case '/':
            result += '/';
            break;
          case '\\':
            result += '\\';
            break;
          case 'b':
            result += '\b';
            break;
          case 'f':
            result += '\f';
            break;
          case 'n':
            result += '\n';
            break;
          case 'r':
            result += '\r';
            break;
          case 't':
            result += '\t';
            break;
          case 'u': {
            let hexString = '';
            for (let i = 0; i < 4; i++) {
              this.next();
              const nextChar = this.char();
              if (!/[0-9a-f]/i.test(nextChar)) {
                this.error(`Invalid hex code: ${nextChar}`);
              }
              hexString += nextChar;
            }
            const hexNumber = Number.parseInt(hexString, 16);
            const letter = String.fromCharCode(hexNumber);
            result += letter;
            break;
          }
          default: this.error(`Invalid escape code: \\${this.char()}`);
        }
      } else {
        result += char;
      }
      if (this.peek() === '"') {
        break;
      }
      this.next();
    }
    this.next();
    this.expect('"');
    return result;
  }
  parseList() {
    this.expect('[');
    this.skipWhitespace();
    if (this.char() === ']') {
      this.next();
      return [];
    }
    const result = [];
    while (true) {
      this.skipWhitespace();
      const value = this.parseValue();
      result.push(value);
      this.skipWhitespace();
      if (this.char() === ']') {
        break;
      }
      this.expect(',');
    }
    this.expect(']');
    return result;
  }
  parseObject() {
    this.expect('{');
    this.skipWhitespace();
    if (this.char() === '}') {
      this.next();
      return {};
    }
    const result = {};
    while (true) {
      this.skipWhitespace();
      const key = this.parseString();
      this.skipWhitespace();
      this.expect(':');
      const value = this.parseValue();
      result[key] = value;
      this.skipWhitespace();
      if (this.char() === '}') {
        break;
      }
      this.expect(',');
    }
    this.expect('}');
    return result;
  }
}

const parse = source => {
  try {
    return JSON.parse(source);
  } catch (e) {
    try {
      const parser = new JSONParser(source);
      return parser.parse();
    } catch (e2) {
      throw e;
    }
  }
};

export default {
  parse
};
