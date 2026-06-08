"use client";

import { useState } from "react";
import { X, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import type { BudgetStats } from "@/app/presupuesto/page";

interface BudgetModalProps {
  onClose: () => void;
  stats: BudgetStats[];
}

export default function BudgetModal({ onClose, stats }: BudgetModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Agrupar subcategorías por categoría
  const categoryMap = stats.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = new Set<string>();
    acc[s.category].add(s.subcategory);
    return acc;
  }, {} as Record<string, Set<string>>);

  const existingCategories = Object.keys(categoryMap);

  const [categoryType, setCategoryType] = useState<"SELECT" | "NEW">("SELECT");
  const [subcategoryType, setSubcategoryType] = useState<"SELECT" | "NEW">("SELECT");

  const [form, setForm] = useState({
    transactionType: "GASTO" as "INGRESO" | "GASTO" | "TRANSFERENCIA",
    category: "",
    newCategory: "",
    subcategory: "",
    newSubcategory: "",
    suggestedBudget: "",
  });

  const availableSubcategories = form.category && categoryMap[form.category] 
    ? Array.from(categoryMap[form.category])
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalCategory = categoryType === "NEW" ? form.newCategory : form.category;
    const finalSubcategory = subcategoryType === "NEW" ? form.newSubcategory : form.subcategory;

    if (!finalCategory || !finalSubcategory) {
      alert("Debes seleccionar o ingresar una categoría y subcategoría.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: finalCategory,
          subcategory: finalSubcategory,
          suggestedBudget: Number(form.suggestedBudget.replace(/\D/g, "")),
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

  const formatCOPInput = (val: string) => {
    const num = val.replace(/\D/g, "");
    if (!num) return "";
    return "$" + parseInt(num, 10).toLocaleString("es-CO");
  };

  const inputClass = "w-full border-b border-gray-300 py-2.5 text-gray-900 focus:outline-none focus:border-black transition-colors text-base bg-transparent";
  const labelClass = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 mt-4";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-[420px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header del Modal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Ajustar Presupuesto</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Tipo de Transacción */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tipo de Transacción</label>
            <div className="flex gap-2 mt-1.5">
              {(["GASTO", "INGRESO", "TRANSFERENCIA"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, transactionType: t, category: "", subcategory: "" }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors border ${
                    form.transactionType === t
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {t === "GASTO" ? "Gasto" : t === "INGRESO" ? "Ingreso" : "Transf."}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Categoría Principal</label>
              <button 
                type="button" 
                onClick={() => {
                  setCategoryType(categoryType === "SELECT" ? "NEW" : "SELECT");
                  setForm(f => ({ ...f, category: "", newCategory: "", subcategory: "", newSubcategory: "" }));
                  setSubcategoryType("SELECT");
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                {categoryType === "SELECT" ? "+ Nueva" : "Usar existente"}
              </button>
            </div>
            {categoryType === "SELECT" ? (
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subcategory: "" }))}
                className={inputClass}
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
                required
              />
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subcategoría</label>
              <button 
                type="button" 
                onClick={() => {
                  setSubcategoryType(subcategoryType === "SELECT" ? "NEW" : "SELECT");
                  setForm(f => ({ ...f, subcategory: "", newSubcategory: "" }));
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                {subcategoryType === "SELECT" ? "+ Nueva" : "Usar existente"}
              </button>
            </div>
            {subcategoryType === "SELECT" ? (
              <select
                value={form.subcategory}
                onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}
                className={inputClass}
                required
                disabled={categoryType === "NEW" || !form.category}
              >
                <option value="" disabled>
                  {categoryType === "NEW" || !form.category ? "Primero seleccione una categoría" : "Seleccione una subcategoría"}
                </option>
                {availableSubcategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={form.newSubcategory}
                onChange={(e) => setForm((f) => ({ ...f, newSubcategory: e.target.value }))}
                placeholder="Ej. Arriendo, Gasolina"
                className={inputClass}
                required
              />
            )}
          </div>

          <div>
            <label className={labelClass}>Presupuesto Sugerido (Mensual)</label>
            <input
              type="text"
              value={form.suggestedBudget}
              onChange={(e) => setForm((f) => ({ ...f, suggestedBudget: formatCOPInput(e.target.value) }))}
              placeholder="$0"
              className={inputClass}
              required
            />
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
              Si la subcategoría ya existe, se actualizará su presupuesto.
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
