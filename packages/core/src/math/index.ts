export class Complex {
  constructor(public re: number, public im: number) {}
  
  add(other: Complex | number): Complex {
    if (typeof other === 'number') return new Complex(this.re + other, this.im);
    return new Complex(this.re + other.re, this.im + other.im);
  }
  
  sub(other: Complex | number): Complex {
    if (typeof other === 'number') return new Complex(this.re - other, this.im);
    return new Complex(this.re - other.re, this.im - other.im);
  }
  
  mul(other: Complex | number): Complex {
    if (typeof other === 'number') return new Complex(this.re * other, this.im * other);
    return new Complex(
      this.re * other.re - this.im * other.im,
      this.re * other.im + this.im * other.re
    );
  }
  
  div(other: Complex | number): Complex {
    if (typeof other === 'number') return new Complex(this.re / other, this.im / other);
    const denom = other.re * other.re + other.im * other.im;
    if (denom === 0) throw new Error("Division by zero in complex numbers");
    return new Complex(
      (this.re * other.re + this.im * other.im) / denom,
      (this.im * other.re - this.re * other.im) / denom
    );
  }

  exp(): Complex {
    const r = Math.exp(this.re);
    return new Complex(r * Math.cos(this.im), r * Math.sin(this.im));
  }

  ln(): Complex {
    const r = Math.sqrt(this.re * this.re + this.im * this.im);
    const theta = Math.atan2(this.im, this.re);
    return new Complex(Math.log(r), theta);
  }

  pow(other: Complex | number): Complex {
    if (typeof other === 'number') {
      if (other === 0) return new Complex(1, 0);
      if (this.re === 0 && this.im === 0) return new Complex(0, 0);
      // z^n = r^n (cos(n*theta) + i*sin(n*theta))
      const r = Math.sqrt(this.re * this.re + this.im * this.im);
      const theta = Math.atan2(this.im, this.re);
      const r_n = Math.pow(r, other);
      return new Complex(r_n * Math.cos(other * theta), r_n * Math.sin(other * theta));
    }
    
    // z^w = e^{w \ln(z)}
    if (this.re === 0 && this.im === 0) return new Complex(0, 0);
    return this.ln().mul(other).exp();
  }
}

export class MatrixValue {
  constructor(public rows: MathValue[][]) {}

  add(other: MatrixValue): MatrixValue {
    if (this.rows.length !== other.rows.length || this.rows[0].length !== other.rows[0].length) {
      throw new Error("DimensionMismatchError: Cannot add matrices of different dimensions");
    }
    const newRows = this.rows.map((row, i) => 
      row.map((val, j) => mathAdd(val, other.rows[i][j]))
    );
    return new MatrixValue(newRows);
  }

  mul(other: MatrixValue | MathValue): MatrixValue {
    if (other instanceof MatrixValue) {
      if (this.rows[0].length !== other.rows.length) {
        throw new Error("DimensionMismatchError: Invalid dimensions for matrix multiplication");
      }
      const newRows: MathValue[][] = [];
      for (let i = 0; i < this.rows.length; i++) {
        const row: MathValue[] = [];
        for (let j = 0; j < other.rows[0].length; j++) {
          let sum: MathValue = 0;
          for (let k = 0; k < this.rows[0].length; k++) {
            sum = mathAdd(sum, mathMul(this.rows[i][k], other.rows[k][j]));
          }
          row.push(sum);
        }
        newRows.push(row);
      }
      return new MatrixValue(newRows);
    } else {
      // Scalar multiplication
      const newRows = this.rows.map(row => 
        row.map(val => mathMul(val, other))
      );
      return new MatrixValue(newRows);
    }
  }

  transpose(): MatrixValue {
    const newRows: MathValue[][] = [];
    for (let i = 0; i < this.rows[0].length; i++) {
      newRows.push(this.rows.map(row => row[i]));
    }
    return new MatrixValue(newRows);
  }

  det(): MathValue {
    if (this.rows.length !== this.rows[0].length) {
      throw new Error("DimensionMismatchError: Matrix must be square");
    }
    return this._det(this.rows);
  }

  private _det(matrix: MathValue[][]): MathValue {
    const n = matrix.length;
    if (n === 1) return matrix[0][0];
    if (n === 2) {
       return mathSub(
         mathMul(matrix[0][0], matrix[1][1]),
         mathMul(matrix[0][1], matrix[1][0])
       );
    }
    
    let d: MathValue = 0;
    for (let j = 0; j < n; j++) {
      const subMatrix = matrix.slice(1).map(row => row.filter((_, col) => col !== j));
      const cofactor = mathMul(matrix[0][j], this._det(subMatrix));
      if (j % 2 === 0) d = mathAdd(d, cofactor);
      else d = mathSub(d, cofactor);
    }
    return d;
  }

  inv(): MatrixValue {
    const d = this.det();
    if (d === 0) throw new Error("Matrix is singular");
    
    const n = this.rows.length;
    if (n === 1) return new MatrixValue([[mathDiv(1, this.rows[0][0])]]);
    
    const cofactors: MathValue[][] = [];
    for (let i = 0; i < n; i++) {
      const row: MathValue[] = [];
      for (let j = 0; j < n; j++) {
        const sub = this.rows.filter((_, rowIdx) => rowIdx !== i).map(r => r.filter((_, colIdx) => colIdx !== j));
        let c = this._det(sub);
        if ((i + j) % 2 !== 0) c = mathMul(-1, c);
        row.push(c);
      }
      cofactors.push(row);
    }
    
    const adjugate = new MatrixValue(cofactors).transpose();
    return adjugate.mul(mathDiv(1, d));
  }
}

export type MathValue = number | Complex | MatrixValue;

export function mathAdd(a: MathValue, b: MathValue): MathValue {
  if (typeof a === 'number' && typeof b === 'number') return a + b;
  if (a instanceof Complex) return a.add(b as any);
  if (b instanceof Complex) return b.add(a as any);
  if (a instanceof MatrixValue && b instanceof MatrixValue) return a.add(b);
  throw new Error("Unsupported addition");
}

export function mathSub(a: MathValue, b: MathValue): MathValue {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Complex) return a.sub(b as any);
  if (b instanceof Complex) return new Complex(-b.re, -b.im).add(a as any); // hacky but works
  // matrix sub not implemented, just basic
  throw new Error("Unsupported subtraction");
}

export function mathMul(a: MathValue, b: MathValue): MathValue {
  if (typeof a === 'number' && typeof b === 'number') return a * b;
  if (a instanceof Complex) return a.mul(b as any);
  if (b instanceof Complex) return b.mul(a as any);
  if (a instanceof MatrixValue) return a.mul(b);
  if (b instanceof MatrixValue) return b.mul(a); // scalar mul is commutative
  throw new Error("Unsupported multiplication");
}

export function mathDiv(a: MathValue, b: MathValue): MathValue {
  if (typeof a === 'number' && typeof b === 'number') {
    if (b === 0) throw new Error("Division by zero");
    return a / b;
  }
  if (a instanceof Complex) return a.div(b as any);
  if (b instanceof Complex && typeof a === 'number') {
    return new Complex(a, 0).div(b);
  }
  throw new Error("Unsupported division");
}

export function mathPow(base: MathValue, exponent: MathValue): MathValue {
  if (base instanceof MatrixValue && typeof exponent === 'number' && exponent === -1) {
    return base.inv();
  }
  
  if (typeof base === 'number' && typeof exponent === 'number') {
    if (base < 0 && !Number.isInteger(exponent)) {
      // return complex number
      return new Complex(base, 0).pow(exponent);
    }
    return Math.pow(base, exponent);
  }

  if (base instanceof Complex) {
    return base.pow(exponent as any);
  }
  
  if (typeof base === 'number' && exponent instanceof Complex) {
    return new Complex(base, 0).pow(exponent);
  }

  throw new Error("Unsupported power operation");
}
