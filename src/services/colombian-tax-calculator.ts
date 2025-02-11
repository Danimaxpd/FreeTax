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
    const values = TAX_VALUES[this.year];
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
    const monthlyIncomeDecimal = new Decimal(monthlyIncome);
    const annualIncome = this.convertMonthlyToAnnual(monthlyIncome);
    logger.debug(`Annual income: ${annualIncome.toNumber()}`);

    // Calculate IBC and contributions
    const ibc = this.calculateIBC(monthlyIncomeDecimal);
    logger.info(
      `\nIBC:\n${monthlyIncomeDecimal.toNumber().toLocaleString('es-CO')} × ${this.contributionBase.times(100).toNumber()}% = ${ibc.toNumber().toLocaleString('es-CO')} COP`,
    );

    const monthlyHealth = this.calculateHealthContribution(monthlyIncomeDecimal);
    logger.info(
      `\nAporte a Salud (${this.healthRate.times(100).toNumber()}% del IBC):\n${ibc.toNumber().toLocaleString('es-CO')} × ${this.healthRate.times(100).toNumber()}% = ${monthlyHealth.toNumber().toLocaleString('es-CO')} COP`,
    );

    const monthlyPension = this.calculatePensionContribution(monthlyIncomeDecimal);
    logger.info(
      `\nAporte a Pensión (${this.pensionRate.times(100).toNumber()}% del IBC):\n${ibc.toNumber().toLocaleString('es-CO')} × ${this.pensionRate.times(100).toNumber()}% = ${monthlyPension.toNumber().toLocaleString('es-CO')} COP`,
    );

    const monthlyTotalDeductions = monthlyHealth.plus(monthlyPension);
    logger.info(
      `\nTotal Aporte Mensual:\n${monthlyHealth.toNumber().toLocaleString('es-CO')} + ${monthlyPension.toNumber().toLocaleString('es-CO')} = ${monthlyTotalDeductions.toNumber().toLocaleString('es-CO')} COP\n`,
    );

    // Move the rest of the calculations to debug level
    const annualContributions = monthlyTotalDeductions.times(this.monthsInYear);
    logger.debug(`Annual contributions: ${annualContributions.toNumber()}`);

    const presumptiveCosts = annualIncome.times(this.presumptiveCostsRate);
    logger.debug(`Presumptive costs: ${presumptiveCosts.toNumber()}`);

    const taxableIncome = annualIncome.minus(presumptiveCosts).minus(annualContributions);
    logger.debug(`Taxable income: ${taxableIncome.toNumber()}`);
    const taxableIncomeUvt = this.calculateUvtValue(taxableIncome);
    logger.debug(`Taxable income in UVT: ${taxableIncomeUvt.toNumber()}`);

    let tax = new Decimal(0);

    TAX_BRACKETS.forEach(({ lowerLimit, upperLimit, rate }) => {
      if (taxableIncomeUvt.greaterThan(lowerLimit)) {
        const taxableAmount = Decimal.min(
          taxableIncomeUvt.minus(lowerLimit),
          new Decimal(upperLimit).minus(lowerLimit),
        );
        const taxForBracket = taxableAmount.times(rate).dividedBy(100).times(this.uvt);
        tax = tax.plus(taxForBracket);
        logger.debug(
          `Tax for bracket ${lowerLimit}-${upperLimit} UVT at rate ${rate}%: ${taxForBracket.toNumber()}`,
        );
      }
    });

    const monthlyTax = tax.dividedBy(this.monthsInYear);
    logger.debug(`Monthly tax amount: ${monthlyTax.toNumber()}`);
    const effectiveTaxRate = tax.dividedBy(annualIncome).times(100);
    logger.debug(`Effective tax rate: ${effectiveTaxRate.toNumber()}%`);
    const monthlyNetIncome = monthlyIncomeDecimal.minus(monthlyTotalDeductions);
    logger.debug(`Monthly net income: ${monthlyNetIncome.toNumber()}`);

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
    // Move all the detailed reporting to debug level
    logger.debug('\n=== REPORTE DE IMPUESTOS DETALLADO ===');
    logger.debug('\n--- Valores Mensuales ---');
    logger.debug(
      `Ingreso Mensual Bruto: $${taxDetails.monthlyIncome.toNumber().toLocaleString('es-CO')} COP`,
    );
    logger.debug(
      `Aportes a Salud (12.5% del IBC): $${taxDetails.monthlyHealth
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    logger.debug(
      `Aportes a Pensión (16% del IBC): $${taxDetails.monthlyPension
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    logger.debug(
      `Retención en la Fuente Mensual: $${taxDetails.monthlyTaxAmount
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    logger.debug(
      `Total Deducciones Mensuales: $${taxDetails.monthlyTotalDeductions
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    logger.debug(
      `Ingreso Neto Mensual: $${taxDetails.monthlyNetIncome.toNumber().toLocaleString('es-CO')} COP`,
    );

    logger.debug('\n--- Base Gravable ---');
    logger.debug(
      `Costos Presuntivos (25%): $${taxDetails.monthlyPresumptiveCosts
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    logger.debug(
      `Base Gravable Mensual: $${taxDetails.monthlyTaxableIncome
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    logger.debug('================================');
  }
}
