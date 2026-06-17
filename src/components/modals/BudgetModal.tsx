"use client";

import { useState } from "react";
import { X, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { fromCents } from "@/lib/money";
import { useFeedback } from "@/components/ui/Feedback";

type TxType = "INGRESO" | "GASTO" | "TRANSFERENCIA";

interface BudgetModalProps {
  onClose: () => void;
  categories: string[];
  initialCategory?: string;
  initialType?: TxType;
  initialBudget?: number; // centavos
  initialIcon?: string;
}

// Emojis sugeridos para categorías comunes
const EMOJI_OPTIONS = [
  "🍔", "🍕", "🛒", "☕", "🍺", "🏠", "🚗", "⛽",
  "💡", "📱", "💻", "🎮", "🎬", "🎵", "👕", "🛍️",
  "✈️", "🏖️", "💊", "🏥", "🎓", "📚", "🐶", "🎁",
  "💰", "💳", "🏦", "💼", "🏋️", "✂️", "🔧", "🌐",
];

export default function BudgetModal({
  onClose,
  categories,
  initialCategory,
  initialType,
  initialBudget,
  initialIcon,
}: BudgetModalProps) {
  const router = useRouter();
  const { toast } = useFeedback();
  const [loading, setLoading] = useState(false);

  const isEditing = !!initialCategory;
  const existingCategories = Array.from(new Set(categories));

  const [categoryType, setCategoryType] = useState<"SELECT" | "NEW">(initialCategory ? "SELECT" : "NEW");

  const [form, setForm] = useState({
    transactionType: (initialType ?? "GASTO") as TxType,
    category: initialCategory || "",
    newCategory: "",
    suggestedBudget: initialBudget ? String(fromCents(initialBudget)) : "",
    icon: initialIcon || "📌",
  });

  const isGasto = form.transactionType === "GASTO";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalCategory = categoryType === "NEW" ? form.newCategory.trim() : form.category;

    if (!finalCategory) {
      toast("error", "Debes seleccionar o ingresar una categoría.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: finalCategory,
          icon: form.icon,
          suggestedBudget: isGasto ? Number(form.suggestedBudget || 0) : 0,
          transactionType: form.transactionType,
        }),
      });

      if (!res.ok) throw new Error("Error al guardar");

      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
      toast("error", "No se pudo guardar la categoría.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border-b py-2.5 text-sm focus:outline-none transition-colors bg-transparent";
  const labelClass = "block text-[10px] leading-none font-bold text-muted uppercase tracking-wide mb-1 mt-4";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
      <div className="rounded-[24px] w-full max-w-[420px] shadow-2xl overflow-hidden border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {isEditing ? "Editar categoría" : "Nueva categoría"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-3" style={{ color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-[10px] leading-none font-bold text-muted uppercase tracking-wide mb-1">Tipo</label>
            <div className="flex gap-2 mt-1.5">
              {(["GASTO", "INGRESO", "TRANSFERENCIA"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={isEditing}
                  onClick={() => setForm((f) => ({ ...f, transactionType: t }))}
                  className="flex-1 py-2 rounded-lg text-xs font-bold transition-colors border disabled:opacity-60"
                  style={form.transactionType === t
                    ? { background: "var(--accent)", color: "var(--accent-fg)", borderColor: "var(--accent)" }
                    : { background: "transparent", color: "var(--text-secondary)", borderColor: "var(--border)" }}
                >
                  {t === "GASTO" ? "Gasto" : t === "INGRESO" ? "Ingreso" : "Transf."}
                </button>
              ))}
            </div>
          </div>

          {/* Categoría */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[10px] leading-none font-bold text-muted uppercase tracking-wide">Nombre</label>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryType(categoryType === "SELECT" ? "NEW" : "SELECT");
                    setForm((f) => ({ ...f, category: "", newCategory: "" }));
                  }}
                  className="text-xs font-bold"
                  style={{ color: "var(--info)" }}
                >
                  {categoryType === "SELECT" ? "+ Nueva" : "Usar existente"}
                </button>
              )}
            </div>
            {categoryType === "SELECT" ? (
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className={inputClass}
                style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
                disabled={isEditing}
                required
              >
                <option value="" disabled>Seleccione una categoría</option>
                {existingCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.newCategory}
                onChange={(e) => setForm((f) => ({ ...f, newCategory: e.target.value }))}
                placeholder="Ej. Vivienda, Transporte"
                className={inputClass}
                style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
                required
              />
            )}
          </div>

          {/* Emoji */}
          <div>
            <label className={labelClass}>Emoji de la categoría</label>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-2xl border" style={{ background: "var(--bg-surface-2)", borderColor: "var(--border)" }}>
                {form.icon || "📌"}
              </div>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="Pega cualquier emoji"
                className={inputClass}
                style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
              />
            </div>
            <div className="grid grid-cols-8 gap-1.5 mt-3">
              {EMOJI_OPTIONS.map((emoji) => {
                const selected = form.icon === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, icon: emoji }))}
                    className="aspect-square rounded-lg flex items-center justify-center text-lg transition-all border"
                    style={{
                      background: selected ? "var(--bg-surface-3)" : "transparent",
                      borderColor: selected ? "var(--text-primary)" : "transparent",
                    }}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tope (solo GASTO) */}
          {isGasto && (
            <div>
              <label className={labelClass}>Tope mensual (presupuesto)</label>
              <input
                type="number"
                step="0.01"
                value={form.suggestedBudget}
                onChange={(e) => setForm((f) => ({ ...f, suggestedBudget: e.target.value }))}
                placeholder="$0 — déjalo en 0 si no quieres tope"
                className={inputClass}
                style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
              />
              <p className="text-[11px] text-muted mt-2 leading-relaxed">
                El tope dibuja la línea punteada en el dashboard. Si lo superas, la barra pinta por fuera en rojo.
              </p>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-70"
              style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : "Guardar categoría"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
