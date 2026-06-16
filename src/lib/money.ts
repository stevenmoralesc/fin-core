/**
 * src/lib/money.ts
 * ─────────────────────────────────────────────────────────────
 * El dinero se almacena SIEMPRE como enteros en centavos (la unidad
 * menor de la moneda, valor × 100). Esto evita los errores de
 * redondeo del punto flotante en sumas y saldos.
 *
 * - En la BD: enteros (ej. $1.473.900,00 → 147390000).
 * - En la UI: se divide entre 100 solo para mostrar/editar.
 *
 * Regla: convertir a centavos al ESCRIBIR (toCents) y a unidades al
 * MOSTRAR (fromCents / formatCents). Nunca operar en decimales.
 * ─────────────────────────────────────────────────────────────
 */

/** Decimal de la UI → centavos enteros para almacenar. */
export function toCents(amount: number | string): number {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Centavos almacenados → unidades decimales (para inputs/cálculos UI). */
export function fromCents(cents: number): number {
  return (cents || 0) / 100;
}

/**
 * Formatea centavos como moneda local.
 * @param cents   monto en centavos (entero)
 * @param signed  si true, antepone +/− según el signo
 */
export function formatCents(cents: number, signed = false): string {
  const value = fromCents(cents);
  const abs = Math.abs(value).toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (!signed) return `$${abs}`;
  return value < 0 ? `−$${abs}` : `+$${abs}`;
}

/** Versión abreviada para barras/etiquetas: 368000 cents → "3.680" … */
export function formatCentsShort(cents: number): string {
  const value = fromCents(cents);
  if (Math.abs(value) >= 1_000_000) {
    const m = value / 1_000_000;
    return `${(Math.round(m * 10) / 10).toString().replace(".", ",")}M`;
  }
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${Math.round(value)}`;
}
