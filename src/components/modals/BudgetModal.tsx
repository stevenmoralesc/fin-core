"use client";

import { useState, useRef, useEffect } from "react";
import { X, RefreshCw, Check, ArrowLeftRight, SmilePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Theme as EmojiTheme, EmojiStyle, type EmojiClickData } from "emoji-picker-react";
import { useFeedback } from "@/components/ui/Feedback";
import { useTheme } from "@/components/layout/ThemeProvider";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

type TxType = "INGRESO" | "GASTO" | "TRANSFERENCIA";

interface BudgetModalProps {
  onClose: () => void;
  categories: string[];
  initialCategory?: string;
  initialType?: TxType;
  initialBudget?: number; // centavos
  initialIcon?: string;
}

function splitAmount(value: string): { integer: string; decimal: string } {
  if (!value) return { integer: "$0", decimal: "" };
  const [intPart, decPart] = value.split(",");
  return {
    integer: "$" + intPart,
    decimal: decPart !== undefined ? "," + decPart : "",
  };
}

export default function BudgetModal({
  onClose,
  initialCategory,
  initialType,
  initialBudget,
  initialIcon,
}: BudgetModalProps) {
  const router = useRouter();
  const { toast } = useFeedback();
  const { resolved: themeMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!initialCategory;

  const [form, setForm] = useState(() => {
    let formatted = "";
    if (initialBudget) {
      const absValue = Math.abs(initialBudget / 100);
      const [int, dec] = String(absValue).split(".");
      formatted = parseInt(int, 10).toLocaleString("es-CO");
      if (dec !== undefined) formatted += "," + dec;
    }
    return {
      transactionType: (initialType ?? "GASTO") as TxType,
      category: initialCategory || "",
      suggestedBudget: formatted,
      icon: initialIcon || "",
    };
  });

  const isGasto = form.transactionType === "GASTO";
  const isIngreso = form.transactionType === "INGRESO";

  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Si estamos creando una nueva categoría de gasto, focus en nombre. 
    // Si editamos y tiene tope, focus en tope. Depende del caso de uso.
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9,]/g, "");
    const parts = raw.split(",");
    if (parts.length > 2) raw = parts[0] + "," + parts.slice(1).join("");
    const [integer, decimal] = raw.split(",");
    let formatted = integer ? parseInt(integer, 10).toLocaleString("es-CO") : "";
    if (raw.includes(",")) formatted += "," + (decimal || "");
    setForm((f) => ({ ...f, suggestedBudget: formatted }));
  };

  const setType = (t: "INGRESO" | "GASTO") => {
    if (isEditing) return; // No se puede cambiar el tipo editando
    setForm((f) => ({ ...f, transactionType: t, suggestedBudget: t === "INGRESO" ? "" : f.suggestedBudget }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const finalCategory = form.category.trim();

    if (!finalCategory) {
      setError("Ingresa un nombre para la categoría.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const numericBudget = form.suggestedBudget
        ? parseFloat(form.suggestedBudget.replace(/\./g, "").replace(",", "."))
        : 0;

      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: finalCategory,
          icon: form.icon,
          suggestedBudget: isGasto ? numericBudget : 0,
          transactionType: form.transactionType,
        }),
      });

      if (!res.ok) throw new Error("Error al guardar");

      router.refresh();
      onClose();
    } catch (err) {
      setError("No se pudo guardar la categoría.");
    } finally {
      setLoading(false);
    }
  };

  const { integer: intPart, decimal: decPart } = splitAmount(form.suggestedBudget);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-[392px] sm:rounded-[30px] rounded-t-[30px] overflow-hidden border flex flex-col max-h-[90vh]"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          boxShadow: "0 12px 40px rgba(20,20,30,0.10)",
          fontFamily: "var(--font-hanken), system-ui, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-[22px] pt-[14px] pb-6 overflow-y-auto no-scrollbar">
          {/* Grabber */}
          <div
            className="mx-auto mb-[18px] w-10 h-1 rounded-full shrink-0"
            style={{ background: "var(--border)" }}
          />

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[19px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {isEditing ? "Editar categoría" : "Nueva categoría"}
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

          {/* Switch Gasto / Ingreso (Idéntico a Nuevo Movimiento) */}
          <div className={`flex flex-col items-center gap-[7px] mb-6 ${isEditing ? "opacity-50 pointer-events-none" : ""}`}>
            <div
              className="relative w-[108px] h-10 rounded-full flex items-center p-1"
              style={{ background: "var(--bg-surface-3)" }}
            >
              <div
                className="absolute top-1 w-12 h-8 rounded-full transition-all duration-250"
                style={{
                  left: isGasto ? 4 : 56,
                  background: isGasto ? "var(--danger)" : "var(--success)",
                  boxShadow: isGasto ? "0 3px 8px rgba(229,72,77,0.32)" : "0 3px 8px rgba(52,211,153,0.32)",
                }}
              />
              <button
                type="button"
                onClick={() => setType("GASTO")}
                className="relative flex-1 flex items-center justify-center text-[22px] font-semibold leading-none"
                style={{ color: isGasto ? "#fff" : "var(--text-placeholder)" }}
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setType("INGRESO")}
                className="relative flex-1 flex items-center justify-center text-[20px] font-semibold leading-none"
                style={{ color: isIngreso ? "#fff" : "var(--text-placeholder)" }}
              >
                +
              </button>
            </div>
            <span
              className="text-[13px] font-bold"
              style={{ color: isIngreso ? "var(--success)" : "var(--danger)", letterSpacing: "0.01em" }}
            >
              {isIngreso ? "Ingreso" : "Gasto"}
            </span>
          </div>

          {/* Tope Mensual (Monto visual split) - Solo Gastos */}
          {isGasto && (
            <div className="text-center mb-6">
              <p
                className="text-[11px] mb-1.5 font-bold uppercase"
                style={{ color: "var(--text-placeholder)", letterSpacing: "0.12em", fontFamily: "var(--font-jetbrains), monospace" }}
              >
                TOPE MENSUAL (OPCIONAL)
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
                  style={{ width: 2.5, height: 42, background: "var(--danger)", borderRadius: 2, marginLeft: 4, marginRight: 4, alignSelf: "center" }}
                />
                <span style={{ fontSize: 26, color: "var(--text-placeholder)" }}>{decPart}</span>
              </div>
              <input
                ref={amountRef}
                type="text"
                inputMode="decimal"
                value={form.suggestedBudget}
                onChange={handleAmountChange}
                className="sr-only"
                style={{ position: "absolute", left: -9999 }}
              />
            </div>
          )}

          {/* Filas: Nombre e Icono combinados */}
          <div className="flex flex-col gap-2.5 mb-[22px]">
            <div className={`flex items-stretch gap-3 px-[14px] py-3 rounded-[14px] ${isEditing ? "opacity-70" : ""}`} style={{ background: "var(--bg-surface-2)" }}>
              <button
                type="button"
                onClick={() => setShowEmojis(!showEmojis)}
                className="w-10 flex items-center justify-center shrink-0 rounded-[10px] border transition-colors hover:bg-surface-3"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
                title="Elegir icono"
              >
                {form.icon ? (
                  <span className="text-[20px]">{form.icon}</span>
                ) : (
                  <SmilePlus size={20} strokeWidth={2} />
                )}
              </button>
              
              <div className="flex-1 min-w-0 py-0.5">
                <p className="text-[10px]" style={{ color: "var(--text-placeholder)", letterSpacing: "0.08em", fontFamily: "var(--font-jetbrains), monospace" }}>
                  NOMBRE CATEGORÍA
                </p>
                <input
                  type="text"
                  placeholder="Ej: Vivienda, Transporte"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  disabled={isEditing}
                  className="text-[14.5px] font-semibold bg-transparent outline-none w-full mt-px placeholder-gray-400 dark:placeholder-gray-600"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
            </div>
            
            {showEmojis && (
              <div className="mt-1 flex justify-center w-full bg-surface-2 rounded-xl p-2 border border-subtle overflow-hidden">
                <EmojiPicker
                  onEmojiClick={(e: EmojiClickData) => {
                    setForm((f) => ({ ...f, icon: e.emoji }));
                    setShowEmojis(false);
                  }}
                  theme={themeMode === "dark" ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                  emojiStyle={EmojiStyle.NATIVE}
                  width="100%"
                  height={300}
                  searchPlaceholder="Buscar icono..."
                  previewConfig={{ showPreview: false }}
                />
              </div>
            )}
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
                Guardar
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
