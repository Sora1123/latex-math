export class LatexParseError extends Error {
  constructor(message: string, public position?: number, public token?: string) {
    super(message);
    this.name = 'LatexParseError';
  }
}

export class LatexTokenError extends Error {
  constructor(message: string, public position?: number) {
    super(message);
    this.name = 'LatexTokenError';
  }
}

export class EvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EvaluationError';
  }
}

export class UnsupportedExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedExpressionError';
  }
}

export class DimensionMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DimensionMismatchError';
  }
}

export class UndefinedVariableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UndefinedVariableError';
  }
}

export class DivisionByZeroError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DivisionByZeroError';
  }
}
