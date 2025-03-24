import Decimal from 'decimal.js';
import promptSync from 'prompt-sync';
import { TaxCalculator } from './services/tax-calculator.js';
import { logger } from './utils/logger.js';
import { isValidNumber, parseFormattedNumber } from './helpers/number.js';
import { formatCurrency } from './utils/format.js';

const prompt = promptSync({ sigint: true });

async function main() {
  try {
    const calculator = new TaxCalculator(2025);

    logger.info('Calculadora de Impuestos Colombia 2025');
    logger.info('=====================================');

    let monthlyIncome: string;
    let parsedIncome: number | null;

    do {
      monthlyIncome = prompt('Ingrese su salario mensual (COP): ');
      parsedIncome = parseFormattedNumber(monthlyIncome);

      if (!parsedIncome || !isValidNumber(monthlyIncome)) {
        logger.error(
          'Por favor ingrese un valor numérico válido mayor a 0 (ejemplo: 15.000.000 o 15,000,000)',
        );
      }
    } while (!parsedIncome || !isValidNumber(monthlyIncome));

    const taxDetails = calculator.calculateTax(parsedIncome);

    // Print a more comprehensive report
    logger.info('\n=== REPORTE DE IMPUESTOS 2025 ===\n');

    // Contributions
    logger.info('\n--- Aportes ---');
    logger.info(`Salud (12.5%): ${formatCurrency(taxDetails.monthlyHealth)}`);
    logger.info(`Pensión (16%): ${formatCurrency(taxDetails.monthlyPension)}`);
    const totalContributions = taxDetails.monthlyPension.plus(taxDetails.monthlyHealth);
    logger.info(`Total: ${formatCurrency(totalContributions)}`);

    logger.info('--- DETALLES DE CONTRIBUCIONES ---');
    // Monthly values
    logger.info('--- Valores Mensuales ---');
    logger.info(`Salario Mensual: ${formatCurrency(taxDetails.monthlyIncome)}`);
    logger.info(
      `Costos Presuntivos Mensuales (25%): ${formatCurrency(taxDetails.monthlyPresumptiveCosts || new Decimal(0))}`,
    );
    logger.info(`Base Gravable Mensual: ${formatCurrency(taxDetails.monthlyTaxableIncome)}`);
    logger.info(`Impuesto Mensual a Pagar: ${formatCurrency(taxDetails.monthlyTaxAmount)}`);

    // Annual values
    logger.info('\n--- Valores Anuales ---');
    logger.info(`Ingreso Anual: ${formatCurrency(taxDetails.annualIncome)}`);
    logger.info(
      `Costos Presuntivos Anuales (25%): ${formatCurrency(taxDetails.deductions?.presumptiveCosts || new Decimal(0))}`,
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
  } catch (error) {
    logger.error('Error al calcular impuestos:', error);
  }
}

main().catch((error) => {
  logger.error('Error fatal:', error);
  process.exit(1);
});
