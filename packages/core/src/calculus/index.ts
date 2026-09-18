import { Expression, BinaryOperationNode, PowerNode, NumberNode, FunctionNode } from '../ast/index.js';
import { UnsupportedExpressionError } from '../errors/index.js';

export function differentiate(node: Expression, variable: string): Expression {
  switch (node.type) {
    case 'Number':
    case 'Constant':
      return { type: 'Number', value: 0 };
    case 'Variable':
      return node.name === variable ? { type: 'Number', value: 1 } : { type: 'Number', value: 0 };
    case 'BinaryOperation':
      if (node.operator === '+') {
        return { type: 'BinaryOperation', operator: '+', left: differentiate(node.left, variable), right: differentiate(node.right, variable), implicit: false };
      }
      if (node.operator === '-') {
        return { type: 'BinaryOperation', operator: '-', left: differentiate(node.left, variable), right: differentiate(node.right, variable), implicit: false };
      }
      if (node.operator === '*') {
        return {
          type: 'BinaryOperation',
          operator: '+',
          implicit: false,
          left: { type: 'BinaryOperation', operator: '*', implicit: false, left: differentiate(node.left, variable), right: node.right },
          right: { type: 'BinaryOperation', operator: '*', implicit: false, left: node.left, right: differentiate(node.right, variable) }
        };
      }
      if (node.operator === '/') {
        const num: BinaryOperationNode = {
          type: 'BinaryOperation',
          operator: '-',
          implicit: false,
          left: { type: 'BinaryOperation', operator: '*', implicit: false, left: differentiate(node.left, variable), right: node.right },
          right: { type: 'BinaryOperation', operator: '*', implicit: false, left: node.left, right: differentiate(node.right, variable) }
        };
        const den: PowerNode = { type: 'Power', base: node.right, exponent: { type: 'Number', value: 2 } };
        return { type: 'BinaryOperation', operator: '/', implicit: false, left: num, right: den };
      }
      break;
    case 'Power':
       const n = node.exponent;
       const baseDeriv = differentiate(node.base, variable);
       const newExponent: BinaryOperationNode = { type: 'BinaryOperation', operator: '-', implicit: false, left: n, right: { type: 'Number', value: 1 } };
       return {
         type: 'BinaryOperation',
         operator: '*',
         implicit: false,
         left: {
           type: 'BinaryOperation',
           operator: '*',
           implicit: false,
           left: n,
           right: { type: 'Power', base: node.base, exponent: newExponent }
         },
         right: baseDeriv
       };
    case 'Function':
       const arg = node.args[0];
       const argDeriv = differentiate(arg, variable);
       let outer: Expression;
       switch (node.name) {
         case 'sin': outer = { type: 'Function', name: 'cos', args: [arg] }; break;
         case 'cos': outer = { type: 'BinaryOperation', operator: '*', implicit: false, left: { type: 'Number', value: -1 }, right: { type: 'Function', name: 'sin', args: [arg] } }; break;
         case 'tan': outer = { type: 'Power', base: { type: 'Function', name: 'cos', args: [arg] }, exponent: { type: 'Number', value: -2 } }; break;
         case 'exp': outer = node; break;
         case 'ln': outer = { type: 'BinaryOperation', operator: '/', implicit: false, left: { type: 'Number', value: 1 }, right: arg }; break;
         default: throw new Error(`Derivative not implemented for ${node.name}`);
       }
       return { type: 'BinaryOperation', operator: '*', implicit: false, left: outer, right: argDeriv };
  }
  throw new Error(`Derivative not implemented for ${node.type}`);
}

export function integrate(node: Expression, variable: string): Expression {
  // Analytical integration requires a full CAS integration table. Throw explicit error per spec.
  throw new UnsupportedExpressionError('Symbolic integration is not fully implemented yet.');
}
