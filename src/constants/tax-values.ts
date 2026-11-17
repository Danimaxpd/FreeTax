import {
  FspBracket,
  StatutoryCapsConfig,
  TaxBracket,
  TaxYearConfig,
} from '../types/tax.types';

export const TAX_BRACKETS: TaxBracket[] = [
  { lowerLimit: 0, upperLimit: 1090, rate: 0 }, // 0% up to 1,090 UVT
  { lowerLimit: 1090, upperLimit: 1700, rate: 19 }, // 19% > 1,090 and <= 1,700 UVT
  { lowerLimit: 1700, upperLimit: 4100, rate: 28 }, // 28% > 1,700 and <= 4,100 UVT
  { lowerLimit: 4100, upperLimit: 8670, rate: 33 }, // 33% > 4,100 and <= 8,670 UVT
  { lowerLimit: 8670, upperLimit: 18970, rate: 35 }, // 35% > 8,670 and <= 18,970 UVT
  { lowerLimit: 18970, upperLimit: 31000, rate: 37 }, // 37% > 18,970 and <= 31,000 UVT
  { lowerLimit: 31000, upperLimit: Infinity, rate: 39 }, // 39% > 31,000 UVT
];

export const DEFAULT_FSP_BRACKETS: FspBracket[] = [
  { minSmmlv: 4, maxSmmlv: 16, rate: 0.01 },
  { minSmmlv: 16, maxSmmlv: 17, rate: 0.012 },
  { minSmmlv: 17, maxSmmlv: 18, rate: 0.014 },
  { minSmmlv: 18, maxSmmlv: 19, rate: 0.016 },
  { minSmmlv: 19, maxSmmlv: 20, rate: 0.018 },
  { minSmmlv: 20, maxSmmlv: Infinity, rate: 0.02 },
];

export const DEFAULT_STATUTORY_CAPS: StatutoryCapsConfig = {
  ibcMaxSmmlv: 25,
  exempt25Rate: 0.25,
  exempt25CapUvt: 790,
  globalDeductionCapRate: 0.4,
  globalDeductionCapUvt: 1340,
  dependentIncomeRate: 0.1,
  dependentMonthlyCapUvt: 32,
  dependentAdditionalUvt: 72,
  dependentAdditionalMaxCount: 4,
  prepaidHealthMonthlyCapUvt: 16,
  housingInterestMonthlyCapUvt: 100,
  voluntaryPensionMaxRate: 0.3,
  voluntaryPensionCapUvt: 3800,
  gmfDeductibleRate: 0.5,
  electronicInvoiceRate: 0.01,
  electronicInvoiceCapUvt: 240,
};

export const MONTH_NAMES_ES: string[] = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export interface ArlRiskLevel {
  level: number;
  label: string;
  rate: number;
}

export const ARL_RISK_LEVELS: ArlRiskLevel[] = [
  { level: 0, label: 'Sin ARL (0%)', rate: 0 },
  { level: 1, label: 'Riesgo I (0.522%)', rate: 0.00522 },
  { level: 2, label: 'Riesgo II (1.044%)', rate: 0.01044 },
  { level: 3, label: 'Riesgo III (2.436%)', rate: 0.02436 },
  { level: 4, label: 'Riesgo IV (4.350%)', rate: 0.0435 },
  { level: 5, label: 'Riesgo V (6.960%)', rate: 0.0696 },
];

export function createYearConfigFromBase(params: {
  year: number;
  uvt: number;
  minimumWage: number;
  healthRate?: number;
  pensionRate?: number;
  ibcBase?: number;
  presumptiveCosts?: number;
}): TaxYearConfig {
  const {
    year,
    uvt,
    minimumWage,
    healthRate = 0.125,
    pensionRate = 0.16,
    ibcBase = 0.4,
    presumptiveCosts = 0.25,
  } = params;

  if (!Number.isFinite(year) || year <= 0) {
    throw new Error(`Invalid tax year: ${year}`);
  }
  if (!Number.isFinite(uvt) || uvt <= 0) {
    throw new Error(`Invalid UVT value for year ${year}: ${uvt}`);
  }
  if (!Number.isFinite(minimumWage) || minimumWage <= 0) {
    throw new Error(`Invalid minimumWage value for year ${year}: ${minimumWage}`);
  }
  if (!Number.isFinite(healthRate) || healthRate < 0) {
    throw new Error(`Invalid healthRate value for year ${year}: ${healthRate}`);
  }
  if (!Number.isFinite(pensionRate) || pensionRate < 0) {
    throw new Error(`Invalid pensionRate value for year ${year}: ${pensionRate}`);
  }
  if (!Number.isFinite(ibcBase) || ibcBase <= 0) {
    throw new Error(`Invalid ibcBase value for year ${year}: ${ibcBase}`);
  }
  if (!Number.isFinite(presumptiveCosts) || presumptiveCosts < 0) {
    throw new Error(`Invalid presumptiveCosts value for year ${year}: ${presumptiveCosts}`);
  }

  return {
    year,
    uvt,
    minimumWage,
    contributions: {
      health: {
        rate: healthRate,
        base: ibcBase,
        minimum: minimumWage,
      },
      pension: {
        rate: pensionRate,
        base: ibcBase,
        minimum: minimumWage,
      },
    },
    deductions: {
      presumptiveCosts,
    },
    brackets: TAX_BRACKETS.map((bracket) => ({ ...bracket })),
    caps: { ...DEFAULT_STATUTORY_CAPS },
    fspBrackets: DEFAULT_FSP_BRACKETS.map((bracket) => ({ ...bracket })),
  };
}

export const TAX_YEARS: Record<number, TaxYearConfig> = {
  2024: createYearConfigFromBase({ year: 2024, uvt: 47065, minimumWage: 1300000 }),
  2025: createYearConfigFromBase({ year: 2025, uvt: 49799, minimumWage: 1423500 }),
  2026: createYearConfigFromBase({ year: 2026, uvt: 52374, minimumWage: 1750905 }),
};

export type ValidTaxYear = number;

export function getAvailableYears(): number[] {
  return Object.keys(TAX_YEARS)
    .map(Number)
    .filter((year) => Number.isFinite(year))
    .sort((a, b) => a - b);
}

export function getTaxYearConfig(year: number): TaxYearConfig {
  const config = TAX_YEARS[year];
  if (!config) {
    throw new Error(`Tax configuration for year ${year} not found`);
  }
  return config;
}

function isValidNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isValidPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function validateContributionConfig(name: string, contrib: unknown): void {
  if (!contrib || typeof contrib !== 'object') {
    throw new Error(`Invalid contributions.${name} configuration`);
  }
  const c = contrib as Record<string, unknown>;
  if (!isValidNonNegativeNumber(c.rate)) {
    throw new Error(`Invalid contributions.${name}.rate: ${String(c.rate)}`);
  }
  if (!isValidPositiveNumber(c.base)) {
    throw new Error(`Invalid contributions.${name}.base: ${String(c.base)}`);
  }
  if (!isValidNonNegativeNumber(c.minimum)) {
    throw new Error(`Invalid contributions.${name}.minimum: ${String(c.minimum)}`);
  }
}

export function validateTaxYearConfig(year: number, config: TaxYearConfig): void {
  if (!isValidPositiveNumber(year)) {
    throw new Error(`Invalid tax year: ${year}`);
  }
  if (!config || typeof config !== 'object') {
    throw new Error(`Invalid tax configuration object for year ${year}`);
  }
  if (!isValidPositiveNumber(config.uvt)) {
    throw new Error(`Invalid UVT value for year ${year}: ${config.uvt}`);
  }
  if (!isValidPositiveNumber(config.minimumWage)) {
    throw new Error(`Invalid minimumWage value for year ${year}: ${config.minimumWage}`);
  }
  if (!config.contributions || typeof config.contributions !== 'object') {
    throw new Error(`Missing contributions configuration for year ${year}`);
  }
  validateContributionConfig('health', config.contributions.health);
  validateContributionConfig('pension', config.contributions.pension);

  if (
    !config.deductions ||
    typeof config.deductions !== 'object' ||
    !isValidNonNegativeNumber(config.deductions.presumptiveCosts)
  ) {
    throw new Error(
      `Invalid deductions.presumptiveCosts for year ${year}: ${String(config.deductions?.presumptiveCosts)}`,
    );
  }

  if (!Array.isArray(config.brackets) || config.brackets.length === 0) {
    throw new Error(`Invalid tax brackets array for year ${year}`);
  }
  config.brackets.forEach((bracket, index) => {
    if (
      !bracket ||
      !isValidNonNegativeNumber(bracket.lowerLimit) ||
      typeof bracket.upperLimit !== 'number' ||
      Number.isNaN(bracket.upperLimit) ||
      bracket.upperLimit < bracket.lowerLimit ||
      !isValidNonNegativeNumber(bracket.rate)
    ) {
      throw new Error(`Invalid tax bracket at index ${index} for year ${year}`);
    }
  });

  if (config.fspBrackets !== undefined) {
    if (!Array.isArray(config.fspBrackets)) {
      throw new Error(`Invalid fspBrackets array for year ${year}`);
    }
    config.fspBrackets.forEach((bracket, index) => {
      if (
        !bracket ||
        !isValidNonNegativeNumber(bracket.minSmmlv) ||
        typeof bracket.maxSmmlv !== 'number' ||
        Number.isNaN(bracket.maxSmmlv) ||
        bracket.maxSmmlv < bracket.minSmmlv ||
        !isValidNonNegativeNumber(bracket.rate)
      ) {
        throw new Error(`Invalid FSP bracket at index ${index} for year ${year}`);
      }
    });
  }
}

export function registerTaxYearConfig(year: number, config: TaxYearConfig): TaxYearConfig {
  validateTaxYearConfig(year, config);

  const normalized: TaxYearConfig = {
    ...config,
    year,
    contributions: {
      health: { ...config.contributions.health },
      pension: { ...config.contributions.pension },
    },
    deductions: { ...config.deductions },
    brackets: config.brackets.map((bracket) => ({ ...bracket })),
    caps: { ...DEFAULT_STATUTORY_CAPS, ...(config.caps ?? {}) },
    fspBrackets: (config.fspBrackets ?? DEFAULT_FSP_BRACKETS).map((bracket) => ({ ...bracket })),
  };

  TAX_YEARS[year] = normalized;
  return normalized;
}
