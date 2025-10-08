import { Token } from "./lexer.ts";

export interface JNode {
  kind: 'JNode';
}

export type JValue = string | number | boolean | null | undefined;
export type JObject = { [key: string]: JToken };
export type JArray = JToken[];
export type JToken = JValue | JObject | JArray;

export class Parser {
  private i = 0;
  constructor(private tokens: Token[]) {}

  public parse(): JToken {
    const token = this.tokens[this.i];

    if (!token) {
      throw new Error('Unexpected end of input');
    }

    if (token.kind === 'LeftBrace') {
      return this.parseObject();
    }

    if (token.kind === 'LeftBracket') {
      return this.parseArray();
    }

    return this.parseValue();
  }

  // --- OBJECT: { "key": value, ... }
  private parseObject(): JObject {
    const obj: JObject = {};
    this.expect('LeftBrace');
    this.i++; // consume '{'

    while (this.tokens[this.i] && this.tokens[this.i].kind !== 'RightBrace') {
      const keyToken = this.tokens[this.i];
      if (keyToken.kind !== 'String') {
        throw new Error(`Expected string key, got ${keyToken.kind}`);
      }
      const key = String(keyToken.value);
      this.i++;

      this.expect('Colon');
      this.i++; // consume ':'

      const value = this.parse();
      obj[key] = value;

      if (this.tokens[this.i].kind === 'Comma') {
        this.i++; // consume ','
      } else {
        break;
      }
    }

    this.expect('RightBrace');
    this.i++; // consume '}'

    return obj;
  }

  // --- ARRAY: [ value, value, ... ]
  private parseArray(): JArray {
    const arr: JArray = [];
    this.expect('LeftBracket');
    this.i++; // consume '['

    while (this.tokens[this.i] && this.tokens[this.i].kind !== 'RightBracket') {
      const value = this.parse();
      arr.push(value);

      if (this.tokens[this.i].kind === 'Comma') {
        this.i++; // consume ','
      } else {
        break;
      }
    }

    this.expect('RightBracket');
    this.i++; // consume ']'

    return arr;
  }

  // --- VALUE: string | number | boolean | null
  private parseValue(): JValue {
    const token = this.tokens[this.i];
    if (!token) throw new Error('Unexpected end of input');

    const validKinds = ['String', 'Number', 'True', 'False', 'Null'];
    if (!validKinds.includes(token.kind)) {
      throw new Error(`Unexpected token ${token.kind}`);
    }

    this.i++; // consume value
    return token.value;
  }

  // --- Utility: expected token kind
  private expect(kind: string) {
    const token = this.tokens[this.i];
    if (!token || token.kind !== kind) {
      throw new Error(`Expected ${kind}, got ${token?.kind}`);
    }
  }
}
