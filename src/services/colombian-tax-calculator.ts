import Decimal from 'decimal.js';
import { TaxDetails } from '../types/tax.types.js';
import { UVT_2025, TAX_BRACKETS } from '../constants/tax-brackets.js';

export class ColombianTaxCalculator2025 { 
  private readonly uvt2025: Decimal = new Decimal(UVT_2025);

  private readonly monthsInYear: number = 12;

  private readonly healthRate: Decimal = new Decimal(0.125); // 12.5%

  private readonly pensionRate: Decimal = new Decimal(0.16); // 16%

  private readonly contributionBase: Decimal = new Decimal(0.4); // 40% of income

  private readonly minimumWage2025: Decimal = new Decimal(1300000); // Projected minimum wage 2025

  private calculateUvtValue(income: Decimal): Decimal {
    return income.dividedBy(this.uvt2025);
  }

  private convertMonthlyToAnnual(monthlyIncome: number): Decimal {
    return new Decimal(monthlyIncome).times(this.monthsInYear);
  }

  private calculateIBC(monthlyIncome: Decimal): Decimal {
    const ibc = monthlyIncome.times(this.contributionBase);
    return Decimal.max(ibc, this.minimumWage2025);
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

    // Calculate monthly contributions
    const monthlyHealth = this.calculateHealthContribution(monthlyIncomeDecimal);
    const monthlyPension = this.calculatePensionContribution(monthlyIncomeDecimal);
    const annualContributions = monthlyHealth.plus(monthlyPension).times(this.monthsInYear);

    // Calculate taxable income
    const presumptiveCosts = annualIncome.times(0.25);
    const taxableIncome = annualIncome.minus(presumptiveCosts).minus(annualContributions);
    const taxableIncomeUvt = this.calculateUvtValue(taxableIncome);

    let tax = new Decimal(0);

    TAX_BRACKETS.forEach(({ lowerLimit, upperLimit, rate }) => {
      if (taxableIncomeUvt.greaterThan(lowerLimit)) {
        const taxableAmount = Decimal.min(
          taxableIncomeUvt.minus(lowerLimit),
          new Decimal(upperLimit).minus(lowerLimit),
        );
        const taxForBracket = taxableAmount.times(rate).dividedBy(100).times(this.uvt2025);
        tax = tax.plus(taxForBracket);
      }
    });

    const monthlyTax = tax.dividedBy(this.monthsInYear);
    const effectiveTaxRate = tax.dividedBy(annualIncome).times(100);
    const monthlyTotalDeductions = monthlyHealth.plus(monthlyPension).plus(monthlyTax);
    const monthlyNetIncome = monthlyIncomeDecimal.minus(monthlyTotalDeductions);

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
    console.log('\n=== REPORTE DE IMPUESTOS 2025 ===');
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
