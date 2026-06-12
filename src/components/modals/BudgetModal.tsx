"use client";

import { useState } from "react";
import { X, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import type { BudgetStats } from "@/app/presupuesto/page";

interface BudgetModalProps {
  onClose: () => void;
  stats: BudgetStats[];
  initialCategory?: string;
  initialBudget?: number;
}

export default function BudgetModal({ onClose, stats, initialCategory, initialBudget }: BudgetModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const existingCategories = Array.from(new Set(stats.map((s) => s.category)));

  const [categoryType, setCategoryType] = useState<"SELECT" | "NEW">(initialCategory ? "SELECT" : "SELECT");

  const [form, setForm] = useState({
    transactionType: "GASTO" as "INGRESO" | "GASTO" | "TRANSFERENCIA",
    category: initialCategory || "",
    newCategory: "",
    suggestedBudget: initialBudget ? String(initialBudget) : "",
    icon: "📌",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalCategory = categoryType === "NEW" ? form.newCategory : form.category;

    if (!finalCategory) {
      alert("Debes seleccionar o ingresar una categoría.");
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
          suggestedBudget: Number(form.suggestedBudget),
          transactionType: form.transactionType,
        }),
      });

      if (!res.ok) throw new Error("Error al guardar");

      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el presupuesto.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border-b border-gray-300 py-2.5 text-primary focus:outline-none focus:border-black transition-colors text-base bg-transparent";
  const labelClass = "block text-[10px] leading-none font-bold text-muted uppercase tracking-wide mb-1 mt-4";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-surface rounded-[24px] w-full max-w-[420px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header del Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <h2 className="text-lg font-bold text-primary tracking-tight">Ajustar Presupuesto</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-3 text-muted transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Tipo de Transacción */}
          <div>
            <label className="block text-[10px] leading-none font-bold text-muted uppercase tracking-wide mb-1">Tipo de Transacción</label>
            <div className="flex gap-2 mt-1.5">
              {(["GASTO", "INGRESO", "TRANSFERENCIA"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, transactionType: t, category: "" }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors border ${
                    form.transactionType === t
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-surface text-secondary border-base hover:border-gray-300"
                  }`}
                >
                  {t === "GASTO" ? "Gasto" : t === "INGRESO" ? "Ingreso" : "Transf."}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[10px] leading-none font-bold text-muted uppercase tracking-wide">Categoría</label>
              <button 
                type="button" 
                onClick={() => {
                  setCategoryType(categoryType === "SELECT" ? "NEW" : "SELECT");
                  setForm(f => ({ ...f, category: "", newCategory: "" }));
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                {categoryType === "SELECT" ? "+ Nueva" : "Usar existente"}
              </button>
            </div>
            {categoryType === "SELECT" ? (
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className={inputClass}
                required
              >
                <option value="" disabled>Seleccione una categoría</option>
                {existingCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={2}
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  className="w-12 text-center text-xl border-b border-gray-300 py-2.5 focus:outline-none focus:border-black transition-colors bg-transparent"
                  title="Icono (Emoji)"
                />
                <input
                  type="text"
                  value={form.newCategory}
                  onChange={(e) => setForm((f) => ({ ...f, newCategory: e.target.value }))}
                  placeholder="Ej. Vivienda, Transporte"
                  className={inputClass}
                  required
                />
              </div>
            )}
          </div>

          <div>
            <label className={labelClass}>Presupuesto Sugerido (Mensual)</label>
            <input
              type="number"
              step="0.01"
              value={form.suggestedBudget}
              onChange={(e) => setForm((f) => ({ ...f, suggestedBudget: e.target.value }))}
              placeholder="$0"
              className={inputClass}
              required
            />
            <p className="text-[11px] text-muted mt-2 leading-relaxed">
              Si la categoría ya existe, se actualizará su presupuesto.
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-70"
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : "Guardar Presupuesto"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
