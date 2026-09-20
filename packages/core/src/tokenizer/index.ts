import { LatexTokenError } from '../errors/index.js';

export enum TokenType {
  Number = 'Number',
  Identifier = 'Identifier', // x, y, a
  Command = 'Command',       // \cdot, \times, \frac
  Operator = 'Operator',     // +, -, *, /, =, <, >
  LeftParen = 'LeftParen',
  RightParen = 'RightParen',
  LeftBrace = 'LeftBrace',
  RightBrace = 'RightBrace',
  LeftBracket = 'LeftBracket',
  RightBracket = 'RightBracket',
  Caret = 'Caret',
  Underscore = 'Underscore',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let current = 0;

  while (current < input.length) {
    let char = input[current];

    // Skip whitespace
    if (/\s/.test(char)) {
      current++;
      continue;
    }

    // Numbers (including decimals)
    if (/[0-9]/.test(char)) {
      let value = '';
      const start = current;
      while (current < input.length && /[0-9\.]/.test(input[current])) {
        value += input[current];
        current++;
      }
      tokens.push({ type: TokenType.Number, value, position: start });
      continue;
    }

    // Identifiers (letters)
    if (/[a-zA-Z]/.test(char)) {
      tokens.push({ type: TokenType.Identifier, value: char, position: current });
      current++;
      continue;
    }

    // Commands (e.g. \cdot)
    if (char === '\\') {
      let value = '\\';
      const start = current;
      current++;
      if (current < input.length && /^[\\,;!:]$/.test(input[current])) {
        value += input[current];
        current++;
      } else {
        while (current < input.length && /[a-zA-Z]/.test(input[current])) {
          value += input[current];
          current++;
        }
      }

      if (['\\,', '\\;', '\\:', '\\!', '\\quad', '\\qquad'].includes(value)) {
        continue;
      }

      if (['\\mathrm', '\\mathbf', '\\mathit', '\\text', '\\operatorname'].includes(value)) {
        continue;
      }

      if (value === '\\dx') {
        tokens.push({ type: TokenType.Identifier, value: 'd', position: start });
        tokens.push({ type: TokenType.Identifier, value: 'x', position: start + 2 });
        continue;
      }
      if (value === '\\dy') {
        tokens.push({ type: TokenType.Identifier, value: 'd', position: start });
        tokens.push({ type: TokenType.Identifier, value: 'y', position: start + 2 });
        continue;
      }
      if (value === '\\dt') {
        tokens.push({ type: TokenType.Identifier, value: 'd', position: start });
        tokens.push({ type: TokenType.Identifier, value: 't', position: start + 2 });
        continue;
      }
      if (value === '\\du') {
        tokens.push({ type: TokenType.Identifier, value: 'd', position: start });
        tokens.push({ type: TokenType.Identifier, value: 'u', position: start + 2 });
        continue;
      }
      if (value === '\\dv') {
        tokens.push({ type: TokenType.Identifier, value: 'd', position: start });
        tokens.push({ type: TokenType.Identifier, value: 'v', position: start + 2 });
        continue;
      }
      if (value === '\\dz') {
        tokens.push({ type: TokenType.Identifier, value: 'd', position: start });
        tokens.push({ type: TokenType.Identifier, value: 'z', position: start + 2 });
        continue;
      }
      if (value === '\\differentialD') {
        tokens.push({ type: TokenType.Identifier, value: 'd', position: start });
        continue;
      }

      tokens.push({ type: TokenType.Command, value, position: start });
      continue;
    }

    // Operators and symbols
    if (char === '+') { tokens.push({ type: TokenType.Operator, value: char, position: current }); current++; continue; }
    if (char === '-') { tokens.push({ type: TokenType.Operator, value: char, position: current }); current++; continue; }
    if (char === '*') { tokens.push({ type: TokenType.Operator, value: char, position: current }); current++; continue; }
    if (char === '/') { tokens.push({ type: TokenType.Operator, value: char, position: current }); current++; continue; }
    if (char === '|') { tokens.push({ type: TokenType.Operator, value: char, position: current }); current++; continue; }
    if (char === '!') { tokens.push({ type: TokenType.Operator, value: char, position: current }); current++; continue; }
    if (char === '=') { tokens.push({ type: TokenType.Operator, value: char, position: current }); current++; continue; }
    
    if (char === '<') {
      if (input[current + 1] === '=') {
        tokens.push({ type: TokenType.Operator, value: '<=', position: current }); current += 2; continue; 
      }
      tokens.push({ type: TokenType.Operator, value: char, position: current }); current++; continue; 
    }
    
    if (char === '>') {
      if (input[current + 1] === '=') {
        tokens.push({ type: TokenType.Operator, value: '>=', position: current }); current += 2; continue; 
      }
      tokens.push({ type: TokenType.Operator, value: char, position: current }); current++; continue; 
    }
    
    if (char === '&') { tokens.push({ type: TokenType.Command, value: '&', position: current }); current++; continue; }
    
    // Parens/Braces/Brackets
    if (char === '(') { tokens.push({ type: TokenType.LeftParen, value: char, position: current }); current++; continue; }
    if (char === ')') { tokens.push({ type: TokenType.RightParen, value: char, position: current }); current++; continue; }
    if (char === '{') { tokens.push({ type: TokenType.LeftBrace, value: char, position: current }); current++; continue; }
    if (char === '}') { tokens.push({ type: TokenType.RightBrace, value: char, position: current }); current++; continue; }
    if (char === '[') { tokens.push({ type: TokenType.LeftBracket, value: char, position: current }); current++; continue; }
    if (char === ']') { tokens.push({ type: TokenType.RightBracket, value: char, position: current }); current++; continue; }
    
    // Superscript/Subscript
    if (char === '^') { tokens.push({ type: TokenType.Caret, value: char, position: current }); current++; continue; }
    if (char === '_') { tokens.push({ type: TokenType.Underscore, value: char, position: current }); current++; continue; }

    throw new LatexTokenError(`Unexpected character: "${char}"`, current);
  }

  tokens.push({ type: TokenType.EOF, value: '', position: current });
  return tokens;
}
