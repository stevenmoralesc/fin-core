"use client";

/**
 * src/components/budget/BudgetBars.tsx
 * ─────────────────────────────────────────────────────────────
 * Barras de presupuesto por categoría (solo GASTO con tope).
 * - Altura del contorno punteado ∝ tope (diciente).
 * - El relleno pinta el gasto; si se SUPERA el tope, sobresale
 *   por encima del contorno en rojo (sobre-gasto visible).
 * Montos en centavos enteros.
 * ─────────────────────────────────────────────────────────────
 */

import { formatCents, formatCentsShort } from "@/lib/money";

export interface BudgetBarItem {
  category: string;
  icon?: string | null;
  budget: number; // tope, en centavos
  spent: number;  // gastado, en centavos
}

/** Paleta pastel cíclica: relleno (claro) + borde punteado (mismo tono saturado) */
const PASTELS = [
  { fill: "#FBD7B0", dash: "#E8A867" },
  { fill: "#BBDEF5", dash: "#7BB8DC" },
  { fill: "#F9C7D6", dash: "#EB9BB0" },
  { fill: "#F4E5A1", dash: "#D9BE5C" },
  { fill: "#C6E8C9", dash: "#85C58E" },
  { fill: "#D9C9F0", dash: "#AE94DD" },
  { fill: "#FAD4C0", dash: "#EE9E7E" },
  { fill: "#C9E9E4", dash: "#7FC9BE" },
];

const TRACK_H = 190;       // px de la barra (tope) más alta
const MIN_OUTLINE = 84;    // px mínimos para que quepa el contenido
const OVERFLOW_MAX = 60;   // px máximos que el sobre-gasto sobresale

export default function BudgetBars({ items }: { items: BudgetBarItem[] }) {
  // Solo categorías con tope; de mayor a menor (las barras descienden).
  const bars = items
    .filter((b) => b.budget > 0)
    .sort((a, b) => b.budget - a.budget);

  if (bars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          Sin topes configurados
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-placeholder)" }}>
          Asigna un tope a tus categorías de gasto en «Categorías»
        </p>
      </div>
    );
  }

  const maxBudget = Math.max(...bars.map((b) => b.budget), 1);

  return (
    <div
      className="flex gap-4 sm:gap-5 items-end justify-start overflow-x-auto pt-2"
      style={{ minHeight: TRACK_H + OVERFLOW_MAX + 48 }}
    >
      {bars.map((cat, i) => {
        const color = PASTELS[i % PASTELS.length];
        const pct = (cat.spent / cat.budget) * 100;
        const over = pct > 100;

        const outlineH = Math.max(MIN_OUTLINE, Math.round((cat.budget / maxBudget) * TRACK_H));
        // Relleno dentro del contorno (tope al 100%).
        const fillPct = Math.min(pct, 100);
        // Sobre-gasto: sobresale proporcional al exceso, con tope visual.
        const overflowH = over
          ? Math.min(Math.round(((pct - 100) / 100) * outlineH), OVERFLOW_MAX)
          : 0;

        return (
          <div key={cat.category} className="group relative flex flex-col items-center shrink-0" style={{ width: 84 }}>
            {/* Pista: contenedor alto, contenido anclado abajo para que el overflow suba */}
            <div className="flex flex-col justify-end w-full" style={{ height: TRACK_H + OVERFLOW_MAX }}>
              {/* Sobre-gasto (rojo) por encima del contorno */}
              {over && (
                <div
                  className="w-full flex items-start justify-center"
                  style={{
                    height: overflowH,
                    background: "var(--danger)",
                    borderTopLeftRadius: 18,
                    borderTopRightRadius: 18,
                  }}
                  title={`Excedido en ${formatCents(cat.spent - cat.budget)}`}
                >
                  <span className="text-[10px] font-extrabold text-white leading-none pt-1">
                    +{Math.round(pct - 100)}%
                  </span>
                </div>
              )}

              {/* Contorno punteado = tope */}
              <div
                className="relative w-full transition-transform group-hover:-translate-y-0.5"
                style={{
                  height: outlineH,
                  borderRadius: over ? "0 0 22px 22px" : 22,
                  border: `2px dashed ${over ? "var(--danger)" : color.dash}`,
                  padding: 4,
                }}
                title={`${cat.category} · ${formatCents(cat.spent)} de ${formatCents(cat.budget)}`}
              >
                {/* Relleno (gasto) creciendo desde abajo */}
                <div
                  className="absolute left-1 right-1 bottom-1 transition-[height] duration-700 ease-out"
                  style={{
                    height: `calc(${fillPct}% - 8px)`,
                    minHeight: cat.spent > 0 ? 64 : 0,
                    background: color.fill,
                    borderRadius: 18,
                  }}
                />
                {/* Contenido anclado al fondo */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-0.5 pb-2.5 z-10">
                  <span className="text-lg leading-none mb-0.5">{cat.icon || "💸"}</span>
                  <span className="text-sm font-extrabold leading-none" style={{ color: "#1f2937" }}>
                    {formatCentsShort(cat.spent)}
                  </span>
                  <span
                    className="text-[11px] font-bold leading-none"
                    style={{ color: over ? "var(--danger)" : "rgba(31,41,55,0.55)" }}
                  >
                    {pct.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Nombre */}
            <p
              className="text-xs font-medium text-center mt-2.5 truncate w-full"
              style={{ color: "var(--text-secondary)" }}
              title={cat.category}
            >
              {cat.category}
            </p>
          </div>
        );
      })}
    </div>
  );
}
