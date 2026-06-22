"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Receipt, TrendingUp, TrendingDown } from "lucide-react";
import MonthPickerPopover from "@/components/ui/MonthPickerPopover";
import TransactionList from "@/components/ui/TransactionList";
import SummaryCard from "@/components/ui/SummaryCard";
import type { Transaction, CategoriesByType, DashboardSummary } from "@/lib/types";

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: CategoriesByType;
}

type Filter = "TODOS" | "GASTO" | "INGRESO" | "TRANSFERENCIA";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "GASTO", label: "Gastos" },
  { value: "INGRESO", label: "Ingresos" },
  { value: "TRANSFERENCIA", label: "Transferencias" },
];

export default function TransactionsView({ transactions, categories }: TransactionsViewProps) {
  const [filter, setFilter] = useState<Filter>("TODOS");
  const [query, setQuery] = useState("");

  const [periodo, setPeriodo] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
  });

  // Totales sincronizados con /resumen (incluye devengo de cuotas en gastos).
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/dashboard?periodo=${periodo}`)
      .then((r) => r.json())
      .then((d) => { if (alive) setSummary(d); })
      .catch(() => { if (alive) setSummary(null); });
    return () => { alive = false; };
  }, [periodo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (filter !== "TODOS" && tx.type !== filter) return false;
      if (!tx.date.startsWith(periodo)) return false;
      if (!q) return true;
      return (
        (tx.description ?? "").toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        (tx.paymentMethodName ?? "").toLowerCase().includes(q)
      );
    });
  }, [transactions, filter, query, periodo]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Movimientos</h1>
          <MonthPickerPopover periodo={periodo} onChange={setPeriodo} />
        </div>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {filtered.length} {filtered.length === 1 ? "movimiento registrado" : "movimientos registrados"}
        </p>
      </div>

      {/* ── Totales: mismo módulo que /resumen (sin pill). ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SummaryCard
          tone="income"
          icon={TrendingUp}
          label="Ingresos del mes"
          cents={summary?.ingresosDelPeriodo ?? 0}
        />
        <SummaryCard
          tone="expense"
          icon={TrendingDown}
          label="Gastos del mes"
          cents={summary?.gastosCorrientesMes ?? 0}
        />
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
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "var(--bg-surface-2)" }}>
            <Receipt size={20} style={{ color: "var(--text-muted)" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No hay movimientos</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-placeholder)" }}>Ajusta los filtros o registra una transacción</p>
        </div>
      ) : (
        <TransactionList transactions={filtered} categories={categories} />
      )}
    </div>
  );
}
