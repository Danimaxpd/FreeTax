import Decimal from 'decimal.js';
import promptSync from 'prompt-sync';
import { TaxCalculator } from './services/tax-calculator.js';
import { logger } from './utils/logger.js';
import { isValidNumber, parseFormattedNumber } from './helpers/number.js';
import { formatCurrency } from './utils/format.js';

const prompt = promptSync({ sigint: true });

async function main() {
  const year = 2026;
  
  try {
    const calculator = new TaxCalculator(year);

    logger.info(`Calculadora de Impuestos Colombia ${year}`);
    logger.info('=====================================');

    let monthlyIncome: string;
    let parsedIncome: number | null;

    do {
      monthlyIncome = prompt('Ingrese su salario mensual (COP): ');
      parsedIncome = parseFormattedNumber(monthlyIncome);

      if (!parsedIncome || !isValidNumber(monthlyIncome)) {
        logger.error(
          'Por favor ingrese un valor numérico válido mayor a 1.000.000 (ejemplo: 15.000.000 o 15,000,000)',
        );
      }
    } while (!parsedIncome || !isValidNumber(monthlyIncome));

    const taxDetails = calculator.calculateTax(parsedIncome);
    const rates = calculator.getRates();

    // Print a more comprehensive report
    logger.info(`\n=== REPORTE DE IMPUESTOS ${year} ===\n`);

    // Contributions
    logger.info('\n--- Aportes ---');
    logger.info(`Salud (${rates.health}%): ${formatCurrency(taxDetails.monthlyHealth)}`);
    logger.info(`Pensión (${rates.pension}%): ${formatCurrency(taxDetails.monthlyPension)}`);
    const totalContributions = taxDetails.monthlyPension.plus(taxDetails.monthlyHealth);
    logger.info(`Total: ${formatCurrency(totalContributions)}`);

    logger.info('--- DETALLES DE CONTRIBUCIONES ---');
    // Monthly values
    logger.info('--- Valores Mensuales ---');
    logger.info(`Salario Mensual: ${formatCurrency(taxDetails.monthlyIncome)}`);
    logger.info(
      `Costos Presuntivos Mensuales (${rates.presumptiveCosts}%): ${formatCurrency(taxDetails.monthlyPresumptiveCosts || new Decimal(0))}`,
    );
    logger.info(`Base Gravable Mensual: ${formatCurrency(taxDetails.monthlyTaxableIncome)}`);
    logger.info(`Impuesto Mensual a Pagar: ${formatCurrency(taxDetails.monthlyTaxAmount)}`);

    // Annual values
    logger.info('\n--- Valores Anuales ---');
    logger.info(`Ingreso Anual: ${formatCurrency(taxDetails.annualIncome)}`);
    logger.info(
      `Costos Presuntivos Anuales (${rates.presumptiveCosts}%): ${formatCurrency(taxDetails.deductions?.presumptiveCosts || new Decimal(0))}`,
    );
    logger.info(`Base Gravable Anual: ${formatCurrency(taxDetails.annualTaxableIncome)}`);
    logger.info(`Impuesto Anual a Pagar: ${formatCurrency(taxDetails.annualTaxAmount)}`);
    logger.info(`Tasa Efectiva de Impuestos: ${taxDetails.effectiveTaxRate.toFixed(2)}%`);

    // Summary
    logger.info('\n--- Resumen ---');
    logger.info(
      `Total Deducciones Mensuales: ${formatCurrency(taxDetails.monthlyTotalDeductions)}`,
    );
    logger.info(`Ingreso Neto Mensual: ${formatCurrency(taxDetails.monthlyNetIncome)}`);
    logger.info('================================');
  } catch (e: unknown) {
    logger.error(`Error al calcular impuestos: ${e instanceof Error ? e.message : String(e)}`);
  }
}

main().catch((error) => {
  logger.error('Error fatal:', error);
  process.exit(1);
});
