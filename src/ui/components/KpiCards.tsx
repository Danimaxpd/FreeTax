import React from 'react';
import { AnnualTaxPlan, TaxYearConfig } from '../../types/tax.types';
import { formatCOP } from '../../utils/format';

interface KpiCardsProps {
  plan: AnnualTaxPlan;
  config: TaxYearConfig;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ plan, config }) => {
  const avgMonthlyTaxSave = plan.netAnnualTaxToSave / 12;
  const avgMonthlyPila = plan.annualPilaTotal / 12;
  const avgMonthlyNetSpendable = plan.annualNetSpendableIncome / 12;

  const activeMonths = plan.months.filter((m) => m.grossIncome > 0);
  const avgIbc =
    activeMonths.length > 0
      ? activeMonths.reduce((acc, m) => acc + m.ibc, 0) / activeMonths.length
      : 0;

  const ibcMaxSmmlv = config.caps?.ibcMaxSmmlv ?? 25;
  const maxIbc = config.minimumWage * ibcMaxSmmlv;
  const ibcBaseRate = config.contributions.health.base;

  const hitsMaxCap = activeMonths.some((m) => m.ibc >= maxIbc - 1 && m.grossIncome * ibcBaseRate > maxIbc);
  const hitsMinFloor = activeMonths.some(
    (m) => m.ibc <= config.minimumWage + 1 && m.grossIncome * ibcBaseRate < config.minimumWage,
  );

  let ibcStatusLabel = `IBC prom: ${formatCOP(avgIbc)}`;
  if (hitsMaxCap) {
    ibcStatusLabel = `Tope ${ibcMaxSmmlv} SMMLV activo (${formatCOP(maxIbc)})`;
  } else if (hitsMinFloor) {
    ibcStatusLabel = `Piso 1 SMMLV activo (${formatCOP(config.minimumWage)})`;
  }

  const regime = plan.selectedRegime;
  const globalCapPct =
    regime.globalCapLimit > 0
      ? Math.min(100, (regime.totalSubjectToGlobalCap / regime.globalCapLimit) * 100)
      : 0;
  const isCapExceeded = regime.totalSubjectToGlobalCap > regime.globalCapLimit + 1;

  return (
    <section className="kpi-grid" aria-label="Indicadores principales">
      <article className="kpi-card highlight">
        <span className="kpi-label">Ahorro Mensual Recomendado (Renta)</span>
        <strong className="kpi-value">{formatCOP(avgMonthlyTaxSave)}</strong>
        <span className="kpi-sub">
          Por ahorrar en el año: <strong>{formatCOP(plan.netAnnualTaxToSave)}</strong>
          {plan.withholdingsPaidAnnual > 0
            ? ` (Impuesto ${formatCOP(plan.annualTaxTotal)} − Retefuente ${formatCOP(plan.withholdingsPaidAnnual)})`
            : ''}
        </span>
      </article>

      <article className="kpi-card">
        <span className="kpi-label">Pago Mensual PILA (Seguridad Social)</span>
        <strong className="kpi-value">{formatCOP(avgMonthlyPila)}</strong>
        <span className="kpi-sub">
          Anual: {formatCOP(plan.annualPilaTotal)} · {ibcStatusLabel}
        </span>
      </article>

      <article className="kpi-card">
        <span className="kpi-label">Ingreso Neto Disponible (Promedio)</span>
        <strong className="kpi-value">{formatCOP(avgMonthlyNetSpendable)}</strong>
        <span className="kpi-sub">
          Anual libre tras PILA y ahorro renta: {formatCOP(plan.annualNetSpendableIncome)}
        </span>
      </article>

      <article className="kpi-card">
        <span className="kpi-label">Tasa Efectiva Renta y Límite Ley 2277</span>
        <strong className="kpi-value">{plan.effectiveTaxRate.toFixed(2)}%</strong>
        <span className="kpi-sub">
          Uso tope 40% / 1.340 UVT: {formatCOP(regime.appliedCappedDeductions)} /{' '}
          {formatCOP(regime.globalCapLimit)} ({globalCapPct.toFixed(0)}%)
          {isCapExceeded ? ' · Tope alcanzado' : ''}
        </span>
        <div className="progress-track" aria-hidden="true">
          <div
            className={`progress-fill ${isCapExceeded ? 'capped' : ''}`}
            style={{ width: `${globalCapPct}%` }}
          />
        </div>
      </article>
    </section>
  );
};
