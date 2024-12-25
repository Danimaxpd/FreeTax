import Decimal from 'decimal.js';
import { TaxDetails } from '../types/tax.types.js';
import { UVT_VALUES, TAX_BRACKETS } from '../constants/tax-brackets.js';

export class ColombianTaxCalculator {
  private readonly uvt: Decimal;

  private readonly monthsInYear: number = 12;

  private readonly healthRate: Decimal = new Decimal(0.125); // 12.5%

  private readonly pensionRate: Decimal = new Decimal(0.16); // 16%

  private readonly contributionBase: Decimal = new Decimal(0.4); // 40% of income

  private readonly minimumWage: Decimal;

  constructor(year: number) {
    const uvtValue = UVT_VALUES[year];
    if (uvtValue === undefined) {
      throw new Error(`UVT value for year ${year} is not defined.`);
    }
    this.uvt = new Decimal(uvtValue);
    this.minimumWage = new Decimal(this.getMinimumWage(year));
  }

  private getMinimumWage(year: number): number {
    const minimumWages: { [year: number]: number } = {
      2025: 1300000, // Projected minimum wage for 2025
    };
    const wage = minimumWages[year];
    if (wage === undefined) {
      throw new Error(`Minimum wage for year ${year} is not defined.`);
    }
    return wage;
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
    console.log(`Calculating tax for monthly income: ${monthlyIncome}`);
    const monthlyIncomeDecimal = new Decimal(monthlyIncome);
    const annualIncome = this.convertMonthlyToAnnual(monthlyIncome);
    console.log(`Annual income: ${annualIncome.toNumber()}`);

    // Calculate monthly contributions
    const monthlyHealth = this.calculateHealthContribution(monthlyIncomeDecimal);
    console.log(`Monthly health contribution: ${monthlyHealth.toNumber()}`);
    const monthlyPension = this.calculatePensionContribution(monthlyIncomeDecimal);
    console.log(`Monthly pension contribution: ${monthlyPension.toNumber()}`);
    const annualContributions = monthlyHealth.plus(monthlyPension).times(this.monthsInYear);
    console.log(`Annual contributions: ${annualContributions.toNumber()}`);

    // Calculate taxable income
    const presumptiveCosts = annualIncome.times(0.25);
    console.log(`Presumptive costs (25% of annual income): ${presumptiveCosts.toNumber()}`);
    const taxableIncome = annualIncome.minus(presumptiveCosts).minus(annualContributions);
    console.log(`Taxable income: ${taxableIncome.toNumber()}`);
    const taxableIncomeUvt = this.calculateUvtValue(taxableIncome);
    console.log(`Taxable income in UVT: ${taxableIncomeUvt.toNumber()}`);

    let tax = new Decimal(0);

    TAX_BRACKETS.forEach(({ lowerLimit, upperLimit, rate }) => {
      if (taxableIncomeUvt.greaterThan(lowerLimit)) {
        const taxableAmount = Decimal.min(
          taxableIncomeUvt.minus(lowerLimit),
          new Decimal(upperLimit).minus(lowerLimit),
        );
        const taxForBracket = taxableAmount.times(rate).dividedBy(100).times(this.uvt);
        tax = tax.plus(taxForBracket);
        console.log(
          `Tax for bracket ${lowerLimit}-${upperLimit} UVT at rate ${rate}%: ${taxForBracket.toNumber()}`,
        );
      }
    });

    const monthlyTax = tax.dividedBy(this.monthsInYear);
    console.log(`Monthly tax amount: ${monthlyTax.toNumber()}`);
    const effectiveTaxRate = tax.dividedBy(annualIncome).times(100);
    console.log(`Effective tax rate: ${effectiveTaxRate.toNumber()}%`);
    const monthlyTotalDeductions = monthlyHealth.plus(monthlyPension).plus(monthlyTax);
    console.log(`Total monthly deductions: ${monthlyTotalDeductions.toNumber()}`);
    const monthlyNetIncome = monthlyIncomeDecimal.minus(monthlyTotalDeductions);
    console.log(`Monthly net income: ${monthlyNetIncome.toNumber()}`);

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
    console.log('\n=== REPORTE DE IMPUESTOS ===');
    console.log('\n--- Valores Mensuales ---');
    console.log(
      `Ingreso Mensual Bruto: $${taxDetails.monthlyIncome.toNumber().toLocaleString('es-CO')} COP`,
    );
    console.log(
      `Aportes a Salud (12.5% del IBC): $${taxDetails.monthlyHealth
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    console.log(
      `Aportes a Pensión (16% del IBC): $${taxDetails.monthlyPension
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    console.log(
      `Retención en la Fuente Mensual: $${taxDetails.monthlyTaxAmount
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    console.log(
      `Total Deducciones Mensuales: $${taxDetails.monthlyTotalDeductions
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    console.log(
      `Ingreso Neto Mensual: $${taxDetails.monthlyNetIncome.toNumber().toLocaleString('es-CO')} COP`,
    );

    console.log('\n--- Base Gravable ---');
    console.log(
      `Costos Presuntivos (25%): $${taxDetails.monthlyPresumptiveCosts
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    console.log(
      `Base Gravable Mensual: $${taxDetails.monthlyTaxableIncome
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    console.log('================================');
  }
}
