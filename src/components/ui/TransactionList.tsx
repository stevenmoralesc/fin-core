"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import EditTransactionModal from "@/components/modals/EditTransactionModal";
import type { Transaction, CategoriesByType } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { relativeDate } from "@/lib/format";

type Mode = "grouped" | "flat";

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

function dateLabel(key: string): string {
  const date = new Date(key + "T12:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.floor((today.getTime() - target.getTime()) / 86_400_000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return date.toLocaleDateString("es-CO", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

// Emoji por defecto si la categoría no tiene icono asignado.
function fallbackEmoji(type: Transaction["type"]): string {
  if (type === "INGRESO") return "💰";
  if (type === "TRANSFERENCIA") return "🔄";
  return "💸";
}

function categoryEmoji(
  tx: Pick<Transaction, "type" | "category">,
  categories?: CategoriesByType,
): string {
  const entry = categories?.[tx.type]?.[tx.category]?.[0]?.icon;
  return entry || fallbackEmoji(tx.type);
}

export default function TransactionList({
  transactions,
  categories,
  mode = "grouped",
  showRelativeDate = false,
}: {
  transactions: Transaction[];
  categories?: CategoriesByType;
  /** `grouped` (default) agrupa por día con encabezado de fecha; `flat` lista
   * todo en una sola tarjeta sin encabezados (uso típico: recientes en el resumen). */
  mode?: Mode;
  /** Mostrar la fecha relativa en la línea inferior (útil sólo en modo `flat`). */
  showRelativeDate?: boolean;
}) {
  const router = useRouter();
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const groups = useMemo(() => {
    if (mode === "flat") return [];
    const map = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const key = dateKey(tx.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return [...map.entries()];
  }, [transactions, mode]);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No hay movimientos</p>
      </div>
    );
  }

  const renderRow = (tx: Transaction, i: number, isLast: boolean) => {
    const isIngreso = tx.type === "INGRESO";
    const isTransfer = tx.type === "TRANSFERENCIA";
    // Fondo del icono: verde sólo para ingresos, gris para gastos/transferencias.
    const iconBg = isIngreso ? "var(--success-bg)" : "var(--bg-surface-2)";
    const emoji = categoryEmoji(tx, categories);

    const subtitleParts: string[] = [];
    if (tx.paymentMethodName) subtitleParts.push(tx.paymentMethodName);
    subtitleParts.push(tx.category);
    if (showRelativeDate) subtitleParts.push(relativeDate(tx.date));

    return (
      <div
        key={tx.id}
        className="flex items-center gap-4 px-5 py-3.5 transition-colors group cursor-default hover:bg-surface-2"
        style={{ borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)" }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg leading-none"
          style={{ background: iconBg }}
          aria-hidden
        >
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {tx.description || tx.category}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
            {subtitleParts.join(" · ")}
          </p>
        </div>
        <span
          className="text-sm font-bold tabular-nums shrink-0"
          style={{
            color: isIngreso
              ? "var(--success)"
              : isTransfer
              ? "var(--text-secondary)"
              : "var(--text-primary)",
          }}
        >
          {isIngreso ? "+" : isTransfer ? "" : "−"}
          {formatCents(tx.amount)}
        </span>
        {categories && (
          <button
            onClick={() => setEditingTx(tx)}
            className="opacity-0 lg:group-hover:opacity-100 opacity-100 sm:opacity-0 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg shrink-0 hover:bg-surface-3"
            style={{ color: "var(--text-muted)" }}
            title="Editar transacción"
          >
            <MoreHorizontal size={14} />
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      {mode === "flat" ? (
        <div
          className="rounded-2xl border overflow-hidden shadow-sm"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          {transactions.map((tx, i) => renderRow(tx, i, i === transactions.length - 1))}
        </div>
      ) : (
        <div className="flex flex-col gap-6 w-full">
          {groups.map(([key, txs]) => (
            <div key={key}>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2 px-1 capitalize"
                style={{ color: "var(--text-muted)" }}
              >
                {dateLabel(key)}
              </p>
              <div
                className="rounded-2xl border overflow-hidden shadow-sm"
                style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
              >
                {txs.map((tx, i) => renderRow(tx, i, i === txs.length - 1))}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingTx && categories && (
        <EditTransactionModal
          transaction={editingTx}
          categories={categories}
          onClose={() => setEditingTx(null)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}
