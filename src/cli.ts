import { readFileSync, realpathSync } from 'fs';
import { pathToFileURL } from 'url';
import promptSync from 'prompt-sync';
import Table from 'tty-table';
import {
  ARL_RISK_LEVELS,
  MONTH_NAMES_ES,
  getAvailableYears,
  getDefaultTaxYear,
  getTaxYearConfig,
} from './constants/tax-values';
import { isValidNumber, parseCurrencyInput, parseFormattedNumber } from './helpers/number';
import { TaxCalculator } from './services/tax-calculator';
import {
  AnnualTaxPlan,
  DeductionInputs,
  DeductionMode,
  TaxYearConfig,
} from './types/tax.types';
import { formatCOP } from './utils/format';
import { logger } from './utils/logger';

type PromptFn = (question: string) => string | null;

function createInputPrompter(): PromptFn {
  if (process.stdin.isTTY) {
    const syncPrompt = promptSync({ sigint: true });
    return (question: string) => syncPrompt(question);
  }

  let lines: string[] = [];
  try {
    lines = readFileSync(0, 'utf8').split(/\r?\n/);
  } catch {
    lines = [];
  }
  let lineIndex = 0;

  return (question: string) => {
    process.stdout.write(question);
    if (lineIndex >= lines.length) {
      return null;
    }
    const line = lines[lineIndex] ?? null;
    lineIndex += 1;
    if (line !== null) {
      process.stdout.write(`${line}\n`);
    }
    return line;
  };
}

function parseYearArg(argv: string[]): number | undefined {
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg) {
      // eslint-disable-next-line no-continue
      continue;
    }
    if (arg.startsWith('--year=')) {
      const value = Number(arg.slice('--year='.length));
      return Number.isFinite(value) ? value : undefined;
    }
    if (arg === '--year' && argv[i + 1]) {
      const value = Number(argv[i + 1]);
      return Number.isFinite(value) ? value : undefined;
    }
  }
  return undefined;
}

function promptText(ask: PromptFn, question: string): string | null {
  const answer = ask(question);
  return answer === null ? null : answer.trim();
}

function promptOptionalCop(ask: PromptFn, question: string, defaultValue = 0): number {
  let done = false;
  let result = defaultValue;

  while (!done) {
    const answer = promptText(ask, `${question} [${formatCOP(defaultValue)}]: `);
    if (answer === null || answer === '') {
      result = defaultValue;
      done = true;
    } else {
      const parsed = parseCurrencyInput(answer, { allowZero: true, min: 0 });
      if (parsed.value !== null) {
        result = parsed.value;
        done = true;
      } else {
        logger.error(parsed.error ?? 'Valor inválido.');
      }
    }
  }

  return result;
}

function promptDependentsCount(ask: PromptFn): number {
  let done = false;
  let dependentsCount = 0;

  while (!done) {
    const depStr = promptText(ask, 'Número de dependientes económicos (0-4) [0]: ');
    if (depStr === null || depStr === '') {
      dependentsCount = 0;
      done = true;
    } else {
      const depNum = Number(depStr);
      if (Number.isInteger(depNum) && depNum >= 0 && depNum <= 10) {
        dependentsCount = depNum;
        done = true;
      } else {
        logger.error('Ingrese un número entero mayor o igual a 0.');
      }
    }
  }

  return dependentsCount;
}

function promptArlRate(ask: PromptFn): number {
  let done = false;
  let arlRate = 0;

  while (!done) {
    const arlStr = promptText(ask, 'Nivel de riesgo ARL (0=Sin ARL, 1..5) [0]: ');
    if (arlStr === null || arlStr === '') {
      arlRate = 0;
      done = true;
    } else {
      const level = Number(arlStr);
      const found = ARL_RISK_LEVELS.find((item) => item.level === level);
      if (found) {
        arlRate = found.rate;
        done = true;
      } else {
        logger.error('Ingrese un nivel válido entre 0 y 5.');
      }
    }
  }

  return arlRate;
}

function promptDeductions(ask: PromptFn): DeductionInputs {
  const answer = promptText(
    ask,
    '¿Desea ingresar deducciones opcionales Ley 2277 (dependientes, prepagada, vivienda, FPV, costos)? (s/N): ',
  );
  if (!answer || !['s', 'si', 'sí', 'y', 'yes'].includes(answer.toLowerCase())) {
    return { deductionMode: 'auto' };
  }

  const dependentsCount = promptDependentsCount(ask);
  const prepaidHealthAnnual = promptOptionalCop(
    ask,
    'Medicina prepagada / seguros de salud anual (COP)',
  );
  const housingInterestAnnual = promptOptionalCop(
    ask,
    'Intereses de crédito de vivienda anual (COP)',
  );
  const voluntaryPensionAnnual = promptOptionalCop(
    ask,
    'Aportes voluntarios a pensión (FPV) / AFC anual (COP)',
  );
  const gmfAnnual = promptOptionalCop(ask, 'GMF (4x1000) pagado anual (COP)');
  const electronicInvoicePurchasesAnnual = promptOptionalCop(
    ask,
    'Compras con factura electrónica anual (COP)',
  );
  const actualCostsAnnual = promptOptionalCop(
    ask,
    'Costos y gastos procedentes reales anuales (COP)',
  );
  const withholdingsPaidAnnual = promptOptionalCop(
    ask,
    'Retención en la fuente ya practicada en el año (COP)',
  );
  const arlRate = promptArlRate(ask);

  let deductionMode: DeductionMode = 'auto';
  const modeStr = promptText(
    ask,
    'Modo de régimen: (1) Auto [Recomendado], (2) Renta Exenta 25%, (3) Costos Reales, (4) Clásico [1]: ',
  );
  if (modeStr === '2') {
    deductionMode = 'exempt25';
  } else if (modeStr === '3') {
    deductionMode = 'actualCosts';
  } else if (modeStr === '4') {
    deductionMode = 'legacyPresumptive';
  }

  return {
    deductionMode,
    dependentsCount,
    prepaidHealthAnnual,
    housingInterestAnnual,
    voluntaryPensionAnnual,
    gmfAnnual,
    electronicInvoicePurchasesAnnual,
    actualCostsAnnual,
    arlRate,
    withholdingsPaidAnnual,
  };
}

function promptTaxYear(ask: PromptFn, availableYears: number[], defaultYear: number): number {
  let done = false;
  let selectedYear = defaultYear;

  while (!done) {
    const yearInput = promptText(
      ask,
      `Año fiscal (${availableYears.join(', ')}) [${defaultYear}]: `,
    );
    if (yearInput === null || yearInput === '') {
      selectedYear = defaultYear;
      done = true;
    } else {
      const parsedYear = Number(yearInput);
      if (availableYears.includes(parsedYear)) {
        selectedYear = parsedYear;
        done = true;
      } else {
        logger.error(`Año no válido. Opciones disponibles: ${availableYears.join(', ')}`);
      }
    }
  }

  return selectedYear;
}

function promptIncomeMode(ask: PromptFn): '1' | '2' {
  let done = false;
  let incomeMode: '1' | '2' = '1';

  while (!done) {
    const modeInput = promptText(
      ask,
      'Modo de ingresos: (1) Fijo mensual  (2) Variable mes a mes [1]: ',
    );
    if (modeInput === null || modeInput === '' || modeInput === '1') {
      incomeMode = '1';
      done = true;
    } else if (modeInput === '2') {
      incomeMode = '2';
      done = true;
    } else {
      logger.error('Seleccione 1 para ingreso fijo o 2 para ingreso variable.');
    }
  }

  return incomeMode;
}

function promptFixedMonthlyIncome(ask: PromptFn): number | null {
  let parsedIncome: number | null = null;
  let cancelled = false;

  while (parsedIncome === null && !cancelled) {
    const rawIncome = promptText(ask, 'Ingrese su salario/honorarios mensual (COP): ');
    if (rawIncome === null) {
      cancelled = true;
    } else if (isValidNumber(rawIncome)) {
      parsedIncome = parseFormattedNumber(rawIncome);
    }

    if (parsedIncome === null && !cancelled) {
      logger.error(
        'Por favor ingrese un valor numérico válido mayor a 1.000.000 (ejemplo: 15.000.000 o 15,000,000)',
      );
    }
  }

  return parsedIncome;
}

function promptVariableMonthlyIncomes(ask: PromptFn): number[] {
  const monthlyArray: number[] = [];

  for (let i = 0; i < 12; i += 1) {
    const monthName = MONTH_NAMES_ES[i] ?? `Mes ${i + 1}`;
    let done = false;
    let monthIncome = 0;

    while (!done) {
      const rawMonth = promptText(ask, `Ingreso bruto de ${monthName} (COP) [0]: `);
      if (rawMonth === null || rawMonth === '') {
        monthIncome = 0;
        done = true;
      } else {
        const parsed = parseCurrencyInput(rawMonth, { allowZero: true, min: 0 });
        if (parsed.value !== null) {
          monthIncome = parsed.value;
          done = true;
        } else {
          logger.error(parsed.error ?? 'Monto inválido.');
        }
      }
    }

    monthlyArray.push(monthIncome);
  }

  return monthlyArray;
}

function renderAnnualReport(plan: AnnualTaxPlan, config: TaxYearConfig): void {
  logger.info(`\n=== REPORTE ANUAL DE IMPUESTOS Y PILA ${plan.year} ===`);
  if (config.lawLabel) {
    logger.info(`Normativa: ${config.lawLabel}`);
  }
  if (config.normativeRef) {
    logger.info(`Referencia oficial: ${config.normativeRef}`);
  }
  logger.info(
    `UVT ${plan.year}: ${formatCOP(plan.uvt)} | SMMLV ${plan.year}: ${formatCOP(plan.minimumWage)}`,
  );
  logger.info(`Régimen seleccionado: ${plan.selectedRegime.label}`);
  logger.info(
    `Régimen recomendado Ley 2277: ${plan.comparison[plan.recommendedMode].label} (ahorro vs alternativa: ${formatCOP(plan.taxSavedByRecommended)})`,
  );
  logger.info(`Ingreso Bruto Anual: ${formatCOP(plan.annualGrossIncome)}`);
  logger.info(
    `Total PILA Anual: ${formatCOP(plan.annualPilaTotal)} (Salud: ${formatCOP(plan.annualHealthTotal)}, Pensión: ${formatCOP(plan.annualPensionTotal)}, FSP: ${formatCOP(plan.annualFspTotal)}, ARL: ${formatCOP(plan.annualArlTotal)})`,
  );
  logger.info(`Impuesto de Renta Anual: ${formatCOP(plan.annualTaxTotal)}`);
  logger.info(`Retenciones ya pagadas: ${formatCOP(plan.withholdingsPaidAnnual)}`);
  logger.info(`Neto Anual a Ahorrar para Renta: ${formatCOP(plan.netAnnualTaxToSave)}`);
  logger.info(`Ingreso Neto Disponible Anual: ${formatCOP(plan.annualNetSpendableIncome)}`);
  logger.info(
    `Tasa Efectiva Renta: ${plan.effectiveTaxRate.toFixed(2)}% | Carga Total (PILA + Renta): ${plan.totalDeductionsAndPilaRate.toFixed(2)}%`,
  );

  const regimeHeader = [
    { value: 'Régimen', width: 42 },
    { value: 'Base Gravable', width: 18 },
    { value: 'Base UVT', width: 12 },
    { value: 'Impuesto Anual', width: 18 },
    { value: 'Tasa Ef.', width: 12 },
  ];
  const regimeRows = [
    plan.comparison.exempt25,
    plan.comparison.actualCosts,
    plan.comparison.legacyPresumptive,
  ].map((reg) => [
    reg.mode === plan.selectedMode ? `* ${reg.label}` : reg.label,
    formatCOP(reg.taxableIncomeAnnual),
    reg.taxableIncomeUvt.toFixed(1),
    formatCOP(reg.annualTaxCop),
    `${reg.effectiveTaxRate.toFixed(2)}%`,
  ]);

  const regimeTable = Table(regimeHeader, regimeRows, []);
  logger.info(`\n--- COMPARACIÓN DE REGÍMENES (LEY 2277 DE 2022) ---\n${regimeTable.render()}`);

  const monthHeader = [
    { value: 'Mes', width: 14 },
    { value: 'Bruto', width: 16 },
    { value: 'IBC', width: 15 },
    { value: 'Salud', width: 14 },
    { value: 'Pensión', width: 14 },
    { value: 'FSP', width: 13 },
    { value: 'Total PILA', width: 15 },
    { value: 'Ahorro Renta', width: 15 },
    { value: 'Acumulado', width: 16 },
    { value: 'Neto Disp.', width: 16 },
  ];
  const monthRows = plan.months.map((m) => [
    m.monthName,
    formatCOP(m.grossIncome),
    formatCOP(m.ibc),
    formatCOP(m.health),
    formatCOP(m.pension),
    formatCOP(m.fsp),
    formatCOP(m.totalPila),
    formatCOP(m.taxSavingsProvision),
    formatCOP(m.cumulativeTaxSaved),
    formatCOP(m.netSpendableIncome),
  ]);

  const monthTable = Table(monthHeader, monthRows, []);
  logger.info(`\n--- PLAN MENSUAL DE AHORRO Y FLUJO DE CAJA ---\n${monthTable.render()}`);
}

export async function runCli(argv: string[] = process.argv.slice(2)): Promise<void> {
  const ask = createInputPrompter();
  const availableYears = getAvailableYears();
  const defaultYear = getDefaultTaxYear();

  try {
    let selectedYear = parseYearArg(argv);

    if (selectedYear !== undefined) {
      getTaxYearConfig(selectedYear);
    } else {
      selectedYear = promptTaxYear(ask, availableYears, defaultYear);
    }

    const calculator = new TaxCalculator(selectedYear);
    const activeConfig = calculator.getConfig();

    logger.info(`\nCalculadora de Impuestos Colombia ${selectedYear}`);
    if (activeConfig.lawLabel) {
      logger.info(`Ley aplicable: ${activeConfig.lawLabel}`);
    }
    logger.info('=====================================');

    const incomeMode = promptIncomeMode(ask);
    let incomes: number | number[];

    if (incomeMode === '1') {
      const fixedIncome = promptFixedMonthlyIncome(ask);
      if (fixedIncome === null) {
        logger.error('Entrada cancelada.');
        return;
      }
      incomes = fixedIncome;
    } else {
      incomes = promptVariableMonthlyIncomes(ask);
    }

    const deductions = promptDeductions(ask);
    const plan = calculator.calculateAnnualPlan(incomes, deductions);
    renderAnnualReport(plan, activeConfig);
  } catch (error: unknown) {
    logger.error(
      `Error al calcular impuestos: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function isCliEntryPoint(): boolean {
  if (typeof process === 'undefined' || !Array.isArray(process.argv)) {
    return false;
  }

  const entryPath = process.argv[1];
  if (!entryPath) {
    return false;
  }

  try {
    return import.meta.url === pathToFileURL(realpathSync(entryPath)).href;
  } catch {
    return false;
  }
}

if (isCliEntryPoint()) {
  runCli().catch((error: unknown) => {
    logger.error(`Error fatal: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
