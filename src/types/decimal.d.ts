declare module 'decimal.js' {
  export default class Decimal {
    constructor(value: Decimal | string | number);

    static min(...values: Array<Decimal | string | number>): Decimal;
    static max(...values: Array<Decimal | string | number>): Decimal;

    abs(): Decimal;
    dividedBy(value: Decimal | string | number): Decimal;
    div(value: Decimal | string | number): Decimal;
    times(value: Decimal | string | number): Decimal;
    mul(value: Decimal | string | number): Decimal;
    plus(value: Decimal | string | number): Decimal;
    add(value: Decimal | string | number): Decimal;
    minus(value: Decimal | string | number): Decimal;
    sub(value: Decimal | string | number): Decimal;
    greaterThan(value: Decimal | string | number): boolean;
    gt(value: Decimal | string | number): boolean;
    lessThan(value: Decimal | string | number): boolean;
    lt(value: Decimal | string | number): boolean;
    toNumber(): number;
    toFixed(dp?: number): string;
    toString(): string;
  }
} 