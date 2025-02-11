import promptSync from 'prompt-sync';
import { ColombianTaxCalculator } from './services/colombian-tax-calculator.js';
import { logger } from './utils/logger.js';
import { isValidNumber, parseFormattedNumber } from './helpers/number.js';

const prompt = promptSync({ sigint: true });
const calculator = new ColombianTaxCalculator(2025);

function main() {
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
  logger.info(`Salary parsed ${parsedIncome}`);
  const taxDetails = calculator.calculateTax(parsedIncome);
  calculator.printTaxReport(taxDetails);
}

main();
