import Decimal from 'decimal.js';
import {
  DEFAULT_FSP_BRACKETS,
  DEFAULT_STATUTORY_CAPS,
  MONTH_NAMES_ES,
  getTaxYearConfig,
  validateTaxYearConfig,
} from '../constants/tax-values';
import {
  AnnualTaxPlan,
  DeductionInputs,
  FspBracket,
  MonthlyBreakdown,
  MonthlyPilaBreakdown,
  RegimeCalculationSummary,
  StatutoryCapsConfig,
  TaxDetails,
  TaxYearConfig,
} from '../types/tax.types';

function sanitizeNonNegative(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, value);
}

export class TaxCalculator {
  private readonly config: TaxYearConfig;

  private readonly caps: StatutoryCapsConfig;

  private readonly fspBrackets: FspBracket[];

  private readonly year: number;

  constructor(yearOrConfig: number | TaxYearConfig) {
    const rawConfig =
      typeof yearOrConfig === 'number' ? getTaxYearConfig(yearOrConfig) : yearOrConfig;

    const resolvedYear =
      rawConfig.year ??
      (typeof yearOrConfig === 'number' ? yearOrConfig : new Date().getFullYear());
    validateTaxYearConfig(resolvedYear, rawConfig);

    this.year = resolvedYear;
    this.caps = { ...DEFAULT_STATUTORY_CAPS, ...(rawConfig.caps ?? {}) };
    this.fspBrackets = (rawConfig.fspBrackets ?? DEFAULT_FSP_BRACKETS)
      .slice()
      .sort((a, b) => a.minSmmlv - b.minSmmlv);
    this.config = {
      ...rawConfig,
      year: this.year,
      caps: this.caps,
      fspBrackets: this.fspBrackets,
    };
  }

  public getConfig(): TaxYearConfig {
    return this.config;
  }

  public getRates(): { health: number; pension: number; presumptiveCosts: number } {
    return {
      health: this.config.contributions.health.rate * 100,
      pension: this.config.contributions.pension.rate * 100,
      presumptiveCosts: this.config.deductions.presumptiveCosts * 100,
    };
  }

  private getFspRate(ibc: Decimal): number {
    const ibcInSmmlv = ibc.dividedBy(this.config.minimumWage).toNumber();
    const firstBracket = this.fspBrackets[0];
    if (!firstBracket || ibcInSmmlv < firstBracket.minSmmlv) {
      return 0;
    }

    for (let i = 0; i < this.fspBrackets.length; i += 1) {
      const bracket = this.fspBrackets[i];
      if (!bracket) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const matchesLower =
        i === 0 ? ibcInSmmlv >= bracket.minSmmlv : ibcInSmmlv > bracket.minSmmlv;
      const matchesUpper =
        bracket.maxSmmlv === Infinity ? true : ibcInSmmlv <= bracket.maxSmmlv;

      if (matchesLower && matchesUpper) {
        return bracket.rate;
      }
    }

    return 0;
  }

  public calculateMonthlyPila(monthlyIncome: number, arlRate = 0): MonthlyPilaBreakdown {
    if (!Number.isFinite(monthlyIncome) || Number.isNaN(monthlyIncome) || monthlyIncome <= 0) {
      return {
        ibc: 0,
        health: 0,
        pension: 0,
        fsp: 0,
        arl: 0,
        totalPila: 0,
      };
    }

    const baseRate = this.config.contributions.health.base;
    const minIbc = new Decimal(this.config.minimumWage);
    const maxIbc = new Decimal(this.config.minimumWage).times(this.caps.ibcMaxSmmlv);
    const rawIbc = new Decimal(monthlyIncome).times(baseRate);
    const ibc = Decimal.min(Decimal.max(rawIbc, minIbc), maxIbc);

    const health = ibc.times(this.config.contributions.health.rate);
    const pension = ibc.times(this.config.contributions.pension.rate);
    const fspRate = this.getFspRate(ibc);
    const fsp = ibc.times(fspRate);
    const safeArlRate = sanitizeNonNegative(arlRate);
    const arl = ibc.times(safeArlRate);
    const totalPila = health.plus(pension).plus(fsp).plus(arl);

    return {
      ibc: ibc.toNumber(),
      health: health.toNumber(),
      pension: pension.toNumber(),
      fsp: fsp.toNumber(),
      arl: arl.toNumber(),
      totalPila: totalPila.toNumber(),
    };
  }

  private calculateTaxByBrackets(taxableIncomeUvt: Decimal): Decimal {
    let tax = new Decimal(0);

    this.config.brackets.forEach(({ lowerLimit, upperLimit, rate }) => {
      if (taxableIncomeUvt.greaterThan(lowerLimit)) {
        const bracketSpan =
          upperLimit === Infinity
            ? taxableIncomeUvt.minus(lowerLimit)
            : Decimal.min(
                taxableIncomeUvt.minus(lowerLimit),
                new Decimal(upperLimit).minus(lowerLimit),
              );
        const bracketTax = bracketSpan.times(rate).dividedBy(100).times(this.config.uvt);
        tax = tax.plus(bracketTax);
      }
    });

    return tax;
  }

  private normalizeMonthlyIncomes(monthlyIncomes: number | number[]): number[] {
    if (typeof monthlyIncomes === 'number') {
      const value = sanitizeNonNegative(monthlyIncomes);
      return Array.from({ length: 12 }, () => value);
    }

    return Array.from({ length: 12 }, (_, index) => sanitizeNonNegative(monthlyIncomes[index]));
  }

  private buildRegimeSummary(params: {
    mode: 'exempt25' | 'actualCosts' | 'legacyPresumptive';
    label: string;
    grossAnnualIncome: Decimal;
    incrgoAnnual: Decimal;
    netIncomeAnnual: Decimal;
    costsAndExpensesAnnual: Decimal;
    imputableDeductionsAnnual: Decimal;
    voluntaryExemptionsAnnual: Decimal;
    exempt25Annual: Decimal;
    outOfCapDeductionsAnnual: Decimal;
    applyGlobalCap: boolean;
    overrideTaxableIncomeAnnual?: Decimal;
  }): RegimeCalculationSummary {
    const {
      mode,
      label,
      grossAnnualIncome,
      incrgoAnnual,
      netIncomeAnnual,
      costsAndExpensesAnnual,
      imputableDeductionsAnnual,
      voluntaryExemptionsAnnual,
      exempt25Annual,
      outOfCapDeductionsAnnual,
      applyGlobalCap,
      overrideTaxableIncomeAnnual,
    } = params;

    const uvt = new Decimal(this.config.uvt);
    const netAfterCostsAnnual = Decimal.max(0, netIncomeAnnual.minus(costsAndExpensesAnnual));
    const totalSubjectToGlobalCap = imputableDeductionsAnnual
      .plus(voluntaryExemptionsAnnual)
      .plus(exempt25Annual);
    const globalCapLimit = applyGlobalCap
      ? Decimal.min(
          netAfterCostsAnnual.times(this.caps.globalDeductionCapRate),
          new Decimal(this.caps.globalDeductionCapUvt).times(uvt),
        )
      : new Decimal(0);
    const appliedCappedDeductions = applyGlobalCap
      ? Decimal.min(totalSubjectToGlobalCap, globalCapLimit)
      : new Decimal(0);

    const taxableIncomeAnnual =
      overrideTaxableIncomeAnnual ??
      Decimal.max(
        0,
        netAfterCostsAnnual.minus(appliedCappedDeductions).minus(outOfCapDeductionsAnnual),
      );
    const taxableIncomeUvt = taxableIncomeAnnual.dividedBy(uvt);
    const annualTaxCop = this.calculateTaxByBrackets(taxableIncomeUvt);
    const annualTaxUvt = annualTaxCop.dividedBy(uvt);
    const effectiveTaxRate = grossAnnualIncome.greaterThan(0)
      ? annualTaxCop.dividedBy(grossAnnualIncome).times(100)
      : new Decimal(0);

    return {
      mode,
      label,
      grossAnnualIncome: grossAnnualIncome.toNumber(),
      incrgoAnnual: incrgoAnnual.toNumber(),
      netIncomeAnnual: netIncomeAnnual.toNumber(),
      costsAndExpensesAnnual: costsAndExpensesAnnual.toNumber(),
      netAfterCostsAnnual: netAfterCostsAnnual.toNumber(),
      imputableDeductionsAnnual: imputableDeductionsAnnual.toNumber(),
      voluntaryExemptionsAnnual: voluntaryExemptionsAnnual.toNumber(),
      exempt25Annual: exempt25Annual.toNumber(),
      totalSubjectToGlobalCap: totalSubjectToGlobalCap.toNumber(),
      globalCapLimit: globalCapLimit.toNumber(),
      appliedCappedDeductions: appliedCappedDeductions.toNumber(),
      outOfCapDeductionsAnnual: outOfCapDeductionsAnnual.toNumber(),
      taxableIncomeAnnual: taxableIncomeAnnual.toNumber(),
      taxableIncomeUvt: taxableIncomeUvt.toNumber(),
      annualTaxCop: annualTaxCop.toNumber(),
      annualTaxUvt: annualTaxUvt.toNumber(),
      effectiveTaxRate: effectiveTaxRate.toNumber(),
    };
  }

  public calculateAnnualPlan(
    monthlyIncomes: number | number[],
    inputs: DeductionInputs = {},
  ): AnnualTaxPlan {
    const normalizedIncomes = this.normalizeMonthlyIncomes(monthlyIncomes);
    const arlRate = sanitizeNonNegative(inputs.arlRate);
    const dependentsCount = Math.floor(sanitizeNonNegative(inputs.dependentsCount));
    const prepaidHealthAnnual = sanitizeNonNegative(inputs.prepaidHealthAnnual);
    const housingInterestAnnual = sanitizeNonNegative(inputs.housingInterestAnnual);
    const voluntaryPensionAnnual = sanitizeNonNegative(inputs.voluntaryPensionAnnual);
    const gmfAnnual = sanitizeNonNegative(inputs.gmfAnnual);
    const electronicInvoicePurchasesAnnual = sanitizeNonNegative(
      inputs.electronicInvoicePurchasesAnnual,
    );
    const actualCostsAnnual = sanitizeNonNegative(inputs.actualCostsAnnual);
    const withholdingsPaidAnnual = sanitizeNonNegative(inputs.withholdingsPaidAnnual);

    const monthlyPilaList = normalizedIncomes.map((income) =>
      this.calculateMonthlyPila(income, arlRate),
    );

    let annualGrossDec = new Decimal(0);
    let annualHealthDec = new Decimal(0);
    let annualPensionDec = new Decimal(0);
    let annualFspDec = new Decimal(0);
    let annualArlDec = new Decimal(0);
    let annualPilaDec = new Decimal(0);

    for (let i = 0; i < 12; i += 1) {
      const income = normalizedIncomes[i] ?? 0;
      const pila = monthlyPilaList[i];
      annualGrossDec = annualGrossDec.plus(income);
      if (pila) {
        annualHealthDec = annualHealthDec.plus(pila.health);
        annualPensionDec = annualPensionDec.plus(pila.pension);
        annualFspDec = annualFspDec.plus(pila.fsp);
        annualArlDec = annualArlDec.plus(pila.arl);
        annualPilaDec = annualPilaDec.plus(pila.totalPila);
      }
    }

    const uvtDec = new Decimal(this.config.uvt);
    const incrgoAnnual = annualHealthDec.plus(annualPensionDec).plus(annualFspDec);
    const netIncomeAnnual = Decimal.max(0, annualGrossDec.minus(incrgoAnnual));

    // Imputable deductions (subject to 40% / 1,340 UVT global cap)
    const dependentsArt387 =
      dependentsCount > 0
        ? Decimal.min(
            annualGrossDec.times(this.caps.dependentIncomeRate),
            new Decimal(this.caps.dependentMonthlyCapUvt * 12).times(uvtDec),
          )
        : new Decimal(0);
    const prepaidHealthDeduction = Decimal.min(
      prepaidHealthAnnual,
      new Decimal(this.caps.prepaidHealthMonthlyCapUvt * 12).times(uvtDec),
    );
    const housingInterestDeduction = Decimal.min(
      housingInterestAnnual,
      new Decimal(this.caps.housingInterestMonthlyCapUvt * 12).times(uvtDec),
    );
    const gmfDeduction = new Decimal(gmfAnnual).times(this.caps.gmfDeductibleRate);

    const imputableDeductionsAnnual = dependentsArt387
      .plus(prepaidHealthDeduction)
      .plus(housingInterestDeduction)
      .plus(gmfDeduction);

    // Voluntary Pension (FPV) / AFC exemption
    const voluntaryExemptionsAnnual = Decimal.min(
      voluntaryPensionAnnual,
      annualGrossDec.times(this.caps.voluntaryPensionMaxRate),
      new Decimal(this.caps.voluntaryPensionCapUvt).times(uvtDec),
    );

    // Out-of-cap deductions (Ley 2277 de 2022)
    const additionalDependentsCount = Math.min(
      dependentsCount,
      this.caps.dependentAdditionalMaxCount,
    );
    const additionalDependentsOutOfCap = new Decimal(additionalDependentsCount)
      .times(this.caps.dependentAdditionalUvt)
      .times(uvtDec);
    const electronicInvoiceOutOfCap = Decimal.min(
      new Decimal(electronicInvoicePurchasesAnnual).times(this.caps.electronicInvoiceRate),
      new Decimal(this.caps.electronicInvoiceCapUvt).times(uvtDec),
    );
    const outOfCapDeductionsAnnual = additionalDependentsOutOfCap.plus(electronicInvoiceOutOfCap);

    // Option A: Renta Exenta 25% (Art. 206 num. 10 ET - capped at 790 UVT)
    const baseFor25 = Decimal.max(
      0,
      netIncomeAnnual.minus(imputableDeductionsAnnual).minus(voluntaryExemptionsAnnual),
    );
    const exempt25Annual = Decimal.min(
      baseFor25.times(this.caps.exempt25Rate),
      new Decimal(this.caps.exempt25CapUvt).times(uvtDec),
    );
    const exempt25Summary = this.buildRegimeSummary({
      mode: 'exempt25',
      label: 'Renta Exenta 25% (Art. 206 num. 10)',
      grossAnnualIncome: annualGrossDec,
      incrgoAnnual,
      netIncomeAnnual,
      costsAndExpensesAnnual: new Decimal(0),
      imputableDeductionsAnnual,
      voluntaryExemptionsAnnual,
      exempt25Annual,
      outOfCapDeductionsAnnual,
      applyGlobalCap: true,
    });

    // Option B: Costos y Gastos Procedentes (Art. 336 ET - without 25% exempt income)
    const cappedActualCosts = Decimal.min(netIncomeAnnual, actualCostsAnnual);
    const actualCostsSummary = this.buildRegimeSummary({
      mode: 'actualCosts',
      label: 'Costos y Gastos Reales (Art. 336)',
      grossAnnualIncome: annualGrossDec,
      incrgoAnnual,
      netIncomeAnnual,
      costsAndExpensesAnnual: cappedActualCosts,
      imputableDeductionsAnnual,
      voluntaryExemptionsAnnual,
      exempt25Annual: new Decimal(0),
      outOfCapDeductionsAnnual,
      applyGlobalCap: true,
    });

    // Legacy Presumptive mode (25% presumptive costs without Ley 2277 caps)
    const legacyPresumptiveCosts = annualGrossDec.times(this.config.deductions.presumptiveCosts);
    const legacyTaxable = Decimal.max(
      0,
      annualGrossDec.minus(legacyPresumptiveCosts).minus(incrgoAnnual),
    );
    const legacySummary = this.buildRegimeSummary({
      mode: 'legacyPresumptive',
      label: 'Modo Clásico (25% Presuntivo sin tope)',
      grossAnnualIncome: annualGrossDec,
      incrgoAnnual,
      netIncomeAnnual,
      costsAndExpensesAnnual: legacyPresumptiveCosts,
      imputableDeductionsAnnual: new Decimal(0),
      voluntaryExemptionsAnnual: new Decimal(0),
      exempt25Annual: new Decimal(0),
      outOfCapDeductionsAnnual: new Decimal(0),
      applyGlobalCap: false,
      overrideTaxableIncomeAnnual: legacyTaxable,
    });

    const recommendedMode: 'exempt25' | 'actualCosts' =
      exempt25Summary.annualTaxCop <= actualCostsSummary.annualTaxCop
        ? 'exempt25'
        : 'actualCosts';
    const taxSavedByRecommended = Math.abs(
      exempt25Summary.annualTaxCop - actualCostsSummary.annualTaxCop,
    );

    const requestedMode = inputs.deductionMode;
    const selectedMode: 'exempt25' | 'actualCosts' | 'legacyPresumptive' =
      !requestedMode || requestedMode === 'auto' ? recommendedMode : requestedMode;

    const comparison = {
      exempt25: exempt25Summary,
      actualCosts: actualCostsSummary,
      legacyPresumptive: legacySummary,
    };
    const selectedRegime = comparison[selectedMode];

    const annualTaxTotal = selectedRegime.annualTaxCop;
    const netAnnualTaxToSaveDec = Decimal.max(
      0,
      new Decimal(annualTaxTotal).minus(withholdingsPaidAnnual),
    );

    let cumulativeTaxSavedDec = new Decimal(0);
    const months: MonthlyBreakdown[] = [];

    for (let i = 0; i < 12; i += 1) {
      const grossIncome = normalizedIncomes[i] ?? 0;
      const pila = monthlyPilaList[i] ?? {
        ibc: 0,
        health: 0,
        pension: 0,
        fsp: 0,
        arl: 0,
        totalPila: 0,
      };
      const taxSavingsProvisionDec = annualGrossDec.greaterThan(0)
        ? netAnnualTaxToSaveDec.times(grossIncome).dividedBy(annualGrossDec)
        : new Decimal(0);
      cumulativeTaxSavedDec = cumulativeTaxSavedDec.plus(taxSavingsProvisionDec);
      const netSpendableIncomeDec = new Decimal(grossIncome)
        .minus(pila.totalPila)
        .minus(taxSavingsProvisionDec);

      months.push({
        monthIndex: i,
        monthName: MONTH_NAMES_ES[i] ?? `Mes ${i + 1}`,
        grossIncome,
        ibc: pila.ibc,
        health: pila.health,
        pension: pila.pension,
        fsp: pila.fsp,
        arl: pila.arl,
        totalPila: pila.totalPila,
        taxSavingsProvision: taxSavingsProvisionDec.toNumber(),
        netSpendableIncome: netSpendableIncomeDec.toNumber(),
        cumulativeTaxSaved: cumulativeTaxSavedDec.toNumber(),
      });
    }

    const annualGrossIncome = annualGrossDec.toNumber();
    const annualPilaTotal = annualPilaDec.toNumber();
    const netAnnualTaxToSave = netAnnualTaxToSaveDec.toNumber();
    const annualNetSpendableIncome = annualGrossDec
      .minus(annualPilaDec)
      .minus(netAnnualTaxToSaveDec)
      .toNumber();
    const totalDeductionsAndPilaRate =
      annualGrossIncome > 0
        ? new Decimal(annualPilaTotal)
            .plus(annualTaxTotal)
            .dividedBy(annualGrossDec)
            .times(100)
            .toNumber()
        : 0;

    return {
      year: this.year,
      uvt: this.config.uvt,
      minimumWage: this.config.minimumWage,
      selectedMode,
      recommendedMode,
      taxSavedByRecommended,
      selectedRegime,
      comparison,
      annualGrossIncome,
      annualPilaTotal,
      annualHealthTotal: annualHealthDec.toNumber(),
      annualPensionTotal: annualPensionDec.toNumber(),
      annualFspTotal: annualFspDec.toNumber(),
      annualArlTotal: annualArlDec.toNumber(),
      annualTaxTotal,
      withholdingsPaidAnnual,
      netAnnualTaxToSave,
      annualNetSpendableIncome,
      effectiveTaxRate: selectedRegime.effectiveTaxRate,
      totalDeductionsAndPilaRate,
      months,
    };
  }

  public calculateTax(monthlyIncome: number, inputs?: DeductionInputs): TaxDetails {
    const safeMonthlyIncome = sanitizeNonNegative(monthlyIncome);
    const plan = this.calculateAnnualPlan(safeMonthlyIncome, inputs);
    const firstMonth = plan.months[0];

    const income = new Decimal(safeMonthlyIncome);
    const annualIncome = new Decimal(plan.annualGrossIncome);
    const monthlyHealth = new Decimal(firstMonth?.health ?? 0);
    const monthlyPension = new Decimal(firstMonth?.pension ?? 0);
    const monthlyFsp = new Decimal(firstMonth?.fsp ?? 0);
    const monthlyArl = new Decimal(firstMonth?.arl ?? 0);
    const monthlyPila = new Decimal(firstMonth?.totalPila ?? 0);
    const ibc = new Decimal(firstMonth?.ibc ?? 0);

    const annualTaxableIncome = new Decimal(plan.selectedRegime.taxableIncomeAnnual);
    const monthlyTaxableIncome = annualTaxableIncome.dividedBy(12);
    const annualTaxAmount = new Decimal(plan.annualTaxTotal);
    const monthlyTaxAmount = annualTaxAmount.dividedBy(12);
    const effectiveTaxRate = new Decimal(plan.effectiveTaxRate);

    const totalMonthlyDeductions = monthlyPila.plus(monthlyTaxAmount);
    const monthlyNetIncome = income.minus(totalMonthlyDeductions);
    const annualPresumptiveOrExempt = new Decimal(
      plan.selectedRegime.exempt25Annual + plan.selectedRegime.costsAndExpensesAnnual,
    );
    const monthlyPresumptiveCosts = annualPresumptiveOrExempt.dividedBy(12);

    return {
      monthlyIncome: income,
      annualIncome,
      monthlyTaxableIncome,
      annualTaxableIncome,
      monthlyTaxAmount,
      annualTaxAmount,
      effectiveTaxRate,
      monthlyHealth,
      monthlyPension,
      monthlyFsp,
      monthlyArl,
      monthlyTotalDeductions: totalMonthlyDeductions,
      monthlyNetIncome,
      monthlyPresumptiveCosts,
      contributions: {
        health: {
          base: ibc,
          amount: monthlyHealth,
        },
        pension: {
          base: ibc,
          amount: monthlyPension,
        },
      },
      deductions: {
        presumptiveCosts: annualPresumptiveOrExempt,
        totalContributions: new Decimal(plan.annualPilaTotal),
      },
      tax: {
        taxableIncome: annualTaxableIncome,
        annualAmount: annualTaxAmount,
        monthlyAmount: monthlyTaxAmount,
        effectiveRate: effectiveTaxRate,
      },
      summary: {
        totalMonthlyDeductions,
        monthlyNetIncome,
      },
    };
  }
}
