"use client";

import { useState } from "react";
import { RefreshCw, X } from "lucide-react";
import type { Account, CreditCard as CreditCardType, CategoriesByType } from "@/lib/types";
import { useRouter } from "next/navigation";

interface ModalProps {
  accounts: Account[];
  creditCards: CreditCardType[];
  categories: CategoriesByType;
  onClose: () => void;
}

export default function TransactionModal({ accounts, creditCards, categories, onClose }: ModalProps) {
  const router = useRouter();
  
  const [form, setForm] = useState({
    type: "GASTO" as "INGRESO" | "GASTO" | "TRANSFERENCIA",
    category: "",
    subcategory: "",
    amount: "",
    description: "",
    paymentMethod: accounts.length > 0 ? `ACCOUNT:${accounts[0].id}` : "",
    installments: "1",
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Categorías filtradas según el tipo de transacción seleccionado
  const categoriesForType = categories[form.type] ?? {};
  const subcategories = form.category ? (categoriesForType[form.category] ?? []) : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category || !form.subcategory || !form.amount || !form.description) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setLoading(true);
    setError("");

    const [paymentMethodType, paymentMethodId] = form.paymentMethod.split(":");

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          paymentMethodId,
          paymentMethodType,
          installments: parseInt(form.installments || "1"),
          date: new Date(form.date).toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error desconocido");
      }
      
      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  // Estilos base copiados del diseño de Sheets
  const labelClass = "block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5";
  const inputClass = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 bg-white transition-all";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <form
        className="bg-white rounded-xl shadow-2xl w-full max-w-[420px] p-6 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[15px] font-semibold text-gray-900">Nueva Transacción</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Row 1: Tipo y Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Tipo</label>
              <select
                value={form.type}
                onChange={(e) => {
                  const nextType = e.target.value as "INGRESO" | "GASTO" | "TRANSFERENCIA";
                  setForm((f) => {
                    let pm = f.paymentMethod;
                    if (nextType !== "GASTO" && pm.startsWith("CREDIT_CARD")) {
                      pm = accounts.length > 0 ? `ACCOUNT:${accounts[0].id}` : "";
                    }
                    return { ...f, type: nextType, category: "", subcategory: "", paymentMethod: pm };
                  });
                }}
                className={inputClass}
              >
                <option value="INGRESO">Ingreso</option>
                <option value="GASTO">Gasto</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Fecha</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 2: Medio de Pago */}
          <div>
            <label className={labelClass}>Medio de Pago</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
              className={inputClass}
            >
              <option value="" disabled>Selecciona...</option>
              <optgroup label="Cuentas / Efectivo">
                {accounts.map((acc) => (
                  <option key={`ACCOUNT:${acc.id}`} value={`ACCOUNT:${acc.id}`}>{acc.name}</option>
                ))}
              </optgroup>
              {form.type === "GASTO" && creditCards.length > 0 && (
                <optgroup label="Tarjetas de Crédito">
                  {creditCards.map((cc) => (
                    <option key={`CREDIT_CARD:${cc.id}`} value={`CREDIT_CARD:${cc.id}`}>{cc.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Row 3: Monto y Cuotas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Monto</label>
              <input
                type="number"
                min="0"
                step="100"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="Ej. 45000"
                className={inputClass}
              />
            </div>
            {form.paymentMethod.startsWith("CREDIT_CARD") && (
              <div>
                <label className={labelClass}>Cuotas</label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={form.installments}
                  onChange={(e) => setForm((f) => ({ ...f, installments: e.target.value }))}
                  className={inputClass}
                />
              </div>
            )}
          </div>

          {/* Row 4: Categoría y Subcategoría */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Categoría</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subcategory: "" }))}
                className={inputClass}
              >
                <option value="">Selecciona...</option>
                {Object.keys(categoriesForType).length === 0 ? (
                  <option disabled value="">Sin categorías para este tipo</option>
                ) : (
                  Object.keys(categoriesForType).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className={labelClass}>Subcategoría</label>
              <select
                value={form.subcategory}
                onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}
                disabled={!form.category}
                className={`${inputClass} disabled:opacity-50 disabled:bg-gray-50`}
              >
                <option value="">Primero elige categoría</option>
                {subcategories.map((s) => (
                  <option key={s.subcategory} value={s.subcategory}>{s.subcategory}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Descripción */}
          <div>
            <label className={labelClass}>Descripción</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="¿En qué se gastó?"
              className={inputClass}
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-7">
          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm font-semibold text-white bg-black hover:bg-gray-900 py-3 rounded-lg transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading && <RefreshCw size={14} className="animate-spin" />}
            {loading ? "Guardando..." : "Registrar Movimiento"}
          </button>
        </div>
      </form>
    </div>
  );
}
