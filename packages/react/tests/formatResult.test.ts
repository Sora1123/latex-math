import { describe, it, expect } from 'vitest';
import { formatResult } from '../src/useLatexEvaluation';
import { SciNumber, Complex, MatrixValue } from '@latex-math/core';

describe('formatResult LaTeX formatting', () => {
  it('formats large numbers in LaTeX instead of 1e+100', () => {
    const formatted = formatResult(1e100);
    expect(formatted).toBe('1 \\times 10^{100}');
    expect(formatted).not.toContain('1e+100');
    expect(formatted).not.toContain('1e100');
  });

  it('formats small numbers in LaTeX instead of 1e-100', () => {
    const formatted = formatResult(1e-100);
    expect(formatted).toBe('1 \\times 10^{-100}');
    expect(formatted).not.toContain('1e-100');
  });

  it('formats SciNumber in LaTeX instead of 1*10^1000', () => {
    const num = new SciNumber(1, 1000);
    const formatted = formatResult(num);
    expect(formatted).toBe('1 \\times 10^{1000}');
    expect(formatted).not.toContain('*');
    expect(formatted).not.toContain('1e+1000');
  });

  it('formats strings with exponential notation into LaTeX', () => {
    expect(formatResult('1e+100')).toBe('1 \\times 10^{100}');
    expect(formatResult('1*10^1000')).toBe('1 \\times 10^{1000}');
  });

  it('formats complex numbers correctly', () => {
    expect(formatResult(new Complex(0, -1))).toBe('-i');
    expect(formatResult(new Complex(0, 1))).toBe('i');
    expect(formatResult(new Complex(3, 4))).toBe('3 + 4i');
    expect(formatResult(new Complex(3, -4))).toBe('3 - 4i');
  });

  it('formats matrices in LaTeX pmatrix syntax', () => {
    const matrix = new MatrixValue([
      [1, 2],
      [3, 4],
    ]);
    expect(formatResult(matrix)).toBe('\\begin{pmatrix}1 & 2 \\\\ 3 & 4\\end{pmatrix}');
  });

  it('formats integers and decimals cleanly', () => {
    expect(formatResult(42)).toBe('42');
    expect(formatResult(2.5)).toBe('2.5');
    expect(formatResult(0)).toBe('0');
  });
});
