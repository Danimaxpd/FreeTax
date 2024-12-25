import promptSync from 'prompt-sync';
import { ColombianTaxCalculator } from './services/colombian-tax-calculator.js';

const prompt = promptSync({ sigint: true });
const calculator = new ColombianTaxCalculator(2025); // TODO: Update with an env variable

function isValidNumber(input: string): boolean {
  const num = Number(input);
  return !Number.isNaN(num) && num > 0;
}

function main() {
  console.log('Calculadora de Impuestos Colombia 2025');
  console.log('=====================================');

  let monthlyIncome: string;
  do {
    monthlyIncome = prompt('Ingrese su salario mensual (COP): ');
    if (!isValidNumber(monthlyIncome)) {
      console.log('Por favor ingrese un valor numérico válido mayor a 0');
    }
  } while (!isValidNumber(monthlyIncome));

  const taxDetails = calculator.calculateTax(Number(monthlyIncome));
  calculator.printTaxReport(taxDetails);
}

main();
