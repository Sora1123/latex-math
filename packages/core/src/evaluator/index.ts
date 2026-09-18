import { Expression } from '../ast/index.js';
import { parseLatex } from '../parser/index.js';
import { MathValue, mathAdd, mathSub, mathMul, mathDiv, mathPow, Complex, MatrixValue } from '../math/index.js';
import { EvaluationError, DimensionMismatchError, DivisionByZeroError, UndefinedVariableError } from '../errors/index.js';

export interface EvalOptions {
  variables?: Record<string, MathValue>;
}

export function evaluateLatex(input: string | Expression, options: EvalOptions = {}): MathValue {
  let ast: Expression;
  if (typeof input === 'string') {
    ast = parseLatex(input);
  } else {
    ast = input;
  }

  return evaluate(ast, options);
}

function cleanFloat(val: number): number {
  return Math.abs(val) < 1e-14 ? 0 : val;
}

export function evaluate(node: Expression, options: EvalOptions = {}): MathValue {
  switch (node.type) {
    case 'Number':
      return node.value;
    
    case 'Variable': {
      const val = options.variables?.[node.name];
      if (val === undefined) {
        throw new EvaluationError(`Undefined variable: ${node.name}`);
      }
      return val;
    }

    case 'Constant': {
      if (node.name === 'pi') return Math.PI;
      if (node.name === 'e') return Math.E;
      if (node.name === 'i') return new Complex(0, 1);
      throw new EvaluationError(`Unknown constant: ${node.name}`);
    }
    
    case 'BinaryOperation': {
      const left = evaluate(node.left, options);
      const right = evaluate(node.right, options);
      switch (node.operator) {
        case '+': return mathAdd(left, right);
        case '-': return mathSub(left, right);
        case '*': return mathMul(left, right);
        case '/': return mathDiv(left, right);
        default:
          throw new EvaluationError(`Unknown operator: ${(node as any).operator}`);
      }
    }

    case 'UnaryOperation': {
      const operand = evaluate(node.operand, options);
      if (node.operator === '-') {
        if (typeof operand === 'number') return -operand;
        if (operand instanceof Complex) return new Complex(-operand.re, -operand.im);
        throw new EvaluationError('Unary minus not implemented for this type');
      }
      if (node.operator === '+') return operand;
      throw new EvaluationError(`Unknown unary operator: ${(node as any).operator}`);
    }

    case 'Fraction': {
      const num = evaluate(node.numerator, options);
      const den = evaluate(node.denominator, options);
      return mathDiv(num, den);
    }

    case 'Power': {
      const base = evaluate(node.base, options);
      const exponent = evaluate(node.exponent, options);
      return mathPow(base, exponent);
    }

    case 'Root': {
      const index = evaluate(node.index, options);
      const radicand = evaluate(node.radicand, options);
      if (typeof index === 'number' && typeof radicand === 'number') {
        if (index % 2 === 0 && radicand < 0) {
          throw new EvaluationError('Even root of negative number');
        }
        if (radicand < 0) {
          return -Math.pow(-radicand, 1 / index);
        }
        return Math.pow(radicand, 1 / index);
      }
      throw new EvaluationError('Root not implemented for complex/matrices');
    }

    case 'Function': {
      const arg = evaluate(node.args[0], options);
      
      if (node.name === 'det' || node.name === 'transpose') {
        if (!(arg instanceof MatrixValue)) throw new EvaluationError(`${node.name} requires a matrix`);
        if (node.name === 'det') return arg.det();
        return arg.transpose();
      }

      if (node.name === 'arg') {
        if (arg instanceof Complex) return Math.atan2(arg.im, arg.re);
        if (typeof arg === 'number') return arg >= 0 ? 0 : Math.PI;
        throw new EvaluationError(`arg requires a number or complex number`);
      }

      if (typeof arg !== 'number') {
        throw new EvaluationError(`Function ${node.name} not implemented for complex/matrices`);
      }
      switch(node.name) {
        case 'sin': return cleanFloat(Math.sin(arg));
        case 'cos': return cleanFloat(Math.cos(arg));
        case 'tan': return cleanFloat(Math.tan(arg));
        case 'arcsin': return cleanFloat(Math.asin(arg));
        case 'arccos': return cleanFloat(Math.acos(arg));
        case 'arctan': return cleanFloat(Math.atan(arg));
        case 'ln': return cleanFloat(Math.log(arg));
        case 'log': return cleanFloat(Math.log10(arg));
        case 'exp': return cleanFloat(Math.exp(arg));
        default: throw new EvaluationError(`Unknown function: ${node.name}`);
      }
    }

    case 'AbsoluteValue': {
      const val = evaluate(node.expression, options);
      if (typeof val === 'number') return Math.abs(val);
      if (val instanceof Complex) return Math.sqrt(val.re * val.re + val.im * val.im);
      throw new EvaluationError('Absolute value not implemented for matrices');
    }

    case 'Matrix': {
      const evaluatedRows = node.rows.map(row => 
        row.map(cell => evaluate(cell, options))
      );
      return new MatrixValue(evaluatedRows);
    }

    case 'Derivative': {
      throw new EvaluationError("Cannot numerically evaluate symbolic derivative. Use simplify(differentiate(ast, var)) instead.");
    }

    case 'Summation': {
      const lowerBound = evaluate(node.lowerBound, options);
      const upperBound = evaluate(node.upperBound, options);
      if (typeof lowerBound !== 'number' || typeof upperBound !== 'number') {
         throw new EvaluationError("Summation bounds must be real numbers");
      }
      let sum = 0;
      for (let i = lowerBound; i <= upperBound; i++) {
        const iterOptions = { ...options, variables: { ...options?.variables, [node.indexVariable]: i } };
        const val = evaluate(node.expression, iterOptions);
        if (typeof val !== 'number') {
          throw new EvaluationError("Summation body must evaluate to a real number");
        }
        sum += val;
      }
      return cleanFloat(sum);
    }
    case 'Integral': {
      if (node.lowerBound && node.upperBound) {
        const a = evaluate(node.lowerBound, options);
        const b = evaluate(node.upperBound, options);
        if (typeof a !== 'number' || typeof b !== 'number') throw new EvaluationError("Integral bounds must be real numbers");
        
        const steps = 1000;
        const h = (b - a) / steps;
        let sum = 0;
        for (let i = 0; i <= steps; i++) {
          const x = a + i * h;
          const val = evaluate(node.expression, { ...options, variables: { ...options?.variables, [node.variable]: x } });
          if (typeof val !== 'number') throw new EvaluationError("Integrand must evaluate to real number");
          const weight = (i === 0 || i === steps) ? 1 : (i % 2 === 0 ? 2 : 4);
          sum += weight * val;
        }
        return (sum * h) / 3;
      }
      throw new EvaluationError("Cannot numerically evaluate indefinite integral");
    }

    default:
      throw new EvaluationError(`Unsupported evaluation for node type: ${(node as any).type}`);
  }
}
