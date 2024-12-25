import Decimal from 'decimal.js';
import { TaxDetails } from '../types/tax.types.js';
import { UVT_2025, TAX_BRACKETS } from '../constants/tax-brackets.js';

export class ColombianTaxCalculator2025 {

  private readonly uvt2025: Decimal = new Decimal(UVT_2025);

  private readonly monthsInYear: number = 12;

  private calculateUvtValue(income: Decimal): Decimal {
    return income.dividedBy(this.uvt2025);
  }

  private convertMonthlyToAnnual(monthlyIncome: number): Decimal {
    return new Decimal(monthlyIncome).times(this.monthsInYear);
  }

  public calculateTax(monthlyIncome: number): TaxDetails {
    const annualIncome = this.convertMonthlyToAnnual(monthlyIncome);
    const presumptiveCosts = annualIncome.times(0.25);
    const taxableIncome = annualIncome.minus(presumptiveCosts);
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

    return {
      monthlyIncome: new Decimal(monthlyIncome),
      annualIncome,
      monthlyPresumptiveCosts: presumptiveCosts.dividedBy(this.monthsInYear),
      annualPresumptiveCosts: presumptiveCosts,
      monthlyTaxableIncome: taxableIncome.dividedBy(this.monthsInYear),
      annualTaxableIncome: taxableIncome,
      monthlyTaxAmount: monthlyTax,
      annualTaxAmount: tax,
      effectiveTaxRate,
    };
  }

  public printTaxReport(taxDetails: TaxDetails): void {
    console.log('\n=== REPORTE DE IMPUESTOS 2025 ===');
    console.log('\n--- Valores Mensuales ---');
    console.log(
      `Salario Mensual: $${taxDetails.monthlyIncome.toNumber().toLocaleString('es-CO')} COP`,
    );
    console.log(
      `Costos Presuntivos Mensuales (25%): $${taxDetails.monthlyPresumptiveCosts
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    console.log(
      `Base Gravable Mensual: $${taxDetails.monthlyTaxableIncome
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    console.log(
      `Impuesto Mensual a Pagar: $${taxDetails.monthlyTaxAmount
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );

    console.log('\n--- Valores Anuales ---');
    console.log(
      `Ingreso Anual: $${taxDetails.annualIncome.toNumber().toLocaleString('es-CO')} COP`,
    );
    console.log(
      `Costos Presuntivos Anuales (25%): $${taxDetails.annualPresumptiveCosts
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    console.log(
      `Base Gravable Anual: $${taxDetails.annualTaxableIncome
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    console.log(
      `Impuesto Anual a Pagar: $${taxDetails.annualTaxAmount
        .toNumber()
        .toLocaleString('es-CO')} COP`,
    );
    console.log(`Tasa Efectiva de Impuestos: ${taxDetails.effectiveTaxRate.toFixed(2)}%`);
    console.log('================================');
  }
}
