"use client";

import { useState } from "react";
import { PieChart, Plus, Target, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { BudgetStats } from "@/app/presupuesto/page";
import BudgetModal from "@/components/modals/BudgetModal";

interface BudgetDashboardProps {
  initialStats: BudgetStats[];
}

function formatCOP(value: number): string {
  return `$${value.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Monto abreviado: 368000 → "368k", 1226450 → "1,2M" */
function formatK(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${(Math.round(m * 10) / 10).toString().replace(".", ",")}M`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${Math.round(value)}`;
}

/** Paleta pastel cíclica: relleno (claro) + borde punteado (mismo tono, más saturado) */
const PASTELS = [
  { fill: "#FBD7B0", dash: "#E8A867" }, // durazno
  { fill: "#BBDEF5", dash: "#7BB8DC" }, // azul
  { fill: "#F9C7D6", dash: "#EB9BB0" }, // rosa
  { fill: "#F4E5A1", dash: "#D9BE5C" }, // amarillo
  { fill: "#C6E8C9", dash: "#85C58E" }, // verde
  { fill: "#D9C9F0", dash: "#AE94DD" }, // lila
  { fill: "#FAD4C0", dash: "#EE9E7E" }, // coral
  { fill: "#C9E9E4", dash: "#7FC9BE" }, // turquesa
];

const MAX_BAR_HEIGHT = 300; // px de la barra punteada más alta
const MIN_BAR_HEIGHT = 124; // px mínimos para que quepa el contenido

export default function BudgetDashboard({ initialStats }: BudgetDashboardProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Orden de mayor a menor presupuesto (así las barras punteadas descienden)
  const stats = [...initialStats].sort((a, b) => b.budget - a.budget);

  const totalBudget = stats.reduce((acc, s) => acc + s.budget, 0);
  const totalSpent = stats.reduce((acc, s) => acc + s.spent, 0);
  const globalProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const maxBudget = Math.max(...stats.map((s) => s.budget), 1);

  const handleDelete = async (category: string) => {
    if (!confirm(`¿Eliminar el presupuesto de ${category}?`)) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/budgets?category=${encodeURIComponent(category)}`, { method: "DELETE" });
      router.refresh();
    } catch {
      alert("Error al eliminar");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* ── KPI Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border p-6 shadow-sm flex flex-col justify-between" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Target size={20} className="text-indigo-600" />
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Presupuesto Total</h3>
              </div>
              <p className="text-3xl font-bold mt-2" style={{ color: "var(--text-primary)" }}>{formatCOP(totalBudget)}</p>
            </div>
          </div>

          <div className="rounded-2xl border p-6 shadow-sm flex flex-col justify-between" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <PieChart size={20} className="text-rose-600" />
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Gasto Actual</h3>
              </div>
              <p className="text-3xl font-bold mt-2" style={{ color: "var(--text-primary)" }}>{formatCOP(totalSpent)}</p>
            </div>
          </div>

          <div className="rounded-2xl border p-6 shadow-sm flex flex-col justify-between" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Ejecución Global</h3>
                <span className="text-sm font-bold" style={{ color: globalProgress > 100 ? "var(--danger)" : "var(--success)" }}>
                  {globalProgress.toFixed(1)}%
                </span>
              </div>
              <div className="h-4 w-full bg-surface-3 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${Math.min(globalProgress, 100)}%`, background: globalProgress > 100 ? "var(--danger)" : "var(--success)" }}
                />
              </div>
              <p className="text-xs font-medium mt-3" style={{ color: "var(--text-muted)" }}>
                {globalProgress > 100
                  ? `Te excediste por ${formatCOP(totalSpent - totalBudget)}`
                  : `Te quedan ${formatCOP(totalBudget - totalSpent)} disponibles`}
              </p>
            </div>
          </div>
        </div>

        {/* ── Gráfico de barras por categoría ── */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Presupuestos por Categoría</h2>
            <button
              onClick={() => { setEditingCategory(null); setModalOpen(true); }}
              className="flex items-center gap-2 text-sm font-semibold transition-colors"
              style={{ color: "#4f46e5" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#4338ca")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#4f46e5")}
            >
              <Plus size={16} /> Ajustar Presupuestos
            </button>
          </div>

          <div className="rounded-3xl border p-6 shadow-sm overflow-x-auto" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            {stats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Sin presupuestos configurados</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-placeholder)" }}>Haz clic en «Ajustar Presupuestos» para empezar</p>
              </div>
            ) : (
              <div
                className="flex gap-4 sm:gap-6 items-end justify-start pt-10"
                style={{ minHeight: MAX_BAR_HEIGHT + 56 }}
              >
                {stats.map((cat, i) => {
                  const color = PASTELS[i % PASTELS.length];
                  const pct = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : cat.spent > 0 ? 100 : 0;
                  const fillPct = Math.min(pct, 100);

                  // Altura de la barra punteada ∝ presupuesto (mayor presupuesto = más alta)
                  const ratio = cat.budget / maxBudget;
                  const outlineHeight = Math.max(MIN_BAR_HEIGHT, Math.round(ratio * MAX_BAR_HEIGHT));

                  return (
                    <div
                      key={cat.category}
                      className="group relative flex flex-col items-center shrink-0"
                      style={{ width: 96 }}
                    >
                      {/* Acciones en hover */}
                      <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <button
                          onClick={() => { setEditingCategory(cat); setModalOpen(true); }}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-surface border border-base text-secondary hover:text-indigo-600 shadow-sm transition-colors"
                          title="Editar"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.category)}
                          disabled={isDeleting}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-surface border border-base text-secondary hover:text-red-600 shadow-sm transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      {/* Barra: contorno punteado (= presupuesto) con relleno pastel (= gastado) */}
                      <div
                        className="relative w-full transition-transform group-hover:-translate-y-1"
                        style={{
                          height: outlineHeight,
                          borderRadius: 24,
                          border: `2px dashed ${color.dash}`,
                          padding: 4,
                        }}
                        title={`${cat.category} · gastado ${formatCOP(cat.spent)} de ${formatCOP(cat.budget)}`}
                      >
                        {/* Relleno que crece desde abajo (mín. para que el texto quede legible sobre el pastel) */}
                        <div
                          className="absolute left-1 right-1 bottom-1 transition-[height] duration-700 ease-out"
                          style={{
                            height: `calc(${fillPct}% - 8px)`,
                            minHeight: cat.spent > 0 ? 84 : 0,
                            background: color.fill,
                            borderRadius: 20,
                          }}
                        />

                        {/* Contenido anclado al fondo, sobre el relleno */}
                        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-0.5 pb-3 z-10">
                          <span className="text-xl leading-none mb-1">{cat.icon || "💸"}</span>
                          <span className="text-sm font-extrabold leading-none" style={{ color: "#1f2937" }}>
                            {formatK(cat.spent)}
                          </span>
                          <span className="text-[11px] font-semibold leading-none" style={{ color: "rgba(31,41,55,0.55)" }}>
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Nombre de la categoría */}
                      <p
                        className="text-xs font-medium text-center mt-3 truncate w-full"
                        style={{ color: "var(--text-secondary)" }}
                        title={cat.category}
                      >
                        {cat.category}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <BudgetModal
          stats={stats}
          initialCategory={editingCategory?.category}
          initialBudget={editingCategory?.budget}
          initialIcon={editingCategory?.icon ?? undefined}
          onClose={() => { setModalOpen(false); setEditingCategory(null); }}
        />
      )}
    </>
  );
}
