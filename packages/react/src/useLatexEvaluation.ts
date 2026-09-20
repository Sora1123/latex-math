import { useState, useEffect } from 'react';
import { parseLatex, evaluateLatex } from '@latex-math/core';

export interface UseLatexEvaluationResult {
  result: any;
  error: string | null;
}

export function formatResult(res: any, sigFigs: number = 10): string {
  if (res === null || res === undefined) return '';
  if (typeof res === 'string') {
    const sciMatch = res.match(/^([+-]?\d+(?:\.\d+)?)[eE]([+-]?\d+)$/);
    if (sciMatch) {
      const m = parseFloat(sciMatch[1]).toString();
      const exp = parseInt(sciMatch[2], 10);
      return `${m} \\times 10^{${exp}}`;
    }
    const starMatch = res.match(/^([+-]?\d+(?:\.\d+)?)\s*\*\s*10\^\{?([+-]?\d+)\}?$/);
    if (starMatch) {
      const m = parseFloat(starMatch[1]).toString();
      const exp = parseInt(starMatch[2], 10);
      return `${m} \\times 10^{${exp}}`;
    }
    return res;
  }

  if (res && (res.isSciNumber || (typeof res.toString === 'function' && res.constructor?.name === 'SciNumber'))) {
    if (typeof res.toLatex === 'function') {
      return res.toLatex(sigFigs);
    }
    const m = res.mantissa;
    const exp = res.exponent;
    if (m === 0) return '0';
    const mStr = parseFloat(m.toPrecision(sigFigs)).toString();
    if (exp === 0) return mStr;
    return `${mStr} \\times 10^{${exp}}`;
  }

  if (typeof res === 'number') {
    if (res === 0) return '0';
    if (!isFinite(res)) return res > 0 ? '\\infty' : '-\\infty';
    if (isNaN(res)) return '\\text{NaN}';

    const numStr = res.toString();
    if (numStr.includes('e') || numStr.includes('E')) {
      const [mantissa, exp] = numStr.toLowerCase().split('e');
      const cleanM = parseFloat(mantissa).toString();
      const expNum = parseInt(exp, 10);
      return `${cleanM} \\times 10^{${expNum}}`;
    }

    if (Number.isInteger(res)) return res.toString();

    const str = res.toPrecision(sigFigs);
    if (str.includes('e') || str.includes('E')) {
      const [mantissa, exp] = str.toLowerCase().split('e');
      const cleanM = parseFloat(mantissa).toString();
      const expNum = parseInt(exp, 10);
      return `${cleanM} \\times 10^{${expNum}}`;
    }
    return parseFloat(str).toString();
  }

  if (res && typeof res === 'object' && 're' in res && 'im' in res) {
    let re = res.re;
    let im = res.im;
    if (Math.abs(re) < 1e-14) re = 0;
    if (Math.abs(im) < 1e-14) im = 0;

    if (im === 0) return formatResult(re, sigFigs);
    if (re === 0) {
      if (im === 1) return 'i';
      if (im === -1) return '-i';
      return `${formatResult(im, sigFigs)}i`;
    }

    const reStr = formatResult(re, sigFigs);
    if (im < 0) {
      const imStr = im === -1 ? '' : formatResult(-im, sigFigs);
      return `${reStr} - ${imStr}i`;
    } else {
      const imStr = im === 1 ? '' : formatResult(im, sigFigs);
      return `${reStr} + ${imStr}i`;
    }
  }

  if (res && typeof res === 'object' && 'rows' in res && Array.isArray(res.rows)) {
    return `\\begin{pmatrix}${res.rows.map((row: any[]) => row.map(v => formatResult(v, sigFigs)).join(' & ')).join(' \\\\ ')}\\end{pmatrix}`;
  }

  return String(res);
}

export function useLatexEvaluation(
  expression: string,
  variables?: Record<string, any>
): UseLatexEvaluationResult {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!expression.trim()) {
      setResult(null);
      setError(null);
      return;
    }

    try {
      const ast = parseLatex(expression);
      const res = evaluateLatex(ast, { variables });
      setResult(formatResult(res, 10));
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setResult(null);
    }
  }, [expression, variables]);

  return { result, error };
}
