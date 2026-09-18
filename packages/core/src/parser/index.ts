import { Token, TokenType, tokenize } from '../tokenizer/index.js';
import { Expression } from '../ast/index.js';
import { LatexParseError } from '../errors/index.js';
import { normalizeLatex } from './normalizer.js';

export { normalizeLatex };

function extractDx(expr: Expression): { integrand: Expression; variable: string } | null {
  if (expr.type === 'BinaryOperation' && expr.operator === '*') {
    if (expr.right.type === 'BinaryOperation' && expr.right.operator === '*' && expr.right.implicit && expr.right.left.type === 'Variable' && expr.right.left.name === 'd' && expr.right.right.type === 'Variable') {
      return { integrand: expr.left, variable: expr.right.right.name };
    }
    if (expr.right.type === 'Variable' && expr.left.type === 'BinaryOperation' && expr.left.operator === '*' && expr.left.right.type === 'Variable' && expr.left.right.name === 'd') {
      return { integrand: expr.left.left, variable: expr.right.name };
    }
  }
  return null;
}

export function parseLatex(input: string): Expression {
  const normalized = normalizeLatex(input);
  const tokens = tokenize(normalized);
  let current = 0;

  function peek(): Token {
    return tokens[current];
  }

  function consume(type?: TokenType): Token {
    const token = peek();
    if (type && token.type !== type) {
      throw new LatexParseError(`Expected token type ${type}, but got ${token.type}`, token.position);
    }
    current++;
    return token;
  }

  function parseExpression(): Expression {
    let left = parseAddition();

    const token = peek();
    if (token.type === TokenType.Operator && ['=', '<', '>', '<=', '>='].includes(token.value)) {
      consume();
      const right = parseAddition();
      return { type: 'Equation', operator: token.value as '=' | '<' | '>' | '<=' | '>=', left, right };
    }
    
    // Check for LaTeX commands that act as operators
    if (token.type === TokenType.Command && ['\\leq', '\\geq', '\\le', '\\ge'].includes(token.value)) {
      const cmd = consume().value;
      const right = parseAddition();
      let op: '=' | '<' | '>' | '<=' | '>=' = '<=';
      if (cmd === '\\geq' || cmd === '\\ge') op = '>=';
      return { type: 'Equation', operator: op, left, right };
    }

    return left;
  }

  function parseAddition(): Expression {
    let left = parseMultiplication();

    while (peek().type === TokenType.Operator && (peek().value === '+' || peek().value === '-')) {
      const opToken = consume();
      const right = parseMultiplication();
      left = {
        type: 'BinaryOperation',
        operator: opToken.value as '+' | '-',
        left,
        right,
      };
    }

    return left;
  }

  function parseMultiplication(): Expression {
    let left = parseUnary();

    while (true) {
      const token = peek();
      if (token.type === TokenType.EOF) break;

      if (token.type === TokenType.Operator && (token.value === '*' || token.value === '/')) {
        const opToken = consume();
        const right = parseUnary();
        left = {
          type: 'BinaryOperation',
          operator: opToken.value as '*' | '/',
          left,
          right,
        };
      } else if (token.type === TokenType.Command && (token.value === '\\cdot' || token.value === '\\times')) {
        consume();
        const right = parseUnary();
        left = {
          type: 'BinaryOperation',
          operator: '*',
          left,
          right,
        };
      } else if (
        token.type === TokenType.Number ||
        token.type === TokenType.Identifier ||
        token.type === TokenType.LeftParen ||
        token.type === TokenType.LeftBrace ||
        (token.type === TokenType.Command && !['\\right', '\\end', '\\\\', '&'].includes(token.value))
      ) {
        // Implicit multiplication
        const right = parseUnary();
        left = {
          type: 'BinaryOperation',
          operator: '*',
          left,
          right,
          implicit: true,
        };
      } else {
        break;
      }
    }

    return left;
  }

  function parseUnary(): Expression {
    const token = peek();
    if (token.type === TokenType.Operator && (token.value === '+' || token.value === '-')) {
      const opToken = consume();
      const operand = parsePower();
      return {
        type: 'UnaryOperation',
        operator: opToken.value as '+' | '-',
        operand,
      };
    }
    return parsePower();
  }

  function parsePower(): Expression {
    let left = parsePrimary();

    if (peek() && peek().type === TokenType.Command && peek().value === '\\!') {
      consume();
      left = { type: 'Factorial', operand: left };
    } else if (peek() && peek().type === TokenType.Operator && peek().value === '!') {
      // Allow raw '!' operator just in case tokenizer catches it as an operator
      consume();
      left = { type: 'Factorial', operand: left };
    }

    const token = peek();
    if (token.type === TokenType.Caret) {
      consume();
      let exponent: Expression;
      if (peek().type === TokenType.LeftBrace) {
        consume();
        exponent = parseExpression();
        consume(TokenType.RightBrace);
      } else {
        exponent = parsePrimary();
      }
      left = { type: 'Power', base: left, exponent };
    }

    return left;
  }

  function parsePrimary(): Expression {
    const token = peek();

    if (token.type === TokenType.Number) {
      consume();
      return {
        type: 'Number',
        value: parseFloat(token.value),
      };
    }

    if (token.type === TokenType.Identifier) {
      consume();
      if (token.value === 'e' || token.value === 'i') {
        return { type: 'Constant', name: token.value };
      }
      return {
        type: 'Variable',
        name: token.value,
      };
    }
    
    if (token.type === TokenType.LeftParen) {
      consume();
      const expr = parseExpression();
      consume(TokenType.RightParen);
      return expr;
    }

    if (token.type === TokenType.LeftBrace) {
      consume();
      const expr = parseExpression();
      consume(TokenType.RightBrace);
      return expr;
    }

    if (token.type === TokenType.Command && token.value === '|') {
      consume();
      const expr = parseExpression();
      const nextToken = consume();
      if (nextToken.type === TokenType.Command && nextToken.value === '|') {
        // success
      } else if (nextToken.type === TokenType.Operator && nextToken.value === '|') {
        // success
      } else {
        throw new LatexParseError('Expected closing |', nextToken.position);
      }
      return { type: 'AbsoluteValue', expression: expr };
    }

    if (token.type === TokenType.Operator && token.value === '|') {
      consume();
      const expr = parseExpression();
      const nextToken = consume();
      if (nextToken.type === TokenType.Command && nextToken.value === '|') {
        // success
      } else if (nextToken.type === TokenType.Operator && nextToken.value === '|') {
        // success
      } else {
        throw new LatexParseError('Expected closing |', nextToken.position);
      }
      return { type: 'AbsoluteValue', expression: expr };
    }

    if (token.type === TokenType.Command) {
      consume();

      if (token.value === '\\left') {
        const next = consume();
        if (next.type === TokenType.LeftParen) {
          const expr = parseExpression();
          const rightCmd = consume(TokenType.Command);
          if (rightCmd.value !== '\\right') throw new LatexParseError('Expected \\right', rightCmd.position);
          consume(TokenType.RightParen);
          return expr;
        } else if (next.type === TokenType.Command && next.value === '|') {
          const expr = parseExpression();
          const rightCmd = consume(TokenType.Command);
          if (rightCmd.value !== '\\right') throw new LatexParseError('Expected \\right', rightCmd.position);
          const barCmd = consume();
          if (barCmd.type !== TokenType.Command || barCmd.value !== '|') throw new LatexParseError('Expected |', barCmd.position);
          return { type: 'AbsoluteValue', expression: expr };
        } else if (next.type === TokenType.Operator && next.value === '|') {
          const expr = parseExpression();
          const rightCmd = consume(TokenType.Command);
          if (rightCmd.value !== '\\right') throw new LatexParseError('Expected \\right', rightCmd.position);
          const barCmd = consume();
          if (barCmd.type !== TokenType.Operator || barCmd.value !== '|') throw new LatexParseError('Expected |', barCmd.position);
          return { type: 'AbsoluteValue', expression: expr };
        } else {
          throw new LatexParseError('Unsupported \\left delimiter', next.position);
        }
      }
      
      if (token.value === '\\pi') return { type: 'Constant', name: 'pi' };

      if (token.value === '\\begin') {
        consume(TokenType.LeftBrace);
        let envNameStr = '';
        while (peek().type === TokenType.Identifier) {
          envNameStr += consume(TokenType.Identifier).value;
        }
        consume(TokenType.RightBrace);
        
        if (envNameStr !== 'pmatrix' && envNameStr !== 'bmatrix' && envNameStr !== 'vmatrix') {
          throw new LatexParseError('Unsupported environment', token.position);
        }

        const rows: Expression[][] = [];
        let currentRow: Expression[] = [];
        
        while (true) {
          if (peek().type === TokenType.Command && peek().value === '\\end') {
            consume();
            consume(TokenType.LeftBrace);
            let endNameStr = '';
            while (peek().type === TokenType.Identifier) {
              endNameStr += consume(TokenType.Identifier).value;
            }
            consume(TokenType.RightBrace);
            if (endNameStr !== envNameStr) throw new LatexParseError('Mismatched environment', peek().position);
            if (currentRow.length > 0) rows.push(currentRow);
            break;
          }
          
          if (peek().type === TokenType.Command && peek().value === '\\\\') {
            consume();
            rows.push(currentRow);
            currentRow = [];
            continue;
          }
          
          if (peek().type === TokenType.Command && peek().value === '&') {
            consume();
            continue;
          }
          
          currentRow.push(parseExpression());
        }
        
        return { type: 'Matrix', rows };
      }

      const functions = ['\\sin', '\\cos', '\\tan', '\\arcsin', '\\arccos', '\\arctan', '\\ln', '\\log', '\\exp', '\\det', '\\transpose', '\\arg'];
      if (functions.includes(token.value)) {
        let funcName = token.value.substring(1);
        let power: Expression | null = null;
        
        if (peek().type === TokenType.Caret) {
          consume();
          const hasBrace = peek().type === TokenType.LeftBrace;
          if (hasBrace) {
            consume();
            power = parseExpression();
            consume(TokenType.RightBrace);
          } else {
            power = parsePrimary();
          }
        }

        // if power is -1 and funcName is sin, cos, tan, change to arcsin, arccos, arctan
        let isInverse = false;
        if (power) {
          if (power.type === 'Number' && power.value === -1) {
            isInverse = true;
          } else if (power.type === 'UnaryOperation' && power.operator === '-' && power.operand.type === 'Number' && power.operand.value === 1) {
            isInverse = true;
          }
        }

        if (isInverse) {
          if (funcName === 'sin') { funcName = 'arcsin'; power = null; }
          else if (funcName === 'cos') { funcName = 'arccos'; power = null; }
          else if (funcName === 'tan') { funcName = 'arctan'; power = null; }
        }

        let arg: Expression;
        if (peek().type === TokenType.LeftParen) {
          consume();
          arg = parseExpression();
          consume(TokenType.RightParen);
        } else if (peek().type === TokenType.LeftBrace) {
          consume();
          arg = parseExpression();
          consume(TokenType.RightBrace);
        } else if (peek().type === TokenType.Command && peek().value === '\\left') {
          arg = parsePrimary();
        } else {
          arg = parsePrimary();
        }
        
        const funcNode: Expression = { type: 'Function', name: funcName, args: [arg] };
        
        if (power) {
          return { type: 'Power', base: funcNode, exponent: power };
        }
        return funcNode;
      }

      if (token.value === '\\binom') {
        let n: Expression;
        if (peek().type === TokenType.LeftBrace) {
          consume(TokenType.LeftBrace);
          n = parseExpression();
          consume(TokenType.RightBrace);
        } else {
          n = parsePrimary();
        }

        let k: Expression;
        if (peek().type === TokenType.LeftBrace) {
          consume(TokenType.LeftBrace);
          k = parseExpression();
          consume(TokenType.RightBrace);
        } else {
          k = parsePrimary();
        }
        return { type: 'Combinatorics', n, k };
      }

      if (token.value === '\\frac') {
        let numerator: Expression;
        if (peek().type === TokenType.LeftBrace) {
          consume(TokenType.LeftBrace);
          numerator = parseExpression();
          consume(TokenType.RightBrace);
        } else {
          numerator = parsePrimary();
        }
        
        let denominator: Expression;
        if (peek().type === TokenType.LeftBrace) {
          consume(TokenType.LeftBrace);
          denominator = parseExpression();
          consume(TokenType.RightBrace);
        } else {
          denominator = parsePrimary();
        }

        if (numerator.type === 'Variable' && numerator.name === 'd') {
          if (denominator.type === 'BinaryOperation' && denominator.operator === '*' && denominator.implicit && denominator.left.type === 'Variable' && denominator.left.name === 'd' && denominator.right.type === 'Variable') {
            const variable = denominator.right.name;
            const expr = parsePower();
            return { type: 'Derivative', variable, expression: expr };
          }
        }

        return { type: 'Fraction', numerator, denominator };
      }

      if (token.value === '\\int') {
        let lowerBound: Expression | null = null;
        let upperBound: Expression | null = null;
        if (peek().type === TokenType.Underscore) {
          consume();
          lowerBound = peek().type === TokenType.LeftBrace ? parsePrimary() : parsePrimary();
        }
        if (peek().type === TokenType.Caret) {
          consume();
          upperBound = peek().type === TokenType.LeftBrace ? parsePrimary() : parsePrimary();
        }

        const body = parseExpression();
        const extracted = extractDx(body);
        let integrand = body;
        let variable = 'x';
        
        if (extracted) {
          integrand = extracted.integrand;
          variable = extracted.variable;
        }

        return { type: 'Integral', variable, lowerBound, upperBound, expression: integrand };
      }
      if (token.value === '\\sum') {
        let indexVariable = '';
        let lowerBound: Expression | null = null;
        let upperBound: Expression | null = null;
        if (peek().type === TokenType.Underscore) {
          consume();
          if (peek().type === TokenType.LeftBrace) {
            consume();
            const eq = parseExpression();
            if (eq.type === 'Equation' && eq.operator === '=' && eq.left.type === 'Variable') {
              indexVariable = eq.left.name;
              lowerBound = eq.right;
            } else {
              throw new LatexParseError('Expected equation in summation subscript', peek().position);
            }
            consume(TokenType.RightBrace);
          } else {
            throw new LatexParseError('Expected { after _ in \\sum', peek().position);
          }
        }
        if (peek().type === TokenType.Caret) {
          consume();
          if (peek().type === TokenType.LeftBrace) {
            consume();
            upperBound = parseExpression();
            consume(TokenType.RightBrace);
          } else {
            upperBound = parsePrimary();
          }
        }
        if (!lowerBound || !upperBound) {
          throw new LatexParseError('Summation requires lower and upper bounds', token.position);
        }
        const body = parseExpression();
        return { type: 'Summation', indexVariable, lowerBound, upperBound, expression: body };
      }
      if (token.value === "\\sqrt") {
        let index: Expression = { type: "Number", value: 2 };
        if (peek().type === TokenType.LeftBracket) {
          consume();
          index = parseExpression();
          consume(TokenType.RightBracket);
        }
        
        let radicand: Expression;
        if (peek().type === TokenType.LeftBrace) {
          consume(TokenType.LeftBrace);
          radicand = parseExpression();
          consume(TokenType.RightBrace);
        } else {
          radicand = parsePrimary();
        }

        return { type: 'Root', radicand, index };
      }

      if (token.value === '\\left') {
        const delim = consume(); 
        if (delim.type === TokenType.LeftParen) {
          const expr = parseExpression();
          const rightDelim = consume(TokenType.Command);
          if (rightDelim.value !== '\\right') throw new LatexParseError('Expected \\right', rightDelim.position);
          consume(TokenType.RightParen);
          return expr;
        } else if (delim.type === TokenType.Operator && delim.value === '|') {
          const expr = parseExpression();
          const rightDelim = consume(TokenType.Command);
          if (rightDelim.value !== '\\right') throw new LatexParseError('Expected \\right', rightDelim.position);
          const rightPipe = consume(TokenType.Operator);
          if (rightPipe.value !== '|') throw new LatexParseError('Expected |', rightPipe.position);
          return { type: 'AbsoluteValue', expression: expr };
        } else {
          throw new LatexParseError(`Unsupported \\left delimiter: ${delim.value}`, delim.position);
        }
      }
    }

    if (token.type === TokenType.Operator && token.value === '|') {
      consume();
      const expr = parseExpression();
      const right = consume(TokenType.Operator);
      if (right.value !== '|') throw new LatexParseError('Expected |', right.position);
      return { type: 'AbsoluteValue', expression: expr };
    }

    throw new LatexParseError(`Unexpected token: ${token.value}`, token.position);
  }

  const ast = parseExpression();
  if (peek().type !== TokenType.EOF) {
    throw new LatexParseError(`Unexpected token at end of input: ${peek().value}`, peek().position);
  }

  return ast;
}
