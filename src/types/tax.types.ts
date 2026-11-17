import Decimal from 'decimal.js';

export interface ContributionConfig {
  rate: number;
  base: number;
  minimum: number;
}

export interface FspBracket {
  minSmmlv: number;
  maxSmmlv: number;
  rate: number;
}

export interface TaxBracket {
  lowerLimit: number;
  upperLimit: number;
  rate: number;
}

export interface StatutoryCapsConfig {
  ibcMaxSmmlv: number;
  exempt25Rate: number;
  exempt25CapUvt: number;
  globalDeductionCapRate: number;
  globalDeductionCapUvt: number;
  dependentIncomeRate: number;
  dependentMonthlyCapUvt: number;
  dependentAdditionalUvt: number;
  dependentAdditionalMaxCount: number;
  prepaidHealthMonthlyCapUvt: number;
  housingInterestMonthlyCapUvt: number;
  voluntaryPensionMaxRate: number;
  voluntaryPensionCapUvt: number;
  gmfDeductibleRate: number;
  electronicInvoiceRate: number;
  electronicInvoiceCapUvt: number;
}

export interface TaxYearConfig {
  year?: number;
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
  caps?: StatutoryCapsConfig;
  fspBrackets?: FspBracket[];
}

export type DeductionMode = 'auto' | 'exempt25' | 'actualCosts' | 'legacyPresumptive';

export interface DeductionInputs {
  deductionMode?: DeductionMode;
  dependentsCount?: number;
  prepaidHealthAnnual?: number;
  housingInterestAnnual?: number;
  voluntaryPensionAnnual?: number;
  gmfAnnual?: number;
  electronicInvoicePurchasesAnnual?: number;
  actualCostsAnnual?: number;
  arlRate?: number;
  withholdingsPaidAnnual?: number;
}

export interface MonthlyPilaBreakdown {
  ibc: number;
  health: number;
  pension: number;
  fsp: number;
  arl: number;
  totalPila: number;
}

export interface MonthlyBreakdown {
  monthIndex: number;
  monthName: string;
  grossIncome: number;
  ibc: number;
  health: number;
  pension: number;
  fsp: number;
  arl: number;
  totalPila: number;
  taxSavingsProvision: number;
  netSpendableIncome: number;
  cumulativeTaxSaved: number;
}

export interface RegimeCalculationSummary {
  mode: 'exempt25' | 'actualCosts' | 'legacyPresumptive';
  label: string;
  grossAnnualIncome: number;
  incrgoAnnual: number;
  netIncomeAnnual: number;
  costsAndExpensesAnnual: number;
  netAfterCostsAnnual: number;
  imputableDeductionsAnnual: number;
  voluntaryExemptionsAnnual: number;
  exempt25Annual: number;
  totalSubjectToGlobalCap: number;
  globalCapLimit: number;
  appliedCappedDeductions: number;
  outOfCapDeductionsAnnual: number;
  taxableIncomeAnnual: number;
  taxableIncomeUvt: number;
  annualTaxCop: number;
  annualTaxUvt: number;
  effectiveTaxRate: number;
}

export interface AnnualTaxPlan {
  year: number;
  uvt: number;
  minimumWage: number;
  selectedMode: 'exempt25' | 'actualCosts' | 'legacyPresumptive';
  recommendedMode: 'exempt25' | 'actualCosts';
  taxSavedByRecommended: number;
  selectedRegime: RegimeCalculationSummary;
  comparison: {
    exempt25: RegimeCalculationSummary;
    actualCosts: RegimeCalculationSummary;
    legacyPresumptive: RegimeCalculationSummary;
  };
  annualGrossIncome: number;
  annualPilaTotal: number;
  annualHealthTotal: number;
  annualPensionTotal: number;
  annualFspTotal: number;
  annualArlTotal: number;
  annualTaxTotal: number;
  withholdingsPaidAnnual: number;
  netAnnualTaxToSave: number;
  annualNetSpendableIncome: number;
  effectiveTaxRate: number;
  totalDeductionsAndPilaRate: number;
  months: MonthlyBreakdown[];
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
  monthlyFsp?: Decimal;
  monthlyArl?: Decimal;
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
