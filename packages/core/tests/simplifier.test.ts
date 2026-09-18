import { describe, it, expect } from 'vitest';
import { parseLatex } from '../src/parser/index.js';
import { simplify, substitute } from '../src/simplifier/index.js';
import { toLatex } from '../src/printer/index.js';

describe('Phase 3 - Simplifier & Substitution', () => {
  describe('simplify', () => {
    it('folds constants', () => {
      const ast = parseLatex('2 + 3');
      const simplified = simplify(ast);
      expect(toLatex(simplified)).toBe('5');
    });

    it('simplifies x * 1 and 1 * x', () => {
      const ast1 = parseLatex('x * 1');
      const ast2 = parseLatex('1 * x');
      expect(toLatex(simplify(ast1))).toBe('x');
      expect(toLatex(simplify(ast2))).toBe('x');
    });

    it('simplifies x * 0', () => {
      const ast = parseLatex('x * 0');
      expect(toLatex(simplify(ast))).toBe('0');
    });

    it('simplifies x + 0', () => {
      const ast = parseLatex('x + 0');
      expect(toLatex(simplify(ast))).toBe('x');
    });

    it('simplifies x - 0', () => {
      const ast = parseLatex('x - 0');
      expect(toLatex(simplify(ast))).toBe('x');
    });

    it('simplifies 0 - x', () => {
      const ast = parseLatex('0 - x');
      expect(toLatex(simplify(ast))).toBe('-x');
    });

    it('simplifies fractions with 0 numerator', () => {
      const ast = parseLatex('\\frac{0}{x}');
      expect(toLatex(simplify(ast))).toBe('0');
    });

    it('simplifies x^1 to x', () => {
      const ast = parseLatex('x^1');
      expect(toLatex(simplify(ast))).toBe('x');
    });

    it('simplifies x^0 to 1', () => {
      const ast = parseLatex('x^0');
      expect(toLatex(simplify(ast))).toBe('1');
    });
  });

  describe('substitute', () => {
    it('replaces variables with numbers', () => {
      const ast = parseLatex('2x + y');
      const subbed = substitute(ast, { x: 3 });
      expect(toLatex(subbed)).toBe('2 \\cdot 3 + y');
    });

    it('replaces variables with expressions', () => {
      const ast = parseLatex('x^2');
      const subbed = substitute(ast, { x: parseLatex('y + 1') });
      expect(toLatex(subbed)).toBe('\\left(y + 1\\right)^{2}');
    });
  });
});
