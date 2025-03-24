import Decimal from 'decimal.js';
import { TaxYearConfig, TaxDetails } from '../types/tax.types';
import { TAX_YEARS } from '../constants/tax-values';

export class TaxCalculator {
  private readonly config: TaxYearConfig;

  constructor(year: number) {
    const config = TAX_YEARS[year];
    if (!config) {
      throw new Error(`Tax configuration for year ${year} not found`);
    }
    this.config = config;
  }

  private calculateContributionBase(
    monthlyIncome: Decimal,
    config: { base: number; minimum: number },
  ): Decimal {
    const base = monthlyIncome.times(config.base);
    return Decimal.max(base, new Decimal(config.minimum));
  }

  private calculateContribution(base: Decimal, rate: number): Decimal {
    return base.times(rate);
  }

  private calculateTaxByBrackets(taxableIncomeUVT: Decimal): Decimal {
    let tax = new Decimal(0);

    this.config.brackets.forEach(({ lowerLimit, upperLimit, rate }) => {
      if (taxableIncomeUVT.greaterThan(lowerLimit)) {
        const bracketAmount = Decimal.min(
          taxableIncomeUVT.minus(lowerLimit),
          new Decimal(upperLimit).minus(lowerLimit),
        );
        const bracketTax = bracketAmount.times(rate).dividedBy(100).times(this.config.uvt);
        tax = tax.plus(bracketTax);
      }
    });

    return tax;
  }

  public calculateTax(monthlyIncome: number): TaxDetails {
    const income = new Decimal(monthlyIncome);
    const annualIncome = income.times(12);

    // Calculate contribution bases
    const healthBase = this.calculateContributionBase(income, this.config.contributions.health);
    const pensionBase = this.calculateContributionBase(income, this.config.contributions.pension);

    // Calculate contributions
    const healthContribution = this.calculateContribution(
      healthBase,
      this.config.contributions.health.rate,
    );
    const pensionContribution = this.calculateContribution(
      pensionBase,
      this.config.contributions.pension.rate,
    );
    const totalMonthlyContributions = healthContribution.plus(pensionContribution);
    const annualContributions = totalMonthlyContributions.times(12);

    // Calculate deductions
    const presumptiveCosts = annualIncome.times(this.config.deductions.presumptiveCosts);
    const monthlyPresumptiveCosts = presumptiveCosts.dividedBy(12);

    // Calculate taxable income
    const taxableIncome = annualIncome.minus(presumptiveCosts).minus(annualContributions);
    const monthlyTaxableIncome = taxableIncome.dividedBy(12);
    const taxableIncomeUVT = taxableIncome.dividedBy(this.config.uvt);

    // Calculate tax
    const annualTax = this.calculateTaxByBrackets(taxableIncomeUVT);
    const monthlyTax = annualTax.dividedBy(12);
    const effectiveRate = annualTax.dividedBy(annualIncome).times(100);

    // Calculate final amounts
    const totalMonthlyDeductions = totalMonthlyContributions.plus(monthlyTax);
    const monthlyNetIncome = income.minus(totalMonthlyDeductions);

    return {
      // Basic income values
      monthlyIncome: income,
      annualIncome,

      // Taxable income values
      monthlyTaxableIncome,
      annualTaxableIncome: taxableIncome,

      // Tax amounts
      monthlyTaxAmount: monthlyTax,
      annualTaxAmount: annualTax,
      effectiveTaxRate: effectiveRate,

      // Contributions
      monthlyHealth: healthContribution,
      monthlyPension: pensionContribution,

      // Deductions and net income
      monthlyTotalDeductions: totalMonthlyDeductions,
      monthlyNetIncome,
      monthlyPresumptiveCosts,

      // Structured data for new format
      contributions: {
        health: {
          base: healthBase,
          amount: healthContribution,
        },
        pension: {
          base: pensionBase,
          amount: pensionContribution,
        },
      },
      deductions: {
        presumptiveCosts,
        totalContributions: annualContributions,
      },
      tax: {
        taxableIncome,
        annualAmount: annualTax,
        monthlyAmount: monthlyTax,
        effectiveRate,
      },
      summary: {
        totalMonthlyDeductions,
        monthlyNetIncome,
      },
    };
  }
}
