# @latex-math/react

Interactive React components and hooks for math input, live rendering, and real-time LaTeX evaluation. Powered by `@latex-math/core` and MathLive.

[![npm version](https://img.shields.io/npm/v/@latex-math/react.svg)](https://www.npmjs.com/package/@latex-math/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Features

- 🧮 **Interactive `LatexInput`**: Visual, WYSIWYG math editing powered by MathLive. Supports keyboard shortcuts (`/` for fractions, `^` for powers), symbol toolbars, and instant copy buttons.
- 🔄 **TeX Auto-Normalization**: Visual indicators and automatic correction for unbraced syntax (e.g. typing `\sqrt 1+2` prompts or normalizes to `\sqrt{1} + 2`).
- ✍️ **Fast Rendering (`LatexExpression`)**: Built-in KaTeX equation renderer for display and inline mathematical formulas.
- 🎣 **Evaluation Hook (`useLatexEvaluation`)**: Reactive hook that parses and evaluates mathematical LaTeX on the fly with custom variable scopes and error boundaries.

---

## Installation

Install both `@latex-math/react` and `@latex-math/core`:

```bash
npm install @latex-math/react @latex-math/core
```

```bash
yarn add @latex-math/react @latex-math/core
# or
pnpm add @latex-math/react @latex-math/core
```

### CSS Import (Required for Math Formulas)

Import KaTeX styles in your root layout or application entry (`layout.tsx`, `_app.tsx`, or `main.tsx`):

```tsx
import "@latex-math/react/dist/index.css";
// or
import "katex/dist/katex.min.css";
```

### Using with Next.js & Tailwind CSS

1. **Client Component**:
Because `<LatexInput />` interacts with the browser's custom element DOM, ensure your component has the `"use client"` directive at the top:
```tsx
"use client";
import { LatexInput } from '@latex-math/react';
```

2. **Tailwind CSS Configuration**:
To ensure Tailwind compiles the utility classes used inside `@latex-math/react`, add the package to your `tailwind.config.js`:
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@latex-math/react/**/*.{js,mjs,cjs}", // <-- Add this line
  ],
  // ...
};
```
*(Or in Tailwind v4 `globals.css`: `@source "../node_modules/@latex-math/react";`)*

---

## Quick Start

### 1. `LatexInput` (WYSIWYG Math Editor)

```tsx
import React, { useState } from 'react';
import { LatexInput } from '@latex-math/react';

export function MathEditor() {
  const [latex, setLatex] = useState('\\frac{a}{b} + \\sqrt{x}');

  return (
    <div className="max-w-xl mx-auto p-4">
      <LatexInput
        value={latex}
        onChange={setLatex}
        placeholder="Type math..."
        showToolbar={true}
        showLatexBadge={true}
      />
    </div>
  );
}
```

### 2. `LatexExpression` (Math Display)

Render static or dynamic mathematical expressions with KaTeX:

```tsx
import React from 'react';
import { LatexExpression } from '@latex-math/react';

export function EquationDisplay() {
  return (
    <div>
      {/* Display block */}
      <LatexExpression expression="\int_{0}^{\infty} e^{-x^2} \, dx = \frac{\sqrt{\pi}}{2}" displayMode={true} />

      {/* Inline math */}
      <p>
        The quadratic formula is <LatexExpression expression="x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}" displayMode={false} />.
      </p>
    </div>
  );
}
```

### 3. `useLatexEvaluation` (Real-Time Evaluation Hook)

```tsx
import React, { useState } from 'react';
import { LatexInput, useLatexEvaluation } from '@latex-math/react';

export function Calculator() {
  const [latex, setLatex] = useState('2x^2 + 3x - 5');

  const { result, error, isEvaluating } = useLatexEvaluation(latex, {
    variables: { x: 3 }
  });

  return (
    <div className="space-y-4">
      <LatexInput value={latex} onChange={setLatex} />

      {isEvaluating && <p>Evaluating...</p>}
      {error && <p className="text-red-500">Error: {error.message}</p>}
      {result !== null && (
        <div className="font-semibold text-lg">
          Result for x = 3: {result.toString()}
        </div>
      )}
    </div>
  );
}
```

---

## Component API

### `<LatexInput />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | *(required)* | Current LaTeX string value |
| `onChange` | `(value: string) => void` | *(required)* | Callback fired when the expression changes |
| `variables` | `Record<string, number>` | `{}` | Variable scope for live evaluation |
| `placeholder` | `string` | `"\text{Type math... }"` | Placeholder displayed inside empty math field |
| `showToolbar` | `boolean` | `true` | Displays quick math buttons (fractions, powers, roots, calculus, trig) |
| `showLatexBadge` | `boolean` | `true` | Displays bottom bar showing the underlying LaTeX string and copy action |
| `showEvaluatedResult` | `boolean` | `true` | Shows evaluated answer in the bottom-right corner of the input box |
| `showKeyboard` | `boolean` | `true` | Controls whether the virtual keyboard toggle button is visible/active |
| `showMenu` | `boolean` | `true` | Controls whether the MathLive contextual menu toggle button is visible |
| `fontsDirectory` | `string` | `CDN` | Directory URL for MathLive fonts (defaults to official unpkg CDN) |
| `className` | `string` | `""` | Root container styling class |
| `inputWrapperClassName` | `string` | `""` | Math input box styling class (supports custom `bg-*`, `border-*`, `text-*`, `rounded-*`) |
| `mathFieldClassName` | `string` | `""` | Alias for `inputWrapperClassName` (combined onto the same math input box) |
| `mathFieldContainerClassName` | `string` | `""` | Backwards-compatible alias for `inputWrapperClassName` |
| `resultClassName` | `string` | `""` | Evaluated result badge styling (supports custom `bg-*`, `text-*`, `border-*`, and corner positioning) |

### `<LatexExpression />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `expression` | `string` | *(required)* | The LaTeX string to render |
| `displayMode` | `boolean` | `true` | Whether to render as centered display mode (`true`) or inline (`false`) |
| `output` | `"html"` \| `"htmlAndMathml"` \| `"mathml"` | `"html"` | Markup output format (defaults to `"html"` to avoid duplicate MathML rendering) |
| `className` | `string` | `""` | Additional CSS class names |

### `useLatexEvaluation(expression, options)`

```typescript
const { result, ast, error, isEvaluating } = useLatexEvaluation(expression, {
  variables: { x: 4, y: 10 }
});
```

- **`expression`**: `string` - The LaTeX formula to evaluate.
- **`options.variables`**: `Record<string, number>` - Optional variable values.
- **`result`**: Computed number, matrix, or null.
- **`ast`**: The parsed `@latex-math/core` AST node.
- **`error`**: Evaluation or parsing error if invalid.

---

## License

MIT © [Sora1123](https://github.com/Sora1123)
