/**
 * Normalizes LaTeX expressions to make ambiguous or unbraced arguments explicit.
 * In standard TeX macro syntax, commands take single tokens as arguments when braces
 * are omitted. For instance:
 *   \sqrt 1+2  -> \sqrt{1} + 2
 *   \frac12    -> \frac{1}{2}
 *   \frac 1 2  -> \frac{1}{2}
 *   \binom42   -> \binom{4}{2}
 *   \sqrt[3]8  -> \sqrt[3]{8}
 */
export function normalizeLatex(input: string): string {
  if (!input || typeof input !== 'string') return '';

  input = input
    .replace(/\\dx(?![a-zA-Z])/g, ' \\, dx ')
    .replace(/\\dy(?![a-zA-Z])/g, ' \\, dy ')
    .replace(/\\dt(?![a-zA-Z])/g, ' \\, dt ')
    .replace(/\\differentialD(?![a-zA-Z])/g, ' d ')
    .replace(/\\mathrm\{([a-zA-Z]+)\}/g, '$1');

  let i = 0;

  function skipWhitespace(): void {
    while (i < input.length && /\s/.test(input[i])) {
      i++;
    }
  }

  function readGroupOrToken(): string {
    skipWhitespace();
    if (i >= input.length) return '';

    // If braced group, extract full group and recursively normalize inside
    if (input[i] === '{') {
      let depth = 1;
      const start = i;
      i++;
      while (i < input.length && depth > 0) {
        if (input[i] === '{') depth++;
        else if (input[i] === '}') depth--;
        i++;
      }
      const inner = input.slice(start + 1, i - 1);
      return `{${normalizeLatex(inner)}}`;
    }

    // If LaTeX command (e.g. \pi, \alpha, etc.)
    if (input[i] === '\\') {
      const start = i;
      i++;
      if (i < input.length && /^[\\,;!:]$/.test(input[i])) {
        i++;
      } else {
        while (i < input.length && /[a-zA-Z]/.test(input[i])) {
          i++;
        }
      }
      const cmd = input.slice(start, i);
      return `{${cmd}}`;
    }

    // Single character token (digit, variable letter, etc.)
    const char = input[i];
    i++;
    return `{${char}}`;
  }

  let result = '';

  while (i < input.length) {
    // Check for \sqrt
    if (input.startsWith('\\sqrt', i) && (i + 5 === input.length || !/[a-zA-Z]/.test(input[i + 5]))) {
      result += '\\sqrt';
      i += 5;
      skipWhitespace();

      // Optional [index] for root
      if (i < input.length && input[i] === '[') {
        const bracketStart = i;
        while (i < input.length && input[i] !== ']') i++;
        if (i < input.length) i++; // consume ']'
        const innerBracket = input.slice(bracketStart + 1, i - 1);
        result += `[${normalizeLatex(innerBracket)}]`;
      }

      skipWhitespace();
      const hadExplicitBrace = i < input.length && input[i] === '{';
      const arg = readGroupOrToken();
      result += arg;

      if (!hadExplicitBrace && i < input.length && /[+\-*\/=]/.test(input[i])) {
        const op = input[i];
        i++;
        skipWhitespace();
        result += ` ${op} `;
      }
      continue;
    }

    // Check for \frac
    if (input.startsWith('\\frac', i) && (i + 5 === input.length || !/[a-zA-Z]/.test(input[i + 5]))) {
      result += '\\frac';
      i += 5;
      skipWhitespace();
      const hadExplicitBrace = i < input.length && input[i] === '{';
      const num = readGroupOrToken();
      const den = readGroupOrToken();
      result += num + den;

      if (!hadExplicitBrace && i < input.length && /[+\-*\/=]/.test(input[i])) {
        const op = input[i];
        i++;
        skipWhitespace();
        result += ` ${op} `;
      }
      continue;
    }

    // Check for \binom
    if (input.startsWith('\\binom', i) && (i + 6 === input.length || !/[a-zA-Z]/.test(input[i + 6]))) {
      result += '\\binom';
      i += 6;
      skipWhitespace();
      const n = readGroupOrToken();
      const k = readGroupOrToken();
      result += n + k;
      continue;
    }

    result += input[i];
    i++;
  }

  return result;
}
