# @latex-math/core

A robust, lightweight TypeScript library that parses LaTeX mathematical expressions into a strictly typed Abstract Syntax Tree (AST), evaluates mathematical values, simplifies expressions, and supports symbolic calculus.

Zero dependencies for the core runtime. Built without unsafe dynamic code execution (`eval` or `Function()`).

[![npm version](https://img.shields.io/npm/v/@latex-math/core.svg)](https://www.npmjs.com/package/@latex-math/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Features

- 📐 **Typed Mathematical AST**: Parses mathematical LaTeX into a well-defined `Expression` AST union (fractions, roots, powers, matrices, sums, integrals, and more).
- ⚡ **Safe & Deterministic**: Hand-rolled recursive descent parser and tokenizer. Never relies on `eval()` or `new Function()`.
- 🧠 **Evaluation Engine**: Evaluates arithmetic, trigonometric functions, logarithms, binomial coefficients, summations, matrices, and complex numbers with variable scoping.
- 🔄 **TeX Macro Normalization**: Automatically resolves and normalizes unbraced TeX macros (such as `\sqrt 1+2` $\to$ `\sqrt{1} + 2`, `\frac12` $\to$ `\frac{1}{2}`).
- 📈 **Calculus Support**: Symbolic differentiation (`\frac{d}{dx}`) and numerical integration with Simpson's rule.
- 🖨️ **Printer & Simplifier**: Print AST back into clean LaTeX string representation, and perform algebraic simplifications.

---

## Installation

```bash
npm install @latex-math/core
```

```bash
yarn add @latex-math/core
# or
pnpm add @latex-math/core
```

---

## Quick Start

### 1. Parsing to AST

```typescript
import { parseLatex } from '@latex-math/core';

// Parse a LaTeX expression into a typed AST
const ast = parseLatex('\\frac{2x + 4}{2}');
console.log(ast);
```

### 2. Evaluating Expressions

```typescript
import { parseLatex, evaluateLatex } from '@latex-math/core';

// Evaluate numeric expressions
const result = evaluateLatex('\\sqrt{16} + 2^3');
console.log(result); // 12

// Evaluate with variables
const ast = parseLatex('3x^2 - 4x + 1');
const evaluated = evaluateLatex(ast, {
  variables: { x: 5 }
});
console.log(evaluated); // 56
```

### 3. Symbolic Differentiation & Calculus

```typescript
import { parseLatex, differentiate, printLatex } from '@latex-math/core';

// Differentiate an expression symbolically with respect to 'x'
const ast = parseLatex('x^3 + 4x^2 - 7x + 2');
const derivativeAst = differentiate(ast, 'x');

// Print back to LaTeX
console.log(printLatex(derivativeAst)); // 3x^2 + 8x - 7
```

### 4. Expression Simplification

```typescript
import { parseLatex, simplifyExpression, printLatex } from '@latex-math/core';

const expr = parseLatex('0 + 1 \\cdot x + 4 - 2');
const simplified = simplifyExpression(expr);

console.log(printLatex(simplified)); // x + 2
```

### 5. LaTeX Argument Normalization

Converts ambiguous or unbraced LaTeX syntax into explicit, braced TeX:

```typescript
import { normalizeLatex } from '@latex-math/core';

normalizeLatex('\\sqrt 1+2'); // "\\sqrt{1} + 2"
normalizeLatex('\\frac12');   // "\\frac{1}{2}"
normalizeLatex('\\binom42');  // "\\binom{4}{2}"
```

---

## Supported LaTeX Syntax

| Category | Examples |
|---|---|
| **Arithmetic** | `+`, `-`, `\cdot`, `\times`, `/`, `\div`, implicit multiplication (`2x`, `3\pi`) |
| **Fractions** | `\frac{a}{b}`, `\frac12` |
| **Powers & Roots** | `x^2`, `x^{2+y}`, `\sqrt{x}`, `\sqrt[3]{8}` |
| **Trigonometry** | `\sin`, `\cos`, `\tan`, `\arcsin`, `\arccos`, `\arctan`, `\csc`, `\sec`, `\cot` |
| **Logarithms** | `\ln(x)`, `\log(x)`, `\log_{10}(x)` |
| **Calculus** | `\frac{d}{dx} f(x)`, `\int_{0}^{1} x^2 \, dx` |
| **Summations** | `\sum_{n=1}^{10} n^2` |
| **Matrices** | `\begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}`, `\begin{bmatrix} ... \end{bmatrix}` |
| **Combinatorics** | `\binom{n}{k}`, `n!` |
| **Special Constants** | `\pi`, `e`, `i` (imaginary unit) |

---

## API Reference

### `parseLatex(input: string): Expression`
Parses a LaTeX math string into a typed AST. Automatically runs macro normalization.

### `evaluateLatex(expr: Expression | string, scope?: EvaluationScope): number | Matrix | Complex | boolean`
Evaluates an AST or LaTeX string. Accepts optional variable scopes:
```typescript
interface EvaluationScope {
  variables?: Record<string, number | Complex | Matrix>;
  functions?: Record<string, (...args: number[]) => number>;
}
```

### `differentiate(expr: Expression, variable?: string): Expression`
Calculates the symbolic derivative of an expression with respect to the specified variable (defaults to `'x'`).

### `simplifyExpression(expr: Expression): Expression`
Simplifies an expression using algebraic identity rules (constant folding, zero multiplication, identity element removal).

### `printLatex(expr: Expression): string`
Serializes an `Expression` AST back into a standard LaTeX string.

### `normalizeLatex(input: string): string`
Normalizes unbraced TeX macros (`\sqrt`, `\frac`, `\binom`) by wrapping implicit single tokens in braces.

---

## License

MIT © [Sora1123](https://github.com/Sora1123)
