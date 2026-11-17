import React, { useState } from 'react';
import { createYearConfigFromBase, registerTaxYearConfig } from '../../constants/tax-values';
import { parseCurrencyInput } from '../../helpers/number';
import { TaxYearConfig } from '../../types/tax.types';

interface YearConfigModalProps {
  currentYear: number;
  currentConfig: TaxYearConfig;
  onClose: () => void;
  onRegistered: (year: number) => void;
}

function parseStrictInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseStrictDecimal(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export const YearConfigModal: React.FC<YearConfigModalProps> = ({
  currentYear,
  currentConfig,
  onClose,
  onRegistered,
}) => {
  const [yearInput, setYearInput] = useState(String(currentYear + 1));
  const [uvtInput, setUvtInput] = useState(String(Math.round(currentConfig.uvt * 1.05)));
  const [smmlvInput, setSmmlvInput] = useState(
    String(Math.round(currentConfig.minimumWage * 1.06)),
  );
  const [healthPctInput, setHealthPctInput] = useState(
    String(Number((currentConfig.contributions.health.rate * 100).toFixed(2))),
  );
  const [pensionPctInput, setPensionPctInput] = useState(
    String(Number((currentConfig.contributions.pension.rate * 100).toFixed(2))),
  );
  const [ibcPctInput, setIbcPctInput] = useState(
    String(Number((currentConfig.contributions.health.base * 100).toFixed(2))),
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);

    const parsedYear = parseStrictInt(yearInput);
    if (parsedYear === null || parsedYear < 2020 || parsedYear > 2100) {
      setErrorMsg('Ingrese un año fiscal válido entre 2020 y 2100.');
      return;
    }

    const uvtParsed = parseCurrencyInput(uvtInput, { allowZero: false, min: 1000 });
    if (uvtParsed.value === null) {
      setErrorMsg(`UVT inválido: ${uvtParsed.error ?? 'ingrese un valor positivo.'}`);
      return;
    }

    const smmlvParsed = parseCurrencyInput(smmlvInput, { allowZero: false, min: 100000 });
    if (smmlvParsed.value === null) {
      setErrorMsg(`SMMLV inválido: ${smmlvParsed.error ?? 'ingrese un valor positivo.'}`);
      return;
    }

    const healthPct = parseStrictDecimal(healthPctInput);
    if (healthPct === null || healthPct <= 0 || healthPct > 100) {
      setErrorMsg('El porcentaje de Salud debe estar entre 0.1% y 100%.');
      return;
    }

    const pensionPct = parseStrictDecimal(pensionPctInput);
    if (pensionPct === null || pensionPct <= 0 || pensionPct > 100) {
      setErrorMsg('El porcentaje de Pensión debe estar entre 0.1% y 100%.');
      return;
    }

    const ibcPct = parseStrictDecimal(ibcPctInput);
    if (ibcPct === null || ibcPct <= 0 || ibcPct > 100) {
      setErrorMsg('La base de cotización (IBC %) debe estar entre 1% y 100%.');
      return;
    }

    const config = createYearConfigFromBase({
      year: parsedYear,
      uvt: uvtParsed.value,
      minimumWage: smmlvParsed.value,
      healthRate: healthPct / 100,
      pensionRate: pensionPct / 100,
      ibcBase: ibcPct / 100,
      presumptiveCosts: currentConfig.deductions.presumptiveCosts,
    });

    registerTaxYearConfig(parsedYear, config);
    onRegistered(parsedYear);
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="year-modal-title">
      <div className="modal-card">
        <div className="modal-header">
          <h2 id="year-modal-title">Agregar o Personalizar Año Fiscal en Memoria</h2>
          <button type="button" className="btn btn-sm" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <p className="panel-desc" style={{ marginBottom: 14 }}>
          Registre parámetros para un nuevo año (ej. 2027) o sobrescriba un año existente en esta
          sesión sin modificar archivos del código.
        </p>

        {errorMsg && <div className="alert-banner alert-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          <div className="two-col">
            <div className="field-group">
              <div className="field-label-row">
                <label className="field-label" htmlFor="custom-year">
                  Año Fiscal
                </label>
              </div>
              <input
                id="custom-year"
                className="input-control"
                type="number"
                min={2020}
                max={2100}
                value={yearInput}
                onChange={(e) => setYearInput(e.target.value)}
              />
            </div>

            <div className="field-group">
              <div className="field-label-row">
                <label className="field-label" htmlFor="custom-ibc">
                  Base IBC (%)
                </label>
                <span className="field-hint">Estándar: 40%</span>
              </div>
              <input
                id="custom-ibc"
                className="input-control"
                type="text"
                value={ibcPctInput}
                onChange={(e) => setIbcPctInput(e.target.value)}
              />
            </div>
          </div>

          <div className="two-col">
            <div className="field-group">
              <div className="field-label-row">
                <label className="field-label" htmlFor="custom-uvt">
                  Valor UVT (COP)
                </label>
              </div>
              <input
                id="custom-uvt"
                className="input-control"
                type="text"
                value={uvtInput}
                onChange={(e) => setUvtInput(e.target.value)}
              />
            </div>

            <div className="field-group">
              <div className="field-label-row">
                <label className="field-label" htmlFor="custom-smmlv">
                  SMMLV (COP)
                </label>
              </div>
              <input
                id="custom-smmlv"
                className="input-control"
                type="text"
                value={smmlvInput}
                onChange={(e) => setSmmlvInput(e.target.value)}
              />
            </div>
          </div>

          <div className="two-col">
            <div className="field-group">
              <div className="field-label-row">
                <label className="field-label" htmlFor="custom-health">
                  Tasa Salud (%)
                </label>
                <span className="field-hint">Estándar: 12.5%</span>
              </div>
              <input
                id="custom-health"
                className="input-control"
                type="text"
                value={healthPctInput}
                onChange={(e) => setHealthPctInput(e.target.value)}
              />
            </div>

            <div className="field-group">
              <div className="field-label-row">
                <label className="field-label" htmlFor="custom-pension">
                  Tasa Pensión (%)
                </label>
                <span className="field-hint">Estándar: 16%</span>
              </div>
              <input
                id="custom-pension"
                className="input-control"
                type="text"
                value={pensionPctInput}
                onChange={(e) => setPensionPctInput(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar Año en Memoria
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
