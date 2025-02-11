import Decimal from 'decimal.js';
import { TaxDetails } from '../types/tax.types.js';
import { TAX_VALUES, TAX_BRACKETS, ValidTaxYear } from '../constants/tax-values.js';
import { logger } from '../utils/logger.js';

export class ColombianTaxCalculator {
  private readonly uvt: Decimal;

  private readonly monthsInYear: number = 12;

  private readonly healthRate: Decimal;

  private readonly pensionRate: Decimal;

  private readonly contributionBase: Decimal;

  private readonly presumptiveCostsRate: Decimal;

  private readonly minimumWage: Decimal;

  private readonly year: ValidTaxYear;

  constructor(year: ValidTaxYear) {
    this.year = year;
    const values = TAX_VALUES[year];
    if (!values) {
      throw new Error(`Tax values for year ${year} are not defined.`);
    }

    this.uvt = new Decimal(values.uvt);
    this.minimumWage = new Decimal(values.minimumWage);
    this.healthRate = new Decimal(values.healthRate);
    this.pensionRate = new Decimal(values.pensionRate);
    this.contributionBase = new Decimal(values.contributionBase);
    this.presumptiveCostsRate = new Decimal(values.presumptiveCostsRate);
  }

  private calculateUvtValue(income: Decimal): Decimal {
    return income.dividedBy(this.uvt);
  }

  private convertMonthlyToAnnual(monthlyIncome: number): Decimal {
    return new Decimal(monthlyIncome).times(this.monthsInYear);
  }

  private calculateIBC(monthlyIncome: Decimal): Decimal {
    const ibc = monthlyIncome.times(this.contributionBase);
    return Decimal.max(ibc, this.minimumWage);
  }

  private calculateHealthContribution(monthlyIncome: Decimal): Decimal {
    const ibc = this.calculateIBC(monthlyIncome);
    return ibc.times(this.healthRate);
  }

  private calculatePensionContribution(monthlyIncome: Decimal): Decimal {
    const ibc = this.calculateIBC(monthlyIncome);
    return ibc.times(this.pensionRate);
  }

  public calculateTax(monthlyIncome: number): TaxDetails {
    logger.info(`Calculating tax for monthly income: ${monthlyIncome}`);
    const monthlyIncomeDecimal = new Decimal(monthlyIncome);
    const annualIncome = this.convertMonthlyToAnnual(monthlyIncome);
    logger.info(`Annual income: ${annualIncome.toNumber()}`);

    // Calculate monthly contributions
    const monthlyHealth = this.calculateHealthContribution(monthlyIncomeDecimal);
    logger.info(`Monthly health contribution: ${monthlyHealth.toNumber()}`);
    const monthlyPension = this.calculatePensionContribution(monthlyIncomeDecimal);
    logger.info(`Monthly pension contribution: ${monthlyPension.toNumber()}`);
    const annualContributions = monthlyHealth.plus(monthlyPension).times(this.monthsInYear);
    logger.info(`Annual contributions: ${annualContributions.toNumber()}`);

    // Calculate taxable income
    const presumptiveCosts = annualIncome.times(this.presumptiveCostsRate);
    logger.info(`Presumptive costs (25% of annual income): ${presumptiveCosts.toNumber()}`);
    const taxableIncome = annualIncome.minus(presumptiveCosts).minus(annualContributions);
    logger.info(`Taxable income: ${taxableIncome.toNumber()}`);
    const taxableIncomeUvt = this.calculateUvtValue(taxableIncome);
    logger.info(`Taxable income in UVT: ${taxableIncomeUvt.toNumber()}`);

    let tax = new Decimal(0);

    TAX_BRACKETS.forEach(({ lowerLimit, upperLimit, rate }) => {
      if (taxableIncomeUvt.greaterThan(lowerLimit)) {
        const taxableAmount = Decimal.min(
          taxableIncomeUvt.minus(lowerLimit),
          new Decimal(upperLimit).minus(lowerLimit),
        );
        const taxForBracket = taxableAmount.times(rate).dividedBy(100).times(this.uvt);
        tax = tax.plus(taxForBracket);
        logger.info(
          `Tax for bracket ${lowerLimit}-${upperLimit} UVT at rate ${rate}%: ${taxForBracket.toNumber()}`,
        );
      }
    });

    const monthlyTax = tax.dividedBy(this.monthsInYear);
    logger.info(`Monthly tax amount: ${monthlyTax.toNumber()}`);
    const effectiveTaxRate = tax.dividedBy(annualIncome).times(100);
    logger.info(`Effective tax rate: ${effectiveTaxRate.toNumber()}%`);
    const monthlyTotalDeductions = monthlyHealth.plus(monthlyPension).plus(monthlyTax);
    logger.info(`Total monthly deductions: ${monthlyTotalDeductions.toNumber()}`);
    const monthlyNetIncome = monthlyIncomeDecimal.minus(monthlyTotalDeductions);
    logger.info(`Monthly net income: ${monthlyNetIncome.toNumber()}`);

    return {
      monthlyIncome: monthlyIncomeDecimal,
      annualIncome,
      monthlyPresumptiveCosts: presumptiveCosts.dividedBy(this.monthsInYear),
      annualPresumptiveCosts: presumptiveCosts,
      monthlyTaxableIncome: taxableIncome.dividedBy(this.monthsInYear),
      annualTaxableIncome: taxableIncome,
      monthlyTaxAmount: monthlyTax,
      annualTaxAmount: tax,
      effectiveTaxRate,
      monthlyHealth,
      monthlyPension,
      monthlyTotalDeductions,
      monthlyNetIncome,
    };
  }

  public printTaxReport(taxDetails: TaxDetails): void {
    logger.info('\n=== REPORTE DE IMPUESTOS ===');
    logger.info('\n--- Valores Mensuales ---');
    logger.info(
      `Ingreso Mensual Bruto: $${taxDetails.monthlyIncome.toNumber().toLocaleString('es-CO')} COP`,
    );
    logger.info(
      `Aportes a Salud (12.5% del IBC): $${taxDetails.monthlyHealth
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    logger.info(
      `Aportes a Pensión (16% del IBC): $${taxDetails.monthlyPension
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    logger.info(
      `Retención en la Fuente Mensual: $${taxDetails.monthlyTaxAmount
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    logger.info(
      `Total Deducciones Mensuales: $${taxDetails.monthlyTotalDeductions
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    logger.info(
      `Ingreso Neto Mensual: $${taxDetails.monthlyNetIncome.toNumber().toLocaleString('es-CO')} COP`,
    );

    logger.info('\n--- Base Gravable ---');
    logger.info(
      `Costos Presuntivos (25%): $${taxDetails.monthlyPresumptiveCosts
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    logger.info(
      `Base Gravable Mensual: $${taxDetails.monthlyTaxableIncome
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    logger.info('================================');
  }
}
