import { TaxYearConfig } from '../types/tax.types';

export type ValidTaxYear = keyof typeof TAX_YEARS;

export const TAX_YEARS: Record<number, TaxYearConfig> = {
  2025: {
    uvt: 49799,
    minimumWage: 1423500,
    contributions: {
      health: {
        rate: 0.125,
        base: 0.4,
        minimum: 1423500,
      },
      pension: {
        rate: 0.16,
        base: 0.4,
        minimum: 1423500,
      },
    },
    deductions: {
      presumptiveCosts: 0.25,
    },
    brackets: [
      { lowerLimit: 0, upperLimit: 1090, rate: 0 },
      { lowerLimit: 1090, upperLimit: 1700, rate: 19 },
      { lowerLimit: 1700, upperLimit: 4100, rate: 28 },
      { lowerLimit: 4100, upperLimit: 8670, rate: 33 },
      { lowerLimit: 8670, upperLimit: 18970, rate: 35 },
      { lowerLimit: 18970, upperLimit: 31000, rate: 37 },
      { lowerLimit: 31000, upperLimit: Infinity, rate: 39 },
    ],
  },
  2026: {
    uvt: 52374,
    minimumWage: 1750905,
    contributions: {
      health: {
        rate: 0.125,
        base: 0.4,
        minimum: 1750905,
      },
      pension: {
        rate: 0.16,
        base: 0.4,
        minimum: 1750905,
      },
    },
    deductions: {
      presumptiveCosts: 0.25,
    },
    brackets: [
      { lowerLimit: 0, upperLimit: 1090, rate: 0 },
      { lowerLimit: 1090, upperLimit: 1700, rate: 19 },
      { lowerLimit: 1700, upperLimit: 4100, rate: 28 },
      { lowerLimit: 4100, upperLimit: 8670, rate: 33 },
      { lowerLimit: 8670, upperLimit: 18970, rate: 35 },
      { lowerLimit: 18970, upperLimit: 31000, rate: 37 },
      { lowerLimit: 31000, upperLimit: Infinity, rate: 39 },
    ],
  },
};

export const TAX_BRACKETS = [
  { lowerLimit: 0, upperLimit: 1090, rate: 0 }, // 0% up to 1090 UVT
  { lowerLimit: 1090, upperLimit: 1700, rate: 19 }, // 19% > 1090 UVT and <= 1700 UVT
  { lowerLimit: 1700, upperLimit: 4100, rate: 28 }, // 28% > 1700 UVT and <= 4100 UVT
  { lowerLimit: 4100, upperLimit: 8670, rate: 33 }, // 33% > 4100 UVT and <= 8670 UVT
  { lowerLimit: 8670, upperLimit: 18970, rate: 35 }, // 35% > 8670 UVT and <= 18970 UVT
  { lowerLimit: 18970, upperLimit: 31000, rate: 37 }, // 37% > 18970 UVT and <= 31000 UVT
  { lowerLimit: 31000, upperLimit: Infinity, rate: 39 }, // 39% > 31000 UVT
] as const;
