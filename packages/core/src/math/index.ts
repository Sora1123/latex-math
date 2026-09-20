function cleanZero(val: number): number {
  return Math.abs(val) < 1e-14 ? 0 : val;
}

export class SciNumber {
  readonly isSciNumber = true;

  constructor(
    public mantissa: number,
    public exponent: number
  ) {
    this.normalize();
  }

  normalize(): void {
    if (this.mantissa === 0 || !isFinite(this.mantissa) || !isFinite(this.exponent)) return;
    const sign = this.mantissa < 0 ? -1 : 1;
    let m = Math.abs(this.mantissa);
    const log10 = Math.log10(m);
    if (log10 >= 1 || log10 < 0) {
      const shift = Math.floor(log10);
      m = m / Math.pow(10, shift);
      this.exponent += shift;
    }
    this.mantissa = sign * m;
  }

  toNumber(): number {
    return this.mantissa * Math.pow(10, this.exponent);
  }

  add(other: SciNumber | number): SciNumber {
    const b = typeof other === 'number' ? SciNumber.fromNumber(other) : other;
    const diff = this.exponent - b.exponent;
    if (diff > 16) return new SciNumber(this.mantissa, this.exponent);
    if (diff < -16) return new SciNumber(b.mantissa, b.exponent);
    const newMantissa = this.mantissa + b.mantissa * Math.pow(10, -diff);
    return new SciNumber(newMantissa, this.exponent);
  }

  sub(other: SciNumber | number): SciNumber {
    const b = typeof other === 'number' ? SciNumber.fromNumber(other) : other;
    return this.add(new SciNumber(-b.mantissa, b.exponent));
  }

  mul(other: SciNumber | number): SciNumber {
    if (typeof other === 'number') {
      if (other === 0) return new SciNumber(0, 0);
      return new SciNumber(this.mantissa * other, this.exponent);
    }
    return new SciNumber(this.mantissa * other.mantissa, this.exponent + other.exponent);
  }

  div(other: SciNumber | number): SciNumber {
    if (typeof other === 'number') {
      if (other === 0) throw new Error("Division by zero");
      return new SciNumber(this.mantissa / other, this.exponent);
    }
    if (other.mantissa === 0) throw new Error("Division by zero");
    return new SciNumber(this.mantissa / other.mantissa, this.exponent - other.exponent);
  }

  pow(exp: number): SciNumber {
    if (exp === 0) return new SciNumber(1, 0);
    const totalExp = this.exponent * exp;
    const logM = Math.log10(Math.abs(this.mantissa));
    const combinedLog = totalExp + logM * exp;
    const newExp = Math.floor(combinedLog);
    const newMantissa = Math.pow(10, combinedLog - newExp);
    const sign = this.mantissa < 0 && exp % 2 !== 0 ? -1 : 1;
    return new SciNumber(sign * newMantissa, newExp);
  }

  toString(sigFigs: number = 10): string {
    if (this.mantissa === 0) return '0';
    const mStr = parseFloat(this.mantissa.toPrecision(sigFigs)).toString();
    if (this.exponent === 0) return mStr;
    if (mStr === '1') {
      return `1 * 10^${this.exponent}`;
    }
    return `${mStr} * 10^${this.exponent}`;
  }

  static fromNumber(val: number): SciNumber {
    if (val === 0) return new SciNumber(0, 0);
    const sign = val < 0 ? -1 : 1;
    const absVal = Math.abs(val);
    const exp = Math.floor(Math.log10(absVal));
    const m = sign * (absVal / Math.pow(10, exp));
    return new SciNumber(m, exp);
  }
}

export class Complex {
  re: number;
  im: number;

  constructor(re: number, im: number) {
    this.re = cleanZero(re);
    this.im = cleanZero(im);
  }
  
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
    return new Complex(cleanZero(r * Math.cos(this.im)), cleanZero(r * Math.sin(this.im)));
  }

  ln(): Complex {
    const r = Math.sqrt(this.re * this.re + this.im * this.im);
    const theta = Math.atan2(this.im, this.re);
    return new Complex(cleanZero(Math.log(r)), cleanZero(theta));
  }

  pow(other: Complex | number): Complex {
    if (typeof other === 'number') {
      if (other === 0) return new Complex(1, 0);
      if (this.re === 0 && this.im === 0) return new Complex(0, 0);
      // z^n = r^n (cos(n*theta) + i*sin(n*theta))
      const r = Math.sqrt(this.re * this.re + this.im * this.im);
      const theta = Math.atan2(this.im, this.re);
      const r_n = Math.pow(r, other);
      return new Complex(cleanZero(r_n * Math.cos(other * theta)), cleanZero(r_n * Math.sin(other * theta)));
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

export type MathValue = number | Complex | MatrixValue | SciNumber;

export function mathAdd(a: MathValue, b: MathValue): MathValue {
  if (a instanceof SciNumber || b instanceof SciNumber) {
    const sciA = a instanceof SciNumber ? a : SciNumber.fromNumber(a as number);
    const sciB = b instanceof SciNumber ? b : SciNumber.fromNumber(b as number);
    return sciA.add(sciB);
  }
  if (typeof a === 'number' && typeof b === 'number') return a + b;
  if (a instanceof Complex) return a.add(b as any);
  if (b instanceof Complex) return b.add(a as any);
  if (a instanceof MatrixValue && b instanceof MatrixValue) return a.add(b);
  throw new Error("Unsupported addition");
}

export function mathSub(a: MathValue, b: MathValue): MathValue {
  if (a instanceof SciNumber || b instanceof SciNumber) {
    const sciA = a instanceof SciNumber ? a : SciNumber.fromNumber(a as number);
    const sciB = b instanceof SciNumber ? b : SciNumber.fromNumber(b as number);
    return sciA.sub(sciB);
  }
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Complex) return a.sub(b as any);
  if (b instanceof Complex) return new Complex(-b.re, -b.im).add(a as any);
  throw new Error("Unsupported subtraction");
}

export function mathMul(a: MathValue, b: MathValue): MathValue {
  if (a instanceof SciNumber || b instanceof SciNumber) {
    const sciA = a instanceof SciNumber ? a : SciNumber.fromNumber(a as number);
    const sciB = b instanceof SciNumber ? b : SciNumber.fromNumber(b as number);
    return sciA.mul(sciB);
  }
  if (typeof a === 'number' && typeof b === 'number') {
    const res = a * b;
    if (!isFinite(res)) {
      return SciNumber.fromNumber(a).mul(SciNumber.fromNumber(b));
    }
    return res;
  }
  if (a instanceof Complex) return a.mul(b as any);
  if (b instanceof Complex) return b.mul(a as any);
  if (a instanceof MatrixValue) return a.mul(b);
  if (b instanceof MatrixValue) return b.mul(a);
  throw new Error("Unsupported multiplication");
}

export function mathDiv(a: MathValue, b: MathValue): MathValue {
  if (a instanceof SciNumber || b instanceof SciNumber) {
    const sciA = a instanceof SciNumber ? a : SciNumber.fromNumber(a as number);
    const sciB = b instanceof SciNumber ? b : SciNumber.fromNumber(b as number);
    return sciA.div(sciB);
  }
  if (typeof a === 'number' && typeof b === 'number') {
    if (b === 0) throw new Error("Division by zero");
    const res = a / b;
    if (!isFinite(res)) {
      return SciNumber.fromNumber(a).div(SciNumber.fromNumber(b));
    }
    return res;
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

  if (base instanceof SciNumber && typeof exponent === 'number') {
    return base.pow(exponent);
  }
  
  if (typeof base === 'number' && typeof exponent === 'number') {
    if (base < 0 && !Number.isInteger(exponent)) {
      return new Complex(base, 0).pow(exponent);
    }
    // Handle overflow or underflow for large exponents
    if (base > 0 && (Math.abs(exponent) >= 300 || Math.abs(exponent * Math.log10(base)) >= 300)) {
      const sciBase = SciNumber.fromNumber(base);
      return sciBase.pow(exponent);
    }
    const res = Math.pow(base, exponent);
    if (!isFinite(res) && base > 0) {
      const sciBase = SciNumber.fromNumber(base);
      return sciBase.pow(exponent);
    }
    if (res === 0 && base > 0 && exponent < 0) {
      const sciBase = SciNumber.fromNumber(base);
      return sciBase.pow(exponent);
    }
    return res;
  }

  if (base instanceof Complex) {
    return base.pow(exponent as any);
  }
  
  if (typeof base === 'number' && exponent instanceof Complex) {
    return new Complex(base, 0).pow(exponent);
  }

  throw new Error("Unsupported power operation");
}
