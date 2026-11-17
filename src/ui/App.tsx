import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  CloseButton,
  Collapse,
  Container,
  Flex,
  Grid,
  HStack,
  Text,
  useColorMode,
} from '@chakra-ui/react';
import {
  getAvailableYears,
  getDefaultTaxYear,
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
import { HeaderYearSelector, ThemeMode } from './components/HeaderYearSelector';
import { IncomeMode, IncomePanel } from './components/IncomePanel';
import { KpiCards } from './components/KpiCards';
import { MonthlyCashFlowTable } from './components/MonthlyCashFlowTable';
import { RegimeComparison } from './components/RegimeComparison';
import { YearConfigModal } from './components/YearConfigModal';

const STORAGE_KEY_SCENARIO = 'freetax_colombia_scenario_v1';
const STORAGE_KEY_AUTOSAVE = 'freetax_colombia_autosave_v1';
const STORAGE_KEY_THEME = 'freetax_colombia_theme_v1';

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

const REGIME_LABELS: Record<'exempt25' | 'actualCosts' | 'legacyPresumptive', string> = {
  exempt25: 'Renta Exenta 25% (Art. 206)',
  actualCosts: 'Costos y Gastos Reales (Art. 336)',
  legacyPresumptive: 'Clásico 25% Presuntivo',
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

function countActiveOptionalDeductions(form: DeductionFormState): number {
  let count = 0;
  const deps = Number.parseInt(form.dependentsCount, 10);
  if (Number.isFinite(deps) && deps > 0) count += 1;
  if (safeParseCurrency(form.prepaidHealthText) > 0) count += 1;
  if (safeParseCurrency(form.housingInterestText) > 0) count += 1;
  if (safeParseCurrency(form.voluntaryPensionText) > 0) count += 1;
  if (safeParseCurrency(form.actualCostsText) > 0) count += 1;
  if (safeParseCurrency(form.electronicInvoicePurchasesText) > 0) count += 1;
  if (safeParseCurrency(form.gmfText) > 0) count += 1;
  if ((Number.parseFloat(form.arlRate) || 0) > 0) count += 1;
  if (safeParseCurrency(form.withholdingsPaidText) > 0) count += 1;
  return count;
}

export const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const themeHydratedRef = useRef(false);
  const { colorMode, setColorMode, toggleColorMode } = useColorMode();

  const [autoSave, setAutoSave] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY_AUTOSAVE) === 'true';
    } catch {
      return false;
    }
  });

  const [availableYears, setAvailableYears] = useState<number[]>(() => getAvailableYears());
  const [selectedYear, setSelectedYear] = useState<number>(() => getDefaultTaxYear());
  const [incomeMode, setIncomeMode] = useState<IncomeMode>('fixed');
  const [fixedIncomeText, setFixedIncomeText] = useState<string>('15.000.000');
  const [monthlyIncomeTexts, setMonthlyIncomeTexts] = useState<string[]>(createDefaultMonthlyTexts);
  const [deductionForm, setDeductionForm] = useState<DeductionFormState>(DEFAULT_DEDUCTION_FORM);
  const [customYears, setCustomYears] = useState<Array<{ year: number; config: TaxYearConfig }>>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Sync Chakra colorMode, data-theme attribute, and localStorage
  useEffect(() => {
    if (!themeHydratedRef.current) {
      themeHydratedRef.current = true;
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY_THEME);
        if ((saved === 'light' || saved === 'dark') && saved !== colorMode) {
          setColorMode(saved);
          document.documentElement.setAttribute('data-theme', saved);
          return;
        }
      } catch {
        // Ignore storage error
      }
    }

    document.documentElement.setAttribute('data-theme', colorMode);
    try {
      window.localStorage.setItem(STORAGE_KEY_THEME, colorMode);
    } catch {
      // Ignore storage error
    }
  }, [colorMode, setColorMode]);

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
    const customOverride = customYears.find((entry) => entry.year === selectedYear);
    if (customOverride) {
      return customOverride.config;
    }
    try {
      return getTaxYearConfig(selectedYear);
    } catch {
      const fallbackYear = getDefaultTaxYear();
      return getTaxYearConfig(fallbackYear);
    }
  }, [selectedYear, customYears]);

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

  const activeDeductionsCount = useMemo(
    () => countActiveOptionalDeductions(deductionForm),
    [deductionForm],
  );

  const handleChangeDeductionField = <K extends keyof DeductionFormState>(
    key: K,
    value: DeductionFormState[K],
  ) => {
    setDeductionForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleChangeMonthlyIncome = (monthIndex: number, value: string) => {
    setMonthlyIncomeTexts((prev) => prev.map((item, idx) => (idx === monthIndex ? value : item)));
  };

  const handleEnableVariableModeFromTable = () => {
    const seed = fixedIncomeText.trim() ? fixedIncomeText : '0';
    setMonthlyIncomeTexts(Array.from({ length: 12 }, () => seed));
    setIncomeMode('variable');
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
    setSelectedYear(getDefaultTaxYear());
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

  const activeTheme: ThemeMode = colorMode === 'light' ? 'light' : 'dark';

  return (
    <Box minH="100vh" bg="bg.canvas" color="text.primary" py={5} pb={14}>
      <Container maxW="1360px" px={{ base: 4, md: 5 }}>
        <HeaderYearSelector
          availableYears={availableYears}
          selectedYear={selectedYear}
          config={activeConfig}
          theme={activeTheme}
          onToggleTheme={toggleColorMode}
          onSelectYear={setSelectedYear}
          onOpenYearModal={() => setShowYearModal(true)}
        />

        <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
          <Box
            bg="bg.surface"
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="md"
            px={3}
            py={1.5}
          >
            <Checkbox
              size="sm"
              isChecked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              color="text.secondary"
            >
              Auto-guardar en navegador (localStorage)
            </Checkbox>
          </Box>

          <HStack spacing={2} wrap="wrap">
            <Button
              size="sm"
              bg="bg.surface"
              borderWidth="1px"
              borderColor="border.subtle"
              color="text.primary"
              _hover={{ borderColor: 'border.accent' }}
              onClick={handleExportJson}
            >
              Exportar JSON
            </Button>
            <Button
              size="sm"
              bg="bg.surface"
              borderWidth="1px"
              borderColor="border.subtle"
              color="text.primary"
              _hover={{ borderColor: 'border.accent' }}
              onClick={handleImportClick}
            >
              Importar JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
            <Button
              size="sm"
              bg="bg.dangerSoft"
              borderWidth="1px"
              borderColor="accent.danger"
              color="accent.danger"
              _hover={{ opacity: 0.9 }}
              onClick={handleResetDefaults}
            >
              Restablecer
            </Button>
          </HStack>
        </Flex>

        {statusBanner && (
          <Alert
            status={statusBanner.type}
            variant="subtle"
            borderRadius="md"
            mb={4}
            borderWidth="1px"
            borderColor="border.subtle"
          >
            <AlertIcon />
            <Text flex="1" fontSize="sm">
              {statusBanner.text}
            </Text>
            <CloseButton
              alignSelf="flex-start"
              position="relative"
              right={-1}
              top={-0.5}
              onClick={() => setStatusBanner(null)}
              aria-label="Cerrar notificación"
            />
          </Alert>
        )}

        {/* Paso 1: Salario, Año Fiscal y Ley */}
        <IncomePanel
          incomeMode={incomeMode}
          fixedIncomeText={fixedIncomeText}
          monthlyIncomeTexts={monthlyIncomeTexts}
          availableYears={availableYears}
          selectedYear={selectedYear}
          config={activeConfig}
          deductionMode={deductionForm.deductionMode}
          onChangeMode={setIncomeMode}
          onChangeFixedIncome={setFixedIncomeText}
          onChangeMonthlyIncome={handleChangeMonthlyIncome}
          onCopyJanuaryToAll={handleCopyJanuaryToAll}
          onApplyPreset={handleApplyPreset}
          onSelectYear={setSelectedYear}
          onOpenYearModal={() => setShowYearModal(true)}
          onChangeDeductionMode={(mode) => handleChangeDeductionField('deductionMode', mode)}
        />

        {/* KPIs Ejecutivos */}
        <KpiCards plan={plan} config={activeConfig} />

        {/* Paso 2: Tabla Prioritaria de Ahorro y Flujo Mensual */}
        <MonthlyCashFlowTable
          plan={plan}
          incomeMode={incomeMode}
          monthlyIncomeTexts={monthlyIncomeTexts}
          onChangeMonthlyIncome={handleChangeMonthlyIncome}
          onEnableVariableModeFromTable={handleEnableVariableModeFromTable}
        />

        {/* Opciones Avanzadas (Opcional) */}
        <Flex
          justify="space-between"
          align="center"
          wrap="wrap"
          gap={3}
          bg="bg.surface"
          borderWidth="1px"
          borderColor="border.subtle"
          borderRadius="xl"
          px={4}
          py={3.5}
          mb={4}
          boxShadow="sm"
        >
          <Button
            size="sm"
            bg="bg.accentSoft"
            color="accent.primary"
            borderWidth="1px"
            borderColor="border.accent"
            fontWeight="bold"
            _hover={{ borderColor: 'accent.primary' }}
            onClick={() => setShowAdvancedOptions((prev) => !prev)}
            aria-expanded={showAdvancedOptions}
          >
            {showAdvancedOptions ? '▾' : '▸'} Opciones Avanzadas (Opcional): 2. Deducciones Ley
            2277 y Comparativo de Regímenes
          </Button>

          <HStack spacing={2} wrap="wrap">
            <Badge
              px={3}
              py={1}
              borderRadius="full"
              bg="bg.subtle"
              borderWidth="1px"
              borderColor="border.subtle"
              color="text.secondary"
              textTransform="none"
              fontSize="xs"
              fontWeight="semibold"
            >
              Régimen: {REGIME_LABELS[plan.selectedMode]}
            </Badge>
            <Badge
              px={3}
              py={1}
              borderRadius="full"
              bg="bg.subtle"
              borderWidth="1px"
              borderColor="border.subtle"
              color="text.secondary"
              textTransform="none"
              fontSize="xs"
              fontWeight="semibold"
            >
              {activeDeductionsCount === 0
                ? '0 deducciones opcionales'
                : `${activeDeductionsCount} deducción(es) / ajuste(s) activo(s)`}
            </Badge>
          </HStack>
        </Flex>

        <Collapse in={showAdvancedOptions} animateOpacity unmountOnExit>
          <Grid
            templateColumns={{ base: '1fr', xl: '440px minmax(0, 1fr)' }}
            gap={5}
            alignItems="start"
          >
            <DeductionsPanel
              form={deductionForm}
              config={activeConfig}
              onChange={handleChangeDeductionField}
            />
            <RegimeComparison plan={plan} onSelectMode={handleSelectRegimeCard} />
          </Grid>
        </Collapse>

        {showYearModal && (
          <YearConfigModal
            currentYear={selectedYear}
            currentConfig={activeConfig}
            onClose={() => setShowYearModal(false)}
            onRegistered={handleYearRegistered}
          />
        )}
      </Container>
    </Box>
  );
};

export default App;
