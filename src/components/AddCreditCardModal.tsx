"use client";

import { useState } from "react";
import { X, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface AddCreditCardModalProps {
  onClose: () => void;
}

export default function AddCreditCardModal({ onClose }: AddCreditCardModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    bank: "",
    totalLimit: "",
    closingDay: "15",
    paymentDay: "30",
  });

  const formatCOPInput = (val: string) => {
    const num = val.replace(/\D/g, "");
    if (!num) return "";
    return "$" + parseInt(num, 10).toLocaleString("es-CO");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/credit-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          bank: form.bank.trim(),
          totalLimit: Number(form.totalLimit.replace(/\D/g, "")),
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
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full border-b border-gray-200 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-800 transition-colors bg-transparent";
  const labelClass =
    "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-[400px] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Nueva Tarjeta</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
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
                placeholder="Ej. Visa Platinum"
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
                placeholder="Ej. Bancolombia"
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* Cupo */}
          <div>
            <label className={labelClass}>Cupo Total</label>
            <input
              type="text"
              value={form.totalLimit}
              onChange={(e) => setForm((f) => ({ ...f, totalLimit: formatCOPInput(e.target.value) }))}
              placeholder="$0"
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-70"
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : "Crear Tarjeta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
