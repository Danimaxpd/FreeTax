# AGENTS.md

Guide for AI coding agents working on **FreeTax / Colombian Tax Calculator** (`colombia-tax-calculator`).

> For adding a new fiscal year step-by-step, see [NEW_YEAR_GUIDE.md](./NEW_YEAR_GUIDE.md).

---

## 1. Project Overview & Architecture

This repository is an **in-memory Colombian income tax (Renta) and social security (PILA) planner** for independent workers (*trabajadores independientes*), implementing the **Estatuto Tributario (ET)** and **Ley 2277 de 2022**.

There is **no backend server or database**: the TypeScript calculation engine runs purely in memory and is shared directly by both the **Vite + React Web UI** (default, Dark Mode first) and the **Interactive CLI**.

```
                   npm start [cli | --cli | -c]
                                │
                                ▼
                       scripts/start.js
                       ┌────────┴────────┐
                       │ (default)       │ (cli / --cli / -c)
                       ▼                 ▼
              Vite + React UI        Interactive CLI
             src/ui/main.tsx           src/cli.ts
             src/ui/App.tsx          (prompt-sync, tty-table,
             src/ui/components/*      pino logger, --year=YYYY)
                       │                 │
                       └────────┬────────┘
                                │ imports shared in-memory engine
                                ▼
               Core TypeScript Domain Engine (src/)
        ┌───────────────────────────────────────────────┐
        │ src/services/tax-calculator.ts (TaxCalculator)│
        │   ├─ decimal.js arbitrary-precision math      │
        │   ├─ PILA (IBC 40%, 1..25 SMMLV, FSP, ARL)    │
        │   ├─ Ley 2277 Regimes (Exempt 25% vs Costs)   │
        │   └─ 12-month proportional savings plan       │
        ├───────────────────────────────────────────────┤
        │ src/constants/tax-values.ts                   │
        │   ├─ TAX_YEARS (2024, 2025, 2026)             │
        │   ├─ OFFICIAL_LAW_LINKS, getDefaultTaxYear    │
        │   ├─ TAX_BRACKETS, DEFAULT_FSP_BRACKETS       │
        │   ├─ DEFAULT_STATUTORY_CAPS, ARL_RISK_LEVELS  │
        │   └─ createYearConfigFromBase / register...   │
        ├───────────────────────────────────────────────┤
        │ src/types/tax.types.ts                        │
        │ src/helpers/number.ts & src/utils/format.ts   │
        └───────────────────────────────────────────────┘
```

### Directory & File Map

| Path | Purpose |
| :--- | :--- |
| `src/types/tax.types.ts` | Shared TypeScript interfaces (`TaxYearConfig`, `OfficialLawResource`, `StatutoryCapsConfig`, `DeductionInputs`, `AnnualTaxPlan`, `RegimeCalculationSummary`, `MonthlyBreakdown`, `MonthlyPilaBreakdown`, `TaxDetails`). |
| `src/constants/tax-values.ts` | Official tax year registry (`TAX_YEARS` for 2024, 2025, 2026), `OFFICIAL_LAW_LINKS`, `DEFAULT_LAW_LABEL`, `getDefaultTaxYear()`, Art. 241 UVT brackets, FSP brackets, statutory caps, `ARL_RISK_LEVELS`, `MONTH_NAMES_ES`, `validateTaxYearConfig()`, and dynamic year registration helpers. |
| `src/services/tax-calculator.ts` | `TaxCalculator` class: `calculateMonthlyPila()`, `calculateAnnualPlan()`, and backward-compatible `calculateTax()`. |
| `src/helpers/number.ts` | Currency parsing and validation (`parseCurrencyInput`, `parseFormattedNumber`, `isValidNumber`), supporting Colombian (`15.000.000`) and US (`15,000,000`) separators. |
| `src/utils/format.ts` | Currency formatting (`formatCOP`, `formatCurrency`). |
| `src/utils/logger.ts` | Pino logger configured with `pino-pretty` and `LOG_LEVEL`. |
| `src/cli.ts` | Interactive & piped-stdin CLI (`runCli`) supporting `--year=YYYY`, `getDefaultTaxYear()`, active `lawLabel` / `normativeRef` display, fixed vs. 12-month variable income, optional Ley 2277 deductions, and `tty-table` reports. |
| `src/index.ts` | Public library entrypoint re-exporting engine, types, constants (`OFFICIAL_LAW_LINKS`, `getDefaultTaxYear`, etc.), helpers, and `runCli`. |
| `src/ui/` | Vite + React + TypeScript + **Chakra UI** (`@chakra-ui/react`) Web UI (`App.tsx`, `main.tsx`, `theme.ts`, `styles.css`, `components/*`): **Tokyo Night** Dark Mode default (`initialColorMode: 'dark'`, `data-theme="dark"`, `freetax_colombia_theme_v1`) + Clean White/Navy Light Mode, Step 1 unified Salary + Fiscal Year + Law card, prioritized full-width KPIs & Paso 2 12-month table (Simplified vs. PILA Breakdown toggle + inline monthly editing), collapsible Optional Advanced deductions/regime comparison (`showAdvancedOptions` false by default), optional `localStorage` auto-save, and JSON scenario import/export. |
| `scripts/start.js` | Unified launcher (`#!/usr/bin/env node`, wired to `bin.freetax`): starts `vite --open` by default, or `tsx -r dotenv/config src/cli.ts` when `cli`, `--cli`, or `-c` is passed. |
| `scripts/fix-imports.js` | `postbuild` script appending `.js` extensions to relative imports in compiled `dist/`. |
| `tests/` | Vitest test suites (`tests/tax-calculator.test.ts`, `tests/number.test.ts`). |
| `NEW_YEAR_GUIDE.md` | Contributor guide for adding new Colombian tax years and verifying updates. |
| `src/constants/tax-brackets.ts` & `src/services/colombian-tax-calculator.ts` | Minimal backward-compatible re-exports pointing to `tax-values.ts` and `tax-calculator.ts`. |

---

## 2. How to Add a New Tax Year (e.g., 2027)

See [NEW_YEAR_GUIDE.md](./NEW_YEAR_GUIDE.md) for the full checklist and official Colombian URLs (`OFFICIAL_LAW_LINKS`).

### Option A: Permanently in `src/constants/tax-values.ts`

1. Open `src/constants/tax-values.ts` and add a new entry to `TAX_YEARS` using `createYearConfigFromBase`:

```ts
export const TAX_YEARS: Record<number, TaxYearConfig> = {
  2024: createYearConfigFromBase({
    year: 2024,
    uvt: 47065,
    minimumWage: 1300000,
    normativeRef: 'Resolución DIAN 000187 de 2023 (UVT) · Decreto 2292 de 2023 (SMMLV)',
  }),
  2025: createYearConfigFromBase({
    year: 2025,
    uvt: 49799,
    minimumWage: 1423500,
    normativeRef: 'Resolución DIAN 000193 de 2024 (UVT) · Decreto 1572 de 2024 (SMMLV)',
  }),
  2026: createYearConfigFromBase({
    year: 2026,
    uvt: 52374,
    minimumWage: 1750905,
    normativeRef: 'Resolución DIAN 000238 de 2025 (UVT) · Decreto 0159 de 2026 (SMMLV)',
  }),
  2027: createYearConfigFromBase({
    year: 2027,
    uvt: 55000,
    minimumWage: 1900000,
    normativeRef: 'Resolución DIAN XXX de 2026 (UVT) · Decreto XXX de 2026 (SMMLV)',
  }),
};
```

2. `createYearConfigFromBase` accepts optional overrides if statutory rates or metadata change in a future year:
   - `healthRate` (default `0.125`)
   - `pensionRate` (default `0.16`)
   - `ibcBase` (default `0.4`)
   - `presumptiveCosts` (default `0.25`)
   - `lawLabel` (default `DEFAULT_LAW_LABEL`: `'Ley 2277 de 2022 · Estatuto Tributario (Art. 241 y 336)'`)
   - `normativeRef` (optional string displayed in UI & CLI)
3. If UVT brackets (`TAX_BRACKETS`), FSP brackets (`DEFAULT_FSP_BRACKETS`), or statutory caps (`DEFAULT_STATUTORY_CAPS`) change for that specific year, construct or override `brackets`, `fspBrackets`, or `caps` directly on that year's `TaxYearConfig`.
4. Note: `getDefaultTaxYear()` automatically picks `new Date().getFullYear()` if it exists in `TAX_YEARS`, or falls back to the highest registered year.
5. Add/update unit tests in `tests/tax-calculator.test.ts` and update `README.md`.

### Option B: At Runtime in Memory (`createYearConfigFromBase` + `registerTaxYearConfig`)

Both the UI (`src/ui/components/YearConfigModal.tsx`) and library callers can register or override a tax year in memory without modifying source files (`registerTaxYearConfig` validates all required fields via `validateTaxYearConfig`):

```ts
import {
  createYearConfigFromBase,
  registerTaxYearConfig,
  TaxCalculator,
} from './src/index';

const config2027 = createYearConfigFromBase({
  year: 2027,
  uvt: 55000,
  minimumWage: 1900000,
  // optional: healthRate, pensionRate, ibcBase, presumptiveCosts, lawLabel, normativeRef
});

// Validates & registers into the in-memory TAX_YEARS map
registerTaxYearConfig(2027, config2027);

const calculator = new TaxCalculator(2027);
const plan = calculator.calculateAnnualPlan(15_000_000);
```

Alternatively, pass a `TaxYearConfig` object directly to `new TaxCalculator(config)` without mutating `TAX_YEARS`.

---

## 3. Colombian Tax Domain Logic (`src/services/tax-calculator.ts`)

All monetary calculations use `decimal.js` (`Decimal`) internally to avoid IEEE-754 floating-point drift, converting to `number` only at the API boundary.

### 3.1 PILA Rules for Independent Workers (`calculateMonthlyPila`)

For each month with `grossIncome > 0`:

1. **IBC (Ingreso Base de Cotización)**:
   - Base = `40%` (`config.contributions.health.base`) of `grossIncome`.
   - Clamped to `[1 SMMLV, 25 SMMLV]`:
     $$\text{IBC} = \min(\max(\text{grossIncome} \times 0.40,\; \text{SMMLV}),\; 25 \times \text{SMMLV})$$
   - If `monthlyIncome <= 0` (or non-finite), `ibc = 0` and all PILA contributions are `0`.
2. **Health (Salud)**: `12.5%` of `IBC`.
3. **Pension (Pensión)**: `16.0%` of `IBC`.
4. **Fondo de Solidaridad Pensional (FSP)** — progressive based on `ibcInSmmlv = IBC / SMMLV`:
   - `< 4 SMMLV`: `0%`
   - `4 <= ibcInSmmlv <= 16`: `1.0%`
   - `16 < ibcInSmmlv <= 17`: `1.2%`
   - `17 < ibcInSmmlv <= 18`: `1.4%`
   - `18 < ibcInSmmlv <= 19`: `1.6%`
   - `19 < ibcInSmmlv <= 20`: `1.8%`
   - `> 20 SMMLV`: `2.0%`
5. **ARL (Riesgos Laborales, optional)**: `IBC * arlRate` using `ARL_RISK_LEVELS` (0 = 0%, Class I = 0.522%, II = 1.044%, III = 2.436%, IV = 4.350%, V = 6.960%).
6. **Total Monthly PILA**: `health + pension + fsp + arl`.

### 3.2 Estatuto Tributario & Ley 2277 de 2022 (`calculateAnnualPlan`)

Annual calculations sum all 12 months (`number` input is repeated 12x; `number[]` is normalized to 12 elements, padding missing months with `0`):

1. **INCRGO (Ingresos No Constitutivos de Renta ni Ganancia Ocasional — Art. 55 ET)**:
   - `incrgoAnnual = annualHealth + annualPension + annualFsp`
   - `netIncomeAnnual = max(0, grossAnnualIncome - incrgoAnnual)`
   - *(Note: ARL is subtracted from spendable cash flow in `totalPila`, not from `INCRGO`.)*

2. **Imputable Deductions (Subject to Global Cap)**:
   - **Dependents (Art. 387 ET)**: If `dependentsCount > 0`, `min(grossAnnualIncome * 10%, 32 * 12 * UVT)` (`384 UVT/year`).
   - **Prepaid Health (Medicina Prepagada)**: `min(prepaidHealthAnnual, 16 * 12 * UVT)` (`192 UVT/year`).
   - **Housing Interest (Intereses de Vivienda)**: `min(housingInterestAnnual, 100 * 12 * UVT)` (`1,200 UVT/year`).
   - **GMF (4x1000)**: `gmfAnnual * 50%`.

3. **Voluntary Exemptions (FPV / AFC — Subject to Global Cap)**:
   - `min(voluntaryPensionAnnual, grossAnnualIncome * 30%, 3,800 * UVT)`.

4. **Two Competing Ley 2277 Regimes (+ Legacy Reference)**:
   - **Option A — `exempt25` (Renta Exenta 25%, Art. 206 num. 10 ET)**:
     - `costsAndExpensesAnnual = 0`
     - `baseFor25 = max(0, netIncomeAnnual - imputableDeductionsAnnual - voluntaryExemptionsAnnual)`
     - `exempt25Annual = min(baseFor25 * 25%, 790 * UVT)` *(Ley 2277 reduced the annual cap from 2,880 UVT to 790 UVT)*
   - **Option B — `actualCosts` (Costos y Gastos Procedentes, Art. 336 ET)**:
     - `costsAndExpensesAnnual = min(netIncomeAnnual, actualCostsAnnual)`
     - `exempt25Annual = 0` *(Independent workers claiming actual costs/expenses cannot also claim the 25% exempt income.)*
   - **Legacy Reference — `legacyPresumptive`**:
     - `costsAndExpensesAnnual = grossAnnualIncome * 25%`
     - `taxableIncomeAnnual = max(0, grossAnnualIncome - legacyPresumptiveCosts - incrgoAnnual)` (bypasses Ley 2277 caps and out-of-cap deductions; kept for reference/comparison).

5. **Global Cap (Art. 336 ET, Ley 2277 de 2022)**:
   - Applied to both Option A (`exempt25`) and Option B (`actualCosts`):
   - `netAfterCostsAnnual = max(0, netIncomeAnnual - costsAndExpensesAnnual)`
   - `globalCapLimit = min(netAfterCostsAnnual * 40%, 1,340 * UVT)`
   - `totalSubjectToGlobalCap = imputableDeductionsAnnual + voluntaryExemptionsAnnual + exempt25Annual`
   - `appliedCappedDeductions = min(totalSubjectToGlobalCap, globalCapLimit)`

6. **Out-of-Cap Deductions (Ley 2277 de 2022 — Not subject to 40% / 1,340 UVT limit)**:
   - **Additional Dependents Deduction**: `min(dependentsCount, 4) * 72 * UVT`
   - **Electronic Invoice Purchases (Factura Electrónica)**: `min(electronicInvoicePurchasesAnnual * 1%, 240 * UVT)`
   - `outOfCapDeductionsAnnual = additionalDependentsOutOfCap + electronicInvoiceOutOfCap`

7. **Taxable Income & Art. 241 ET Progressive UVT Brackets**:
   - `taxableIncomeAnnual = max(0, netAfterCostsAnnual - appliedCappedDeductions - outOfCapDeductionsAnnual)`
   - `taxableIncomeUvt = taxableIncomeAnnual / UVT`
   - Progressive marginal brackets (`TAX_BRACKETS`):
     - `0 – 1,090 UVT`: `0%`
     - `1,090 – 1,700 UVT`: `19%`
     - `1,700 – 4,100 UVT`: `28%`
     - `4,100 – 8,670 UVT`: `33%`
     - `8,670 – 18,970 UVT`: `35%`
     - `18,970 – 31,000 UVT`: `37%`
     - `> 31,000 UVT`: `39%`
   - `recommendedMode`: `'exempt25'` if `exempt25.annualTaxCop <= actualCosts.annualTaxCop`, else `'actualCosts'`.

### 3.3 Month-by-Month Proportional Tax Savings Provision

After selecting `selectedRegime` (either `recommendedMode` when `deductionMode` is `'auto'`/omitted, or the explicitly chosen mode):

$$\text{netAnnualTaxToSave} = \max(0,\; \text{selectedRegime.annualTaxCop} - \text{withholdingsPaidAnnual})$$

For each month $i \in \{0..11\}$:

$$\text{taxSavingsProvision}_i = \begin{cases} \text{netAnnualTaxToSave} \times \dfrac{\text{grossIncome}_i}{\text{annualGrossIncome}} & \text{if } \text{annualGrossIncome} > 0 \\ 0 & \text{otherwise} \end{cases}$$

- `cumulativeTaxSaved_i = sum(taxSavingsProvision_0 .. taxSavingsProvision_i)` (by December, equals `netAnnualTaxToSave`).
- `netSpendableIncome_i = grossIncome_i - totalPila_i - taxSavingsProvision_i`.

---

## 4. Development, Build & Test Commands

| Command | Description |
| :--- | :--- |
| `npm install` | Install all dependencies (Node `>= 20.0.0`). |
| `npm start` | Launch the unified starter (`scripts/start.js`) -> opens the **Web UI** (`vite --open`). |
| `npm start cli` | Launch the **Interactive CLI** directly without `--` (also supports `npm start -- --cli`, `-c`, and flags such as `--year=2025`). |
| `npm run cli` | Launch the **Interactive CLI** directly (`tsx -r dotenv/config src/cli.ts`). |
| `npm run start:ui` | Launch Vite Web UI directly (`vite --open`). |
| `npm run start:cli` | Alias to launch CLI directly (`tsx -r dotenv/config src/cli.ts`). |
| `npm run dev` | Start Vite dev server without auto-opening browser. |
| `npm test` | Run Vitest suite once (`vitest run`). |
| `npm run test:watch` | Run Vitest in watch mode (`vitest`). |
| `npm run build` | Clean `dist/` and `dist-ui/`, compile library/CLI (`tsc -p tsconfig.build.json`), run `postbuild` (`scripts/fix-imports.js`), and bundle UI (`vite build` -> `dist-ui/`). |
| `npx tsc --noEmit` | Full TypeScript typecheck across `src/` (including `src/ui/`). |
| `npx eslint src/` | Run ESLint checks on source files. |

---

## 5. Coding Conventions

- **Module System**: Native ESM (`"type": "module"` in `package.json`). Relative imports in `src/` use extensionless paths; `scripts/fix-imports.js` rewrites them with `.js` in `dist/` during `postbuild`.
- **TypeScript Strictness**: `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true` (configured in `tsconfig.json` and `tsconfig.build.json`). Always guard indexed array lookups (e.g., `arr[i] ?? default`).
- **Financial Precision**: Use `Decimal` from `decimal.js` inside `TaxCalculator` for all tax/PILA arithmetic before converting outputs to `number`.
- **Linting & Formatting**:
  - ESLint extends `airbnb-base`, `airbnb-typescript/base`, `@typescript-eslint/recommended`, and `prettier` (`.eslintrc.cjs`, configured with `tsx: 'never'` and `'.tsx'` resolver support).
  - `no-console` is `error` — use `logger` from `src/utils/logger.ts` in CLI/backend code instead of `console.log`.
  - Prettier (`.prettierrc`): single quotes, trailing commas (`all`), `printWidth: 100`, 2-space indent, semicolons, LF line endings.
- **No Persistence Layer**: Keep all calculations, custom tax years, and scenario state purely in memory (the UI optionally mirrors state to browser `localStorage` and supports JSON export/import).
- **Official Normative Links**: Keep `OFFICIAL_LAW_LINKS` in `src/constants/tax-values.ts` as the single source of truth for external official Colombian law/DIAN/Mintrabajo links rendered by the UI.
- **Tests**: Add Vitest unit tests in `tests/` for any changes to PILA brackets, Ley 2277 caps, Art. 241 brackets, currency parsing, `getDefaultTaxYear`, or dynamic year registration.
