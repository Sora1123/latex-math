import { describe, it, expect } from 'vitest';
import { parseLatex } from '../src/parser/index.js';
import { differentiate } from '../src/calculus/index.js';
import { simplify } from '../src/simplifier/index.js';
import { toLatex } from '../src/printer/index.js';
import { evaluateLatex } from '../src/evaluator/index.js';

describe('Phase 5 - Calculus', () => {
  describe('Derivative AST', () => {
    it('differentiates x^2', () => {
      const ast = parseLatex('x^2');
      const deriv = simplify(differentiate(ast, 'x'));
      // expecting 2 * x^1 => 2x
      expect(toLatex(deriv)).toBe('2 \\cdot x');
    });

    it('differentiates sin(x)', () => {
      const ast = parseLatex('\\sin(x)');
      const deriv = simplify(differentiate(ast, 'x'));
      expect(toLatex(deriv)).toBe('\\cos\\left(x\\right)');
    });

    it('differentiates constants', () => {
      const ast = parseLatex('5');
      const deriv = simplify(differentiate(ast, 'x'));
      expect(toLatex(deriv)).toBe('0');
    });

    it('differentiates x', () => {
      const ast = parseLatex('x');
      const deriv = simplify(differentiate(ast, 'x'));
      expect(toLatex(deriv)).toBe('1');
    });
  });

  describe('Evaluator Integration', () => {
    it('evaluates definite integral', () => {
      // integral of x from 0 to 1 is 0.5
      // using our numeric simpson's rule
      const val = evaluateLatex('\\int_0^1 x \\, dx') as number;
      expect(val).toBeCloseTo(0.5, 5);
    });

    it('evaluates definite integral of x^2', () => {
      // integral of x^2 from 0 to 1 is 1/3
      const val = evaluateLatex('\\int_0^1 x^2 \\, dx') as number;
      expect(val).toBeCloseTo(1/3, 5);
    });
  });

  describe('Derivative parsing', () => {
    it('parses \\frac{d}{dx} x^2', () => {
      const ast = parseLatex('\\frac{d}{dx} x^2');
      expect(ast.type).toBe('Derivative');
      expect((ast as any).variable).toBe('x');
    });
  });
});
