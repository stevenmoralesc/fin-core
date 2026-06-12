"use client";

import { useState } from "react";
import { PieChart, Plus, Target, CheckCircle2, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { BudgetStats } from "@/app/presupuesto/page";
import BudgetModal from "@/components/modals/BudgetModal";

interface BudgetDashboardProps {
  initialStats: BudgetStats[];
}

function formatCOP(value: number): string {
  return `$${value.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BudgetDashboard({ initialStats: stats }: BudgetDashboardProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetStats | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    } catch (e) {
      alert("Error al eliminar");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
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

        {/* ── Desglose por Categoría (Barras Verticales) ── */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Presupuestos por Categoría</h2>
            <button 
              onClick={() => { setEditingCategory(null); setModalOpen(true); }}
              className="flex items-center gap-2 text-sm font-semibold transition-colors"
              style={{ color: "#4f46e5" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#4338ca"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#4f46e5"}
            >
              <Plus size={16} /> Ajustar Presupuestos
            </button>
          </div>

          <div className="rounded-2xl border p-6 shadow-sm overflow-x-auto" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div className="flex gap-8 min-w-max pb-4 pt-12 items-end justify-start">
              {stats.map((cat) => {
                const catProgress = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : (cat.spent > 0 ? 100 : 0);
                const isExceeded = catProgress > 100;
                const isWarning = catProgress > 80 && !isExceeded;
                
                const fillColor = isExceeded 
                  ? "bg-red-500" 
                  : isWarning 
                    ? "bg-amber-400" 
                    : "bg-emerald-500";

                const logMax = Math.log10(maxBudget + 1);
                const logCat = Math.max(0, Math.log10(cat.budget + 1));
                const barHeight = logMax > 0 ? Math.max(32, (logCat / logMax) * 160) : 32;

                return (
                  <div key={cat.category} className="flex flex-col items-center gap-3 w-28 shrink-0 group relative">
                    {/* Acciones (Editar/Eliminar) en Hover */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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

                    {/* Tooltip / Status indicator */}
                    <div className="h-6 flex items-end justify-center">
                      {isExceeded ? (
                        <AlertTriangle size={16} className="text-red-500" />
                      ) : isWarning ? (
                        <AlertTriangle size={16} className="text-amber-500" />
                      ) : catProgress > 0 ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : null}
                    </div>

                    {/* Vertical Bar */}
                    <div className="relative w-12 rounded-full border-2 overflow-hidden flex flex-col justify-end transition-transform group-hover:scale-105"
                         style={{ height: barHeight, borderColor: "var(--border-subtle)", background: "var(--bg-surface-2)" }}>
                      <div 
                        className={`w-full transition-all duration-700 ease-out ${fillColor}`}
                        style={{ height: `${Math.min(catProgress, 100)}%` }}
                      />
                    </div>

                    {/* Info */}
                    <div className="text-center space-y-1">
                      <p className="text-sm font-bold truncate w-28" style={{ color: "var(--text-primary)" }} title={cat.category}>
                        {cat.icon && <span className="mr-1.5 text-base">{cat.icon}</span>}
                        {cat.category}
                      </p>
                      <p className="text-xs font-semibold" style={{ color: isExceeded ? "var(--danger)" : "var(--text-primary)" }}>
                        {formatCOP(cat.spent)}
                      </p>
                      <p className="text-[10px] leading-none font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                        / {formatCOP(cat.budget)}
                      </p>
                      <p className="text-[10px] font-bold mt-1" style={{ color: isExceeded ? "var(--danger)" : "var(--text-muted)" }}>
                        {catProgress.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <BudgetModal 
          stats={stats}
          initialCategory={editingCategory?.category}
          initialBudget={editingCategory?.budget}
          onClose={() => { setModalOpen(false); setEditingCategory(null); }}
        />
      )}
    </>
  );
}
