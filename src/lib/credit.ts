/**
 * src/lib/credit.ts
 * ─────────────────────────────────────────────────────────────
 * Matemática financiera de compras a cuotas (sistema francés).
 * Fuente única de verdad: la usan dashboard, tarjetas, presupuesto
 * y el pago de cuotas/factura para no duplicar fórmulas.
 * ─────────────────────────────────────────────────────────────
 */

export interface InstallmentLike {
  totalAmount: number;
  totalMonths: number;
  paidMonths: number;
  /** Interés mensual en porcentaje (ej. 2 = 2% mensual). 0 = sin interés. */
  monthlyInterest: number;
}

/**
 * Valor de la cuota mensual.
 * - Con interés: amortización francesa (cuota fija).
 * - Sin interés: reparto lineal del total entre las cuotas.
 */
export function monthlyPayment(
  i: Pick<InstallmentLike, "totalAmount" | "totalMonths" | "monthlyInterest">
): number {
  if (!i.totalMonths || i.totalMonths <= 0) return 0;
  const r = (i.monthlyInterest || 0) / 100;
  if (r > 0) {
    return (i.totalAmount * r) / (1 - Math.pow(1 + r, -i.totalMonths));
  }
  return i.totalAmount / i.totalMonths;
}

/**
 * Capital pendiente (saldo insoluto) tras `paidMonths` pagos.
 * Esto es lo que realmente ocupa el cupo de la tarjeta: el interés
 * es un costo de financiación, NO consume cupo.
 *
 * - Sin interés: total × (cuotas_restantes / total_cuotas).
 * - Con interés: saldo de amortización francesa
 *     P · [(1+r)^n − (1+r)^k] / [(1+r)^n − 1]
 *   con n = total de cuotas, k = cuotas pagadas.
 */
export function outstandingPrincipal(i: InstallmentLike): number {
  if (!i.totalMonths || i.totalMonths <= 0) return 0;
  const k = Math.min(Math.max(i.paidMonths, 0), i.totalMonths);
  const remaining = i.totalMonths - k;
  if (remaining <= 0) return 0;

  const r = (i.monthlyInterest || 0) / 100;
  if (r > 0) {
    const n = i.totalMonths;
    return (
      (i.totalAmount * (Math.pow(1 + r, n) - Math.pow(1 + r, k))) /
      (Math.pow(1 + r, n) - 1)
    );
  }
  return i.totalAmount * (remaining / i.totalMonths);
}
