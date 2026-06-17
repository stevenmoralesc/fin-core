"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, TrendingDown, TrendingUp, ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CategoryItem } from "@/app/presupuesto/page";
import BudgetModal from "@/components/modals/BudgetModal";
import { formatCents } from "@/lib/money";
import { useFeedback } from "@/components/ui/Feedback";

interface Props {
  initialCategories: CategoryItem[];
}

type TxType = "GASTO" | "INGRESO" | "TRANSFERENCIA";

const SECTIONS: { type: TxType; label: string; icon: typeof TrendingDown; color: string; bg: string }[] = [
  { type: "GASTO", label: "Gastos", icon: TrendingDown, color: "var(--danger)", bg: "var(--danger-bg)" },
  { type: "INGRESO", label: "Ingresos", icon: TrendingUp, color: "var(--success)", bg: "var(--success-bg)" },
  { type: "TRANSFERENCIA", label: "Transferencias", icon: ArrowLeftRight, color: "var(--info)", bg: "var(--info-bg)" },
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
      <div className="space-y-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Categorías</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              Organiza tus categorías y asigna un tope mensual a las de gasto.
            </p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            <Plus size={16} />
            Nueva categoría
          </button>
        </div>

        {/* Secciones por tipo */}
        {SECTIONS.map((section) => {
          const items = initialCategories.filter((c) => c.transactionType === section.type);
          const Icon = section.icon;
          return (
            <div key={section.type} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: section.bg }}>
                  <Icon size={15} style={{ color: section.color }} />
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  {section.label}
                </h2>
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>· {items.length}</span>
              </div>

              {items.length === 0 ? (
                <p className="text-sm px-1" style={{ color: "var(--text-placeholder)" }}>
                  Sin categorías de {section.label.toLowerCase()}.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((cat) => (
                    <div
                      key={`${cat.transactionType}:${cat.category}`}
                      className="group flex items-center gap-3 rounded-2xl border p-3.5 transition-colors hover:bg-surface-2"
                      style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: "var(--bg-surface-2)" }}>
                        {cat.icon || "📂"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>{cat.category}</p>
                        {cat.transactionType === "GASTO" && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {cat.suggestedBudget > 0 ? `Tope: ${formatCents(cat.suggestedBudget)}` : "Sin tope"}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => openEdit(cat)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-3"
                          style={{ color: "var(--text-muted)" }}
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-3"
                          style={{ color: "var(--text-muted)" }}
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
