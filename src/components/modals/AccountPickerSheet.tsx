"use client";

/**
 * src/components/modals/AccountPickerSheet.tsx
 * ─────────────────────────────────────────────────────────────
 * Bottom-sheet reutilizable para seleccionar una cuenta. Se usa
 * desde TransferModal al tocar las tarjetas DESDE / HACIA.
 *
 * Diseño handoff: lista con avatar de banco (inicial o icono),
 * nombre + tipo, saldo split-decimal a la derecha. La fila
 * seleccionada se resalta con fondo índigo suave y un check
 * circular al final.
 * ─────────────────────────────────────────────────────────────
 */

import { X, Banknote, TrendingUp, Check } from "lucide-react";
import { formatCentsParts } from "@/lib/money";

interface AccountLike {
  id: string;
  name: string;
  type: string;
  currentBalance: number; // centavos
}

const INDIGO = "#3b5bda";

// ─── Avatar por banco / tipo ──────────────────────────────────

interface AvatarMeta {
  bg: string;
  fg: string;
  text?: string;
  icon?: React.ReactNode;
}

/**
 * Paleta por banco según el handoff. La detección es por substring
 * en el nombre (case-insensitive). Si no hay match, usa un fallback
 * neutro derivado de la inicial.
 */
function avatarMeta(name: string, type: string): AvatarMeta {
  const n = name.toLowerCase();

  // Especiales (icono en lugar de inicial)
  if (n.includes("inversión") || n.includes("inversion")) {
    return { bg: "#eaeef9", fg: INDIGO, icon: <TrendingUp size={20} /> };
  }
  if (n.includes("efectivo") || type === "EFECTIVO") {
    return { bg: "#e6f4ea", fg: "#1f7a4d", icon: <Banknote size={20} /> };
  }

  // Bancos conocidos
  if (n.startsWith("arq")) return { bg: "#e7eafc", fg: "#14182a", text: "A" };
  if (n.includes("davibank") || n.includes("daviplata"))
    return { bg: "#fbe9e9", fg: "#c0392b", text: "D" };
  if (n.includes("nequi")) return { bg: "#efe7fb", fg: "#7b3fe4", text: "N" };
  if (n.includes("pibank")) return { bg: "#e3f4f1", fg: "#138a72", text: "P" };
  if (n.startsWith("rappicuenta j") || n.startsWith("rappicard j"))
    return { bg: "#ffeede", fg: "#e8590c", text: "RJ" };
  if (n.startsWith("rappi"))
    return { bg: "#ffeede", fg: "#e8590c", text: "R" };
  if (n.startsWith("soles")) return { bg: "#fbf0dd", fg: "#b9821a", text: "S" };
  if (n.startsWith("bancolombia"))
    return { bg: "#e9f0fb", fg: "#1d63b8", text: "B" };

  // Fallback genérico
  const initial = name.trim().charAt(0).toUpperCase() || "•";
  return { bg: "var(--bg-surface-3)", fg: "var(--text-secondary)", text: initial };
}

function typeLabel(type: string): string {
  if (type === "AHORROS") return "Ahorros";
  if (type === "EFECTIVO") return "Efectivo";
  if (type === "CORRIENTE") return "Corriente";
  return type;
}

// ─── Componente ───────────────────────────────────────────────

export default function AccountPickerSheet({
  accounts,
  selectedId,
  onSelect,
  onClose,
  title = "Selecciona cuenta",
}: {
  accounts: AccountLike[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  title?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-[392px] sm:rounded-[30px] rounded-t-[30px] overflow-hidden border flex flex-col"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          boxShadow: "0 12px 40px rgba(20,20,30,0.10)",
          fontFamily: "var(--font-hanken), system-ui, sans-serif",
          maxHeight: "min(680px, 90vh)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fijo */}
        <div className="px-[22px] pt-[14px] pb-2 shrink-0">
          <div
            className="mx-auto mb-[18px] w-10 h-1 rounded-full"
            style={{ background: "var(--border)" }}
          />
          <div className="flex items-center justify-between">
            <h3
              className="text-[19px] font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
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
        </div>

        {/* Lista scrolleable */}
        <div
          className="flex-1 overflow-y-auto px-4 pt-3 pb-4 picker-scroll"
          style={{ scrollbarWidth: "none" }}
        >
          {accounts.map((acc) => {
            const isSelected = acc.id === selectedId;
            const meta = avatarMeta(acc.name, acc.type);
            const { integer, decimal } = formatCentsParts(acc.currentBalance);
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => onSelect(acc.id)}
                className="flex items-center gap-[13px] w-full px-3 py-[11px] rounded-2xl text-left transition-colors mb-0.5"
                style={
                  isSelected
                    ? {
                        background: "#f4f6fe",
                        border: "1.5px solid #d4ddf6",
                      }
                    : {
                        background: "transparent",
                        border: "1.5px solid transparent",
                      }
                }
              >
                {/* Avatar */}
                <span
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: meta.bg,
                    color: meta.fg,
                  }}
                >
                  {meta.icon ?? (
                    <span
                      className="font-extrabold"
                      style={{ fontSize: (meta.text?.length ?? 1) >= 2 ? 14 : 15 }}
                    >
                      {meta.text}
                    </span>
                  )}
                </span>

                {/* Nombre + tipo */}
                <span className="flex-1 min-w-0">
                  <span
                    className="block text-[15px] font-bold truncate"
                    style={{ color: isSelected ? "#1a1a1e" : "var(--text-primary)" }}
                  >
                    {acc.name}
                  </span>
                  <span
                    className="block text-[12.5px] mt-px"
                    style={{ color: isSelected ? "#8a8a92" : "var(--text-muted)" }}
                  >
                    {typeLabel(acc.type)}
                  </span>
                </span>

                {/* Saldo */}
                <span
                  className="text-[14.5px] font-bold tabular-nums shrink-0"
                  style={{ color: isSelected ? "#1a1a1e" : "var(--text-primary)" }}
                >
                  {integer}
                  <span
                    style={{
                      color: isSelected ? "#c9c9d0" : "var(--text-placeholder)",
                      fontSize: 12,
                    }}
                  >
                    {decimal}
                  </span>
                </span>

                {/* Check si está seleccionada */}
                {isSelected && (
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-1"
                    style={{ background: INDIGO, color: "#fff" }}
                  >
                    <Check size={15} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <style jsx>{`
          .picker-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </div>
  );
}
