# Colombian Tax & PILA Planner (FreeTax)

An **in-memory Colombian income tax (Impuesto de Renta) and social security (PILA) planner** for independent workers (*trabajadores independientes*), built with TypeScript, Vite + React, and an interactive CLI. Calculations follow the **Estatuto Tributario (ET)** and **Ley 2277 de 2022**.

> Working on this codebase as an AI agent or contributor? See [AGENTS.md](./AGENTS.md) for architecture diagrams, domain formulas, and coding conventions.

---

## Key Features

- **Interactive Web UI (Default on `npm start`)**: Responsive React + TypeScript simulator running 100% in memory with optional browser `localStorage` auto-save and JSON scenario export/import.
- **Interactive & Scriptable CLI (`npm start -- --cli` / `npm run start:cli`)**: Terminal workflow with formatted `tty-table` reports, `--year=YYYY` flag support, and piped stdin support.
- **Month-by-Month Variable Income & Tax Savings Planner**: Enter either a fixed monthly income or 12 individual monthly incomes (Enero–Diciembre, including `$0` months) and get proportional monthly tax savings provisions and cumulative savings targets.
- **Multi-Year Support + Custom In-Memory Years**: Preloaded with official parameters for **2024**, **2025**, and **2026**, plus the ability to add or customize any tax year (e.g., 2027) in memory from the UI or via `createYearConfigFromBase` / `registerTaxYearConfig`.
- **Ley 2277 de 2022 Tax Accuracy**:
  - Automatic comparison between **Option A: 25% Exempt Income** (Art. 206 num. 10, capped at 790 UVT) and **Option B: Actual Costs & Expenses** (Art. 336 ET), plus a legacy presumptive reference mode.
  - Enforces the **40% / 1,340 UVT** global deduction cap, **Art. 55 ET** INCRGO (Health + Pension + FSP), out-of-cap deductions (**72 UVT** per dependent up to 4 + **1%** electronic invoice purchases up to **240 UVT**), and **Art. 241 ET** progressive UVT brackets.
  - Full PILA modeling: IBC = 40% of gross monthly income clamped to `[1 SMMLV, 25 SMMLV]`, Health (12.5%), Pension (16%), progressive **FSP** (1%–2% from 4 to 20+ SMMLV), and optional **ARL** (Classes I–V).

---

## Quick Start

### Prerequisites

- **Node.js** `>= 20.0.0`
- **npm**

### Installation

```bash
git clone https://github.com/yourusername/colombia-tax-calculator.git
cd colombia-tax-calculator
npm install
```

### Run the Web UI (Default)

```bash
npm start
```

This launches `scripts/start.js`, which opens the Vite + React planner in your browser (`http://localhost:5173`).

You can also run the UI directly with:

```bash
npm run start:ui
# or without auto-opening the browser:
npm run dev
```

### Run the CLI

```bash
npm start -- --cli
# or:
npm run start:cli
```

#### CLI Flags

| Flag | Description | Example |
| :--- | :--- | :--- |
| `--cli`, `-c` | Passed to `npm start --` to launch CLI mode instead of the Web UI. | `npm start -- --cli` |
| `--year=YYYY`, `--year YYYY` | Pre-select the tax year without prompting. | `npm start -- --cli --year=2025` |

Optional environment variable:

```bash
LOG_LEVEL=info # Pino log level (trace, debug, info, warn, error)
```

---

## Web UI Capabilities

1. **Header & Tax Year Switcher (`2024`, `2025`, `2026` + Custom Years)**:
   - Displays active **UVT**, **SMMLV**, **IBC %**, **Health %**, and **Pension %** badges.
   - Click **"+ Agregar / Personalizar Año"** to register a new year (e.g. `2027`) or override parameters in memory.
2. **Gross Income Panel**:
   - Switch between **Ingreso Mensual Fijo** and **Ingresos Mes a Mes (Enero–Diciembre)**.
   - Quick presets (`$5M`, `$10M`, `$15M`, `$20M`, `$30M` COP), Colombian/US currency parsing (`15.000.000` or `15,000,000`), real-time validation, and *"Copiar Enero a todos los meses"*.
3. **Ley 2277 Deductions & Regime Optimizer**:
   - Select **Automático (Recomendado - Menor Impuesto)**, **Renta Exenta 25%**, **Costos y Gastos Reales**, or **Modo Clásico (Referencia)**.
   - Configure dependents (`0–4+`), prepaid health (annual or monthly), housing interest, voluntary pension (FPV/AFC), actual costs/expenses, electronic invoice purchases, GMF (4x1000), ARL risk level (I–V), and withholdings already paid (`Retención en la fuente`).
4. **Executive KPIs, Regime Comparison & 12-Month Cash-Flow Table**:
   - Shows recommended monthly tax savings, monthly PILA (with 1–25 SMMLV floor/cap indicator), average net spendable income, effective tax rate, and a 40% / 1,340 UVT cap progress bar.
   - Side-by-side comparison cards showing exact annual tax savings between Option A and Option B.
   - 12-month table with `Ingreso Bruto`, `IBC`, `Salud`, `Pensión`, `FSP`, `ARL` (when active), `Total PILA`, `Ahorro Renta`, `Ahorro Acumulado`, and `Neto Disponible`.
5. **In-Memory State Controls**:
   - Toggle optional `localStorage` auto-save, **Exportar JSON**, **Importar JSON**, and **Restablecer**.

---

## How Colombian Tax & PILA Calculations Work

### 1. Monthly PILA (Social Security)

For each month with positive gross income:
- **IBC**: `40%` of gross monthly income, clamped between `1 SMMLV` (floor) and `25 SMMLV` (ceiling).
- **Salud**: `12.5%` of IBC.
- **Pensión**: `16.0%` of IBC.
- **FSP (Fondo de Solidaridad Pensional)**: Applied when `IBC >= 4 SMMLV` using progressive rates:
  - `4 – 16 SMMLV`: `1.0%`
  - `> 16 – 17 SMMLV`: `1.2%`
  - `> 17 – 18 SMMLV`: `1.4%`
  - `> 18 – 19 SMMLV`: `1.6%`
  - `> 19 – 20 SMMLV`: `1.8%`
  - `> 20 SMMLV`: `2.0%`
- **ARL (Optional)**: `0%` (None) or Class I (`0.522%`) through Class V (`6.960%`) of IBC.

### 2. Annual Income Tax (Ley 2277 de 2022)

1. **INCRGO (Art. 55 ET)**: Sum of annual Health + Pension + FSP is subtracted from annual gross income to obtain **Net Income** (*Ingresos Netos*).
2. **Regime Selection (Option A vs. Option B)**:
   - **Option A (`exempt25`, Art. 206 num. 10 ET)**: No actual costs claimed; allows **25% Exempt Income** on net income after imputable/voluntary deductions, capped at **790 UVT**.
   - **Option B (`actualCosts`, Art. 336 ET)**: Deducts **Actual Costs & Expenses** (*Costos y Gastos Procedentes*), with 25% exempt income set to `$0`.
3. **Global Cap (40% / 1,340 UVT)**: Sum of imputable deductions (Art. 387 10% dependents up to 384 UVT, prepaid health up to 192 UVT, housing interest up to 1,200 UVT, 50% GMF), voluntary exemptions (FPV/AFC up to 30% / 3,800 UVT), and 25% exempt income (Option A) is capped at `min(40% of net income after costs, 1,340 UVT)`.
4. **Out-of-Cap Deductions (Ley 2277)**:
   - **72 UVT** per dependent (up to **4** dependents = `288 UVT` max).
   - **1%** of purchases with **Factura Electrónica** (up to **240 UVT**).
5. **Progressive UVT Brackets (Art. 241 ET)**:
   - `0 – 1,090 UVT`: `0%`
   - `1,090 – 1,700 UVT`: `19%`
   - `1,700 – 4,100 UVT`: `28%`
   - `4,100 – 8,670 UVT`: `33%`
   - `8,670 – 18,970 UVT`: `35%`
   - `18,970 – 31,000 UVT`: `37%`
   - `> 31,000 UVT`: `39%`
6. **Monthly Tax Savings Provision**: Net annual tax due (`max(0, annualTax - withholdingsPaid)`) is allocated across all 12 months proportionally to each month's share of annual gross income.

### Preloaded Fiscal Years

| Year | UVT (COP) | SMMLV (COP) | Reference |
| :--- | :--- | :--- | :--- |
| **2024** | `$47,065` | `$1,300,000` | Resolución DIAN / Decreto SMMLV 2024 |
| **2025** | `$49,799` | `$1,423,500` | Resolución DIAN / Decreto 1572 de 2024 |
| **2026** | `$52,374` | `$1,750,905` | Resolución DIAN 000238 de 2025 / Decreto 0159 de 2026 |

---

## Testing & Building

Run the unit test suite (Vitest):

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Build the TypeScript library/CLI (`dist/`) and the Vite Web UI (`dist-ui/`):

```bash
npm run build
```

---

## Documentation for AI Agents & Contributors

See [AGENTS.md](./AGENTS.md) for the complete architecture diagram, instructions on adding new tax years (in source or in memory), detailed mathematical specifications, and coding standards.

---

## Invite me a cup of tea ☕

[PayPal](https://paypal.me/danimaxpd?country.x=CO&locale.x=es_XC).

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.
