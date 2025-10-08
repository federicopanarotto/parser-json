export enum TokenKind {
  LeftBrace = 'LeftBrace',
  RightBrace = 'RightBrace',
  LeftBracket = 'LeftBracket',
  RightBracket = 'RightBracket',
  Colon = 'Colon',
  Comma = 'Comma',
  String = 'String',
  Number = 'Number',
  True = 'True',
  False = 'False',
  Null = 'Null',
}

export type Token = {
  kind: TokenKind;
  value?: string | number | boolean | null;
};

export function lex(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  function skipWhitespace() {
    while (/\s/.test(input[i])) i++;
  }

  while (i < input.length) {
    skipWhitespace();
    const char = input[i];

    switch (char) {
      case '{':
        tokens.push({ kind: TokenKind.LeftBrace });
        i++;
        break;
      case '}':
        tokens.push({ kind: TokenKind.RightBrace });
        i++;
        break;
      case '[':
        tokens.push({ kind: TokenKind.LeftBracket });
        i++;
        break;
      case ']':
        tokens.push({ kind: TokenKind.RightBracket });
        i++;
        break;
      case ':':
        tokens.push({ kind: TokenKind.Colon });
        i++;
        break;
      case ',':
        tokens.push({ kind: TokenKind.Comma });
        i++;
        break;
      case '"': {
        i++; // salta la prima virgoletta
        let str = '';
        while (i < input.length && input[i] !== '"') {
          // gestisci escape base (es. \")
          if (input[i] === '\\' && i + 1 < input.length) {
            i++;
            const escaped = input[i];
            if (escaped === 'n') str += '\n';
            else if (escaped === 't') str += '\t';
            else str += escaped;
          } else {
            str += input[i];
          }
          i++;
        }
        i++; // salta la chiusura "
        tokens.push({ kind: TokenKind.String, value: str });
        break;
      }
      default:
        // numeri
        if (/[0-9\-]/.test(char)) {
          let numStr = '';
          while (i < input.length && /[0-9eE\+\-\.]/.test(input[i])) {
            numStr += input[i++];
          }
          tokens.push({ kind: TokenKind.Number, value: parseFloat(numStr) });
          break;
        }
        // true
        else if (input.startsWith('true', i)) {
          tokens.push({ kind: TokenKind.True, value: true });
          i += 4;
          break;
        }
        // false
        else if (input.startsWith('false', i)) {
          tokens.push({ kind: TokenKind.False, value: false });
          i += 5;
          break;
        }
        // null
        else if (input.startsWith('null', i)) {
          tokens.push({ kind: TokenKind.Null, value: null });
          i += 4;
          break;
        }
        // errore
        else {
          throw new Error(`Unexpected character '${char}' at position ${i}`);
        }
    }
  }

  return tokens;
}
