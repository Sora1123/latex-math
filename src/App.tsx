/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LatexInput, useLatexEvaluation } from '@latex-math/react';
import { parseLatex } from '@latex-math/core';

export default function App() {
  const [value, setValue] = useState('\\frac{2}{3} + \\int_0^2 x^2 \\, dx');
  const [theme, setTheme] = useState<'default' | 'amber' | 'dark' | 'indigo' | 'emerald'>('default');

  const themes = {
    default: {
      name: 'Default',
      input: 'border-neutral-200 hover:border-neutral-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 text-lg',
      result: '',
    },
    amber: {
      name: 'Warm Amber',
      input: 'bg-amber-50/90 border-amber-300 text-amber-950 text-lg',
      result: 'bg-amber-200/90 text-amber-900 border-amber-400',
    },
    dark: {
      name: 'Slate Dark',
      input: 'bg-neutral-900 text-white border-neutral-700 shadow-md text-lg',
      result: 'bg-neutral-800 text-neutral-100 border-neutral-700',
    },
    indigo: {
      name: 'Indigo & Accent',
      input: 'bg-indigo-50/70 border-indigo-200 text-indigo-950 text-lg',
      result: 'bg-indigo-600 text-white border-indigo-700',
    },
    emerald: {
      name: 'Mint Emerald',
      input: 'bg-emerald-50/70 border-emerald-300 text-emerald-950 text-lg',
      result: 'bg-emerald-600 text-white border-emerald-700',
    },
  };

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
          <div className="p-6 border-b border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Interactive Playground
            </h2>
            {/* Background / Style test switcher */}
            <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-lg">
              <span className="text-xs font-semibold text-neutral-500 px-1.5 select-none">
                Style:
              </span>
              {(Object.keys(themes) as Array<keyof typeof themes>).map((tKey) => (
                <button
                  key={tKey}
                  type="button"
                  onClick={() => setTheme(tKey)}
                  className={`px-2.5 py-0.5 text-xs font-medium rounded-md transition cursor-pointer ${
                    theme === tKey
                      ? "bg-white text-neutral-900 shadow-2xs font-semibold"
                      : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  {themes[tKey].name}
                </button>
              ))}
            </div>
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
                inputWrapperClassName={themes[theme].input}
                resultClassName={themes[theme].result}
              />
            </div>

            {/* Quick Test Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Quick Test Expressions:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "2/3 + 1/3 (yields 1)", expr: "\\frac{2}{3} + \\frac{1}{3}" },
                  { label: "e^{iπ} (yields -1)", expr: "e^{i\\pi}" },
                  { label: "10^100 (LaTeX 10¹⁰⁰)", expr: "10^{100}" },
                  { label: "10^1000 (LaTeX 10¹⁰⁰⁰)", expr: "10^{1000}" },
                  { label: "10^-1000 (scientific notation)", expr: "1 \\cdot 10^{-1000}" },
                  { label: "∫ x dx + 2 (yields 2.5)", expr: "\\int_0^1 x \\, dx + 2" },
                  { label: "∫ x² dx (yields 2.666666667)", expr: "\\int_0^2 x^2 \\, dx" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setValue(item.expr)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
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
