import Decimal from 'decimal.js';

export function formatCurrency(amount: Decimal): string {
  return `$${amount.toNumber().toLocaleString('es-CO')} COP`;
} 