# @latex-math

A production-quality open-source TypeScript library that parses LaTeX mathematical expressions into a typed mathematical AST and evaluates them.

## Overview

This monorepo contains:
- `@latex-math/core`: The core parsing, mathematical AST, evaluation, simplification, and substitution logic.
- `@latex-math/react`: A set of React components (e.g. `MathInput`) to easily drop LaTeX parsing into web applications.

## Getting Started

```ts
import { parseLatex, evaluateLatex } from '@latex-math/core';

// 1. Parsing to AST
const ast = parseLatex('\\frac{2x^2+3x-2}{x-1}');
console.log(ast); // Mathematical AST structure

// 2. Direct Evaluation
const result = evaluateLatex(ast, {
  variables: {
    x: 2
  }
});
console.log(result); // 12
```

## Compatibility Table

| LaTeX feature     | Supported |
|-------------------|-----------|
| Arithmetic        | Yes       |
| Fractions         | Yes       |
| Roots             | Yes       |
| Powers            | Yes       |
| Trig              | Yes       |
| Matrices          | Yes       |
| Complex numbers   | Yes       |
| Integrals         | Numeric   |
| Limits            | No        |
| Summations        | Yes       |

## Supported Syntax

- **Arithmetic & Algebra**: Standard operators (`+`, `-`, `*`, `/`), implicit multiplication (`2x`), fractions (`\frac`), powers (`^`), roots (`\sqrt`).
- **Calculus**: Symbolic differentiation (`\frac{d}{dx} x^2`), numeric integration (`\int_0^1 x^2 \, dx`). Symbolic integration throws an explicit unsupported error pending a CAS engine.
- **Matrices**: Standard operations (+, *, determinant, transpose, inverse) on matrix environments (`\begin{pmatrix} ... \end{pmatrix}`).
- **Complex Numbers**: Support for the imaginary unit `i` (`1 + 2i`) and exponential relations (`e^{i\pi}`).
- **Equations**: Parse comparison operators (`=`, `<`, `>`, `\leq`, `\geq`).
- **Combinatorics**: Parses binomial forms (`\binom{n}{k}`) and factorials (`n!`).
- **Absolute Values**: Support for explicit logic via `|x|` and `\left| x \right|`.

## Architecture & AST

We use a custom, recursive descent parser optimized specifically for mathematical LaTeX. It bypasses the complexity of a full LaTeX typesetting parser to guarantee a strictly-typed, domain-specific AST (`Expression`), completely avoiding unsafe paradigms like `eval()` or `Function()`.

The AST nodes are structurally rigid and exposed statically:
```ts
export type Expression =
  | NumberNode
  | VariableNode
  | ConstantNode
  | BinaryOperationNode
  | UnaryOperationNode
  | FunctionNode
  | FractionNode
  | PowerNode
  | RootNode
  | AbsoluteValueNode
  | MatrixNode
  | EquationNode
  | SummationNode
  | IntegralNode
  | DerivativeNode
  | FactorialNode
  | CombinatoricsNode;
```

## Security Model

`@latex-math` does not utilize `eval()`, `new Function()`, or execute any parsed input natively in JavaScript engines. The parser runs via a safe deterministic finite automaton tokenizer feeding into a hand-rolled recursive descent layer. Arbitrary XSS code execution via malformed mathematical strings is structurally mitigated.

## Limitations

Currently, full CAS (Computer Algebra System) functionalities such as algebraic expansion, symbolic factorization, and symbolic integration are structurally typed and exposed by signature, but strictly throw `UnsupportedExpressionError`s as building a reliable internal CAS extends beyond the immediate computational bounds of a mathematical evaluation parser.

