"use client";

import { useState } from "react";
import { X, RefreshCw, Banknote, Landmark, Briefcase } from "lucide-react";
import { useFeedback } from "@/components/ui/Feedback";

interface AddAccountModalProps {
  onClose: () => void;
}

export default function AddAccountModal({ onClose }: AddAccountModalProps) {
  const { toast } = useFeedback();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "AHORROS" as "EFECTIVO" | "AHORROS" | "CORRIENTE",
    initialBalance: "",
    currency: "COP",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          initialBalance: Number(form.initialBalance),
          currency: form.currency,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error");
      }
      onClose();
    } catch (err) {
      toast("error", (err as Error).message);
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
      <div className="bg-surface rounded-[24px] w-full max-w-[400px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <h2 className="text-lg font-bold text-primary">Nueva Cuenta</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-3 text-muted transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre */}
          <div>
            <label className={labelClass}>Nombre de la Cuenta</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Bancolombia Ahorros, Efectivo Billetera"
              className={inputClass}
              required
            />
          </div>

          {/* Tipo */}
          <div>
            <label className={labelClass}>Tipo de Cuenta</label>
            <div className="flex gap-2 mt-1.5">
              {(["EFECTIVO", "AHORROS", "CORRIENTE"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`flex items-center justify-center gap-2 flex-1 py-3 px-3 rounded-xl border text-sm font-bold transition-all ${
                    form.type === t
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-surface text-secondary border-base hover:border-gray-300"
                  }`}
                >
                  {t === "EFECTIVO" ? (
                    <><Banknote size={16} /> Efectivo</>
                  ) : t === "AHORROS" ? (
                    <><Landmark size={16} /> Ahorros</>
                  ) : (
                    <><Briefcase size={16} /> Corriente</>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Saldo Inicial */}
          <div>
            <label className={labelClass}>Saldo Inicial</label>
            <input
              type="number"
              step="0.01"
              value={form.initialBalance}
              onChange={(e) => setForm((f) => ({ ...f, initialBalance: e.target.value }))}
              placeholder="$0"
              className={inputClass}
              required
            />
            <p className="text-[11px] text-muted mt-1.5 leading-relaxed">
              El saldo que tenías en esta cuenta antes de empezar a trackear.
            </p>
          </div>

          {/* Moneda */}
          <div>
            <label className={labelClass}>Moneda</label>
            <select
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              className={inputClass}
            >
              <option value="COP">🇨🇴 COP — Peso Colombiano</option>
              <option value="USD">🇺🇸 USD — Dólar Americano</option>
              <option value="EUR">🇪🇺 EUR — Euro</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-70"
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : "Crear Cuenta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
