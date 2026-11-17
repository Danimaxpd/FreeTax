import React from 'react';
import { AnnualTaxPlan, RegimeCalculationSummary } from '../../types/tax.types';
import { formatCOP } from '../../utils/format';

interface RegimeComparisonProps {
  plan: AnnualTaxPlan;
  onSelectMode: (mode: 'exempt25' | 'actualCosts' | 'legacyPresumptive') => void;
}

function formatRatePercent(effectiveTaxRate: number): string {
  return `${effectiveTaxRate.toFixed(2)}%`;
}

export const RegimeComparison: React.FC<RegimeComparisonProps> = ({ plan, onSelectMode }) => {
  const regimes: RegimeCalculationSummary[] = [
    plan.comparison.exempt25,
    plan.comparison.actualCosts,
    plan.comparison.legacyPresumptive,
  ];

  const selected = plan.selectedRegime;
  const exemptTax = plan.comparison.exempt25.annualTaxCop;
  const actualTax = plan.comparison.actualCosts.annualTaxCop;
  const diff = Math.abs(exemptTax - actualTax);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Comparativo de Regímenes y Depuración Ley 2277</h2>
          <p className="panel-desc">
            Comparación automática entre Renta Exenta 25% (Art. 206) y Costos y Gastos Reales (Art.
            336). Haga clic en una tarjeta para simular ese régimen.
          </p>
        </div>
      </div>

      {plan.taxSavedByRecommended > 0 && (
        <div className="alert-banner alert-success">
          <strong>Optimización recomendada:</strong> El régimen{' '}
          <strong>
            {plan.recommendedMode === 'exempt25'
              ? 'Renta Exenta 25% (Art. 206)'
              : 'Costos y Gastos Reales (Art. 336)'}
          </strong>{' '}
          ahorra <strong>{formatCOP(diff)}</strong> al año frente a la otra opción Ley 2277.
        </div>
      )}

      <div className="comparison-grid">
        {regimes.map((reg) => {
          const isSelected = plan.selectedMode === reg.mode;
          const isRecommended = plan.recommendedMode === reg.mode;
          return (
            <div
              key={reg.mode}
              role="button"
              tabIndex={0}
              onClick={() => onSelectMode(reg.mode)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectMode(reg.mode);
                }
              }}
              className={`regime-card ${isSelected ? 'selected' : ''} ${
                isRecommended ? 'recommended' : ''
              }`}
              style={{ cursor: 'pointer' }}
            >
              <div className="regime-badges">
                {isRecommended && <span className="pill-badge pill-success">Recomendado</span>}
                {isSelected && <span className="pill-badge pill-primary">Activo</span>}
                {reg.mode === 'legacyPresumptive' && (
                  <span className="pill-badge pill-neutral">Referencia</span>
                )}
              </div>

              <strong style={{ fontSize: '0.9rem' }}>{reg.label}</strong>
              <span className="regime-tax">{formatCOP(reg.annualTaxCop)}</span>
              <span className="regime-meta">
                Base gravable: {formatCOP(reg.taxableIncomeAnnual)} ({reg.taxableIncomeUvt.toFixed(1)}{' '}
                UVT)
              </span>
              <span className="regime-meta">
                Tasa efectiva: {formatRatePercent(reg.effectiveTaxRate)} · Impuesto:{' '}
                {reg.annualTaxUvt.toFixed(1)} UVT
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '0.92rem' }}>
          Detalle de Depuración Anual — {selected.label}
        </h3>
        <div className="summary-kv-list">
          <div className="summary-kv-item">
            <span>Ingresos Brutos Anuales</span>
            <span>{formatCOP(selected.grossAnnualIncome)}</span>
          </div>
          <div className="summary-kv-item">
            <span>(-) INCRGO (Salud + Pensión + FSP)</span>
            <span>{formatCOP(selected.incrgoAnnual)}</span>
          </div>
          <div className="summary-kv-item">
            <span>(=) Ingresos Netos</span>
            <span>{formatCOP(selected.netIncomeAnnual)}</span>
          </div>
          <div className="summary-kv-item">
            <span>(-) Costos y Gastos Procedentes</span>
            <span>{formatCOP(selected.costsAndExpensesAnnual)}</span>
          </div>
          <div className="summary-kv-item">
            <span>Deducciones Imputables (Dep/Salud/Viv/GMF)</span>
            <span>{formatCOP(selected.imputableDeductionsAnnual)}</span>
          </div>
          <div className="summary-kv-item">
            <span>Rentas Exentas Voluntarias (FPV / AFC)</span>
            <span>{formatCOP(selected.voluntaryExemptionsAnnual)}</span>
          </div>
          <div className="summary-kv-item">
            <span>Renta Exenta 25% (Tope 790 UVT)</span>
            <span>{formatCOP(selected.exempt25Annual)}</span>
          </div>
          <div className="summary-kv-item">
            <span>Aplicado bajo Límite Global (40% / 1.340 UVT)</span>
            <span>
              {formatCOP(selected.appliedCappedDeductions)} / {formatCOP(selected.globalCapLimit)}
            </span>
          </div>
          <div className="summary-kv-item">
            <span>(-) Deducciones Fuera de Tope (72 UVT Dep + 1% FE)</span>
            <span>{formatCOP(selected.outOfCapDeductionsAnnual)}</span>
          </div>
          <div className="summary-kv-item">
            <span>(=) Renta Líquida Gravable (Art. 241 ET)</span>
            <span>
              {formatCOP(selected.taxableIncomeAnnual)} ({selected.taxableIncomeUvt.toFixed(1)} UVT)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
