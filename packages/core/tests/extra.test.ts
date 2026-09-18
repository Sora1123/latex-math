import { describe, it, expect } from 'vitest';
import { parseLatex } from '../src/parser/index.js';
import { evaluateLatex } from '../src/evaluator/index.js';

describe('Extra Features', () => {
  it('evaluates summation correctly', () => {
    const val = evaluateLatex('\\sum_{n=1}^{10} n');
    expect(val).toBe(55);
  });
  
  it('snaps floating point inaccuracies for trig functions', () => {
    const val = evaluateLatex('\\sin(\\pi)');
    expect(val).toBe(0); // rather than 1.22e-16
  });
});
