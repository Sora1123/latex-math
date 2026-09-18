export interface FactorialNode {
  type: 'Factorial';
  operand: Expression;
}

export interface CombinatoricsNode {
  type: 'Combinatorics';
  n: Expression;
  k: Expression;
}

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

export interface NumberNode {
  type: 'Number';
  value: number;
}

export interface VariableNode {
  type: 'Variable';
  name: string;
}

export interface ConstantNode {
  type: 'Constant';
  name: string;
}

export interface BinaryOperationNode {
  type: 'BinaryOperation';
  operator: '+' | '-' | '*' | '/';
  left: Expression;
  right: Expression;
  implicit?: boolean; // For implicit multiplication
}

export interface UnaryOperationNode {
  type: 'UnaryOperation';
  operator: '+' | '-';
  operand: Expression;
}

export interface FunctionNode {
  type: 'Function';
  name: string;
  args: Expression[];
}

export interface FractionNode {
  type: 'Fraction';
  numerator: Expression;
  denominator: Expression;
}

export interface PowerNode {
  type: 'Power';
  base: Expression;
  exponent: Expression;
}

export interface RootNode {
  type: 'Root';
  radicand: Expression;
  index: Expression; // e.g. 2 for sqrt, 3 for cbrt
}

export interface AbsoluteValueNode {
  type: 'AbsoluteValue';
  expression: Expression;
}

export interface MatrixNode {
  type: 'Matrix';
  rows: Expression[][];
}

export interface EquationNode {
  type: 'Equation';
  operator: '=' | '<' | '>' | '<=' | '>=';
  left: Expression;
  right: Expression;
}

export interface SummationNode {
  type: 'Summation';
  indexVariable: string;
  lowerBound: Expression;
  upperBound: Expression;
  expression: Expression;
}

export interface IntegralNode {
  type: 'Integral';
  variable: string;
  lowerBound: Expression | null;
  upperBound: Expression | null;
  expression: Expression;
}

export interface DerivativeNode {
  type: 'Derivative';
  variable: string;
  expression: Expression;
}
