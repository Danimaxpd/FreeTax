import React from 'react';
import { MONTH_NAMES_ES } from '../../constants/tax-values';
import { parseCurrencyInput } from '../../helpers/number';
import { formatCOP } from '../../utils/format';

export type IncomeMode = 'fixed' | 'variable';

const PRESET_AMOUNTS = [
  { label: '$5M', value: 5_000_000 },
  { label: '$10M', value: 10_000_000 },
  { label: '$15M', value: 15_000_000 },
  { label: '$20M', value: 20_000_000 },
  { label: '$30M', value: 30_000_000 },
];

interface IncomePanelProps {
  incomeMode: IncomeMode;
  fixedIncomeText: string;
  monthlyIncomeTexts: string[];
  onChangeMode: (mode: IncomeMode) => void;
  onChangeFixedIncome: (value: string) => void;
  onChangeMonthlyIncome: (monthIndex: number, value: string) => void;
  onCopyJanuaryToAll: () => void;
  onApplyPreset: (amount: number) => void;
}

export const IncomePanel: React.FC<IncomePanelProps> = ({
  incomeMode,
  fixedIncomeText,
  monthlyIncomeTexts,
  onChangeMode,
  onChangeFixedIncome,
  onChangeMonthlyIncome,
  onCopyJanuaryToAll,
  onApplyPreset,
}) => {
  const fixedParsed = parseCurrencyInput(fixedIncomeText, { allowZero: true, min: 0 });

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">1. Ingresos Brutos</h2>
          <p className="panel-desc">
            Defina un ingreso mensual constante o proyecte variaciones mes a mes (puede incluir
            meses en $0).
          </p>
        </div>
      </div>

      <div className="segmented" role="tablist" aria-label="Modo de ingreso">
        <button
          type="button"
          role="tab"
          aria-selected={incomeMode === 'fixed'}
          className={`segmented-btn ${incomeMode === 'fixed' ? 'active' : ''}`}
          onClick={() => onChangeMode('fixed')}
        >
          Ingreso Mensual Fijo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={incomeMode === 'variable'}
          className={`segmented-btn ${incomeMode === 'variable' ? 'active' : ''}`}
          onClick={() => onChangeMode('variable')}
        >
          Ingresos Mes a Mes
        </button>
      </div>

      <div className="field-group">
        <div className="field-label-row">
          <span className="field-hint">
            {incomeMode === 'fixed' ? 'Atajos rápidos mensuales:' : 'Aplicar valor a los 12 meses:'}
          </span>
        </div>
        <div className="preset-row">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              className="preset-chip"
              onClick={() => onApplyPreset(preset.value)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {incomeMode === 'fixed' ? (
        <div className="field-group">
          <div className="field-label-row">
            <label className="field-label" htmlFor="fixed-income-input">
              Ingreso Bruto Mensual (COP)
            </label>
            <span className="field-hint">Ej: 15.000.000</span>
          </div>
          <input
            id="fixed-income-input"
            className={`input-control ${fixedParsed.value === null ? 'has-error' : ''}`}
            type="text"
            inputMode="numeric"
            value={fixedIncomeText}
            onChange={(e) => onChangeFixedIncome(e.target.value)}
            placeholder="15.000.000"
          />
          {fixedParsed.value === null ? (
            <p className="field-error">{fixedParsed.error ?? 'Valor numérico inválido'}</p>
          ) : (
            <p className="field-preview">
              Mensual: {formatCOP(fixedParsed.value)} · Anual (x12):{' '}
              {formatCOP(fixedParsed.value * 12)}
            </p>
          )}
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <button type="button" className="btn btn-sm" onClick={onCopyJanuaryToAll}>
              Copiar Enero a todos los meses
            </button>
          </div>
          <div className="monthly-inputs-grid">
            {MONTH_NAMES_ES.map((monthName, idx) => {
              const raw = monthlyIncomeTexts[idx] ?? '0';
              const parsed = parseCurrencyInput(raw, { allowZero: true, min: 0 });
              return (
                <div className="field-group" key={monthName} style={{ marginBottom: 4 }}>
                  <div className="field-label-row">
                    <label className="field-label" htmlFor={`month-income-${idx}`}>
                      {monthName}
                    </label>
                  </div>
                  <input
                    id={`month-income-${idx}`}
                    className={`input-control ${parsed.value === null ? 'has-error' : ''}`}
                    type="text"
                    inputMode="numeric"
                    value={raw}
                    onChange={(e) => onChangeMonthlyIncome(idx, e.target.value)}
                    placeholder="0"
                  />
                  {parsed.value === null ? (
                    <p className="field-error">{parsed.error ?? 'Valor inválido'}</p>
                  ) : (
                    <p className="field-preview">{formatCOP(parsed.value)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
