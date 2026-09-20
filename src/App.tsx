/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LatexInput, useLatexEvaluation } from '@latex-math/react';
import { parseLatex } from '@latex-math/core';

export default function App() {
  const [value, setValue] = useState('\\frac{2}{3} + \\int_0^2 x^2 \\, dx');

  // Let's provide some variables
  const variables = {
    x: 10,
    y: 5
  };

  const { result, error } = useLatexEvaluation(value, variables);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center rounded-xl shadow-sm text-xl font-bold">
              Σ
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              LaTeX Math Engine
            </h1>
          </div>
          <p className="text-neutral-600 text-lg leading-relaxed max-w-2xl">
            A production-ready TypeScript mathematical evaluation engine for LaTeX.
            Parses raw LaTeX strings into a typed AST and robustly evaluates them.
          </p>
        </header>

        <section className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Interactive Playground
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700">
                  Math Input:
                </label>
              </div>

              <LatexInput
                value={value}
                variables={variables}
                onChange={setValue}
                showKeyboard={false}
                showMenu={false}
                showLatexBadge={false}
                showToolbar={false}
              />

              <div className="p-4 rounded-xl border bg-neutral-900 text-white flex items-center justify-between shadow-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Evaluated Result
                </span>
                <div className="text-xl font-mono font-bold">
                  {error ? (
                    <span className="text-red-400 font-sans text-sm">Error: {error}</span>
                  ) : (
                    <span className="text-emerald-400">= {result !== null ? result : '—'}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 pt-4">

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Features Supported</h3>
                <ul className="text-sm text-neutral-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Arithmetic & Implicit mult
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Calculus (Integrals, Derivatives)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Matrices & Operations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Complex Numbers
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Active Variables</h3>
                <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-100 font-mono text-sm text-neutral-600 space-y-1">
                  <div>x = 10</div>
                  <div>y = 5</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
           <h2 className="text-lg font-semibold">AST Explorer</h2>
           <div className="bg-neutral-900 rounded-lg p-4 overflow-x-auto">
             <pre className="text-xs text-neutral-300 font-mono">
               {(() => {
                 try {
                   return JSON.stringify(parseLatex(value), null, 2);
                 } catch (e: any) {
                   return e.message;
                 }
               })()}
             </pre>
           </div>
        </section>
      </div>
    </div>
  );
}
