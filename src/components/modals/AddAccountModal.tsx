"use client";

import { useState, useRef, useEffect } from "react";
import { X, RefreshCw, Banknote, Landmark, Briefcase, FileText, Check, Globe } from "lucide-react";
import { useFeedback } from "@/components/ui/Feedback";

interface AddAccountModalProps {
  onClose: () => void;
}

function splitAmount(value: string): { integer: string; decimal: string } {
  if (!value) return { integer: "$0", decimal: "" };
  const [intPart, decPart] = value.split(",");
  return {
    integer: "$" + intPart,
    decimal: decPart !== undefined ? "," + decPart : "",
  };
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
  const [error, setError] = useState("");

  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9,]/g, "");
    const parts = raw.split(",");
    if (parts.length > 2) raw = parts[0] + "," + parts.slice(1).join("");
    const [integer, decimal] = raw.split(",");
    let formatted = integer ? parseInt(integer, 10).toLocaleString("es-CO") : "";
    if (raw.includes(",")) formatted += "," + (decimal || "");
    setForm((f) => ({ ...f, initialBalance: formatted }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.name.trim()) {
      setError("Ingresa un nombre para la cuenta.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const numericAmount = form.initialBalance
        ? parseFloat(form.initialBalance.replace(/\./g, "").replace(",", "."))
        : 0;

      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          initialBalance: numericAmount,
          currency: form.currency,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al crear cuenta");
      }
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const { integer: intPart, decimal: decPart } = splitAmount(form.initialBalance);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-[392px] sm:rounded-[30px] rounded-t-[30px] overflow-hidden border"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          boxShadow: "0 12px 40px rgba(20,20,30,0.10)",
          fontFamily: "var(--font-hanken), system-ui, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-[22px] pt-[14px] pb-6">
          {/* Grabber */}
          <div
            className="mx-auto mb-[18px] w-10 h-1 rounded-full"
            style={{ background: "var(--border)" }}
          />

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[19px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Nueva cuenta
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "var(--bg-surface-2)", color: "var(--text-muted)" }}
              aria-label="Cerrar"
            >
              <X size={17} />
            </button>
          </div>

          {/* Saldo Inicial (Monto visual split) */}
          <div className="text-center mb-6">
            <p
              className="text-[11px] mb-1.5 font-bold uppercase"
              style={{ color: "var(--text-placeholder)", letterSpacing: "0.12em", fontFamily: "var(--font-jetbrains), monospace" }}
            >
              SALDO INICIAL
            </p>
            <div
              className="relative inline-flex items-baseline justify-center font-bold tabular-nums leading-none cursor-text"
              style={{ letterSpacing: "-0.02em", color: "var(--text-primary)" }}
              onClick={() => amountRef.current?.focus()}
            >
              <span style={{ fontSize: 46 }}>{intPart}</span>
              <span
                aria-hidden
                className="amount-cursor"
                style={{ width: 2.5, height: 42, background: "var(--text-primary)", borderRadius: 2, marginLeft: 4, marginRight: 4, alignSelf: "center" }}
              />
              <span style={{ fontSize: 26, color: "var(--text-placeholder)" }}>{decPart}</span>
            </div>
            <input
              ref={amountRef}
              type="text"
              inputMode="decimal"
              value={form.initialBalance}
              onChange={handleAmountChange}
              className="sr-only"
              style={{ position: "absolute", left: -9999 }}
            />
          </div>

          {/* Tipo de Cuenta (Scroll horizontal estilo categorías) */}
          <div className="mb-4">
            <p className="text-[13px] font-bold mb-3" style={{ color: "var(--text-secondary)" }}>Tipo de cuenta</p>
            <div className="flex gap-[18px] overflow-x-auto pb-2 no-scrollbar" style={{ scrollbarWidth: "none" }}>
              {(["EFECTIVO", "AHORROS", "CORRIENTE"] as const).map((t) => {
                const selected = form.type === t;
                const Icon = t === "EFECTIVO" ? Banknote : t === "AHORROS" ? Landmark : Briefcase;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className="flex flex-col items-center gap-[7px] shrink-0 w-16"
                  >
                    <div
                      className="w-14 h-14 rounded-[16px] flex items-center justify-center transition-all"
                      style={{
                        background: selected ? "var(--text-primary)" : "var(--bg-surface-3)",
                        color: selected ? "var(--bg-surface)" : "var(--text-secondary)",
                        boxShadow: selected ? "0 6px 14px rgba(20,20,30,0.24)" : "none",
                      }}
                    >
                      <Icon size={24} strokeWidth={selected ? 2.5 : 2} />
                    </div>
                    <span
                      className="text-[12px] truncate max-w-full"
                      style={{ fontWeight: selected ? 700 : 600, color: selected ? "var(--text-primary)" : "var(--text-muted)" }}
                    >
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filas: Nombre / Moneda */}
          <div className="flex flex-col gap-2.5 mb-[22px]">
            {/* Nombre */}
            <div className="flex items-center gap-3 px-[14px] py-3 rounded-[14px]" style={{ background: "var(--bg-surface-2)" }}>
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 border"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
              >
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px]" style={{ color: "var(--text-placeholder)", letterSpacing: "0.08em", fontFamily: "var(--font-jetbrains), monospace" }}>
                  NOMBRE
                </p>
                <input
                  type="text"
                  placeholder="Ej: Bancolombia Ahorros"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="text-[14.5px] font-semibold bg-transparent outline-none w-full mt-px placeholder-gray-400 dark:placeholder-gray-600"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
            </div>

            {/* Moneda */}
            <div className="flex items-center gap-3 px-[14px] py-3 rounded-[14px] relative" style={{ background: "var(--bg-surface-2)" }}>
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 border"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
              >
                <Globe size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px]" style={{ color: "var(--text-placeholder)", letterSpacing: "0.08em", fontFamily: "var(--font-jetbrains), monospace" }}>
                  MONEDA
                </p>
                <select
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  className="text-[14.5px] font-semibold bg-transparent outline-none w-full mt-px appearance-none cursor-pointer"
                  style={{ color: "var(--text-primary)" }}
                >
                  <option value="COP">COP — Peso Colombiano</option>
                  <option value="USD">USD — Dólar Americano</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="text-xs rounded-lg px-3 py-2 mb-3"
              style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid var(--danger)" }}
            >
              {error}
            </div>
          )}

          {/* Guardar */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 transition-opacity disabled:opacity-70"
            style={{
              height: 56,
              borderRadius: 16,
              background: "var(--text-primary)",
              color: "var(--bg-surface)",
              fontSize: 16,
              fontWeight: 700,
              boxShadow: "0 8px 20px rgba(20,20,30,0.24)",
            }}
          >
            {loading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <>
                Guardar Cuenta
                <Check size={19} />
              </>
            )}
          </button>
        </div>
      </div>
      <style jsx>{`
        .amount-cursor { animation: amountBlink 1s steps(2, start) infinite; }
        @keyframes amountBlink { to { visibility: hidden; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
