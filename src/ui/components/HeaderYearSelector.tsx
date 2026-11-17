import React from 'react';
import { TaxYearConfig } from '../../types/tax.types';
import { formatCOP } from '../../utils/format';

interface HeaderYearSelectorProps {
  availableYears: number[];
  selectedYear: number;
  config: TaxYearConfig;
  onSelectYear: (year: number) => void;
  onOpenYearModal: () => void;
}

export const HeaderYearSelector: React.FC<HeaderYearSelectorProps> = ({
  availableYears,
  selectedYear,
  config,
  onSelectYear,
  onOpenYearModal,
}) => {
  const healthPct = (config.contributions.health.rate * 100).toFixed(1);
  const pensionPct = (config.contributions.pension.rate * 100).toFixed(1);
  const ibcPct = (config.contributions.health.base * 100).toFixed(0);

  return (
    <header className="app-header">
      <div className="header-brand">
        <h1>Planeador Tributario Colombia — Renta, PILA y Ahorro Mensual</h1>
        <p className="header-subtitle">
          Simulador en memoria para trabajadores independientes · Estatuto Tributario y Ley 2277 de
          2022
        </p>
        <div className="header-badges">
          <span className="info-badge">Año Fiscal {selectedYear}</span>
          <span className="info-badge">UVT: {formatCOP(config.uvt)}</span>
          <span className="info-badge">SMMLV: {formatCOP(config.minimumWage)}</span>
          <span className="info-badge">
            IBC {ibcPct}% · Salud {healthPct}% · Pensión {pensionPct}%
          </span>
        </div>
      </div>

      <div className="header-controls">
        <div className="year-pills" role="group" aria-label="Seleccionar año fiscal">
          {availableYears.map((yr) => (
            <button
              key={yr}
              type="button"
              className={`year-pill ${yr === selectedYear ? 'active' : ''}`}
              onClick={() => onSelectYear(yr)}
            >
              {yr}
            </button>
          ))}
        </div>

        <button type="button" className="btn btn-glass" onClick={onOpenYearModal}>
          + Agregar / Personalizar Año
        </button>
      </div>
    </header>
  );
};
