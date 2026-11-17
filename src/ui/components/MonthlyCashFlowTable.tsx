import React from 'react';
import { AnnualTaxPlan } from '../../types/tax.types';
import { formatCOP } from '../../utils/format';

interface MonthlyCashFlowTableProps {
  plan: AnnualTaxPlan;
}

export const MonthlyCashFlowTable: React.FC<MonthlyCashFlowTableProps> = ({ plan }) => {
  const showArlColumn = plan.annualArlTotal > 0;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Plan de Ahorro y Flujo de Caja Mensual (12 Meses)</h2>
          <p className="panel-desc">
            Provisión mensual proporcional al ingreso bruto para cubrir la declaración de renta{' '}
            {plan.year} sin sorpresas de liquidez.
          </p>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mes</th>
              <th>Ingreso Bruto</th>
              <th>IBC (40%)</th>
              <th>Salud</th>
              <th>Pensión</th>
              <th>FSP</th>
              {showArlColumn && <th>ARL</th>}
              <th>Total PILA</th>
              <th>Ahorro Renta</th>
              <th>Ahorro Acumulado</th>
              <th>Neto Disponible</th>
            </tr>
          </thead>
          <tbody>
            {plan.months.map((m) => (
              <tr key={m.monthIndex}>
                <td>
                  <strong>{m.monthName}</strong>
                </td>
                <td>{formatCOP(m.grossIncome)}</td>
                <td>{formatCOP(m.ibc)}</td>
                <td>{formatCOP(m.health)}</td>
                <td>{formatCOP(m.pension)}</td>
                <td>{formatCOP(m.fsp)}</td>
                {showArlColumn && <td>{formatCOP(m.arl)}</td>}
                <td>{formatCOP(m.totalPila)}</td>
                <td className="col-accent">{formatCOP(m.taxSavingsProvision)}</td>
                <td>{formatCOP(m.cumulativeTaxSaved)}</td>
                <td className="col-success">{formatCOP(m.netSpendableIncome)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total Anual</td>
              <td>{formatCOP(plan.annualGrossIncome)}</td>
              <td>—</td>
              <td>{formatCOP(plan.annualHealthTotal)}</td>
              <td>{formatCOP(plan.annualPensionTotal)}</td>
              <td>{formatCOP(plan.annualFspTotal)}</td>
              {showArlColumn && <td>{formatCOP(plan.annualArlTotal)}</td>}
              <td>{formatCOP(plan.annualPilaTotal)}</td>
              <td className="col-accent">{formatCOP(plan.netAnnualTaxToSave)}</td>
              <td>{formatCOP(plan.netAnnualTaxToSave)}</td>
              <td className="col-success">{formatCOP(plan.annualNetSpendableIncome)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};
