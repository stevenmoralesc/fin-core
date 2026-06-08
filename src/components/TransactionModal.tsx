"use client";

import { useState, useRef, useEffect } from "react";
import { RefreshCw, X } from "lucide-react";
import type { Account, CreditCard as CreditCardType, CategoriesByType } from "@/lib/types";
import { useRouter } from "next/navigation";

// ── Mapa de emojis por categoría ────────────────────────────────
const CATEGORY_EMOJI: Record<string, string> = {
  VIVIENDA: "🏠",
  ALIMENTACION: "🛒",
  TRANSPORTE: "🚗",
  SALUD: "💊",
  EDUCACION: "📚",
  ENTRETENIMIENTO: "🎬",
  ROPA: "👕",
  MASCOTAS: "🐶",
  RESTAURANTES: "🍔",
  TECNOLOGIA: "💻",
  VIAJES: "✈️",
  DEPORTES: "🏋️",
  BELLEZA: "💄",
  SERVICIOS: "⚡",
  INGRESO: "💰",
  SALARIO: "💼",
  TRANSFERENCIA: "↔️",
};

function getCategoryEmoji(cat: string): string {
  const key = cat.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return CATEGORY_EMOJI[key] ?? "📂";
}

interface ModalProps {
  accounts: Account[];
  creditCards: CreditCardType[];
  categories: CategoriesByType;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TransactionModal({ accounts, creditCards, categories, onClose, onSuccess }: ModalProps) {
  const router = useRouter();

  const [form, setForm] = useState({
    type: "GASTO" as "INGRESO" | "GASTO" | "TRANSFERENCIA",
    category: "",
    subcategory: "",
    amount: "",
    description: "",
    tags: "",
    paymentMethod: accounts.length > 0 ? `ACCOUNT:${accounts[0].id}` : "",
    installments: "1",
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amountRef = useRef<HTMLInputElement>(null);

  // auto focus amount on open
  useEffect(() => { amountRef.current?.focus(); }, []);

  const categoriesForType = categories[form.type] ?? {};
  const flatCategories = Object.entries(categoriesForType).map(([cat, subs]) => ({
    cat,
    firstSub: subs[0]?.subcategory ?? cat,
    allSubs: subs.map((s) => s.subcategory),
  }));

  function setType(t: "INGRESO" | "GASTO" | "TRANSFERENCIA") {
    setForm((f) => {
      let pm = f.paymentMethod;
      if (t !== "GASTO" && pm.startsWith("CREDIT_CARD")) {
        pm = accounts.length > 0 ? `ACCOUNT:${accounts[0].id}` : "";
      }
      return { ...f, type: t, category: "", subcategory: "", paymentMethod: pm };
    });
  }

  function selectCategory(cat: string, sub: string) {
    setForm((f) => ({ ...f, category: cat, subcategory: sub }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category || !form.subcategory || !form.amount) {
      setError("Elige una categoría e ingresa el monto.");
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
          description: form.description || form.category,
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
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  const isGasto = form.type === "GASTO";
  const isIngreso = form.type === "INGRESO";

  const amountColor = isIngreso
    ? "text-green-500 placeholder:text-green-300"
    : isGasto
    ? "text-red-500 placeholder:text-red-300"
    : "text-gray-800 placeholder:text-gray-400";

  const inputBase = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 bg-white transition-all";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-[420px] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* ── Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 sm:pt-5">
          <h3 className="text-[15px] font-semibold text-gray-900">Nuevo movimiento</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-6 space-y-5">

          {/* ── Monto + Toggle tipo ─────────────────────────────── */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
            {/* [-] Gasto */}
            <button
              type="button"
              onClick={() => setType("GASTO")}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold shrink-0 transition-all border-2 ${
                isGasto
                  ? "bg-red-500 border-red-500 text-white shadow-md shadow-red-200"
                  : "bg-white border-gray-200 text-gray-400 hover:border-red-300"
              }`}
            >
              −
            </button>

            <input
              ref={amountRef}
              type="number"
              min="0"
              step="100"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0"
              className={`flex-1 text-3xl font-bold bg-transparent outline-none text-center ${amountColor}`}
              style={{ minWidth: 0 }}
            />

            {/* [+] Ingreso */}
            <button
              type="button"
              onClick={() => setType("INGRESO")}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold shrink-0 transition-all border-2 ${
                isIngreso
                  ? "bg-green-500 border-green-500 text-white shadow-md shadow-green-200"
                  : "bg-white border-gray-200 text-gray-400 hover:border-green-300"
              }`}
            >
              +
            </button>
          </div>

          {/* ── Descripción ─────────────────────────────────────── */}
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="¿En qué? (opcional)"
            className="w-full text-sm bg-transparent border-b border-gray-200 pb-2 outline-none text-gray-800 placeholder:text-gray-400 focus:border-gray-500 transition-colors"
          />

          {/* ── Categorías planas ───────────────────────────────── */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Categoría</p>
            {flatCategories.length === 0 ? (
              <p className="text-xs text-gray-400">Sin categorías para este tipo.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {flatCategories.map(({ cat, firstSub, allSubs }) => {
                  const isSelected = form.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => selectCategory(cat, isSelected && allSubs.length > 1 ? allSubs[(allSubs.indexOf(form.subcategory) + 1) % allSubs.length] : firstSub)}
                      className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-center transition-all ${
                        isSelected
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-xl leading-none">{getCategoryEmoji(cat)}</span>
                      <span className="text-[10px] font-semibold leading-tight truncate w-full text-center">{cat}</span>
                      {isSelected && form.subcategory && (
                        <span className={`text-[9px] leading-tight truncate w-full text-center ${isSelected ? "text-gray-300" : "text-gray-400"}`}>
                          {form.subcategory}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Medio de pago + Fecha ──────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Medio de pago</p>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                className={inputBase}
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
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Fecha</p>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className={inputBase}
              />
            </div>
          </div>

          {/* ── Cuotas (solo TC) ─────────────────────────────────── */}
          {form.paymentMethod.startsWith("CREDIT_CARD") && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Número de cuotas</p>
              <input
                type="number"
                min="1"
                max="36"
                value={form.installments}
                onChange={(e) => setForm((f) => ({ ...f, installments: e.target.value }))}
                className={inputBase}
              />
            </div>
          )}

          {/* ── Tags ──────────────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Etiquetas (opcional)</p>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="#supermercado #tarjeta"
              className="w-full text-sm bg-transparent border-b border-gray-200 pb-2 outline-none text-gray-600 placeholder:text-gray-300 focus:border-gray-500 transition-colors"
            />
          </div>

          {/* ── Error ─────────────────────────────────────────────── */}
          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* ── Submit ────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm font-semibold text-white bg-gray-900 hover:bg-black py-3 rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading && <RefreshCw size={14} className="animate-spin" />}
            {loading ? "Guardando..." : "Registrar movimiento"}
          </button>
        </form>
      </div>
    </div>
  );
}
