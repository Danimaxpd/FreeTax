import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getAvailableYears,
  getTaxYearConfig,
  registerTaxYearConfig,
} from '../constants/tax-values';
import { parseCurrencyInput } from '../helpers/number';
import { TaxCalculator } from '../services/tax-calculator';
import {
  AnnualTaxPlan,
  DeductionInputs,
  DeductionMode,
  TaxYearConfig,
} from '../types/tax.types';
import { DeductionFormState, DeductionsPanel } from './components/DeductionsPanel';
import { HeaderYearSelector } from './components/HeaderYearSelector';
import { IncomeMode, IncomePanel } from './components/IncomePanel';
import { KpiCards } from './components/KpiCards';
import { MonthlyCashFlowTable } from './components/MonthlyCashFlowTable';
import { RegimeComparison } from './components/RegimeComparison';
import { YearConfigModal } from './components/YearConfigModal';

const STORAGE_KEY_SCENARIO = 'freetax_colombia_scenario_v1';
const STORAGE_KEY_AUTOSAVE = 'freetax_colombia_autosave_v1';

interface SavedScenarioPayload {
  version: number;
  selectedYear: number;
  incomeMode: IncomeMode;
  fixedIncomeText: string;
  monthlyIncomeTexts: string[];
  deductionForm: DeductionFormState;
  customYears?: Array<{ year: number; config: TaxYearConfig }>;
}

const DEFAULT_DEDUCTION_FORM: DeductionFormState = {
  deductionMode: 'auto',
  dependentsCount: '0',
  prepaidHealthPeriod: 'annual',
  prepaidHealthText: '0',
  housingInterestText: '0',
  voluntaryPensionText: '0',
  actualCostsText: '0',
  electronicInvoicePurchasesText: '0',
  gmfText: '0',
  arlRate: '0',
  withholdingsPaidText: '0',
};

function createDefaultMonthlyTexts(): string[] {
  return Array.from({ length: 12 }, () => '15.000.000');
}

function safeParseCurrency(text: string): number {
  const parsed = parseCurrencyInput(text, { allowZero: true, min: 0 });
  return parsed.value ?? 0;
}

function cloneTaxYearConfig(config: TaxYearConfig): TaxYearConfig {
  return {
    ...config,
    contributions: {
      health: { ...config.contributions.health },
      pension: { ...config.contributions.pension },
    },
    deductions: { ...config.deductions },
    brackets: config.brackets.map((b) => ({ ...b })),
    caps: config.caps ? { ...config.caps } : undefined,
    fspBrackets: config.fspBrackets ? config.fspBrackets.map((b) => ({ ...b })) : undefined,
  };
}

const INITIAL_BUILTIN_YEARS: Array<{ year: number; config: TaxYearConfig }> =
  getAvailableYears().map((year) => ({
    year,
    config: cloneTaxYearConfig(getTaxYearConfig(year)),
  }));

function isValidTaxYearConfig(config: unknown): config is TaxYearConfig {
  if (!config || typeof config !== 'object') return false;
  const c = config as Partial<TaxYearConfig>;
  if (typeof c.uvt !== 'number' || !Number.isFinite(c.uvt) || c.uvt <= 0) return false;
  if (typeof c.minimumWage !== 'number' || !Number.isFinite(c.minimumWage) || c.minimumWage <= 0) {
    return false;
  }
  if (!Array.isArray(c.brackets) || c.brackets.length === 0) return false;
  const validBrackets = c.brackets.every(
    (b) =>
      b &&
      typeof b === 'object' &&
      typeof b.lowerLimit === 'number' &&
      Number.isFinite(b.lowerLimit) &&
      typeof b.rate === 'number' &&
      Number.isFinite(b.rate),
  );
  if (!validBrackets) return false;

  const health = c.contributions?.health;
  const pension = c.contributions?.pension;
  if (
    !health ||
    !pension ||
    typeof health.rate !== 'number' ||
    !Number.isFinite(health.rate) ||
    health.rate <= 0 ||
    typeof health.base !== 'number' ||
    !Number.isFinite(health.base) ||
    health.base <= 0 ||
    typeof pension.rate !== 'number' ||
    !Number.isFinite(pension.rate) ||
    pension.rate <= 0 ||
    typeof pension.base !== 'number' ||
    !Number.isFinite(pension.base) ||
    pension.base <= 0
  ) {
    return false;
  }

  const presumptive = c.deductions?.presumptiveCosts;
  if (typeof presumptive !== 'number' || !Number.isFinite(presumptive) || presumptive < 0) {
    return false;
  }
  return true;
}

function normalizeCustomYearEntries(
  rawEntries: unknown,
  strict: boolean,
): Array<{ year: number; config: TaxYearConfig }> {
  if (!Array.isArray(rawEntries)) return [];
  const valid: Array<{ year: number; config: TaxYearConfig }> = [];
  rawEntries.forEach((entry) => {
    const candidate = entry as { year?: unknown; config?: unknown } | null;
    if (
      !candidate ||
      typeof candidate !== 'object' ||
      typeof candidate.year !== 'number' ||
      !Number.isInteger(candidate.year) ||
      candidate.year < 2020 ||
      candidate.year > 2100 ||
      !isValidTaxYearConfig(candidate.config)
    ) {
      if (strict) {
        throw new Error('Configuración de año personalizado inválida en el archivo.');
      }
      return;
    }

    const normalizedBrackets = candidate.config.brackets.map((b) => ({
      ...b,
      upperLimit: b.upperLimit === null ? Infinity : b.upperLimit,
    }));
    const normalizedFsp = candidate.config.fspBrackets?.map((b) => ({
      ...b,
      maxSmmlv: b.maxSmmlv === null ? Infinity : b.maxSmmlv,
    }));

    valid.push({
      year: candidate.year,
      config: {
        ...candidate.config,
        brackets: normalizedBrackets,
        fspBrackets: normalizedFsp,
      },
    });
  });
  return valid;
}

export const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [autoSave, setAutoSave] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY_AUTOSAVE) === 'true';
    } catch {
      return false;
    }
  });

  const [availableYears, setAvailableYears] = useState<number[]>(() => getAvailableYears());
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [incomeMode, setIncomeMode] = useState<IncomeMode>('fixed');
  const [fixedIncomeText, setFixedIncomeText] = useState<string>('15.000.000');
  const [monthlyIncomeTexts, setMonthlyIncomeTexts] = useState<string[]>(createDefaultMonthlyTexts);
  const [deductionForm, setDeductionForm] = useState<DeductionFormState>(DEFAULT_DEDUCTION_FORM);
  const [customYears, setCustomYears] = useState<Array<{ year: number; config: TaxYearConfig }>>([]);
  const [showYearModal, setShowYearModal] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Hydrate once on mount if auto-save was previously enabled
  useEffect(() => {
    try {
      const enabled = window.localStorage.getItem(STORAGE_KEY_AUTOSAVE) === 'true';
      if (!enabled) return;
      const raw = window.localStorage.getItem(STORAGE_KEY_SCENARIO);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SavedScenarioPayload>;
      const validCustomYears = normalizeCustomYearEntries(parsed.customYears, false);
      if (validCustomYears.length > 0) {
        validCustomYears.forEach((entry) => {
          registerTaxYearConfig(entry.year, entry.config);
        });
        setCustomYears(validCustomYears);
      }
      const nextYears = getAvailableYears();
      setAvailableYears(nextYears);
      if (typeof parsed.selectedYear === 'number' && nextYears.includes(parsed.selectedYear)) {
        setSelectedYear(parsed.selectedYear);
      }
      if (parsed.incomeMode === 'fixed' || parsed.incomeMode === 'variable') {
        setIncomeMode(parsed.incomeMode);
      }
      if (typeof parsed.fixedIncomeText === 'string') {
        setFixedIncomeText(parsed.fixedIncomeText);
      }
      if (Array.isArray(parsed.monthlyIncomeTexts) && parsed.monthlyIncomeTexts.length === 12) {
        setMonthlyIncomeTexts(parsed.monthlyIncomeTexts.map((v) => String(v)));
      }
      if (parsed.deductionForm && typeof parsed.deductionForm === 'object') {
        setDeductionForm((prev) => ({ ...prev, ...parsed.deductionForm }));
      }
    } catch {
      // Ignore corrupt localStorage payload
    }
  }, []);

  // Persist scenario when auto-save is enabled
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_AUTOSAVE, String(autoSave));
      if (autoSave) {
        const payload: SavedScenarioPayload = {
          version: 1,
          selectedYear,
          incomeMode,
          fixedIncomeText,
          monthlyIncomeTexts,
          deductionForm,
          customYears,
        };
        window.localStorage.setItem(STORAGE_KEY_SCENARIO, JSON.stringify(payload));
      }
    } catch {
      // Ignore storage quota / privacy mode errors
    }
  }, [
    autoSave,
    selectedYear,
    incomeMode,
    fixedIncomeText,
    monthlyIncomeTexts,
    deductionForm,
    customYears,
  ]);

  const activeConfig = useMemo(() => {
    try {
      return getTaxYearConfig(selectedYear);
    } catch {
      const fallbackYear = availableYears[availableYears.length - 1] ?? 2026;
      return getTaxYearConfig(fallbackYear);
    }
  }, [selectedYear, availableYears]);

  const plan: AnnualTaxPlan = useMemo(() => {
    const calculator = new TaxCalculator(activeConfig);
    const incomes: number | number[] =
      incomeMode === 'fixed'
        ? safeParseCurrency(fixedIncomeText)
        : monthlyIncomeTexts.map((txt) => safeParseCurrency(txt));

    const depsParsed = Number.parseInt(deductionForm.dependentsCount, 10);
    const dependentsCount =
      Number.isFinite(depsParsed) && depsParsed > 0 ? Math.min(depsParsed, 20) : 0;

    const prepaidRaw = safeParseCurrency(deductionForm.prepaidHealthText);
    const prepaidHealthAnnual =
      deductionForm.prepaidHealthPeriod === 'monthly' ? prepaidRaw * 12 : prepaidRaw;

    const inputs: DeductionInputs = {
      deductionMode: deductionForm.deductionMode,
      dependentsCount,
      prepaidHealthAnnual,
      housingInterestAnnual: safeParseCurrency(deductionForm.housingInterestText),
      voluntaryPensionAnnual: safeParseCurrency(deductionForm.voluntaryPensionText),
      actualCostsAnnual: safeParseCurrency(deductionForm.actualCostsText),
      electronicInvoicePurchasesAnnual: safeParseCurrency(
        deductionForm.electronicInvoicePurchasesText,
      ),
      gmfAnnual: safeParseCurrency(deductionForm.gmfText),
      arlRate: Number.parseFloat(deductionForm.arlRate) || 0,
      withholdingsPaidAnnual: safeParseCurrency(deductionForm.withholdingsPaidText),
    };

    return calculator.calculateAnnualPlan(incomes, inputs);
  }, [activeConfig, incomeMode, fixedIncomeText, monthlyIncomeTexts, deductionForm]);

  const handleChangeDeductionField = <K extends keyof DeductionFormState>(
    key: K,
    value: DeductionFormState[K],
  ) => {
    setDeductionForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleChangeMonthlyIncome = (monthIndex: number, value: string) => {
    setMonthlyIncomeTexts((prev) => prev.map((item, idx) => (idx === monthIndex ? value : item)));
  };

  const handleCopyJanuaryToAll = () => {
    const janValue = monthlyIncomeTexts[0] ?? '0';
    setMonthlyIncomeTexts(Array.from({ length: 12 }, () => janValue));
    setStatusBanner({
      type: 'info',
      text: 'Ingreso de enero copiado a los 12 meses.',
    });
  };

  const handleApplyPreset = (amount: number) => {
    const formatted = amount.toLocaleString('es-CO');
    if (incomeMode === 'fixed') {
      setFixedIncomeText(formatted);
    } else {
      setMonthlyIncomeTexts(Array.from({ length: 12 }, () => formatted));
    }
  };

  const handleYearRegistered = (year: number) => {
    const registeredConfig = getTaxYearConfig(year);
    setCustomYears((prev) => {
      const filtered = prev.filter((item) => item.year !== year);
      return [...filtered, { year, config: registeredConfig }];
    });
    setAvailableYears(getAvailableYears());
    setSelectedYear(year);
    setStatusBanner({
      type: 'success',
      text: `Año fiscal ${year} registrado en memoria correctamente.`,
    });
  };

  const handleExportJson = () => {
    const payload: SavedScenarioPayload = {
      version: 1,
      selectedYear,
      incomeMode,
      fixedIncomeText,
      monthlyIncomeTexts,
      deductionForm,
      customYears,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `freetax-escenario-${selectedYear}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatusBanner({
      type: 'success',
      text: `Escenario ${selectedYear} exportado a JSON.`,
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<SavedScenarioPayload>;
      if (!parsed || typeof parsed !== 'object' || typeof parsed.selectedYear !== 'number') {
        throw new Error('Estructura de archivo JSON inválida.');
      }

      const validCustomYears = normalizeCustomYearEntries(parsed.customYears, true);
      const candidateYears = new Set([
        ...getAvailableYears(),
        ...validCustomYears.map((entry) => entry.year),
      ]);
      if (!candidateYears.has(parsed.selectedYear)) {
        throw new Error(`El año fiscal ${parsed.selectedYear} no está registrado.`);
      }

      if (validCustomYears.length > 0) {
        validCustomYears.forEach((entry) => {
          registerTaxYearConfig(entry.year, entry.config);
        });
        setCustomYears(validCustomYears);
        setAvailableYears(getAvailableYears());
      }

      setSelectedYear(parsed.selectedYear);
      if (parsed.incomeMode === 'fixed' || parsed.incomeMode === 'variable') {
        setIncomeMode(parsed.incomeMode);
      }
      if (typeof parsed.fixedIncomeText === 'string') {
        setFixedIncomeText(parsed.fixedIncomeText);
      }
      if (Array.isArray(parsed.monthlyIncomeTexts) && parsed.monthlyIncomeTexts.length === 12) {
        setMonthlyIncomeTexts(parsed.monthlyIncomeTexts.map((v) => String(v)));
      }
      if (parsed.deductionForm && typeof parsed.deductionForm === 'object') {
        setDeductionForm({ ...DEFAULT_DEDUCTION_FORM, ...parsed.deductionForm });
      }

      setStatusBanner({
        type: 'success',
        text: `Escenario importado desde "${file.name}".`,
      });
    } catch (err) {
      setStatusBanner({
        type: 'error',
        text: `No se pudo importar el JSON: ${err instanceof Error ? err.message : 'archivo inválido'}`,
      });
    }
  };

  const handleResetDefaults = () => {
    INITIAL_BUILTIN_YEARS.forEach((entry) => {
      registerTaxYearConfig(entry.year, cloneTaxYearConfig(entry.config));
    });
    setCustomYears([]);
    setAvailableYears(getAvailableYears());
    setSelectedYear(2026);
    setIncomeMode('fixed');
    setFixedIncomeText('15.000.000');
    setMonthlyIncomeTexts(createDefaultMonthlyTexts());
    setDeductionForm(DEFAULT_DEDUCTION_FORM);
    try {
      window.localStorage.removeItem(STORAGE_KEY_SCENARIO);
    } catch {
      // Ignore storage error
    }
    setStatusBanner({
      type: 'info',
      text: 'Valores restablecidos a la configuración predeterminada.',
    });
  };

  const handleSelectRegimeCard = (mode: 'exempt25' | 'actualCosts' | 'legacyPresumptive') => {
    handleChangeDeductionField('deductionMode', mode as DeductionMode);
  };

  return (
    <div className="app-shell">
      <HeaderYearSelector
        availableYears={availableYears}
        selectedYear={selectedYear}
        config={activeConfig}
        onSelectYear={setSelectedYear}
        onOpenYearModal={() => setShowYearModal(true)}
      />

      <div className="action-bar">
        <div className="action-bar-group">
          <label className="autosave-toggle">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
            />
            Auto-guardar en navegador (localStorage)
          </label>
        </div>

        <div className="action-bar-group">
          <button type="button" className="btn" onClick={handleExportJson}>
            Exportar JSON
          </button>
          <button type="button" className="btn" onClick={handleImportClick}>
            Importar JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          <button type="button" className="btn btn-danger-ghost" onClick={handleResetDefaults}>
            Restablecer
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className={`alert-banner alert-${statusBanner.type}`} role="status">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{statusBanner.text}</span>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setStatusBanner(null)}
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <KpiCards plan={plan} config={activeConfig} />

      <div className="main-grid">
        <div>
          <IncomePanel
            incomeMode={incomeMode}
            fixedIncomeText={fixedIncomeText}
            monthlyIncomeTexts={monthlyIncomeTexts}
            onChangeMode={setIncomeMode}
            onChangeFixedIncome={setFixedIncomeText}
            onChangeMonthlyIncome={handleChangeMonthlyIncome}
            onCopyJanuaryToAll={handleCopyJanuaryToAll}
            onApplyPreset={handleApplyPreset}
          />

          <DeductionsPanel
            form={deductionForm}
            config={activeConfig}
            onChange={handleChangeDeductionField}
          />
        </div>

        <div>
          <RegimeComparison plan={plan} onSelectMode={handleSelectRegimeCard} />
          <MonthlyCashFlowTable plan={plan} />
        </div>
      </div>

      {showYearModal && (
        <YearConfigModal
          currentYear={selectedYear}
          currentConfig={activeConfig}
          onClose={() => setShowYearModal(false)}
          onRegistered={handleYearRegistered}
        />
      )}
    </div>
  );
};

export default App;
