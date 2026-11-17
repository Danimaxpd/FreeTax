import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  isValidNumber,
  parseCurrencyInput,
  parseFormattedNumber,
} from '../src/helpers/number';
import { formatCOP, formatCurrency } from '../src/utils/format';

describe('parseFormattedNumber & isValidNumber (CLI legacy > 1,000,000)', () => {
  it('parses Colombian and US thousand-separated values above 1,000,000', () => {
    expect(parseFormattedNumber('15.000.000')).toBe(15000000);
    expect(parseFormattedNumber('15,000,000')).toBe(15000000);
    expect(parseFormattedNumber('  12000000  ')).toBe(12000000);
    expect(isValidNumber('15.000.000')).toBe(true);
    expect(isValidNumber('15,000,000')).toBe(true);
  });

  it('rejects values at or below 1,000,000 and invalid inputs', () => {
    expect(parseFormattedNumber('1000000')).toBeNull();
    expect(parseFormattedNumber('500.000')).toBeNull();
    expect(parseFormattedNumber('0')).toBeNull();
    expect(parseFormattedNumber('-5000000')).toBeNull();
    expect(parseFormattedNumber('abc')).toBeNull();
    expect(parseFormattedNumber('')).toBeNull();

    expect(isValidNumber('1000000')).toBe(false);
    expect(isValidNumber('abc')).toBe(false);
  });
});

describe('parseCurrencyInput', () => {
  it('parses formatted strings, currency symbols, and numbers', () => {
    expect(parseCurrencyInput('15.000.000')).toEqual({ value: 15000000 });
    expect(parseCurrencyInput('15,000,000')).toEqual({ value: 15000000 });
    expect(parseCurrencyInput('$ 2.500.000 COP')).toEqual({ value: 2500000 });
    expect(parseCurrencyInput('1.500.000,50')).toEqual({ value: 1500000.5 });
    expect(parseCurrencyInput(8500000)).toEqual({ value: 8500000 });
    expect(parseCurrencyInput('0', { allowZero: true })).toEqual({ value: 0 });
  });

  it('validates allowZero, min, max, and invalid formats', () => {
    const zeroDisallowed = parseCurrencyInput('0', { allowZero: false });
    expect(zeroDisallowed.value).toBeNull();
    expect(zeroDisallowed.error).toBeDefined();

    const belowMin = parseCurrencyInput('500.000', { min: 1000000 });
    expect(belowMin.value).toBeNull();
    expect(belowMin.error).toBeDefined();

    const aboveMax = parseCurrencyInput('20.000.000', { max: 10000000 });
    expect(aboveMax.value).toBeNull();
    expect(aboveMax.error).toBeDefined();

    const negative = parseCurrencyInput(-500);
    expect(negative.value).toBeNull();
    expect(negative.error).toBeDefined();

    const empty = parseCurrencyInput('   ');
    expect(empty.value).toBeNull();
    expect(empty.error).toBeDefined();

    const invalid = parseCurrencyInput('15abc');
    expect(invalid.value).toBeNull();
    expect(invalid.error).toBeDefined();

    const nan = parseCurrencyInput(Number.NaN);
    expect(nan.value).toBeNull();
    expect(nan.error).toBeDefined();
  });
});

describe('formatCOP & formatCurrency', () => {
  it('formats numbers and Decimals into Colombian peso strings', () => {
    expect(formatCOP(15000000)).toContain('15');
    expect(formatCOP(new Decimal(15000000))).toContain('15');
    expect(formatCOP(Number.NaN)).toBe('$0');
    expect(formatCurrency(new Decimal(15000000))).toContain('COP');
  });
});
