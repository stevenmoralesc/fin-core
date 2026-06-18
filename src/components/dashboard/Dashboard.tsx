"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Wallet, ShoppingCart, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, MoreHorizontal, ChevronDown, ChevronRight, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
import EditTransactionModal from "@/components/modals/EditTransactionModal";
import TransactionModal from "@/components/modals/TransactionModal";
import BudgetBars from "@/components/budget/BudgetBars";
import { formatCents, formatCentsParts } from "@/lib/money";
import { relativeDate } from "@/lib/format";
import type { DashboardSummary, CategoriesByType, Transaction, Account } from "@/lib/types";

// ── Helpers (los montos llegan en centavos enteros) ───────────
function formatCOP(value: number, showSign = true): string {
  return formatCents(value, showSign);
}

function formatCOPShort(value: number): string {
  return formatCents(value);
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
        <ChevronDown size={13} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
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

// ── Summary card (ingresos / gastos) ──────────────────────────
// Tipografía split: entero bold grande + decimal muted más pequeño.
// Icono pequeño top-right; fila inferior con label izq. y monto der.
function SummaryCard({
  tone,
  icon: Icon,
  label,
  cents,
  pillLabel,
  pillCents,
  pillIcon: PillIcon,
  pillEmpty,
}: {
  tone: "income" | "expense";
  icon: typeof Wallet;
  label: string;
  cents: number;
  pillLabel: string;
  pillCents: number;
  pillIcon: typeof TrendingUp;
  pillEmpty?: boolean;
}) {
  const color = tone === "income" ? "var(--success)" : "var(--danger)";
  const softBg = tone === "income" ? "var(--success-bg)" : "var(--danger-bg)";
  const { integer, decimal } = formatCentsParts(cents);
  return (
    <div
      className="p-6 rounded-3xl border flex flex-col"
      style={{
        background: "var(--bg-surface)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Fila superior: label uppercase + icon button top-right */}
      <div className="flex items-start justify-between gap-4">
        <p className="text-[11px] font-bold uppercase tracking-widest pt-1" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: softBg }}
        >
          <Icon size={16} strokeWidth={2.2} style={{ color }} />
        </div>
      </div>

      {/* Monto principal con tipografía split */}
      <p
        className="font-bold tracking-tight tabular-nums mt-3 truncate"
        style={{ color: "var(--text-primary)", fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)", lineHeight: 1.05 }}
      >
        {integer}
        <span
          className="font-bold"
          style={{ color: "var(--text-placeholder)", fontSize: "0.55em" }}
        >
          {decimal}
        </span>
      </p>

      {/* Fila inferior: label + icono izq., monto der. */}
      <div className="flex items-center justify-between gap-3 mt-5">
        <div className="flex items-center gap-2 min-w-0">
          <PillIcon size={13} strokeWidth={2.5} style={{ color }} />
          <span className="text-xs font-medium truncate" style={{ color: "var(--text-secondary)" }}>
            {pillLabel}
          </span>
        </div>
        <span
          className="text-sm font-bold tabular-nums shrink-0"
          style={{ color: pillEmpty ? "var(--text-placeholder)" : color }}
        >
          {pillEmpty ? "—" : formatCents(pillCents)}
        </span>
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading inicial al cambiar de periodo
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
      <div className="w-full flex flex-col min-h-full animate-pulse">
        <div className="flex gap-2 px-6 md:px-10 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-7 w-28 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="flex flex-col gap-8 px-6 md:px-10 py-8">
          <div className="h-9 w-48 bg-gray-200 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map((i) => <div key={i} className="h-32 bg-gray-200 rounded-3xl" />)}
          </div>
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col min-h-full">

      {/* ── BLOQUE 1: CUENTAS (PILLS) ─────────────────────────── */}
      <div
        className="flex flex-wrap gap-2 w-full px-6 md:px-10 pt-6 pb-4 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        {data.cuentasActivas?.map((acc) => (
          <div
            key={acc.id}
            className="rounded-xl px-3 py-1.5 text-xs flex items-center gap-2 border"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            <Wallet size={12} className="shrink-0" style={{ color: "var(--text-muted)" }} />
            <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{acc.name}</span>
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>{formatCOPShort((acc as Account & { currentBalance?: number }).currentBalance ?? 0)}</span>
          </div>
        ))}
        {loading && (
          <span className="text-xs italic self-center" style={{ color: "var(--text-muted)" }}>Actualizando...</span>
        )}
      </div>

      {/* ── contenido principal con padding ──────────────────── */}
      <div className="flex flex-col gap-8 px-6 md:px-10 py-8">

      {/* ── BLOQUE 2: HEADER ──────────────────────────────────── */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>Resumen</h1>
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

      {/* ── BLOQUE 3: RESUMEN (INGRESOS / GASTOS) ─────────────── */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 w-full transition-opacity duration-300 ${loading ? "opacity-60" : "opacity-100"}`}>
        <SummaryCard
          tone="income"
          icon={Wallet}
          label="Saldo disponible"
          cents={data.liquidezTotal}
          pillLabel="Ingresos del periodo"
          pillCents={data.ingresosDelPeriodo ?? 0}
          pillIcon={TrendingUp}
          pillEmpty={!data.ingresosDelPeriodo}
        />
        <SummaryCard
          tone="expense"
          icon={TrendingDown}
          label="Gastos del periodo"
          cents={data.gastosCorrientesMes}
          pillLabel="Pago TC pendiente"
          pillCents={data.pagoTcPendiente ?? 0}
          pillIcon={CreditCard}
          pillEmpty={!data.pagoTcPendiente}
        />
      </div>

      {/* ── BLOQUE 3.5: PRESUPUESTO POR CATEGORÍA ─────────────── */}
      <div className="rounded-2xl w-full overflow-hidden border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Presupuesto por categoría</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Gasto del periodo frente al tope de cada categoría</p>
          </div>
          <Link
            href="/presupuesto"
            className="flex items-center gap-1 text-xs font-semibold shrink-0"
            style={{ color: "var(--info)" }}
          >
            Categorías
            <ChevronRight size={14} />
          </Link>
        </div>
        <div className="px-6 py-5">
          <BudgetBars items={data.budgetByCategory ?? []} />
        </div>
      </div>

      {/* ── BLOQUE 4: TRANSACCIONES RECIENTES ─────────────────── */}
      <div className="rounded-2xl w-full overflow-hidden border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Transacciones recientes</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {data.periodTransactionsCount > 0
                ? `Últimas ${data.recentTransactions.length} de ${data.periodTransactionsCount} movimientos del periodo`
                : "Sin movimientos en este periodo"}
            </p>
          </div>
          <Link
            href="/transacciones"
            className="flex items-center gap-1 text-xs font-semibold transition-colors shrink-0"
            style={{ color: "#6366f1" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#4f46e5")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#6366f1")}
          >
            Ver todas
            <ChevronRight size={14} />
          </Link>
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
                className="flex items-center gap-4 px-6 py-4 transition-colors group cursor-default hover:bg-surface-2"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background:
                      tx.type === "INGRESO" ? "var(--success-bg)"
                      : tx.type === "GASTO" ? "var(--danger-bg)"
                      : "var(--bg-surface-2)",
                  }}
                >
                  {tx.type === "INGRESO" ? (
                    <ArrowUpRight size={15} strokeWidth={2.5} style={{ color: "var(--success)" }} />
                  ) : tx.type === "TRANSFERENCIA" ? (
                    <ArrowLeftRight size={15} strokeWidth={2.5} style={{ color: "var(--text-secondary)" }} />
                  ) : (
                    <ArrowDownLeft size={15} strokeWidth={2.5} style={{ color: "var(--danger)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{tx.description}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {tx.paymentMethodName ? (
                      <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{tx.paymentMethodName} · </span>
                    ) : ""}
                    {tx.category} · {relativeDate(tx.date)}
                  </p>
                </div>
                <span
                  className="text-sm font-bold tabular-nums shrink-0"
                  style={{
                    color:
                      tx.type === "INGRESO" ? "var(--success)"
                      : tx.type === "GASTO" ? "var(--danger)"
                      : "var(--text-secondary)",
                  }}
                >
                  {tx.type === "INGRESO" ? "+" : tx.type === "TRANSFERENCIA" ? "" : "−"}{formatCOP(tx.amount, false)}
                </span>
                <button
                  onClick={() => setEditingTx(tx as Transaction)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg shrink-0 hover:bg-surface-3"
                  style={{ color: "var(--text-muted)" }}
                  title="Editar transacción"
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      </div>{/* fin contenido principal */}

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
