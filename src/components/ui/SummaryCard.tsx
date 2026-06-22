"use client";

/**
 * SummaryCard — tarjeta de KPI (ingreso o gasto del periodo).
 * Tipografía split: entero grande + decimal muted; icono top-right;
 * fila inferior (pill) opcional con label izq + monto der.
 *
 * Sin pill: omite `pill` y la fila inferior no se renderiza. Útil cuando
 * la vista no tiene un complemento natural (ej. Movimientos).
 */

import type { LucideIcon } from "lucide-react";
import { formatCents, formatCentsParts } from "@/lib/money";

export interface SummaryCardPill {
  label: string;
  cents: number;
  icon: LucideIcon;
  empty?: boolean;
}

export default function SummaryCard({
  tone,
  icon: Icon,
  label,
  cents,
  pill,
}: {
  tone: "income" | "expense";
  icon: LucideIcon;
  label: string;
  cents: number;
  pill?: SummaryCardPill;
}) {
  const color = tone === "income" ? "var(--success)" : "var(--danger)";
  const softBg = tone === "income" ? "var(--success-bg)" : "var(--danger-bg)";
  const { integer, decimal } = formatCentsParts(cents);
  const PillIcon = pill?.icon;
  return (
    <div
      className="p-6 rounded-3xl border flex flex-col"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <p
          className="text-[11px] font-bold uppercase tracking-widest pt-1"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </p>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: softBg }}
        >
          <Icon size={16} strokeWidth={2.2} style={{ color }} />
        </div>
      </div>

      <p
        className="font-bold tracking-tight tabular-nums mt-3 truncate"
        style={{
          color: "var(--text-primary)",
          fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)",
          lineHeight: 1.05,
        }}
      >
        {integer}
        <span
          className="font-bold"
          style={{ color: "var(--text-placeholder)", fontSize: "0.55em" }}
        >
          {decimal}
        </span>
      </p>

      {pill && PillIcon && (
        <div className="flex items-center justify-between gap-3 mt-5">
          <div className="flex items-center gap-2 min-w-0">
            <PillIcon size={13} strokeWidth={2.5} style={{ color }} />
            <span
              className="text-xs font-medium truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              {pill.label}
            </span>
          </div>
          <span
            className="text-sm font-bold tabular-nums shrink-0"
            style={{ color: pill.empty ? "var(--text-placeholder)" : color }}
          >
            {pill.empty ? "—" : formatCents(pill.cents)}
          </span>
        </div>
      )}
    </div>
  );
}
