"use client";

import { useState } from "react";
import { X, RefreshCw, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import type { CreditCard as CreditCardType } from "@/lib/types";

interface InstallmentModalProps {
  onClose: () => void;
  cards: CreditCardType[];
  preselectedCardId?: string;
}

export default function InstallmentModal({ onClose, cards, preselectedCardId }: InstallmentModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    creditCardId: preselectedCardId ?? cards[0]?.id ?? "",
    establishment: "",
    totalAmount: "",
    totalMonths: "1",
    purchaseDate: (() => {
      const d = new Date();
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
    })(),
    monthlyInterest: "0",
    category: "Consumo",
  });

  const totalAmountNum = Number(form.totalAmount) || 0;
  const totalMonthsNum = Number(form.totalMonths) || 1;
  const interest = Number(form.monthlyInterest) || 0;

  // Cuota con interés compuesto (si hay interés)
  const monthlyQuota = interest > 0
    ? totalAmountNum * (interest / 100) / (1 - Math.pow(1 + interest / 100, -totalMonthsNum))
    : totalAmountNum / totalMonthsNum;

  const formatCOP = (v: number) => "$" + Number(v).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "GASTO",
          category: form.category,

          amount: totalAmountNum,
          description: form.establishment,
          paymentMethodId: form.creditCardId,
          paymentMethodType: "CREDIT_CARD",
          installments: totalMonthsNum,
          date: form.purchaseDate,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error desconocido");
      }

      router.refresh();
      onClose();
    } catch (error: any) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border-b border-base py-2.5 text-primary text-sm focus:outline-none focus:border-gray-800 transition-colors bg-transparent";
  const labelClass =
    "block text-[10px] leading-none font-bold text-muted uppercase tracking-wide mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-surface rounded-[24px] w-full max-w-[480px] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
              <CreditCard size={18} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-primary">Nueva Compra Diferida</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-3 text-muted transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tarjeta */}
          <div>
            <label className={labelClass}>Tarjeta de Crédito</label>
            <select
              value={form.creditCardId}
              onChange={(e) => setForm((f) => ({ ...f, creditCardId: e.target.value }))}
              className={inputClass}
              required
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.bank}
                </option>
              ))}
            </select>
          </div>

          {/* Establecimiento */}
          <div>
            <label className={labelClass}>Establecimiento / Descripción</label>
            <input
              type="text"
              value={form.establishment}
              onChange={(e) => setForm((f) => ({ ...f, establishment: e.target.value }))}
              placeholder="Ej. Apple Store, Samsung, Exito"
              className={inputClass}
              required
            />
          </div>

          {/* Fecha */}
          <div>
            <label className={labelClass}>Fecha de Compra</label>
            <input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
              className={inputClass}
              required
            />
          </div>

          {/* Monto + Cuotas en misma fila */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Valor Total</label>
              <input
                type="number"
              step="0.01"
                value={form.totalAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, totalAmount: e.target.value }))
                }
                placeholder="$0"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>N° de Cuotas</label>
              <select
                value={form.totalMonths}
                onChange={(e) => setForm((f) => ({ ...f, totalMonths: e.target.value }))}
                className={inputClass}
              >
                {[1, 2, 3, 4, 6, 8, 10, 12, 18, 24, 36, 48, 60].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "cuota" : "cuotas"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tasa de interés */}
          <div>
            <label className={labelClass}>Tasa de Interés Mensual (%) — 0 si es sin interés</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="30"
              value={form.monthlyInterest}
              onChange={(e) => setForm((f) => ({ ...f, monthlyInterest: e.target.value }))}
              className={inputClass}
            />
          </div>

          {/* Resumen de cuota calculada */}
          {totalAmountNum > 0 && (
            <div className="bg-surface-2 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-secondary font-medium">Cuota mensual estimada</p>
                {interest > 0 && (
                  <p className="text-[10px] text-muted mt-0.5">
                    Con interés del {interest}% mensual
                  </p>
                )}
              </div>
              <p className="text-lg font-bold text-primary">{formatCOP(monthlyQuota)}</p>
            </div>
          )}

          {/* Botón */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-70"
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                "Registrar Compra Diferida"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
