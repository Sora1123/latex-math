import { useState, useEffect } from 'react';
import { parseLatex, evaluateLatex } from '@latex-math/core';

export interface UseLatexEvaluationResult {
  result: any;
  error: string | null;
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
      
      if (typeof res === 'number') setResult(res.toPrecision(10));
      else if (res && typeof res === 'object' && 're' in res) setResult(`${(res as any).re} + ${(res as any).im}i`);
      else if (res && typeof res === 'object' && 'rows' in res) setResult(`Matrix[${(res as any).rows.length}x${(res as any).rows[0].length}]`);
      else setResult(String(res));
      
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setResult(null);
    }
  }, [expression, variables]);

  return { result, error };
}
