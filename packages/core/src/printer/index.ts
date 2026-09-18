import { Expression } from '../ast/index.js';

export function toLatex(node: Expression): string {
  switch (node.type) {
    case 'Number':
      return node.value.toString();
      
    case 'Variable':
      return node.name;
      
    case 'Constant':
      if (node.name === 'pi') return '\\pi';
      return node.name; // e.g. e, i
      
    case 'BinaryOperation': {
      const left = toLatex(node.left);
      const right = toLatex(node.right);
      
      // Need parens logic here? Ideally yes, but keeping it simple.
      // E.g. (a + b) * c
      // Let's add basic paren wrapper if child is + or - and we are * or / or ^
      const wrapLeft = (node.operator === '*' || node.operator === '/') 
        && (node.left.type === 'BinaryOperation' && (node.left.operator === '+' || node.left.operator === '-'));
      const wrapRight = (node.operator === '*' || node.operator === '/') 
        && (node.right.type === 'BinaryOperation' && (node.right.operator === '+' || node.right.operator === '-'));

      const leftStr = wrapLeft ? `\\left(${left}\\right)` : left;
      const rightStr = wrapRight ? `\\left(${right}\\right)` : right;

      if (node.operator === '*') {
        if (node.implicit) {
          // If both are numbers after evaluation/substitution, we should separate them
          if (node.left.type === 'Number' && node.right.type === 'Number') {
            return `${leftStr} \\cdot ${rightStr}`;
          }
          return `${leftStr}${rightStr}`;
        }
        return `${leftStr} \\cdot ${rightStr}`;
      }
      if (node.operator === '/') {
        return `\\frac{${leftStr}}{${rightStr}}`;
      }
      return `${leftStr} ${node.operator} ${rightStr}`;
    }

    case 'UnaryOperation': {
      const operand = toLatex(node.operand);
      const wrap = node.operand.type === 'BinaryOperation' && (node.operand.operator === '+' || node.operand.operator === '-');
      const opStr = wrap ? `\\left(${operand}\\right)` : operand;
      return `${node.operator}${opStr}`;
    }

    case 'Fraction':
      return `\\frac{${toLatex(node.numerator)}}{${toLatex(node.denominator)}}`;

    case 'Power': {
      const base = toLatex(node.base);
      const wrapBase = node.base.type === 'BinaryOperation' || node.base.type === 'Fraction' || node.base.type === 'Root';
      const baseStr = wrapBase ? `\\left(${base}\\right)` : base;
      return `${baseStr}^{${toLatex(node.exponent)}}`;
    }

    case 'Root': {
      const radicand = toLatex(node.radicand);
      if (node.index.type === 'Number' && node.index.value === 2) {
        return `\\sqrt{${radicand}}`;
      }
      return `\\sqrt[${toLatex(node.index)}]{${radicand}}`;
    }

    case 'AbsoluteValue':
      return `\\left|${toLatex(node.expression)}\\right|`;

    case 'Function':
      return `\\${node.name}\\left(${toLatex(node.args[0])}\\right)`;

    default:
      return '';
  }
}
