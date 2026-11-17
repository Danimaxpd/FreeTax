import Decimal from 'decimal.js';

export function formatCurrency(amount: Decimal | number): string {
  const numericValue = amount instanceof Decimal ? amount.toNumber() : amount;
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  return `$${safeValue.toLocaleString('es-CO')} COP`;
}

export function formatCOP(amount: number | Decimal): string {
  const numericValue = amount instanceof Decimal ? amount.toNumber() : amount;
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  return `$${Math.round(safeValue).toLocaleString('es-CO')}`;
}
