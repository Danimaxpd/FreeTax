import Table from 'tty-table';
import Decimal from 'decimal.js';
import { TaxDetails } from '../types/tax.types';
import { TAX_YEARS, TAX_BRACKETS, ValidTaxYear } from '../constants/tax-values';
import { logger } from '../utils/logger';

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
    const values = TAX_YEARS[this.year];
    if (!values) {
      throw new Error(`Tax values for year ${year} are not defined.`);
    }

    this.uvt = new Decimal(values.uvt);
    this.minimumWage = new Decimal(values.minimumWage);
    this.healthRate = new Decimal(values.contributions.health.rate);
    this.pensionRate = new Decimal(values.contributions.pension.rate);
    this.contributionBase = new Decimal(values.contributions.health.base);
    this.presumptiveCostsRate = new Decimal(values.deductions.presumptiveCosts);
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
    // 1. Basic calculations
    const monthlyIncomeDecimal = new Decimal(monthlyIncome);
    const annualIncome = this.convertMonthlyToAnnual(monthlyIncome);
    const ibc = this.calculateIBC(monthlyIncomeDecimal);

    // 2. Monthly contributions
    const monthlyHealth = this.calculateHealthContribution(monthlyIncomeDecimal);
    const monthlyPension = this.calculatePensionContribution(monthlyIncomeDecimal);
    const monthlyTotalDeductions = monthlyHealth.plus(monthlyPension);
    const annualContributions = monthlyTotalDeductions.times(this.monthsInYear);

    // 3. Tax calculations
    const presumptiveCosts = annualIncome.times(this.presumptiveCostsRate);
    const taxableIncome = annualIncome.minus(presumptiveCosts).minus(annualContributions);
    const taxableIncomeUvt = this.calculateUvtValue(taxableIncome);

    // 4. Calculate tax by brackets
    let tax = new Decimal(0);
    TAX_BRACKETS.forEach(({ lowerLimit, upperLimit, rate }) => {
      if (taxableIncomeUvt.greaterThan(lowerLimit)) {
        const taxableAmount = Decimal.min(
          taxableIncomeUvt.minus(lowerLimit),
          new Decimal(upperLimit).minus(lowerLimit),
        );
        const taxForBracket = taxableAmount.times(rate).dividedBy(100).times(this.uvt);
        tax = tax.plus(taxForBracket);
      }
    });

    // 5. Final calculations
    const monthlyTax = tax.dividedBy(this.monthsInYear);
    const effectiveTaxRate = tax.dividedBy(annualIncome).times(100);
    const monthlyNetIncome = monthlyIncomeDecimal.minus(monthlyTotalDeductions).minus(monthlyTax);

    // 6. Debug logging
    this.logDebugInformation({
      annualIncome,
      annualContributions,
      presumptiveCosts,
      taxableIncome,
      taxableIncomeUvt,
      tax,
      monthlyTax,
      effectiveTaxRate,
      monthlyNetIncome,
    });

    // 7. Display summary table
    this.displaySummaryTable({
      monthlyIncomeDecimal,
      ibc,
      monthlyHealth,
      monthlyPension,
      monthlyTotalDeductions,
      monthlyTax,
    });

    // 8. Return tax details using the new structure
    return {
      monthlyIncome: monthlyIncomeDecimal,
      annualIncome,
      effectiveTaxRate,
      monthlyTotalDeductions,
      monthlyNetIncome,
      monthlyTaxableIncome: taxableIncome.dividedBy(this.monthsInYear),
      annualTaxableIncome: taxableIncome,
      monthlyTaxAmount: monthlyTax,
      annualTaxAmount: tax,
      monthlyHealth,
      monthlyPension,
      monthlyPresumptiveCosts: presumptiveCosts.dividedBy(this.monthsInYear),
      contributions: {
        health: {
          base: ibc,
          amount: monthlyHealth,
        },
        pension: {
          base: ibc,
          amount: monthlyPension,
        },
      },
      deductions: {
        presumptiveCosts,
        totalContributions: annualContributions,
      },
      tax: {
        taxableIncome,
        annualAmount: tax,
        monthlyAmount: monthlyTax,
        effectiveRate: effectiveTaxRate,
      },
      summary: {
        totalMonthlyDeductions: monthlyTotalDeductions.plus(monthlyTax),
        monthlyNetIncome,
      },
    };
  }

  private displaySummaryTable(params: {
    monthlyIncomeDecimal: Decimal;
    ibc: Decimal;
    monthlyHealth: Decimal;
    monthlyPension: Decimal;
    monthlyTotalDeductions: Decimal;
    monthlyTax: Decimal;
  }): void {
    const {
      monthlyIncomeDecimal,
      ibc,
      monthlyHealth,
      monthlyPension,
      monthlyTotalDeductions,
      monthlyTax,
    } = params;

    const header = [
      { value: 'Concepto', width: 20 },
      { value: 'Cálculo', width: 40 },
      { value: 'Valor (COP)', width: 20 },
    ];

    const rows = [
      [
        'IBC',
        `${monthlyIncomeDecimal.toNumber().toLocaleString('es-CO')} × ${this.contributionBase.times(100).toNumber()}%`,
        ibc.toNumber().toLocaleString('es-CO'),
      ],
      [
        'Salud',
        `${ibc.toNumber().toLocaleString('es-CO')} × ${this.healthRate.times(100).toNumber()}%`,
        monthlyHealth.toNumber().toLocaleString('es-CO'),
      ],
      [
        'Pensión',
        `${ibc.toNumber().toLocaleString('es-CO')} × ${this.pensionRate.times(100).toNumber()}%`,
        monthlyPension.toNumber().toLocaleString('es-CO'),
      ],
      ['Retención en la Fuente', 'Cálculo por UVT', monthlyTax.toNumber().toLocaleString('es-CO')],
      [
        'Total Deducciones',
        '',
        monthlyTotalDeductions.plus(monthlyTax).toNumber().toLocaleString('es-CO'),
      ],
    ];

    const table = Table(header, rows, []);
    logger.info('\n=== RESUMEN DE APORTES Y RETENCIONES MENSUALES ===\n');
    logger.info(`\n${table.render()}`);
  }

  private logDebugInformation(params: {
    annualIncome: Decimal;
    annualContributions: Decimal;
    presumptiveCosts: Decimal;
    taxableIncome: Decimal;
    taxableIncomeUvt: Decimal;
    tax: Decimal;
    monthlyTax: Decimal;
    effectiveTaxRate: Decimal;
    monthlyNetIncome: Decimal;
  }): void {
    const {
      annualIncome,
      annualContributions,
      presumptiveCosts,
      taxableIncome,
      taxableIncomeUvt,
      tax,
      monthlyTax,
      effectiveTaxRate,
      monthlyNetIncome,
    } = params;

    logger.debug(`Annual income: ${annualIncome.toNumber()}`);
    logger.debug(`Annual contributions: ${annualContributions.toNumber()}`);
    logger.debug(`Presumptive costs: ${presumptiveCosts.toNumber()}`);
    logger.debug(`Taxable income: ${taxableIncome.toNumber()}`);
    logger.debug(`Taxable income in UVT: ${taxableIncomeUvt.toNumber()}`);
    logger.debug(`Annual tax: ${tax.toNumber()}`);
    logger.debug(`Monthly tax amount: ${monthlyTax.toNumber()}`);
    logger.debug(`Effective tax rate: ${effectiveTaxRate.toNumber()}%`);
    logger.debug(`Monthly net income: ${monthlyNetIncome.toNumber()}`);
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
      `Costos Presuntivos (25%): $${taxDetails.monthlyPresumptiveCosts?.toNumber().toLocaleString('es-CO')} COP`,
    );
    logger.debug(
      `Base Gravable Mensual: $${taxDetails.monthlyTaxableIncome
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    logger.debug('================================');
  }
}
