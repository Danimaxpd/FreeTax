# Guide: Adding a New Tax Year (e.g., 2027)

Use this guide whenever Colombia publishes new annual **UVT** (*Unidad de Valor Tributario*), **SMMLV** (*Salario Mínimo Mensual Legal Vigente*), or tax reform rules.

---

## 1. Official Colombian Sources to Consult

| Parameter | Issuing Authority | Official Source |
| :--- | :--- | :--- |
| **UVT** | DIAN | [DIAN — Resoluciones Oficiales UVT](https://www.dian.gov.co/normatividad/Paginas/normas.aspx) |
| **SMMLV & PILA** | Ministerio del Trabajo | [Ministerio del Trabajo — Decretos SMMLV / PILA](https://www.mintrabajo.gov.co/) |
| **Global Caps & Exemptions** | Congreso de Colombia | [Ley 2277 de 2022 (Reforma Tributaria)](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=199883) |
| **Art. 241, 336, 206, 387, 55** | Senado de la República | [Estatuto Tributario Nacional](http://www.secretariasenado.gov.co/senado/basedoc/estatuto_tributario.html) |

---

## 2. Option 1: Permanent 1-Line Addition in Source (`src/constants/tax-values.ts`)

If statutory percentages and Art. 241 ET brackets remain unchanged, add the new year to `TAX_YEARS` in [src/constants/tax-values.ts](./src/constants/tax-values.ts):

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
  // Add new year:
  2027: createYearConfigFromBase({
    year: 2027,
    uvt: 55000, // Replace with official DIAN UVT
    minimumWage: 1900000, // Replace with official SMMLV decree
    normativeRef: 'Resolución DIAN XXX de 2026 (UVT) · Decreto XXX de 2026 (SMMLV)',
  }),
};
```

> **Automatic default year:** `getDefaultTaxYear()` automatically selects the current calendar year when present in `TAX_YEARS` (or the highest registered year otherwise).

---

## 3. Option 2: Customizing Rates, Statutory Caps, or UVT Brackets

If a new tax reform or decree changes contribution rates, caps, or Art. 241 UVT brackets for that year:

1. **Contribution rates / IBC / law label** — pass optional overrides to `createYearConfigFromBase`:
   - `healthRate` (default `0.125`)
   - `pensionRate` (default `0.16`)
   - `ibcBase` (default `0.4`)
   - `presumptiveCosts` (default `0.25`)
   - `lawLabel` (default `'Ley 2277 de 2022 · Estatuto Tributario (Art. 241 y 336)'`)
   - `normativeRef` (string shown in the UI and CLI reports)
2. **Caps, Art. 241 brackets, or FSP brackets** — override `caps`, `brackets`, or `fspBrackets` on the returned `TaxYearConfig`:

```ts
const base2027 = createYearConfigFromBase({
  year: 2027,
  uvt: 55000,
  minimumWage: 1900000,
  lawLabel: 'Reforma Tributaria 2027 · Estatuto Tributario',
  normativeRef: 'Resolución DIAN XXX · Ley XXX de 2026',
});

TAX_YEARS[2027] = {
  ...base2027,
  caps: {
    ...base2027.caps!,
    exempt25CapUvt: 790,
    globalDeductionCapUvt: 1340,
  },
  // Optional: override brackets or fspBrackets if changed by law
};
```

---

## 4. Option 3: Instant In-Memory Testing in the Web UI (No Code Edits)

You can test a new year immediately in the browser without modifying source files:

1. Start the Web UI (`npm start`).
2. Click **`+ Personalizar Año`** in the header or inside **Paso 1** (next to the **Año Fiscal** dropdown).
3. Enter the **Año Fiscal** (e.g., `2027`), **Valor UVT (COP)**, **SMMLV (COP)**, and optional **Base IBC (%)**, **Tasa Salud (%)**, and **Tasa Pensión (%)**.
4. Click **`Guardar Año en Memoria`** — the UI immediately recalculates using `createYearConfigFromBase` + `registerTaxYearConfig`.
5. Use **`Exportar JSON`** to save your custom year + scenario to a `.json` file, and **`Importar JSON`** later to reload it.

---

## 5. Verification Checklist

After permanently adding a new year in `src/constants/tax-values.ts`:

1. Update or add unit tests in [tests/tax-calculator.test.ts](./tests/tax-calculator.test.ts) asserting `getAvailableYears()`, `getTaxYearConfig(2027)`, and sample PILA/tax calculations.
2. Update the Preloaded Years table in [README.md](./README.md).
3. Run the verification suite:

```bash
npm test
npx tsc --noEmit
npx eslint src/
npm run build
```

4. Smoke-test the CLI with the new year:

```bash
npm start cli -- --year=2027
```
