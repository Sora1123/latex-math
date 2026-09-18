import { Expression } from '../ast/index.js';

import { UnsupportedExpressionError } from '../errors/index.js';

export function simplify(node: Expression): Expression {
  switch (node.type) {
    case 'BinaryOperation': {
      const left = simplify(node.left);
      const right = simplify(node.right);

      // Constant folding
      if (left.type === 'Number' && right.type === 'Number') {
        switch (node.operator) {
          case '+': return { type: 'Number', value: left.value + right.value };
          case '-': return { type: 'Number', value: left.value - right.value };
          case '*': return { type: 'Number', value: left.value * right.value };
          case '/': 
            if (right.value !== 0) return { type: 'Number', value: left.value / right.value };
            break;
        }
      }

      // x * 1 -> x, x * 0 -> 0
      if (node.operator === '*') {
        if (left.type === 'Number') {
          if (left.value === 0) return { type: 'Number', value: 0 };
          if (left.value === 1) return right;
        }
        if (right.type === 'Number') {
          if (right.value === 0) return { type: 'Number', value: 0 };
          if (right.value === 1) return left;
        }
      }

      // x + 0 -> x
      if (node.operator === '+') {
        if (left.type === 'Number' && left.value === 0) return right;
        if (right.type === 'Number' && right.value === 0) return left;
      }

      // x - 0 -> x
      if (node.operator === '-') {
        if (right.type === 'Number' && right.value === 0) return left;
        // 0 - x -> -x
        if (left.type === 'Number' && left.value === 0) {
          return { type: 'UnaryOperation', operator: '-', operand: right };
        }
      }

      // x / 1 -> x
      if (node.operator === '/') {
        if (right.type === 'Number' && right.value === 1) return left;
      }

      return { ...node, left, right };
    }

    case 'UnaryOperation': {
      const operand = simplify(node.operand);
      if (operand.type === 'Number') {
        if (node.operator === '-') return { type: 'Number', value: -operand.value };
        if (node.operator === '+') return { type: 'Number', value: operand.value };
      }
      return { ...node, operand };
    }

    case 'Fraction': {
      const numerator = simplify(node.numerator);
      const denominator = simplify(node.denominator);
      
      // 0 / x -> 0
      if (numerator.type === 'Number' && numerator.value === 0 && 
         (denominator.type !== 'Number' || denominator.value !== 0)) {
        return { type: 'Number', value: 0 };
      }

      return { ...node, numerator, denominator };
    }

    case 'Power': {
      const base = simplify(node.base);
      const exponent = simplify(node.exponent);

      // x ^ 1 -> x
      if (exponent.type === 'Number' && exponent.value === 1) return base;
      // x ^ 0 -> 1
      if (exponent.type === 'Number' && exponent.value === 0) return { type: 'Number', value: 1 };
      // 1 ^ x -> 1
      if (base.type === 'Number' && base.value === 1) return { type: 'Number', value: 1 };

      return { ...node, base, exponent };
    }

    case 'Root': {
      const radicand = simplify(node.radicand);
      const index = simplify(node.index);
      return { ...node, radicand, index };
    }

    case 'AbsoluteValue': {
      const expression = simplify(node.expression);
      if (expression.type === 'Number') {
        return { type: 'Number', value: Math.abs(expression.value) };
      }
      return { ...node, expression };
    }

    case 'Function': {
      const args = node.args.map(simplify);
      return { ...node, args };
    }

    default:
      return node;
  }
}

export function expand(node: Expression): Expression {
  // Symbolic expansion requires a full CAS. We will throw an explicit unsupported error for now.
  throw new UnsupportedExpressionError('Algebraic expansion is not fully implemented yet.');
}

export function factor(node: Expression): Expression {
  // Symbolic factorization requires a full CAS. We will throw an explicit unsupported error for now.
  throw new UnsupportedExpressionError('Algebraic factorization is not fully implemented yet.');
}

export function substitute(node: Expression, variables: Record<string, Expression | number>): Expression {
  switch (node.type) {
    case 'Variable': {
      const sub = variables[node.name];
      if (sub !== undefined) {
        if (typeof sub === 'number') {
          return { type: 'Number', value: sub };
        }
        // clone the AST node to prevent shared references
        return JSON.parse(JSON.stringify(sub));
      }
      return { ...node };
    }
    
    case 'BinaryOperation':
      return {
        ...node,
        left: substitute(node.left, variables),
        right: substitute(node.right, variables),
      };
      
    case 'UnaryOperation':
      return {
        ...node,
        operand: substitute(node.operand, variables),
      };

    case 'Fraction':
      return {
        ...node,
        numerator: substitute(node.numerator, variables),
        denominator: substitute(node.denominator, variables),
      };

    case 'Power':
      return {
        ...node,
        base: substitute(node.base, variables),
        exponent: substitute(node.exponent, variables),
      };

    case 'Root':
      return {
        ...node,
        radicand: substitute(node.radicand, variables),
        index: substitute(node.index, variables),
      };

    case 'AbsoluteValue':
      return {
        ...node,
        expression: substitute(node.expression, variables),
      };

    case 'Function':
      return {
        ...node,
        args: node.args.map(arg => substitute(arg, variables)),
      };

    default:
      return { ...node };
  }
}
