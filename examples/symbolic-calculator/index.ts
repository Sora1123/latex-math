import { parseLatex, simplify, substitute, toLatex, expand, factor } from '@latex-math/core';

const ast = parseLatex('\\frac{x^2 - 1}{x - 1}');
const simplified = simplify(ast);

console.log('Simplified:', toLatex(simplified));
// Further calls to expand() and factor() can be made here as they mature.
