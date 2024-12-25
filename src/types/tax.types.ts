import Decimal from 'decimal.js';

export interface TaxDetails {
  monthlyIncome: Decimal;
  annualIncome: Decimal;
  monthlyPresumptiveCosts: Decimal;
  annualPresumptiveCosts: Decimal;
  monthlyTaxableIncome: Decimal;
  annualTaxableIncome: Decimal;
  monthlyTaxAmount: Decimal;
  annualTaxAmount: Decimal;
  effectiveTaxRate: Decimal;
  monthlyHealth: Decimal;
  monthlyPension: Decimal;
  monthlyTotalDeductions: Decimal;
  monthlyNetIncome: Decimal;
}

export interface TaxBracket {
  lowerLimit: number;
  upperLimit: number;
  rate: number;
}
