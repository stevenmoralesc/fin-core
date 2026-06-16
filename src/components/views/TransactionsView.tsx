"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, MoreHorizontal, Search, Receipt } from "lucide-react";
import EditTransactionModal from "@/components/modals/EditTransactionModal";
import type { Transaction, CategoriesByType } from "@/lib/types";
import { formatCents } from "@/lib/money";

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: CategoriesByType;
}

type Filter = "TODOS" | "GASTO" | "INGRESO" | "TRANSFERENCIA";

// Los montos llegan en centavos enteros.
function formatCOP(value: number): string {
  return formatCents(value);
}

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

const FILTERS: { value: Filter; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "GASTO", label: "Gastos" },
  { value: "INGRESO", label: "Ingresos" },
  { value: "TRANSFERENCIA", label: "Transferencias" },
];

export default function TransactionsView({ transactions, categories }: TransactionsViewProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("TODOS");
  const [query, setQuery] = useState("");
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (filter !== "TODOS" && tx.type !== filter) return false;
      if (!q) return true;
      return (
        (tx.description ?? "").toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        (tx.paymentMethodName ?? "").toLowerCase().includes(q)
      );
    });
  }, [transactions, filter, query]);

  const totals = useMemo(() => {
    let ingresos = 0, gastos = 0;
    for (const tx of filtered) {
      if (tx.type === "INGRESO") ingresos += tx.amount;
      else if (tx.type === "GASTO") gastos += tx.amount;
    }
    return { ingresos, gastos };
  }, [filtered]);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of filtered) {
      const key = dateKey(tx.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Movimientos</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {transactions.length} {transactions.length === 1 ? "movimiento registrado" : "movimientos registrados"}
        </p>
      </div>

      {/* ── Totales del listado filtrado ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Ingresos</span>
          <p className="text-xl font-bold mt-1" style={{ color: "var(--success)" }}>+{formatCOP(totals.ingresos)}</p>
        </div>
        <div className="rounded-2xl border p-4" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Gastos</span>
          <p className="text-xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>−{formatCOP(totals.gastos)}</p>
        </div>
      </div>

      {/* ── Filtros + búsqueda ── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--bg-surface-2)" }}>
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={active
                  ? { background: "var(--accent)", color: "var(--accent-fg)" }
                  : { background: "transparent", color: "var(--text-muted)" }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="relative sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full text-sm rounded-lg border pl-9 pr-3 py-2 outline-none transition-colors"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>
      </div>

      {/* ── Lista agrupada por fecha ── */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "var(--bg-surface-2)" }}>
            <Receipt size={20} style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No hay movimientos</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-placeholder)" }}>Ajusta los filtros o registra una transacción</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(([key, txs]) => (
            <div key={key}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1 capitalize" style={{ color: "var(--text-muted)" }}>
                {dateLabel(key)}
              </p>
              <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
                {txs.map((tx, i) => {
                  const isIngreso = tx.type === "INGRESO";
                  const isTransfer = tx.type === "TRANSFERENCIA";
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors group cursor-default"
                      style={{ borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: isIngreso ? "var(--success-bg)" : "var(--bg-surface-2)" }}
                      >
                        {isIngreso ? (
                          <ArrowDownLeft size={15} strokeWidth={2.5} style={{ color: "var(--success)" }} />
                        ) : isTransfer ? (
                          <ArrowLeftRight size={15} strokeWidth={2.5} style={{ color: "var(--text-secondary)" }} />
                        ) : (
                          <ArrowUpRight size={15} strokeWidth={2.5} style={{ color: "var(--text-secondary)" }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          {tx.description || tx.category}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                          {tx.paymentMethodName ? (
                            <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{tx.paymentMethodName} · </span>
                          ) : ""}
                          {tx.category}
                        </p>
                      </div>
                      <span
                        className="text-sm font-bold tabular-nums shrink-0"
                        style={{ color: isIngreso ? "var(--success)" : isTransfer ? "var(--text-secondary)" : "var(--text-primary)" }}
                      >
                        {isIngreso ? "+" : isTransfer ? "" : "−"}{formatCOP(tx.amount)}
                      </span>
                      <button
                        onClick={() => setEditingTx(tx)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-3)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        title="Editar transacción"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          categories={categories}
          onClose={() => setEditingTx(null)}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
