import { useState, useEffect } from 'react';
import { parseLatex, evaluateLatex } from '@latex-math/core';

export interface UseLatexEvaluationResult {
  result: any;
  error: string | null;
}

export function formatResult(res: any, sigFigs: number = 10): string {
  if (res === null || res === undefined) return '';
  if (typeof res === 'string') return res;

  if (res && (res.isSciNumber || (typeof res.toString === 'function' && res.constructor?.name === 'SciNumber'))) {
    return res.toString(sigFigs);
  }

  if (typeof res === 'number') {
    if (res === 0 || Math.abs(res) < 1e-14) return '0';
    if (Number.isInteger(res)) return res.toString();
    const str = res.toPrecision(sigFigs);
    if (str.includes('e')) {
      const [mantissa, exp] = str.split('e');
      const cleanM = parseFloat(mantissa).toString();
      const expNum = parseInt(exp, 10);
      return `${cleanM} * 10^${expNum}`;
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
    return `[${res.rows.map((row: any[]) => `[${row.map(v => formatResult(v, sigFigs)).join(', ')}]`).join(', ')}]`;
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
