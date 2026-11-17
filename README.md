# FreeTax — Colombian Tax & PILA Planner

In-memory Colombian income tax (**Impuesto de Renta**) and social security (**PILA**) planner for independent workers (*trabajadores independientes*), implementing the **Estatuto Tributario (ET)** and **Ley 2277 de 2022**.

> **Docs:** [Adding a New Tax Year](./NEW_YEAR_GUIDE.md) · [AI Agent & Domain Architecture Guide](./AGENTS.md)

---

## Quick Start

**Requirements:** Node.js `>= 20.0.0`

```bash
npm install
```

| Command | Mode | Description |
| :--- | :--- | :--- |
| `npm start` | **Web UI (Default)** | Opens the Dark Mode Vite + React planner in your browser (`http://localhost:5173`). |
| `npm start cli` | **Interactive CLI** | Runs the terminal planner (`npx tsx -r dotenv/config src/cli.ts`). |
| `npm start cli -- --year=2026` | **CLI (Preset Year)** | Skips the year prompt (`--year=YYYY`, `--year YYYY`, `--cli`, or `-c` also work). |
| `npm run cli` | **CLI (Direct)** | Runs the interactive CLI directly. |
| `npm test` | **Unit Tests** | Runs the Vitest suite (`vitest run`). |
| `npm run build` | **Production Build** | Compiles library/CLI (`dist/`) and Web UI (`dist-ui/`). |

Optional environment variable: `LOG_LEVEL=info` (Pino log level for CLI output).

---

## Core Workflow

### Web UI (Chakra UI · Tokyo Night Dark Mode Default)

1. **Paso 1 — Salario, Año Fiscal y Ley Aplicable**:
   - Enter a **fixed monthly income** or switch to **12-month variable income** (`Enero–Diciembre`, including `$0` months), with quick presets (`$5M`–`$30M`).
   - Pick the **Año Fiscal** (`2024`, `2025`, `2026`, or click **`+ Personalizar Año`** to register e.g. `2027` in memory).
   - Select the tax regime (`Ley 2277 — Automático`, `Renta Exenta 25%`, `Costos y Gastos Reales`, or `Clásico`) with direct links to official DIAN/Mintrabajo/Ley 2277 sources.
2. **KPIs Ejecutivos**:
   - Recommended monthly Renta savings, monthly PILA (with `1–25 SMMLV` IBC status), average spendable net income, and Ley 2277 `40% / 1,340 UVT` cap usage.
3. **Paso 2 — Plan de Ahorro y Flujo de Caja Mensual (12 Meses)**:
   - Defaults to **Vista Simplificada** (`Mes`, `Ingreso Bruto`, `Total PILA`, `Ahorro Mensual Renta`, `Ahorro Renta Acumulado`, `Ingreso Neto Disponible`).
   - Toggle **Ver Desglose PILA** (`IBC`, `Salud`, `Pensión`, `FSP`, `ARL`) and edit any month inline.
4. **Opciones Avanzadas (Opcional)**:
   - Collapsed by default; expand to enter Ley 2277 deductions (dependents, prepaid health, housing interest, FPV/AFC, actual costs, electronic invoices, GMF 4x1000, ARL I–V, withholdings) and compare regimes side-by-side.
   - Built with **Chakra UI** and a **Tokyo Night** Dark / Clean White-Navy Light theme (`src/ui/theme.ts`), optional `localStorage` auto-save, and JSON scenario export/import.

---

## Tax & PILA Rules Summary

| Rule | Implementation |
| :--- | :--- |
| **IBC (Base PILA)** | `40%` of gross monthly income, clamped to `[1 SMMLV, 25 SMMLV]` (`0` when month income is `0`). |
| **Salud & Pensión** | Salud `12.5%` + Pensión `16.0%` of IBC; optional ARL Classes I–V (`0.522%`–`6.960%`). |
| **FSP (Solidaridad)** | `0%` (`<4 SMMLV`), `1.0%` (`4–16`), `1.2%` (`16–17`), `1.4%` (`17–18`), `1.6%` (`18–19`), `1.8%` (`19–20`), `2.0%` (`>20`). |
| **INCRGO (Art. 55 ET)** | Annual `Salud + Pensión + FSP` subtracted from annual gross income. |
| **Ley 2277 Regimes** | Compares **Option A** (25% Exempt Income capped at `790 UVT`, Art. 206) vs **Option B** (Actual Costs, Art. 336). |
| **Global Cap** | `min(40% of net income after costs, 1,340 UVT)` across imputable deductions, FPV/AFC, and 25% exempt income. |
| **Out-of-Cap Deductions** | `72 UVT` per dependent (up to 4) + `1%` electronic invoice purchases (up to `240 UVT`). |
| **Art. 241 ET Brackets** | Progressive marginal UVT rates: `0%` (`0–1,090`), `19%` (`–1,700`), `28%` (`–4,100`), `33%` (`–8,670`), `35%` (`–18,970`), `37%` (`–31,000`), `39%` (`>31,000`). |
| **Monthly Renta Savings** | `max(0, annualTax - withholdingsPaid)` distributed proportionally to each month's share of annual gross income. |

### Preloaded Tax Years

| Year | UVT (COP) | SMMLV (COP) | Official Reference |
| :--- | :--- | :--- | :--- |
| **2024** | `$47,065` | `$1,300,000` | Resolución DIAN 000187 de 2023 · Decreto 2292 de 2023 |
| **2025** | `$49,799` | `$1,423,500` | Resolución DIAN 000193 de 2024 · Decreto 1572 de 2024 |
| **2026** | `$52,374` | `$1,750,905` | Resolución DIAN 000238 de 2025 · Decreto 0159 de 2026 |

---

## Contributing & License

Contributions are welcome! See [NEW_YEAR_GUIDE.md](./NEW_YEAR_GUIDE.md) to add a new tax year and [AGENTS.md](./AGENTS.md) for architecture and coding conventions.

Licensed under the MIT License. [Invite me a cup of tea ☕ (PayPal)](https://paypal.me/danimaxpd?country.x=CO&locale.x=es_XC).
