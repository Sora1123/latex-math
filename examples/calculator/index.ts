import { parseLatex, evaluateLatex } from '@latex-math/core';

const ast = parseLatex('\\frac{2x^2+3x-2}{x-1}');
const result = evaluateLatex(ast, { variables: { x: 2 } });
console.log('Result:', result);
