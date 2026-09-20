import React, { useState, useEffect } from 'react';
import { parseLatex, evaluateLatex, EvaluationError, LatexParseError } from '@latex-math/core';
import { formatResult } from './useLatexEvaluation.js';

export * from './LatexExpression.js';
export * from './LatexInput.js';
export * from './useLatexEvaluation.js';

export interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  variables?: Record<string, any>;
}

export const MathInput: React.FC<MathInputProps> = ({ value, onChange, className, variables }) => {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value.trim()) {
      setResult(null);
      setError(null);
      return;
    }
    
    try {
      const ast = parseLatex(value);
      const res = evaluateLatex(ast, { variables });
      setResult(formatResult(res, 10));
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setResult(null);
    }
  }, [value, variables]);

  return (
    <div className={`flex flex-col gap-1 ${className || ''}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
        placeholder="Enter LaTeX expression... e.g. \frac{1}{2} + 3"
      />
      <div className="text-sm min-h-[20px]">
        {error ? (
          <span className="text-red-500 font-medium">Error: {error}</span>
        ) : result !== null ? (
          <span className="text-emerald-600 font-medium">= {result}</span>
        ) : null}
      </div>
    </div>
  );
};
