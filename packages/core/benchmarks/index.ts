import { parseLatex } from '../src/parser/index.js'; import { evaluateLatex } from '../src/evaluator/index.js'; console.time('parse'); parseLatex('\frac{2x^2+3x-2}{x-1}'); console.timeEnd('parse');
