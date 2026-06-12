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
    amount: "",
    description: "",
    tags: "",
    paymentMethod: accounts.length > 0 ? `ACCOUNT:${accounts[0].id}` : "",
    installments: "1",
    date: (() => {
      const d = new Date();
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');
    })(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amountRef = useRef<HTMLInputElement>(null);

  // auto focus amount on open
  useEffect(() => { amountRef.current?.focus(); }, []);

  const categoriesForType = categories[form.type] ?? {};
  const flatCategories = Object.keys(categoriesForType);

  function setType(t: "INGRESO" | "GASTO" | "TRANSFERENCIA") {
    setForm((f) => {
      let pm = f.paymentMethod;
      if (t !== "GASTO" && pm.startsWith("CREDIT_CARD")) {
        pm = accounts.length > 0 ? `ACCOUNT:${accounts[0].id}` : "";
      }
      return { ...f, type: t, category: "", paymentMethod: pm };
    });
  }

  function selectCategory(cat: string) {
    setForm((f) => ({ ...f, category: cat }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.category || !form.amount) {
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
          date: form.date,
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
    ? "text-green-500" // we keep tailwind colors for semantic semantic variants like text-green-500, but they're not fully var themed yet unless we map them. But we have --success and --danger.
    : isGasto
    ? "text-red-500"
    : "";

  const inputStyle = { background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" };
  const inputBase = "w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-gray-300 transition-all";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-[420px] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>

        {/* ── Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 sm:pt-5">
          <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Nuevo movimiento</h3>
          <button type="button" onClick={onClose} className="transition-colors p-1" style={{ color: "var(--text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-6 space-y-5">

          {/* ── Monto + Toggle tipo ─────────────────────────────── */}
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "var(--bg-surface-2)" }}>
            {/* [-] Gasto */}
            <button
              type="button"
              onClick={() => setType("GASTO")}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-lg leading-none font-bold shrink-0 transition-all border-2`}
              style={isGasto
                ? { background: "var(--danger)", borderColor: "var(--danger)", color: "white" }
                : { background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              −
            </button>

            <input
              ref={amountRef}
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0"
              className="flex-1 text-3xl leading-tight font-bold bg-transparent outline-none text-center"
              style={{ minWidth: 0, color: isGasto ? "var(--danger)" : isIngreso ? "var(--success)" : "var(--text-primary)" }}
            />

            {/* [+] Ingreso */}
            <button
              type="button"
              onClick={() => setType("INGRESO")}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-lg leading-none font-bold shrink-0 transition-all border-2`}
              style={isIngreso
                ? { background: "var(--success)", borderColor: "var(--success)", color: "white" }
                : { background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}
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
            className="w-full text-sm bg-transparent border-b pb-2 outline-none transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
          />

          {/* ── Categorías planas ───────────────────────────────── */}
          <div>
            <p className="text-[10px] leading-none font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>Categoría</p>
            {flatCategories.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Sin categorías para este tipo.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {flatCategories.map((cat) => {
                  const isSelected = form.category === cat;
                  const catIcon = categoriesForType[cat]?.[0]?.icon || getCategoryEmoji(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => selectCategory(cat)}
                      className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-center transition-all"
                      style={isSelected
                        ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--accent-fg)" }
                        : { background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                    >
                      <span className="text-xl leading-none">{catIcon}</span>
                      <span className="text-[10px] font-semibold leading-tight truncate w-full text-center">{cat}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Medio de pago + Fecha ──────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] leading-none font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>Medio de pago</p>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                className={inputBase}
                style={inputStyle}
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
              <p className="text-[10px] leading-none font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>Fecha</p>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className={inputBase}
                style={inputStyle}
              />
            </div>
          </div>

          {/* ── Cuotas (solo TC) ─────────────────────────────────── */}
          {form.paymentMethod.startsWith("CREDIT_CARD") && (
            <div>
              <p className="text-[10px] leading-none font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>Número de cuotas</p>
              <input
                type="number"
                min="1"
                max="36"
                value={form.installments}
                onChange={(e) => setForm((f) => ({ ...f, installments: e.target.value }))}
                className={inputBase}
                style={inputStyle}
              />
            </div>
          )}

          {/* ── Tags ──────────────────────────────────────────────── */}
          <div>
            <p className="text-[10px] leading-none font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>Etiquetas (opcional)</p>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="#supermercado #tarjeta"
              className="w-full text-sm bg-transparent border-b pb-2 outline-none transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>

          {/* ── Error ─────────────────────────────────────────────── */}
          {error && (
            <div className="text-xs rounded-lg px-3 py-2" style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
              {error}
            </div>
          )}

          {/* ── Submit ────────────────────────────────────────────── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm font-semibold py-3 rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            {loading && <RefreshCw size={14} className="animate-spin" />}
            {loading ? "Guardando..." : "Registrar movimiento"}
          </button>
        </form>
      </div>
    </div>
  );
}
