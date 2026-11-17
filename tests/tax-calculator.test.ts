import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import {
  OFFICIAL_LAW_LINKS,
  TAX_YEARS,
  createYearConfigFromBase,
  getAvailableYears,
  getDefaultTaxYear,
  getTaxYearConfig,
  registerTaxYearConfig,
} from '../src/constants/tax-values';
import { TaxCalculator } from '../src/services/tax-calculator';

describe('TaxYearConfig registry and years', () => {
  it('preloads 2024, 2025, and 2026 with official UVT, SMMLV, and normative refs', () => {
    const years = getAvailableYears();
    expect(years).toEqual(expect.arrayContaining([2024, 2025, 2026]));

    expect(getTaxYearConfig(2024)).toMatchObject({
      uvt: 47065,
      minimumWage: 1300000,
      lawLabel: expect.stringContaining('Ley 2277 de 2022'),
      normativeRef: expect.stringContaining('Resolución DIAN 000187'),
    });
    expect(getTaxYearConfig(2025)).toMatchObject({
      uvt: 49799,
      minimumWage: 1423500,
      lawLabel: expect.stringContaining('Ley 2277 de 2022'),
      normativeRef: expect.stringContaining('Resolución DIAN 000193'),
    });
    expect(getTaxYearConfig(2026)).toMatchObject({
      uvt: 52374,
      minimumWage: 1750905,
      lawLabel: expect.stringContaining('Ley 2277 de 2022'),
      normativeRef: expect.stringContaining('Resolución DIAN 000238'),
    });
  });

  it('resolves getDefaultTaxYear to current year when configured or latest available otherwise', () => {
    expect(getDefaultTaxYear(new Date(2025, 5, 15))).toBe(2025);
    expect(getDefaultTaxYear(new Date(2026, 0, 10))).toBe(2026);
    expect(getDefaultTaxYear(new Date(2035, 0, 1))).toBe(2026);
  });

  it('exposes official Colombian tax law resource links', () => {
    expect(OFFICIAL_LAW_LINKS.length).toBeGreaterThanOrEqual(4);
    expect(OFFICIAL_LAW_LINKS.map((link) => link.id)).toEqual(
      expect.arrayContaining(['ley-2277', 'estatuto-tributario', 'dian-uvt', 'mintrabajo-smmlv']),
    );
    OFFICIAL_LAW_LINKS.forEach((link) => {
      expect(link.title.length).toBeGreaterThan(0);
      expect(link.shortLabel.length).toBeGreaterThan(0);
      expect(link.description.length).toBeGreaterThan(0);
      expect(link.url).toMatch(/^https?:\/\//);
    });
  });

  it('throws when requesting an unregistered year', () => {
    expect(() => getTaxYearConfig(1999)).toThrow();
    expect(() => new TaxCalculator(1999)).toThrow();
  });

  it('supports creating and registering a custom tax year in memory', () => {
    const config2027 = createYearConfigFromBase({
      year: 2027,
      uvt: 55000,
      minimumWage: 1900000,
    });

    registerTaxYearConfig(2027, config2027);

    try {
      expect(getAvailableYears()).toContain(2027);
      const calc = new TaxCalculator(2027);
      const plan = calc.calculateAnnualPlan(10000000);
      expect(plan.year).toBe(2027);
      expect(plan.uvt).toBe(55000);
      expect(plan.minimumWage).toBe(1900000);
    } finally {
      delete TAX_YEARS[2027];
    }
  });

  it('rejects invalid or incomplete configs in registerTaxYearConfig and TaxCalculator', () => {
    expect(() =>
      registerTaxYearConfig(2028, {
        uvt: 55000,
        minimumWage: 1900000,
      } as unknown as ReturnType<typeof createYearConfigFromBase>),
    ).toThrow();

    expect(() =>
      registerTaxYearConfig(2028, {
        ...createYearConfigFromBase({ year: 2028, uvt: 55000, minimumWage: 1900000 }),
        brackets: [],
      }),
    ).toThrow();

    expect(() =>
      registerTaxYearConfig(2028, {
        ...createYearConfigFromBase({ year: 2028, uvt: 55000, minimumWage: 1900000 }),
        contributions: {
          health: { rate: 0.125, base: 0, minimum: 1900000 },
          pension: { rate: 0.16, base: 0.4, minimum: 1900000 },
        },
      }),
    ).toThrow();

    expect(
      () =>
        new TaxCalculator({
          uvt: 55000,
          minimumWage: 1900000,
        } as unknown as ReturnType<typeof createYearConfigFromBase>),
    ).toThrow();
  });

  it('accepts a direct TaxYearConfig object in constructor', () => {
    const customConfig = createYearConfigFromBase({
      year: 2030,
      uvt: 60000,
      minimumWage: 2000000,
    });
    const calc = new TaxCalculator(customConfig);
    const pila = calc.calculateMonthlyPila(10000000);
    expect(pila.ibc).toBe(4000000);
    expect(pila.health).toBe(500000);
    expect(pila.pension).toBe(640000);
  });
});

describe('TaxCalculator PILA (IBC bounds, FSP brackets, ARL)', () => {
  const calc2026 = new TaxCalculator(2026);
  const smmlv2026 = 1750905;

  it('returns zeros when monthly income is 0 or negative', () => {
    expect(calc2026.calculateMonthlyPila(0)).toEqual({
      ibc: 0,
      health: 0,
      pension: 0,
      fsp: 0,
      arl: 0,
      totalPila: 0,
    });
    expect(calc2026.calculateMonthlyPila(-500000)).toEqual({
      ibc: 0,
      health: 0,
      pension: 0,
      fsp: 0,
      arl: 0,
      totalPila: 0,
    });
  });

  it('clamps IBC to 1 SMMLV minimum when 40% of income is below 1 SMMLV', () => {
    const pila = calc2026.calculateMonthlyPila(2000000); // 40% = 800,000 < 1,750,905
    expect(pila.ibc).toBe(smmlv2026);
    expect(pila.health).toBeCloseTo(smmlv2026 * 0.125, 2);
    expect(pila.pension).toBeCloseTo(smmlv2026 * 0.16, 2);
    expect(pila.fsp).toBe(0);
  });

  it('clamps IBC to 25 SMMLV maximum for very high monthly income', () => {
    const maxIbc = smmlv2026 * 25;
    const pila = calc2026.calculateMonthlyPila(200000000); // 40% = 80M > 25 SMMLV
    expect(pila.ibc).toBe(maxIbc);
    expect(pila.fsp).toBeCloseTo(maxIbc * 0.02, 2);
  });

  it('applies progressive FSP brackets from 4 to 20+ SMMLV', () => {
    // Helper: pick monthlyIncome so IBC = targetSmmlv * smmlv2026
    const incomeForSmmlv = (targetSmmlv: number) => (targetSmmlv * smmlv2026) / 0.4;

    expect(calc2026.calculateMonthlyPila(incomeForSmmlv(3.9)).fsp).toBe(0);
    expect(calc2026.calculateMonthlyPila(incomeForSmmlv(4)).fsp).toBeCloseTo(4 * smmlv2026 * 0.01, 2);
    expect(calc2026.calculateMonthlyPila(incomeForSmmlv(16)).fsp).toBeCloseTo(
      16 * smmlv2026 * 0.01,
      2,
    );
    expect(calc2026.calculateMonthlyPila(incomeForSmmlv(16.5)).fsp).toBeCloseTo(
      16.5 * smmlv2026 * 0.012,
      2,
    );
    expect(calc2026.calculateMonthlyPila(incomeForSmmlv(17.5)).fsp).toBeCloseTo(
      17.5 * smmlv2026 * 0.014,
      2,
    );
    expect(calc2026.calculateMonthlyPila(incomeForSmmlv(18.5)).fsp).toBeCloseTo(
      18.5 * smmlv2026 * 0.016,
      2,
    );
    expect(calc2026.calculateMonthlyPila(incomeForSmmlv(19.5)).fsp).toBeCloseTo(
      19.5 * smmlv2026 * 0.018,
      2,
    );
    expect(calc2026.calculateMonthlyPila(incomeForSmmlv(21)).fsp).toBeCloseTo(
      21 * smmlv2026 * 0.02,
      2,
    );
  });

  it('includes optional ARL contribution when arlRate is provided', () => {
    const pila = calc2026.calculateMonthlyPila(10000000, 0.00522);
    expect(pila.ibc).toBe(4000000);
    expect(pila.arl).toBeCloseTo(4000000 * 0.00522, 2);
    expect(pila.totalPila).toBeCloseTo(
      pila.health + pila.pension + pila.fsp + pila.arl,
      2,
    );
  });
});

describe('TaxCalculator Ley 2277 de 2022 caps and regimes', () => {
  const calc2026 = new TaxCalculator(2026);
  const uvt = 52374;

  it('caps 25% exempt income at 790 UVT and global deductions at min(40%, 1,340 UVT)', () => {
    // High monthly income: 30,000,000/month -> 360,000,000/year
    const plan = calc2026.calculateAnnualPlan(30000000, {
      prepaidHealthAnnual: 20000000, // exceeds 16*12*uvt
      housingInterestAnnual: 80000000, // exceeds 100*12*uvt
      voluntaryPensionAnnual: 200000000, // exceeds 30% / 3800 UVT
      gmfAnnual: 4000000,
    });

    const { exempt25 } = plan.comparison;
    expect(exempt25.exempt25Annual).toBeLessThanOrEqual(790 * uvt + 1e-6);
    expect(exempt25.globalCapLimit).toBeCloseTo(1340 * uvt, 2);
    expect(exempt25.appliedCappedDeductions).toBeCloseTo(1340 * uvt, 2);
  });

  it('applies 40% global cap when 40% of netAfterCosts is below 1,340 UVT', () => {
    // Moderate income: 6,000,000/month -> 72,000,000/year
    const plan = calc2026.calculateAnnualPlan(6000000, {
      voluntaryPensionAnnual: 30000000,
    });
    const { exempt25 } = plan.comparison;
    const expectedFortyPercent = exempt25.netAfterCostsAnnual * 0.4;
    expect(expectedFortyPercent).toBeLessThan(1340 * uvt);
    expect(exempt25.globalCapLimit).toBeCloseTo(expectedFortyPercent, 2);
    expect(exempt25.appliedCappedDeductions).toBeCloseTo(expectedFortyPercent, 2);
  });

  it('applies out-of-cap deductions (max 4 dependents * 72 UVT and max 240 UVT for 1% electronic invoice)', () => {
    const plan = calc2026.calculateAnnualPlan(15000000, {
      dependentsCount: 6, // capped at 4 for the 72 UVT additional benefit
      electronicInvoicePurchasesAnnual: 2000000000, // 1% = 20M, capped at 240 * uvt = 12,569,760
    });

    const expectedOutOfCap = 4 * 72 * uvt + 240 * uvt;
    expect(plan.comparison.exempt25.outOfCapDeductionsAnnual).toBeCloseTo(expectedOutOfCap, 2);
    expect(plan.comparison.actualCosts.outOfCapDeductionsAnnual).toBeCloseTo(expectedOutOfCap, 2);
  });

  it('recommends actualCosts when actual expenses exceed 25% exempt benefit', () => {
    const plan = calc2026.calculateAnnualPlan(20000000, {
      actualCostsAnnual: 120000000, // 50% of 240M gross
    });

    expect(plan.recommendedMode).toBe('actualCosts');
    expect(plan.selectedMode).toBe('actualCosts');
    expect(plan.comparison.actualCosts.exempt25Annual).toBe(0);
    expect(plan.comparison.actualCosts.annualTaxCop).toBeLessThan(
      plan.comparison.exempt25.annualTaxCop,
    );
    expect(plan.taxSavedByRecommended).toBeCloseTo(
      plan.comparison.exempt25.annualTaxCop - plan.comparison.actualCosts.annualTaxCop,
      2,
    );
  });

  it('recommends exempt25 when actual costs are 0 and respects explicit deductionMode overrides', () => {
    const planAuto = calc2026.calculateAnnualPlan(15000000);
    expect(planAuto.recommendedMode).toBe('exempt25');
    expect(planAuto.selectedMode).toBe('exempt25');

    const planLegacy = calc2026.calculateAnnualPlan(15000000, {
      deductionMode: 'legacyPresumptive',
    });
    expect(planLegacy.selectedMode).toBe('legacyPresumptive');
    expect(planLegacy.annualTaxTotal).toBe(planLegacy.comparison.legacyPresumptive.annualTaxCop);
  });

  it('calculates zero tax when taxable income is at or below 1,090 UVT', () => {
    // 4,000,000/month -> 48M/year -> after PILA & 25% exempt, well below 1,090 UVT (~57.08M)
    const plan = calc2026.calculateAnnualPlan(4000000);
    expect(plan.selectedRegime.taxableIncomeUvt).toBeLessThanOrEqual(1090);
    expect(plan.annualTaxTotal).toBe(0);
  });

  it('subtracts withholdingsPaidAnnual from netAnnualTaxToSave without going negative', () => {
    const basePlan = calc2026.calculateAnnualPlan(15000000);
    const partialPlan = calc2026.calculateAnnualPlan(15000000, {
      withholdingsPaidAnnual: 2000000,
    });
    expect(partialPlan.netAnnualTaxToSave).toBeCloseTo(
      Math.max(0, basePlan.annualTaxTotal - 2000000),
      2,
    );

    const overWithheldPlan = calc2026.calculateAnnualPlan(15000000, {
      withholdingsPaidAnnual: 500000000,
    });
    expect(overWithheldPlan.netAnnualTaxToSave).toBe(0);
  });
});

describe('TaxCalculator 12-month variable income & backward compatibility', () => {
  const calc2025 = new TaxCalculator(2025);

  it('distributes netAnnualTaxToSave proportionally across variable months and reconciles sums', () => {
    const variableIncomes = [
      0,
      10000000,
      25000000,
      0,
      15000000,
      18000000,
      12000000,
      30000000,
      8000000,
      0,
      22000000,
      40000000,
    ];

    const plan = calc2025.calculateAnnualPlan(variableIncomes);
    expect(plan.months).toHaveLength(12);

    // Zero-income months have zero PILA and zero tax savings provision
    expect(plan.months[0]?.totalPila).toBe(0);
    expect(plan.months[0]?.taxSavingsProvision).toBe(0);
    expect(plan.months[3]?.taxSavingsProvision).toBe(0);
    expect(plan.months[9]?.taxSavingsProvision).toBe(0);

    const sumProvision = plan.months.reduce((acc, m) => acc + m.taxSavingsProvision, 0);
    const sumNetSpendable = plan.months.reduce((acc, m) => acc + m.netSpendableIncome, 0);

    expect(sumProvision).toBeCloseTo(plan.netAnnualTaxToSave, 4);
    expect(plan.months[11]?.cumulativeTaxSaved).toBeCloseTo(plan.netAnnualTaxToSave, 4);
    expect(sumNetSpendable).toBeCloseTo(plan.annualNetSpendableIncome, 4);
  });

  it('pads shorter income arrays with zeros to 12 months', () => {
    const plan = calc2025.calculateAnnualPlan([12000000, 12000000]);
    expect(plan.months).toHaveLength(12);
    expect(plan.annualGrossIncome).toBe(24000000);
    expect(plan.months[2]?.grossIncome).toBe(0);
    expect(plan.months[11]?.grossIncome).toBe(0);
  });

  it('keeps backward-compatible calculateTax() returning Decimal fields', () => {
    const details = calc2025.calculateTax(15000000);
    expect(details.monthlyIncome).toBeInstanceOf(Decimal);
    expect(details.annualIncome.toNumber()).toBe(180000000);
    expect(details.monthlyHealth.toNumber()).toBeCloseTo(6000000 * 0.125, 2);
    expect(details.monthlyPension.toNumber()).toBeCloseTo(6000000 * 0.16, 2);
    expect(details.monthlyNetIncome.toNumber()).toBeLessThan(15000000);
  });
});
