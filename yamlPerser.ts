import { Token, TokenKind, lex } from "./lexer.ts";

export class YamlParser {
  private i = 0;
  constructor(private tokens: Token[]) {}

  public parse(): string {
    const token = this.tokens[this.i];
    if (!token) throw new Error("Unexpected end of input");

    if (token.kind === TokenKind.LeftBrace) {
      return this.parseObject(0);
    }

    if (token.kind === TokenKind.LeftBracket) {
      return this.parseArray(0);
    }

    return this.valueToYaml(token.value, 0);
  }

  // --- OBJECT ---
  private parseObject(indent: number): string {
    let yaml = "";
    this.expect(TokenKind.LeftBrace);
    this.i++; // consume '{'

    while (this.tokens[this.i] && this.tokens[this.i].kind !== TokenKind.RightBrace) {
      const keyToken = this.tokens[this.i];
      if (keyToken.kind !== TokenKind.String) {
        throw new Error(`Expected string key, got ${keyToken.kind}`);
      }
      const key = String(keyToken.value);
      this.i++;

      this.expect(TokenKind.Colon);
      this.i++; // consume ':'

      const next = this.tokens[this.i];
      const spaces = "  ".repeat(indent);

      if (!next) throw new Error("Unexpected end of input in object");

      if (next.kind === TokenKind.LeftBrace) {
        yaml += `${spaces}${key}:\n` + this.parseObject(indent + 1);
      } else if (next.kind === TokenKind.LeftBracket) {
        yaml += `${spaces}${key}:\n` + this.parseArray(indent + 1);
      } else {
        yaml += `${spaces}${key}: ${this.valueToYaml(this.parseValue(), indent)}\n`;
      }

      if (this.tokens[this.i] && this.tokens[this.i].kind === TokenKind.Comma) {
        this.i++; // consume ','
      } else {
        break;
      }
    }

    this.expect(TokenKind.RightBrace);
    this.i++; // consume '}'
    return yaml;
  }

  // --- ARRAY ---
  private parseArray(indent: number): string {
    let yaml = "";
    this.expect(TokenKind.LeftBracket);
    this.i++; // consume '['

    while (this.tokens[this.i] && this.tokens[this.i].kind !== TokenKind.RightBracket) {
      const spaces = "  ".repeat(indent);
      const token = this.tokens[this.i];

      if (token.kind === TokenKind.LeftBrace) {
        yaml += `${spaces}-\n` + this.parseObject(indent + 1);
      } else if (token.kind === TokenKind.LeftBracket) {
        yaml += `${spaces}-\n` + this.parseArray(indent + 1);
      } else {
        yaml += `${spaces}- ${this.valueToYaml(this.parseValue(), indent)}\n`;
      }

      if (this.tokens[this.i] && this.tokens[this.i].kind === TokenKind.Comma) {
        this.i++; // consume ','
      } else {
        break;
      }
    }

    this.expect(TokenKind.RightBracket);
    this.i++; // consume ']'
    return yaml;
  }

  // --- VALUE ---
  private parseValue(): string | number | boolean | null {
    const token = this.tokens[this.i];
    if (!token) throw new Error("Unexpected end of input");

    const validKinds = [
      TokenKind.String,
      TokenKind.Number,
      TokenKind.True,
      TokenKind.False,
      TokenKind.Null,
    ];

    if (!validKinds.includes(token.kind)) {
      throw new Error(`Unexpected token: ${token.kind}`);
    }

    this.i++;
    return token.value ?? null;
  }

  // --- Utility: token expectation ---
  private expect(kind: TokenKind) {
    const token = this.tokens[this.i];
    if (!token || token.kind !== kind) {
      throw new Error(`Expected ${kind}, got ${token?.kind}`);
    }
  }

  // --- YAML value formatter ---
  public valueToYaml(value: any, indent: number): string {
    if (value === null) return "null";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "number") return value.toString();
    if (typeof value === "string") {
      // aggiunge virgolette solo se necessario
      if (/^[A-Za-z0-9_\-]+$/.test(value)) return value;
      return `${value.replace(/"/g, '\\"')}`;
    }
    return String(value);
  }
}
