"use client";

import { useState, useEffect, useRef } from "react";
import { Wallet, CreditCard, ShoppingCart, ArrowUpRight, ArrowDownLeft, MoreHorizontal, ChevronDown } from "lucide-react";
import EditTransactionModal from "@/components/EditTransactionModal";
import TransactionModal from "@/components/TransactionModal";
import type { DashboardSummary, CategoriesByType, Transaction } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────
function formatCOP(value: number, showSign = true): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("es-CO");
  if (!showSign) return `$${formatted}`;
  return value < 0 ? `−$${formatted}` : `+$${formatted}`;
}

function formatCOPShort(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString("es-CO")}`;
}

function relativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

// ── Month picker popover ──────────────────────────────────────
const MONTH_SHORT = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function MonthPickerPopover({
  periodo,
  onChange,
}: {
  periodo: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [selYear, selMonthIdx] = (() => {
    const [y, m] = periodo.split("-");
    return [parseInt(y), parseInt(m) - 1];
  })();

  const now = new Date();
  const currentYear = now.getFullYear();
  const [viewYear, setViewYear] = useState(selYear);
  const years = [currentYear - 1, currentYear, currentYear + 1];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = new Date(selYear, selMonthIdx, 1)
    .toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  function select(monthIdx: number) {
    const val = `${viewYear}-${(monthIdx + 1).toString().padStart(2, "0")}`;
    onChange(val);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm rounded-lg px-3 py-1.5 font-medium border transition-colors"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)", boxShadow: "var(--shadow-sm)" }}
      >
        <span className="capitalize">{label}</span>
        <ChevronDown size={13} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 z-50 rounded-2xl p-4 w-[240px] border"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}
        >
          {/* Year pills */}
          <div className="flex gap-1.5 mb-3 justify-center">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setViewYear(y)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                style={viewYear === y
                  ? { background: "var(--accent)", color: "var(--accent-fg)" }
                  : { background: "var(--bg-surface-2)", color: "var(--text-secondary)" }}
              >
                {y}
              </button>
            ))}
          </div>
          {/* 3×4 month grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {MONTH_SHORT.map((m, i) => {
              const isSel = viewYear === selYear && i === selMonthIdx;
              const isFuture = viewYear > currentYear || (viewYear === currentYear && i > now.getMonth());
              return (
                <button
                  key={m}
                  type="button"
                  disabled={isFuture}
                  onClick={() => select(i)}
                  className="py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={isSel
                    ? { background: "var(--accent)", color: "var(--accent-fg)" }
                    : isFuture
                    ? { color: "var(--text-muted)", cursor: "default" }
                    : { color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => { if (!isSel && !isFuture) e.currentTarget.style.background = "var(--bg-surface-2)"; }}
                  onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── KPI Card inline ───────────────────────────────────────────
function KpiBlock({
  label,
  value,
  trend,
  trendPositive,
  sub,
}: {
  label: string;
  value: string;
  trend: string;
  trendPositive: boolean;
  sub?: string;
}) {
  return (
    <div
      className="p-6 rounded-2xl border flex flex-col justify-between min-h-[140px]"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
    >
      <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-3xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>{value}</span>
      <div>
        <span className="text-xs font-medium" style={{ color: trendPositive ? "var(--success)" : "var(--danger)" }}>
          {trend}
        </span>
        {sub && <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>{sub}</span>}
      </div>
    </div>
  );
}

// ── Dashboard props ───────────────────────────────────────────
interface DashboardProps {
  categories: CategoriesByType;
  creditCards: import("@/lib/types").CreditCard[];
}

export default function Dashboard({ categories, creditCards }: DashboardProps) {
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [newTxModalOpen, setNewTxModalOpen] = useState(false);

  const [periodo, setPeriodo] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
  });

  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(`/api/dashboard?periodo=${periodo}`)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted) { setData(json); setLoading(false); }
      })
      .catch(() => setLoading(false));
    return () => { isMounted = false; };
  }, [periodo, refreshTrigger]);

  const refresh = () => setRefreshTrigger((r) => r + 1);

  // ── Skeleton ─────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="w-full flex flex-col gap-8 animate-pulse">
        <div className="h-9 w-48 bg-gray-200 rounded-lg" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-7 w-24 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-36 bg-gray-200 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-8">

      {/* ── BLOQUE 1: HEADER ──────────────────────────────────── */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Resumen</h1>
          <MonthPickerPopover periodo={periodo} onChange={setPeriodo} />
        </div>
        <button
          onClick={() => setNewTxModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          <span className="text-base leading-none">+</span>
          Nueva
        </button>
      </div>

      {/* ── BLOQUE 2: CUENTAS (PILLS) ─────────────────────────── */}
      <div className="flex flex-wrap gap-2 w-full pb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        {data.cuentasActivas?.map((acc) => (
          <div
            key={acc.id}
            className="rounded-xl px-3 py-1.5 text-xs flex items-center gap-2 border"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            <Wallet size={12} className="shrink-0" style={{ color: "var(--text-muted)" }} />
            <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{acc.name}</span>
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>{formatCOPShort((acc as any).currentBalance ?? 0)}</span>
          </div>
        ))}
        {loading && (
          <span className="text-xs italic self-center" style={{ color: "var(--text-muted)" }}>Actualizando...</span>
        )}
      </div>

      {/* ── BLOQUE 3: KPI GRID ────────────────────────────────── */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 w-full transition-opacity duration-300 ${loading ? "opacity-50" : "opacity-100"}`}>
        <KpiBlock
          label="Liquidez Total"
          value={formatCOPShort(data.liquidezTotal)}
          trend={`Efectivo + Cuentas`}
          trendPositive={true}
          sub=""
        />
        <KpiBlock
          label="Cupo Utilizado TC"
          value={formatCOPShort(data.cupoUtilizadoTC)}
          trend={`${data.cupoUtilizadoPct.toFixed(1)}% de cupo total`}
          trendPositive={false}
          sub={`Disponible: ${formatCOPShort(data.limiteTC - data.cupoUtilizadoTC)}`}
        />
        <KpiBlock
          label="Gastos del Periodo"
          value={formatCOPShort(data.gastosCorrientesMes)}
          trend={`Gastos registrados`}
          trendPositive={false}
          sub=""
        />
      </div>

      {/* ── BLOQUE 4: TRANSACCIONES RECIENTES ─────────────────── */}
      <div className="rounded-2xl w-full overflow-hidden border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Transacciones recientes</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {data.recentTransactions?.length > 0
                ? `${data.recentTransactions.length} movimientos en el periodo`
                : "Sin movimientos en este periodo"}
            </p>
          </div>
        </div>

        {(!data.recentTransactions || data.recentTransactions.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "var(--bg-surface-2)" }}>
              <ShoppingCart size={20} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Sin transacciones</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-placeholder)" }}>Haz clic en «+ Nueva» para comenzar</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {data.recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 px-6 py-4 transition-colors group cursor-default"
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: tx.type === "INGRESO" ? "var(--success-bg)" : "var(--bg-surface-2)" }}
                >
                  {tx.type === "INGRESO" ? (
                    <ArrowDownLeft size={15} strokeWidth={2.5} style={{ color: "var(--success)" }} />
                  ) : (
                    <ArrowUpRight size={15} strokeWidth={2.5} style={{ color: "var(--text-secondary)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{tx.description}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {tx.paymentMethodName ? (
                      <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{tx.paymentMethodName} · </span>
                    ) : ""}
                    {tx.category} · {tx.subcategory} · {relativeDate(tx.date)}
                  </p>
                </div>
                <span
                  className="text-sm font-bold tabular-nums shrink-0"
                  style={{ color: tx.type === "INGRESO" ? "var(--success)" : "var(--text-primary)" }}
                >
                  {formatCOP(tx.type === "INGRESO" ? tx.amount : -tx.amount)}
                </span>
                <button
                  onClick={() => setEditingTx(tx as Transaction)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg shrink-0"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  title="Editar transacción"
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODALES ───────────────────────────────────────────── */}
      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          categories={categories}
          onClose={() => setEditingTx(null)}
          onSuccess={refresh}
        />
      )}
      {newTxModalOpen && (
        <TransactionModal
          accounts={data?.cuentasActivas || []}
          creditCards={creditCards}
          categories={categories}
          onClose={() => setNewTxModalOpen(false)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
