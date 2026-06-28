"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CategoryItem } from "@/app/presupuesto/page";
import BudgetModal from "@/components/modals/BudgetModal";
import { formatCentsParts } from "@/lib/money";
import { useFeedback } from "@/components/ui/Feedback";

interface Props {
  initialCategories: CategoryItem[];
}

type TxType = "GASTO" | "INGRESO";

const SECTIONS: { type: TxType; label: string; icon: typeof TrendingDown; color: string; bg: string }[] = [
  { type: "GASTO", label: "Gastos y Presupuestos", icon: TrendingDown, color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
  { type: "INGRESO", label: "Fuentes de Ingreso", icon: TrendingUp, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
];

export default function CategoriesManager({ initialCategories }: Props) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);

  const handleDelete = async (cat: CategoryItem) => {
    if (!(await confirm({ title: `¿Eliminar la categoría «${cat.category}»?`, danger: true }))) return;
    try {
      const res = await fetch(
        `/api/budgets?category=${encodeURIComponent(cat.category)}&transactionType=${cat.transactionType}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast("error", "No se pudo eliminar la categoría");
    }
  };

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (cat: CategoryItem) => { setEditing(cat); setModalOpen(true); };

  return (
    <>
      <div className="space-y-10 md:space-y-16 max-w-[1200px] mx-auto">
        
        {/* ── Header Exaggerated Minimalism ── */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter" style={{ color: "var(--text-primary)" }}>
              Categorías
            </h1>
            <p className="text-lg md:text-xl font-medium tracking-tight" style={{ color: "var(--text-muted)" }}>
              Organiza tus movimientos y define topes mensuales.
            </p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-[16px] text-[15px] font-bold transition-all hover:scale-[1.02] shadow-sm shrink-0"
            style={{ background: "var(--text-primary)", color: "var(--bg-surface)" }}
          >
            <Plus size={18} strokeWidth={2.5} />
            Nueva Categoría
          </button>
        </div>

        {/* ── Secciones por tipo ── */}
        <div className="space-y-16">
          {SECTIONS.map((section) => {
            const items = initialCategories.filter((c) => c.transactionType === section.type);
            const Icon = section.icon;
            
            return (
              <div key={section.type} className="space-y-6">
                {/* Título de Sección */}
                <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: "var(--border-subtle)" }}>
                  <span className="w-10 h-10 rounded-[12px] flex items-center justify-center shadow-sm" style={{ background: section.bg }}>
                    <Icon size={20} style={{ color: section.color }} strokeWidth={2.5} />
                  </span>
                  <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                    {section.label}
                  </h2>
                  <span className="text-[13px] font-bold px-2 py-1 rounded-full ml-2" style={{ background: "var(--bg-surface-2)", color: "var(--text-muted)" }}>
                    {items.length}
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center rounded-[32px] border border-dashed" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--bg-surface-2)", color: "var(--text-placeholder)" }}>
                      <Icon size={24} strokeWidth={1.5} />
                    </div>
                    <p className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>Sin categorías</p>
                    <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>Aún no has configurado categorías para {section.label.toLowerCase()}.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                    {items.map((cat) => (
                      <div
                        key={`${cat.transactionType}:${cat.category}`}
                        className="group flex flex-col justify-between rounded-[24px] border p-5 transition-all duration-200 hover:shadow-md relative overflow-hidden"
                        style={{ 
                          background: "var(--bg-surface)", 
                          borderColor: "var(--border-subtle)",
                        }}
                      >
                        {/* Cabecera Tarjeta: Icono + Acciones */}
                        <div className="flex items-start justify-between mb-4">
                          <div 
                            className="w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-sm transition-transform group-hover:scale-105" 
                            style={{ background: section.bg }}
                          >
                            {cat.icon || "📂"}
                          </div>
                          
                          {/* Botones de acción invisibles hasta hover */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEdit(cat); }}
                              className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                              style={{ background: "var(--bg-surface-2)", color: "var(--text-secondary)" }}
                              title="Editar"
                            >
                              <Pencil size={15} strokeWidth={2} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(cat); }}
                              className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                              style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
                              title="Eliminar"
                            >
                              <Trash2 size={15} strokeWidth={2} />
                            </button>
                          </div>
                        </div>

                        {/* Info de la Categoría */}
                        <div>
                          <p className="text-lg font-bold tracking-tight mb-1 truncate" style={{ color: "var(--text-primary)" }}>
                            {cat.category}
                          </p>
                          
                          {cat.transactionType === "GASTO" && (
                            <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                              <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
                                Tope Mensual
                              </p>
                              {cat.suggestedBudget > 0 ? (
                                <p className="text-xl font-extrabold tabular-nums tracking-tight" style={{ color: "var(--text-primary)" }}>
                                  {(() => {
                                    const { integer, decimal } = formatCentsParts(cat.suggestedBudget);
                                    return (
                                      <>
                                        {integer}
                                        <span style={{ fontSize: "13px", color: "var(--text-placeholder)", marginLeft: "2px" }}>{decimal}</span>
                                      </>
                                    );
                                  })()}
                                </p>
                              ) : (
                                <p className="text-[14px] font-bold" style={{ color: "var(--text-placeholder)" }}>
                                  Sin tope definido
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {modalOpen && (
        <BudgetModal
          categories={initialCategories.map((c) => c.category)}
          initialCategory={editing?.category}
          initialType={editing?.transactionType}
          initialBudget={editing?.suggestedBudget}
          initialIcon={editing?.icon ?? undefined}
          onClose={() => { setModalOpen(false); setEditing(null); }}
        />
      )}
    </>
  );
}
