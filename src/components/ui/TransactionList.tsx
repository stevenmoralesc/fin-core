"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, MoreHorizontal } from "lucide-react";
import EditTransactionModal from "@/components/modals/EditTransactionModal";
import type { Transaction, CategoriesByType } from "@/lib/types";
import { formatCents } from "@/lib/money";

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

export default function TransactionList({
  transactions,
  categories,
}: {
  transactions: any[];
  categories?: CategoriesByType;
}) {
  const router = useRouter();
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, typeof transactions>();
    for (const tx of transactions) {
      const key = dateKey(tx.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return [...map.entries()];
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No hay movimientos</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        {groups.map(([key, txs]) => (
          <div key={key}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1 capitalize" style={{ color: "var(--text-muted)" }}>
              {dateLabel(key)}
            </p>
            <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
              {txs.map((tx, i) => {
                const isIngreso = tx.type === "INGRESO";
                const isTransfer = tx.type === "TRANSFERENCIA";
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors group cursor-default hover:bg-surface-2"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: isIngreso ? "var(--success-bg)" : isTransfer ? "var(--bg-surface-2)" : "var(--danger-bg)",
                      }}
                    >
                      {isIngreso ? (
                        <ArrowUpRight size={15} strokeWidth={2.5} style={{ color: "var(--success)" }} />
                      ) : isTransfer ? (
                        <ArrowLeftRight size={15} strokeWidth={2.5} style={{ color: "var(--text-secondary)" }} />
                      ) : (
                        <ArrowDownLeft size={15} strokeWidth={2.5} style={{ color: "var(--danger)" }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {tx.description || tx.category}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {("paymentMethodName" in tx && tx.paymentMethodName) ? (
                          <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{tx.paymentMethodName} · </span>
                        ) : ""}
                        {tx.category}
                      </p>
                    </div>
                    <span
                      className="text-sm font-bold tabular-nums shrink-0"
                      style={{ color: isIngreso ? "var(--success)" : isTransfer ? "var(--text-secondary)" : "var(--text-primary)" }}
                    >
                      {isIngreso ? "+" : isTransfer ? "" : "−"}{formatCents(tx.amount)}
                    </span>
                    {categories && (
                      <button
                        onClick={() => setEditingTx(tx as Transaction)}
                        className="opacity-0 lg:group-hover:opacity-100 opacity-100 sm:opacity-0 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg shrink-0 hover:bg-surface-3"
                        style={{ color: "var(--text-muted)" }}
                        title="Editar transacción"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

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
