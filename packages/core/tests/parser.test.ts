import { describe, it, expect } from 'vitest';
import { parseLatex } from '../src/parser/index.js';

describe('Parser (Phase 1)', () => {
  it('parses basic numbers', () => {
    const ast = parseLatex('42');
    expect(ast).toEqual({ type: 'Number', value: 42 });
  });

  it('parses decimals', () => {
    const ast = parseLatex('3.14');
    expect(ast).toEqual({ type: 'Number', value: 3.14 });
  });

  it('parses basic addition', () => {
    const ast = parseLatex('1 + 2');
    expect(ast).toEqual({
      type: 'BinaryOperation',
      operator: '+',
      left: { type: 'Number', value: 1 },
      right: { type: 'Number', value: 2 },
    });
  });

  it('parses basic subtraction', () => {
    const ast = parseLatex('3 - 4');
    expect(ast).toEqual({
      type: 'BinaryOperation',
      operator: '-',
      left: { type: 'Number', value: 3 },
      right: { type: 'Number', value: 4 },
    });
  });

  it('parses basic multiplication', () => {
    const ast = parseLatex('2 * 3');
    expect(ast).toEqual({
      type: 'BinaryOperation',
      operator: '*',
      left: { type: 'Number', value: 2 },
      right: { type: 'Number', value: 3 },
    });
  });

  it('parses latex multiplication commands', () => {
    const astCdot = parseLatex('2 \\cdot 3');
    expect(astCdot).toEqual({
      type: 'BinaryOperation',
      operator: '*',
      left: { type: 'Number', value: 2 },
      right: { type: 'Number', value: 3 },
    });

    const astTimes = parseLatex('2 \\times 3');
    expect(astTimes).toEqual({
      type: 'BinaryOperation',
      operator: '*',
      left: { type: 'Number', value: 2 },
      right: { type: 'Number', value: 3 },
    });
  });

  it('parses division', () => {
    const ast = parseLatex('8 / 2');
    expect(ast).toEqual({
      type: 'BinaryOperation',
      operator: '/',
      left: { type: 'Number', value: 8 },
      right: { type: 'Number', value: 2 },
    });
  });

  it('respects operator precedence', () => {
    const ast = parseLatex('1 + 2 * 3');
    expect(ast).toEqual({
      type: 'BinaryOperation',
      operator: '+',
      left: { type: 'Number', value: 1 },
      right: {
        type: 'BinaryOperation',
        operator: '*',
        left: { type: 'Number', value: 2 },
        right: { type: 'Number', value: 3 },
      },
    });
  });

  it('handles parentheses', () => {
    const ast = parseLatex('(1 + 2) * 3');
    expect(ast).toEqual({
      type: 'BinaryOperation',
      operator: '*',
      left: {
        type: 'BinaryOperation',
        operator: '+',
        left: { type: 'Number', value: 1 },
        right: { type: 'Number', value: 2 },
      },
      right: { type: 'Number', value: 3 },
    });
  });

  describe('Phase 2 Features', () => {
    it('parses fractions', () => {
      expect(parseLatex('\\frac{1}{2}')).toEqual({
        type: 'Fraction',
        numerator: { type: 'Number', value: 1 },
        denominator: { type: 'Number', value: 2 }
      });
    });

    it('parses powers', () => {
      expect(parseLatex('x^2')).toEqual({
        type: 'Power',
        base: { type: 'Variable', name: 'x' },
        exponent: { type: 'Number', value: 2 }
      });
      
      expect(parseLatex('x^{n+1}')).toEqual({
        type: 'Power',
        base: { type: 'Variable', name: 'x' },
        exponent: {
          type: 'BinaryOperation',
          operator: '+',
          left: { type: 'Variable', name: 'n' },
          right: { type: 'Number', value: 1 }
        }
      });
    });

    it('parses roots', () => {
      expect(parseLatex('\\sqrt{x}')).toEqual({
        type: 'Root',
        index: { type: 'Number', value: 2 },
        radicand: { type: 'Variable', name: 'x' }
      });

      expect(parseLatex('\\sqrt[3]{x}')).toEqual({
        type: 'Root',
        index: { type: 'Number', value: 3 },
        radicand: { type: 'Variable', name: 'x' }
      });
    });

    it('parses implicit multiplication', () => {
      expect(parseLatex('2x')).toEqual({
        type: 'BinaryOperation',
        operator: '*',
        implicit: true,
        left: { type: 'Number', value: 2 },
        right: { type: 'Variable', name: 'x' }
      });

      expect(parseLatex('3(x+1)')).toEqual({
        type: 'BinaryOperation',
        operator: '*',
        implicit: true,
        left: { type: 'Number', value: 3 },
        right: {
          type: 'BinaryOperation',
          operator: '+',
          left: { type: 'Variable', name: 'x' },
          right: { type: 'Number', value: 1 }
        }
      });
    });

    it('parses functions and constants', () => {
      expect(parseLatex('\\sin(x)')).toEqual({
        type: 'Function',
        name: 'sin',
        args: [{ type: 'Variable', name: 'x' }]
      });

      expect(parseLatex('2\\pi')).toEqual({
        type: 'BinaryOperation',
        operator: '*',
        implicit: true,
        left: { type: 'Number', value: 2 },
        right: { type: 'Constant', name: 'pi' }
      });
    });

    it('parses absolute value', () => {
      expect(parseLatex('|x|')).toEqual({
        type: 'AbsoluteValue',
        expression: { type: 'Variable', name: 'x' }
      });
    });
  });
});
