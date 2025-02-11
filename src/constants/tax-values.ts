// Add type for valid years
export type ValidTaxYear = keyof typeof TAX_VALUES;

export const TAX_VALUES = {
  2025: {
    uvt: 49799, // UVT value for 2025
    minimumWage: 1300000, // Projected minimum wage for 2025
    healthRate: 0.125, // 12.5%
    pensionRate: 0.16, // 16%
    contributionBase: 0.4, // 40% of income
    presumptiveCostsRate: 0.25, // 25% of income
  },
} as const;

export const TAX_BRACKETS = [
  { lowerLimit: 0, upperLimit: 1090, rate: 0 }, // 0% up to 1090 UVT
  { lowerLimit: 1090, upperLimit: 1700, rate: 19 }, // 19% > 1090 UVT and <= 1700 UVT
  { lowerLimit: 1700, upperLimit: 4100, rate: 28 }, // 28% > 1700 UVT and <= 4100 UVT
  { lowerLimit: 4100, upperLimit: 8670, rate: 33 }, // 33% > 4100 UVT and <= 8670 UVT
  { lowerLimit: 8670, upperLimit: 18970, rate: 35 }, // 35% > 8670 UVT and <= 18970 UVT
  { lowerLimit: 18970, upperLimit: Infinity, rate: 39 }, // 39% > 18970 UVT
] as const;
