import { JToken } from "./parser.ts";

export interface FormatterOptions {
  indent?: number;           // spazi per indentazione
  minify?: boolean;          // rimuove spazi e newline
  pretty?: boolean;          // stampa leggibile
  casing?: 'camel' | 'pascal' | 'snake';
  includeNull?: boolean;
}

export class Formatter {
  private indent: number;
  private pretty: boolean;
  private minify: boolean;
  private casing: 'camel' | 'pascal' | 'snake';
  private includeNull: boolean;

  constructor(options: FormatterOptions) {
    this.indent = options.indent ?? 2;
    this.pretty = options.pretty ?? true;
    this.minify = options.minify ?? false;
    this.casing = options.casing ?? 'camel';
    this.includeNull = options.includeNull ?? true;

    if (this.minify) this.pretty = false; // minify ha priorità
  }

  format(token: JToken): string {
    return this.formatToken(token, 0);
  }

  private formatToken(token: JToken, level: number): string {
    if (token === null || token === undefined) {
      return this.includeNull ? "null" : "";
    }

    if (typeof token === "string") return JSON.stringify(token);
    if (typeof token === "number" || typeof token === "boolean") return token.toString();
    if (Array.isArray(token)) return this.formatArray(token, level);
    if (typeof token === "object") return this.formatObject(token as Record<string, JToken>, level);

    return JSON.stringify(token);
  }

  private formatObject(obj: Record<string, JToken>, level: number): string {
    const keys = Object.keys(obj).filter(k => this.includeNull || obj[k] !== null);
    if (keys.length === 0) return "{}";

    const indentStr = this.pretty ? " ".repeat(level * this.indent) : "";
    const innerIndentStr = this.pretty ? " ".repeat((level + 1) * this.indent) : "";
    const newline = this.pretty ? "\n" : "";

    const items = keys.map(key => {
      const formattedKey = this.formatKey(key);
      const formattedValue = this.formatToken(obj[key], level + 1);
      return `${innerIndentStr}"${formattedKey}": ${formattedValue}`;
    });

    return `{${newline}${items.join(`,${newline}`)}${newline}${indentStr}}`;
  }

  private formatArray(arr: JToken[], level: number): string {
    if (arr.length === 0) return "[]";

    const indentStr = this.pretty ? " ".repeat(level * this.indent) : "";
    const innerIndentStr = this.pretty ? " ".repeat((level + 1) * this.indent) : "";
    const newline = this.pretty ? "\n" : "";

    const items = arr.map(item => `${innerIndentStr}${this.formatToken(item, level + 1)}`);
    return `[${newline}${items.join(`,${newline}`)}${newline}${indentStr}]`;
  }

  private formatKey(key: string): string {
    switch (this.casing) {
      case 'camel':
        return key[0].toLowerCase() + key.slice(1);
      case 'pascal':
        return key[0].toUpperCase() + key.slice(1);
      case 'snake':
        // Trasforma "myKeyName" → "my_key_name"
        return key
          .replace(/([A-Z])/g, '_$1') // inserisce _ prima delle maiuscole
          .replace(/^_/, '')           // rimuove eventuale _ iniziale
          .toLowerCase();              // tutto minuscolo
      default:
        return key;
    }
  }

}
