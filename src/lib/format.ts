/**
 * src/lib/format.ts
 * ─────────────────────────────────────────────────────────────
 * Helpers de formato compartidos (fechas). El formato de dinero
 * vive en src/lib/money.ts.
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Fecha relativa legible: "Hoy", "Ayer", "Hace N días" (2-6),
 * o "dd mmm" para fechas más antiguas. Acepta ISO completo o
 * "YYYY-MM-DD" (se ancla a mediodía local para evitar saltos de día).
 */
export function relativeDate(iso: string): string {
  const dateStr = iso.length === 10 ? iso + "T12:00:00" : iso;
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diff = Math.floor((today.getTime() - target.getTime()) / 86_400_000);

  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff > 1 && diff < 7) return `Hace ${diff} días`;
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}
