"use client";

import { useState } from "react";
import { X, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CreditCard } from "@/lib/types";

interface EditCreditCardModalProps {
  card: CreditCard;
  onClose: () => void;
}

export default function EditCreditCardModal({ card, onClose }: EditCreditCardModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState({
    name: card.name,
    bank: card.bank,
    totalLimit: String(card.totalLimit),
    closingDay: String(card.closingDay),
    paymentDay: String(card.paymentDay),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/credit-cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          bank: form.bank.trim(),
          totalLimit: Number(form.totalLimit),
          closingDay: Number(form.closingDay),
          paymentDay: Number(form.paymentDay),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error");
      }
      router.refresh();
      onClose();
    } catch (err) {
      alert("Error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/credit-cards/${card.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al eliminar");
      }
      router.refresh();
      onClose();
    } catch (err) {
      alert("Error: " + (err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const inputClass =
    "w-full border-b border-base py-2.5 text-primary text-sm focus:outline-none focus:border-gray-800 transition-colors bg-transparent";
  const labelClass =
    "block text-[10px] leading-none font-bold text-muted uppercase tracking-wide mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-surface rounded-[24px] w-full max-w-[400px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <h2 className="text-lg font-bold text-primary">Editar Tarjeta</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-3 text-muted transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre y Banco */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre Tarjeta</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Banco</label>
              <input
                type="text"
                value={form.bank}
                onChange={(e) => setForm((f) => ({ ...f, bank: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* Cupo */}
          <div>
            <label className={labelClass}>Cupo Total</label>
            <input
              type="number"
              step="0.01"
              value={form.totalLimit}
              onChange={(e) => setForm((f) => ({ ...f, totalLimit: e.target.value }))}
              className={inputClass}
              required
            />
          </div>

          {/* Días */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Día de Corte</label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.closingDay}
                onChange={(e) => setForm((f) => ({ ...f, closingDay: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Día de Pago</label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.paymentDay}
                onChange={(e) => setForm((f) => ({ ...f, paymentDay: e.target.value }))}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-12 h-12 flex items-center justify-center rounded-xl border border-base hover:bg-red-50 hover:border-red-200 text-muted hover:text-red-500 transition-colors shrink-0"
            >
              <Trash2 size={18} />
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-70"
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-900/60">
          <div className="bg-surface rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-primary mb-1">¿Eliminar tarjeta?</h3>
            <p className="text-sm text-secondary mb-5">
              Esta acción eliminará la tarjeta. Asegúrate de no tener cuotas pendientes.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl border border-base text-sm font-semibold text-gray-600 hover:bg-surface-2"
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
