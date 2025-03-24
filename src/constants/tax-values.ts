import { TaxYearConfig } from '../types/tax.types';

// Add type for valid years
export type ValidTaxYear = keyof typeof TAX_YEARS;

export const TAX_YEARS: Record<number, TaxYearConfig> = {
  2025: {
    uvt: 49799,
    minimumWage: 1300000,
    contributions: {
      health: {
        rate: 0.125,
        base: 0.4,
        minimum: 1300000, // Minimum wage
      },
      pension: {
        rate: 0.16,
        base: 0.4,
        minimum: 1300000,
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
      { lowerLimit: 18970, upperLimit: Infinity, rate: 39 },
    ],
  },
  // Add more years as needed
};

export const TAX_BRACKETS = [
  { lowerLimit: 0, upperLimit: 1090, rate: 0 }, // 0% up to 1090 UVT
  { lowerLimit: 1090, upperLimit: 1700, rate: 19 }, // 19% > 1090 UVT and <= 1700 UVT
  { lowerLimit: 1700, upperLimit: 4100, rate: 28 }, // 28% > 1700 UVT and <= 4100 UVT
  { lowerLimit: 4100, upperLimit: 8670, rate: 33 }, // 33% > 4100 UVT and <= 8670 UVT
  { lowerLimit: 8670, upperLimit: 18970, rate: 35 }, // 35% > 8670 UVT and <= 18970 UVT
  { lowerLimit: 18970, upperLimit: Infinity, rate: 39 }, // 39% > 18970 UVT
] as const;
