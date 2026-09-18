import { describe, it, expect } from 'vitest';
import { evaluateLatex } from '../src/evaluator/index.js';

describe('Evaluator (Phase 1)', () => {
  it('evaluates basic numbers', () => {
    expect(evaluateLatex('42')).toBe(42);
    expect(evaluateLatex('3.14')).toBe(3.14);
  });

  it('evaluates addition and subtraction', () => {
    expect(evaluateLatex('1 + 2')).toBe(3);
    expect(evaluateLatex('3 - 4')).toBe(-1);
    expect(evaluateLatex('1 + 2 - 3')).toBe(0);
  });

  it('evaluates multiplication and division', () => {
    expect(evaluateLatex('2 * 3')).toBe(6);
    expect(evaluateLatex('8 / 2')).toBe(4);
    expect(evaluateLatex('2 \\cdot 3')).toBe(6);
    expect(evaluateLatex('2 \\times 3')).toBe(6);
  });

  it('respects precedence', () => {
    expect(evaluateLatex('1 + 2 * 3')).toBe(7);
    expect(evaluateLatex('1 + 2 \\cdot 3')).toBe(7);
  });

  it('handles parentheses', () => {
    expect(evaluateLatex('(1 + 2) * 3')).toBe(9);
    expect(evaluateLatex('10 / (2 + 3)')).toBe(2);
  });

  it('throws on division by zero', () => {
    expect(() => evaluateLatex('1 / 0')).toThrowError('Division by zero');
  });

  it('handles variables', () => {
    expect(evaluateLatex('x + 2', { variables: { x: 3 } })).toBe(5);
    expect(evaluateLatex('a * b', { variables: { a: 4, b: 5 } })).toBe(20);
  });

  describe('Phase 2 Features', () => {
    it('evaluates fractions', () => {
      expect(evaluateLatex('\\frac{1}{2}')).toBe(0.5);
      expect(evaluateLatex('\\frac{10}{5}')).toBe(2);
    });

    it('evaluates powers', () => {
      expect(evaluateLatex('2^3')).toBe(8);
      expect(evaluateLatex('4^{1/2}')).toBe(2);
    });

    it('evaluates roots', () => {
      expect(evaluateLatex('\\sqrt{9}')).toBe(3);
      expect(evaluateLatex('\\sqrt[3]{8}')).toBe(2);
      expect(evaluateLatex('\\sqrt[3]{-8}')).toBe(-2);
    });

    it('evaluates implicit multiplication', () => {
      expect(evaluateLatex('2x', { variables: { x: 3 } })).toBe(6);
      expect(evaluateLatex('3(4)')).toBe(12);
      expect(evaluateLatex('(2)(3)')).toBe(6);
    });

    it('evaluates constants', () => {
      expect(evaluateLatex('\\pi')).toBeCloseTo(Math.PI);
      expect(evaluateLatex('e')).toBeCloseTo(Math.E);
    });

    it('evaluates functions', () => {
      expect(evaluateLatex('\\sin(0)')).toBe(0);
      expect(evaluateLatex('\\cos(0)')).toBe(1);
      expect(evaluateLatex('\\ln(e)')).toBeCloseTo(1);
    });

    it('evaluates absolute value', () => {
      expect(evaluateLatex('|-5|')).toBe(5);
      expect(evaluateLatex('|5|')).toBe(5);
      expect(evaluateLatex('\\left|-3\\right|')).toBe(3);
    });
  });
});
