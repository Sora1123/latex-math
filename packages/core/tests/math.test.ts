import { describe, it, expect } from 'vitest';
import { parseLatex } from '../src/parser/index.js';
import { evaluateLatex } from '../src/evaluator/index.js';
import { Complex, MatrixValue } from '../src/math/index.js';

describe('Phase 4 - Matrices and Complex Numbers', () => {
  describe('Complex Numbers', () => {
    it('evaluates i as complex number', () => {
      const val = evaluateLatex('i');
      expect(val).toBeInstanceOf(Complex);
      expect((val as Complex).re).toBe(0);
      expect((val as Complex).im).toBe(1);
    });

    it('evaluates 2i', () => {
      const val = evaluateLatex('2i') as Complex;
      expect(val.re).toBe(0);
      expect(val.im).toBe(2);
    });

    it('evaluates 1 + 2i', () => {
      const val = evaluateLatex('1 + 2i') as Complex;
      expect(val.re).toBe(1);
      expect(val.im).toBe(2);
    });

    it('evaluates i * i as -1', () => {
      const val = evaluateLatex('i \\cdot i') as Complex;
      expect(val.re).toBe(-1);
      expect(val.im).toBe(0);
    });
    it('evaluates complex exponential e^{i\\pi}', () => {
      const val = evaluateLatex('e^{i\\pi}') as Complex;
      expect(val.re).toBeCloseTo(-1, 5);
      expect(val.im).toBeCloseTo(0, 5);
    });

    it('evaluates arg(2i + 2)', () => {
      const val = evaluateLatex('\\arg(2 + 2i)');
      expect(val).toBeCloseTo(Math.PI / 4, 5);
    });
  });

  describe('Trigonometry', () => {
    it('evaluates sin^2(x)', () => {
      const val = evaluateLatex('\\sin^2(1)');
      const expected = Math.pow(Math.sin(1), 2);
      expect(val).toBeCloseTo(expected, 5);
    });

    it('evaluates sin^{-1}(x) as arcsin', () => {
      const val = evaluateLatex('\\sin^{-1}(0.5)');
      const expected = Math.asin(0.5);
      expect(val).toBeCloseTo(expected, 5);
    });
  });

  describe('Matrices', () => {
    it('parses a basic matrix', () => {
      const ast = parseLatex('\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}');
      expect(ast.type).toBe('Matrix');
      // evaluated
      const val = evaluateLatex(ast) as MatrixValue;
      expect(val.rows.length).toBe(2);
      expect(val.rows[0].length).toBe(2);
      expect(val.rows[0][0]).toBe(1);
      expect(val.rows[1][1]).toBe(4);
    });

    it('adds two matrices', () => {
      const val = evaluateLatex('\\begin{pmatrix} 1 & 2 \\end{pmatrix} + \\begin{pmatrix} 3 & 4 \\end{pmatrix}') as MatrixValue;
      expect(val.rows[0][0]).toBe(4);
      expect(val.rows[0][1]).toBe(6);
    });

    it('multiplies matrices', () => {
      const val = evaluateLatex('\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix} \\begin{pmatrix} 2 \\\\ 0 \\end{pmatrix}') as MatrixValue;
      // [1 2] * [2] = [2 + 0] = 2
      // [3 4]   [0] = [6 + 0] = 6
      expect(val.rows[0][0]).toBe(2);
      expect(val.rows[1][0]).toBe(6);
    });

    it('calculates determinant', () => {
      const val = evaluateLatex('\\det(\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix})');
      expect(val).toBe(-2);
    });

    it('calculates transpose', () => {
      const val = evaluateLatex('\\transpose(\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix})') as MatrixValue;
      expect(val.rows[0][1]).toBe(3);
      expect(val.rows[1][0]).toBe(2);
    });

    it('calculates inverse', () => {
      const val = evaluateLatex('\\begin{pmatrix} 4 & 7 \\\\ 2 & 6 \\end{pmatrix}^{-1}') as MatrixValue;
      // det = 24 - 14 = 10
      // inv = [6/10, -7/10; -2/10, 4/10]
      expect(val.rows[0][0]).toBeCloseTo(0.6, 5);
      expect(val.rows[0][1]).toBeCloseTo(-0.7, 5);
      expect(val.rows[1][0]).toBeCloseTo(-0.2, 5);
      expect(val.rows[1][1]).toBeCloseTo(0.4, 5);
    });
  });
});
