import Decimal from 'decimal.js';

export interface ContributionConfig {
  rate: number;
  base: number;
  minimum: number;
}

export interface TaxYearConfig {
  uvt: number;
  minimumWage: number;
  contributions: {
    health: ContributionConfig;
    pension: ContributionConfig;
  };
  deductions: {
    presumptiveCosts: number;
  };
  brackets: TaxBracket[];
}

export interface TaxBracket {
  lowerLimit: number;
  upperLimit: number;
  rate: number;
}

export interface TaxDetails {
  monthlyIncome: Decimal;
  annualIncome: Decimal;
  monthlyTaxableIncome: Decimal;
  annualTaxableIncome: Decimal;
  monthlyTaxAmount: Decimal;
  annualTaxAmount: Decimal;
  effectiveTaxRate: Decimal;
  monthlyHealth: Decimal;
  monthlyPension: Decimal;
  monthlyTotalDeductions: Decimal;
  monthlyNetIncome: Decimal;
  monthlyPresumptiveCosts?: Decimal;

  contributions?: {
    health: {
      base: Decimal;
      amount: Decimal;
    };
    pension: {
      base: Decimal;
      amount: Decimal;
    };
  };
  deductions?: {
    presumptiveCosts: Decimal;
    totalContributions: Decimal;
  };
  tax?: {
    taxableIncome: Decimal;
    annualAmount: Decimal;
    monthlyAmount: Decimal;
    effectiveRate: Decimal;
  };
  summary?: {
    totalMonthlyDeductions: Decimal;
    monthlyNetIncome: Decimal;
  };
}
