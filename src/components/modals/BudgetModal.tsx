"use client";

import { useState } from "react";
import { X, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Theme as EmojiTheme, EmojiStyle, type EmojiClickData } from "emoji-picker-react";
import { fromCents } from "@/lib/money";
import { useFeedback } from "@/components/ui/Feedback";
import { useTheme } from "@/components/layout/ThemeProvider";

// EmojiPicker es client-only; con next/dynamic evitamos el SSR.
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

export default function BudgetModal({
  onClose,
  categories,
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

  const isEditing = !!initialCategory;

  const [form, setForm] = useState({
    transactionType: (initialType ?? "GASTO") as TxType,
    category: initialCategory || "",
    suggestedBudget: initialBudget ? String(fromCents(initialBudget)) : "",
    icon: initialIcon || "📌",
  });

  const isGasto = form.transactionType === "GASTO";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalCategory = form.category.trim();

    if (!finalCategory) {
      toast("error", "Debes seleccionar o ingresar una categoría.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: finalCategory,
          icon: form.icon,
          suggestedBudget: isGasto ? Number(form.suggestedBudget || 0) : 0,
          transactionType: form.transactionType,
        }),
      });

      if (!res.ok) throw new Error("Error al guardar");

      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
      toast("error", "No se pudo guardar la categoría.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border-b py-2.5 text-sm focus:outline-none transition-colors bg-transparent";
  const labelClass = "block text-[10px] leading-none font-bold text-muted uppercase tracking-wide mb-1 mt-4";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
      <div className="rounded-[24px] w-full max-w-[420px] shadow-2xl overflow-hidden border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {isEditing ? "Editar categoría" : "Nueva categoría"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-3" style={{ color: "var(--text-muted)" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-[10px] leading-none font-bold text-muted uppercase tracking-wide mb-1">Tipo</label>
            <div className="flex gap-2 mt-1.5">
              {(["GASTO", "INGRESO"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={isEditing}
                  onClick={() => setForm((f) => ({ ...f, transactionType: t }))}
                  className="flex-1 py-2 rounded-lg text-xs font-bold transition-colors border disabled:opacity-60"
                  style={form.transactionType === t
                    ? { background: "var(--accent)", color: "var(--accent-fg)", borderColor: "var(--accent)" }
                    : { background: "transparent", color: "var(--text-secondary)", borderColor: "var(--border)" }}
                >
                  {t === "GASTO" ? "Gasto" : "Ingreso"}
                </button>
              ))}
            </div>
          </div>

          {/* Emoji + Nombre en la misma fila */}
          <div>
            <label className="block text-[10px] leading-none font-bold text-muted uppercase tracking-wide">Nombre</label>
            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={() => setShowEmojis(!showEmojis)}
                className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-2xl border transition-colors hover:bg-surface-3"
                style={{ background: "var(--bg-surface-2)", borderColor: "var(--border)" }}
                title="Elegir emoji"
              >
                {form.icon || "📌"}
              </button>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="Ej. Vivienda, Transporte"
                className={inputClass}
                style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
                disabled={isEditing}
                required
              />
            </div>

            {showEmojis && (
              <div className="mt-3 flex justify-center">
                <EmojiPicker
                  onEmojiClick={(e: EmojiClickData) => {
                    setForm((f) => ({ ...f, icon: e.emoji }));
                    setShowEmojis(false);
                  }}
                  theme={themeMode === "dark" ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                  emojiStyle={EmojiStyle.NATIVE}
                  width="100%"
                  height={380}
                  searchPlaceholder="Buscar emoji…"
                  previewConfig={{ showPreview: false }}
                />
              </div>
            )}
          </div>

          {/* Tope (solo GASTO) */}
          {isGasto && (
            <div>
              <label className={labelClass}>Tope mensual (presupuesto)</label>
              <input
                type="number"
                step="0.01"
                value={form.suggestedBudget}
                onChange={(e) => setForm((f) => ({ ...f, suggestedBudget: e.target.value }))}
                placeholder="$0 — déjalo en 0 si no quieres tope"
                className={inputClass}
                style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
              />
              <p className="text-[11px] text-muted mt-2 leading-relaxed">
                El tope dibuja la línea punteada en el dashboard. Si lo superas, la barra pinta por fuera en rojo.
              </p>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-70"
              style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : "Guardar categoría"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
