"use client";

import { useState } from "react";
import { X, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Transaction, CategoriesByType } from "@/lib/types";

interface EditTransactionModalProps {
  transaction: Pick<Transaction, "id" | "date" | "type" | "amount" | "category" | "subcategory" | "description">;
  categories: CategoriesByType;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditTransactionModal({
  transaction,
  categories,
  onClose,
  onSuccess,
}: EditTransactionModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState({
    type: transaction.type,
    category: transaction.category,
    subcategory: transaction.subcategory,
    amount: String(transaction.amount),
    description: transaction.description ?? "",
    date: transaction.date.split("T")[0],
  });

  const categoriesForType = categories[form.type] ?? {};
  const subcategories = form.category ? (categoriesForType[form.category] ?? []) : [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          date: form.date,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.refresh();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/transactions/${transaction.id}`, { method: "DELETE" });
      router.refresh();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const inputClass =
    "w-full border-b border-gray-200 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-800 transition-colors bg-transparent";
  const labelClass =
    "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-[440px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Editar Transacción</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[260px]">{transaction.description}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Tipo */}
          <div>
            <label className={labelClass}>Tipo</label>
            <div className="flex gap-2 mt-1">
              {(["GASTO", "INGRESO", "TRANSFERENCIA"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t, category: "", subcategory: "" }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors border ${
                    form.type === t
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {t === "GASTO" ? "Gasto" : t === "INGRESO" ? "Ingreso" : "Transf."}
                </button>
              ))}
            </div>
          </div>

          {/* Fecha y Monto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Fecha</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Monto (COP)</label>
              <input
                type="number"
                min="0"
                step="100"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* Categoría */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Categoría</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subcategory: "" }))}
                className={inputClass}
                required
              >
                <option value="">Selecciona...</option>
                {Object.keys(categoriesForType).length === 0 ? (
                  <option disabled>Sin categorías para este tipo</option>
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
                className={`${inputClass} disabled:opacity-50`}
                required
              >
                <option value="">Selecciona...</option>
                {subcategories.map((s) => (
                  <option key={s.subcategory} value={s.subcategory}>{s.subcategory}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className={labelClass}>Descripción</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="¿Qué fue este movimiento?"
              className={inputClass}
            />
          </div>

          {/* Botones */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-10 h-[46px] flex items-center justify-center rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-500 transition-colors shrink-0"
            >
              <Trash2 size={16} />
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white py-3 px-4 rounded-xl font-bold text-sm transition-all disabled:opacity-70"
            >
              {loading ? <RefreshCw size={16} className="animate-spin" /> : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>

      {/* Confirm delete overlay */}
      {confirmDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-900/60">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">¿Eliminar transacción?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Esta acción es permanente y afectará el saldo de la cuenta.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold"
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
