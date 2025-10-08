import { Token } from "./lexer.ts";

export class XmlParser {
  private i = 0;
  constructor(private tokens: Token[]) {}

  public parse(): string {
    const token = this.tokens[this.i];
    if (!token) throw new Error('Unexpected end of input');

    if (token.kind === 'LeftBrace') return this.parseObject();
    if (token.kind === 'LeftBracket') return this.parseArray();

    return this.valueToXml(this.parseValue());
  }

  // --- OBJECT → <object>...</object>
  private parseObject(): string {
    let xml = `<object>`;
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

      const valueToken = this.tokens[this.i];
      let valueXml: string;

      if (valueToken.kind === 'LeftBrace') {
        valueXml = this.parseObject();
      } else if (valueToken.kind === 'LeftBracket') {
        valueXml = this.parseArray();
      } else {
        valueXml = this.valueToXml(this.parseValue());
      }

      xml += `<${key}>${valueXml}</${key}>`;

      if (this.tokens[this.i] && this.tokens[this.i].kind === 'Comma') {
        this.i++; // consume ','
      } else {
        break;
      }
    }

    this.expect('RightBrace');
    this.i++; // consume '}'

    xml += `</object>`;
    return xml;
  }

  // --- ARRAY → <array><item>...</item>...</array>
  private parseArray(): string {
    let xml = `<array>`;
    this.expect('LeftBracket');
    this.i++; // consume '['

    while (this.tokens[this.i] && this.tokens[this.i].kind !== 'RightBracket') {
      const token = this.tokens[this.i];
      let valueXml: string;

      if (token.kind === 'LeftBrace') {
        valueXml = this.parseObject();
      } else if (token.kind === 'LeftBracket') {
        valueXml = this.parseArray();
      } else {
        valueXml = this.valueToXml(this.parseValue());
      }

      xml += `<item>${valueXml}</item>`;

      if (this.tokens[this.i] && this.tokens[this.i].kind === 'Comma') {
        this.i++; // consume ','
      } else {
        break;
      }
    }

    this.expect('RightBracket');
    this.i++; // consume ']'

    xml += `</array>`;
    return xml;
  }

  // --- VALUE
  private parseValue(): string | number | boolean | null {
    const token = this.tokens[this.i];
    if (!token) throw new Error('Unexpected end of input');

    const validKinds = ['String', 'Number', 'True', 'False', 'Null'];
    if (!validKinds.includes(token.kind)) {
      throw new Error(`Unexpected token ${token.kind}`);
    }

    this.i++;
    return token.value ?? null;
  }

  // --- Utility per conversione in XML
  private valueToXml(value: string | number | boolean | null | undefined): string {
    if (value === null || value === undefined) return `<null/>`;
    if (typeof value === 'boolean') return `<boolean>${value}</boolean>`;
    if (typeof value === 'number') return `<number>${value}</number>`;
    return `<string>${this.escapeXml(String(value))}</string>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private expect(kind: string) {
    const token = this.tokens[this.i];
    if (!token || token.kind !== kind) {
      throw new Error(`Expected ${kind}, got ${token?.kind}`);
    }
  }
}

export function formatXml(xml: string, indentSize = 2): string {
  // Rimuove spazi e newline inutili
  xml = xml.replace(/\r?\n/g, '').replace(/>\s+</g, '><').trim();

  const PADDING = ' '.repeat(indentSize);
  const tokens = xml
    .replace(/>\s*</g, '><') // rimuove spazi tra tag
    .replace(/></g, '>\n<')  // aggiunge newline tra tag
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  let indent = 0;
  let formatted = '';

  for (const line of tokens) {
    // Tag di chiusura → riduci indentazione prima di scrivere
    if (line.match(/^<\/.+>/)) {
      indent -= 1;
    }

    formatted += PADDING.repeat(indent) + line + '\n';

    // Tag di apertura (non self-closing) → aumenta indentazione dopo
    if (line.match(/^<[^!?/][^>]*[^/]?>$/)) {
      indent += 1;
    }
  }

  return formatted.trim();
}
