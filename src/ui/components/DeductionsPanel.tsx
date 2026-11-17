import React from 'react';
import { ARL_RISK_LEVELS } from '../../constants/tax-values';
import { parseCurrencyInput } from '../../helpers/number';
import { DeductionMode, TaxYearConfig } from '../../types/tax.types';
import { formatCOP } from '../../utils/format';

export interface DeductionFormState {
  deductionMode: DeductionMode;
  dependentsCount: string;
  prepaidHealthPeriod: 'annual' | 'monthly';
  prepaidHealthText: string;
  housingInterestText: string;
  voluntaryPensionText: string;
  actualCostsText: string;
  electronicInvoicePurchasesText: string;
  gmfText: string;
  arlRate: string;
  withholdingsPaidText: string;
}

interface DeductionsPanelProps {
  form: DeductionFormState;
  config: TaxYearConfig;
  onChange: <K extends keyof DeductionFormState>(key: K, value: DeductionFormState[K]) => void;
}

interface CurrencyFieldProps {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const CurrencyField: React.FC<CurrencyFieldProps> = ({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder = '0',
}) => {
  const parsed = parseCurrencyInput(value, { allowZero: true, min: 0 });
  return (
    <div className="field-group">
      <div className="field-label-row">
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
        <span className="field-hint">{hint}</span>
      </div>
      <input
        id={id}
        className={`input-control ${parsed.value === null ? 'has-error' : ''}`}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {parsed.value === null ? (
        <p className="field-error">{parsed.error ?? 'Valor numérico inválido'}</p>
      ) : (
        parsed.value > 0 && <p className="field-preview">{formatCOP(parsed.value)}</p>
      )}
    </div>
  );
};

export const DeductionsPanel: React.FC<DeductionsPanelProps> = ({ form, config, onChange }) => {
  const { uvt } = config;

  const dependentsNum = Number.parseInt(form.dependentsCount, 10);
  const dependentsValid =
    form.dependentsCount.trim() !== '' &&
    !Number.isNaN(dependentsNum) &&
    dependentsNum >= 0 &&
    dependentsNum <= 20;

  const extraDepsCount = dependentsValid ? Math.min(dependentsNum, 4) : 0;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">2. Deducciones Ley 2277 y Régimen</h2>
          <p className="panel-desc">
            Configure sus beneficios tributarios, costos reales, ARL y retenciones practicadas.
          </p>
        </div>
      </div>

      <div className="field-group">
        <div className="field-label-row">
          <label className="field-label" htmlFor="deduction-mode-select">
            Modo de Depuración / Régimen
          </label>
        </div>
        <select
          id="deduction-mode-select"
          className="select-control"
          value={form.deductionMode}
          onChange={(e) => onChange('deductionMode', e.target.value as DeductionMode)}
        >
          <option value="auto">Automático (Recomendado - Menor Impuesto)</option>
          <option value="exempt25">Renta Exenta 25% (Art. 206 - Tope 790 UVT)</option>
          <option value="actualCosts">Costos y Gastos Reales (Art. 336)</option>
          <option value="legacyPresumptive">Modo Clásico (25% Presuntivo sin tope)</option>
        </select>
      </div>

      <div className="two-col">
        <div className="field-group">
          <div className="field-label-row">
            <label className="field-label" htmlFor="dependents-input">
              Dependientes (0 a 4+)
            </label>
          </div>
          <input
            id="dependents-input"
            className={`input-control ${!dependentsValid ? 'has-error' : ''}`}
            type="number"
            min={0}
            max={20}
            value={form.dependentsCount}
            onChange={(e) => onChange('dependentsCount', e.target.value)}
          />
          {!dependentsValid ? (
            <p className="field-error">Ingrese un número entero entre 0 y 20.</p>
          ) : (
            <p className="field-preview">
              {dependentsNum > 0
                ? `Art. 387: 10% (tope 384 UVT = ${formatCOP(384 * uvt)}) + ${extraDepsCount}×72 UVT fuera de tope (${formatCOP(extraDepsCount * 72 * uvt)})`
                : 'Sin dependientes económicos'}
            </p>
          )}
        </div>

        <div className="field-group">
          <div className="field-label-row">
            <label className="field-label" htmlFor="arl-select">
              Nivel de Riesgo ARL
            </label>
            <span className="field-hint">Opcional</span>
          </div>
          <select
            id="arl-select"
            className="select-control"
            value={form.arlRate}
            onChange={(e) => onChange('arlRate', e.target.value)}
          >
            {ARL_RISK_LEVELS.map((opt) => (
              <option key={opt.level} value={String(opt.rate)}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-group">
        <div className="field-label-row">
          <label className="field-label" htmlFor="prepaid-health-input">
            Medicina Prepagada / Seguros de Salud
          </label>
          <span className="field-hint">Tope 16 UVT/mes ({formatCOP(192 * uvt)}/año)</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <button
            type="button"
            className={`btn btn-sm ${form.prepaidHealthPeriod === 'annual' ? 'btn-primary' : ''}`}
            onClick={() => onChange('prepaidHealthPeriod', 'annual')}
          >
            Valor Anual
          </button>
          <button
            type="button"
            className={`btn btn-sm ${form.prepaidHealthPeriod === 'monthly' ? 'btn-primary' : ''}`}
            onClick={() => onChange('prepaidHealthPeriod', 'monthly')}
          >
            Valor Mensual (×12)
          </button>
        </div>
        {(() => {
          const parsed = parseCurrencyInput(form.prepaidHealthText, { allowZero: true, min: 0 });
          const multiplier = form.prepaidHealthPeriod === 'monthly' ? 12 : 1;
          const annualEquivalent = parsed.value !== null ? parsed.value * multiplier : 0;
          return (
            <>
              <input
                id="prepaid-health-input"
                className={`input-control ${parsed.value === null ? 'has-error' : ''}`}
                type="text"
                inputMode="numeric"
                value={form.prepaidHealthText}
                onChange={(e) => onChange('prepaidHealthText', e.target.value)}
                placeholder="0"
              />
              {parsed.value === null && (
                <p className="field-error">{parsed.error ?? 'Valor numérico inválido'}</p>
              )}
              {parsed.value !== null && parsed.value > 0 && (
                <p className="field-preview">Equivalente anual: {formatCOP(annualEquivalent)}</p>
              )}
            </>
          );
        })()}
      </div>

      <CurrencyField
        id="housing-interest-input"
        label="Intereses de Vivienda (Anual)"
        hint={`Tope 100 UVT/mes (${formatCOP(1200 * uvt)}/año)`}
        value={form.housingInterestText}
        onChange={(v) => onChange('housingInterestText', v)}
      />

      <CurrencyField
        id="voluntary-pension-input"
        label="Aportes Voluntarios FPV / AFC (Anual)"
        hint={`Tope 30% ó 3.800 UVT (${formatCOP(3800 * uvt)})`}
        value={form.voluntaryPensionText}
        onChange={(v) => onChange('voluntaryPensionText', v)}
      />

      <CurrencyField
        id="actual-costs-input"
        label="Costos y Gastos Procedentes (Anual)"
        hint="Comparación Opción B (Art. 336)"
        value={form.actualCostsText}
        onChange={(v) => onChange('actualCostsText', v)}
      />

      <CurrencyField
        id="electronic-invoice-input"
        label="Compras con Factura Electrónica (Anual)"
        hint={`Deduce 1% hasta 240 UVT (${formatCOP(240 * uvt)}) fuera de tope`}
        value={form.electronicInvoicePurchasesText}
        onChange={(v) => onChange('electronicInvoicePurchasesText', v)}
      />

      <div className="two-col">
        <CurrencyField
          id="gmf-input"
          label="4x1000 / GMF Pagado (Anual)"
          hint="Deduce 50%"
          value={form.gmfText}
          onChange={(v) => onChange('gmfText', v)}
        />

        <CurrencyField
          id="withholdings-input"
          label="Retención en la Fuente (Anual)"
          hint="Resta del ahorro final"
          value={form.withholdingsPaidText}
          onChange={(v) => onChange('withholdingsPaidText', v)}
        />
      </div>
    </section>
  );
};
