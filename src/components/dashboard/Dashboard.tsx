"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Wallet, ShoppingCart, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, MoreHorizontal, ChevronDown, ChevronRight, TrendingUp, TrendingDown, CreditCard, ArrowLeftRight as Transfer, Plus } from "lucide-react";
import EditCreditCardModal from "@/components/modals/EditCreditCardModal";
import TransactionList from "@/components/ui/TransactionList";
import TransactionModal from "@/components/modals/TransactionModal";
import TransferModal from "@/components/modals/TransferModal";
import BudgetBars from "@/components/budget/BudgetBars";
import MonthPickerPopover from "@/components/ui/MonthPickerPopover";
import SummaryCard from "@/components/ui/SummaryCard";
import type { DashboardSummary, CategoriesByType, Transaction, Account } from "@/lib/types";

// ── Dashboard props ───────────────────────────────────────────
interface DashboardProps {
  categories: CategoriesByType;
  creditCards: import("@/lib/types").CreditCard[];
}

export default function Dashboard({ categories, creditCards }: DashboardProps) {
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [newTxModalType, setNewTxModalType] = useState<"MOVIMIENTO" | "TRANSFERENCIA" | null>(null);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const newMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!newMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) setNewMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [newMenuOpen]);

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


      {/* ── contenido principal con padding ──────────────────── */}
      <div className="flex flex-col gap-8 px-6 md:px-10 py-8">

      {/* ── BLOQUE 2: HEADER ──────────────────────────────────── */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <MonthPickerPopover periodo={periodo} onChange={setPeriodo} />
        </div>
        <div className="relative" ref={newMenuRef}>
          <button
            onClick={() => setNewMenuOpen((o) => !o)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            <span className="text-base leading-none">+</span>
            Nueva
            <ChevronDown size={14} />
          </button>
          {newMenuOpen && (
            <div
              className="absolute top-full right-0 mt-2 py-1.5 rounded-xl border shadow-lg w-56 z-50"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <button
                type="button"
                onClick={() => { setNewMenuOpen(false); setNewTxModalType("MOVIMIENTO"); }}
                className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm hover:bg-surface-2 transition-colors"
                style={{ color: "var(--text-primary)" }}
              >
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--bg-surface-2)" }}>
                  <Plus size={15} style={{ color: "var(--text-secondary)" }} />
                </span>
                <span className="font-medium">Nuevo movimiento</span>
              </button>
              <button
                type="button"
                onClick={() => { setNewMenuOpen(false); setNewTxModalType("TRANSFERENCIA"); }}
                className="flex items-center gap-3 w-full text-left px-3 py-2 text-sm hover:bg-surface-2 transition-colors"
                style={{ color: "var(--text-primary)" }}
              >
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--bg-surface-2)" }}>
                  <Transfer size={15} style={{ color: "var(--text-secondary)" }} />
                </span>
                <span className="font-medium">Transferencia</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── BLOQUE 3: RESUMEN (INGRESOS / GASTOS) ─────────────── */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 w-full transition-opacity duration-300 ${loading ? "opacity-60" : "opacity-100"}`}>
        <SummaryCard
          tone="income"
          icon={TrendingUp}
          label="Ingresos del mes"
          cents={data.ingresosDelPeriodo ?? 0}
          pill={{ label: "Saldo disponible", cents: data.liquidezTotal, icon: Wallet }}
        />
        <SummaryCard
          tone="expense"
          icon={TrendingDown}
          label="Gastos del mes"
          cents={data.gastosCorrientesMes}
          pill={{
            label: "Pago Mínimo TC",
            cents: data.pagoTcPendiente ?? 0,
            icon: CreditCard,
            empty: !data.pagoTcPendiente,
          }}
        />
      </div>

      {/* ── BLOQUE 3.5: PRESUPUESTO POR CATEGORÍA ─────────────── */}
      <div className="rounded-2xl w-full overflow-hidden border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Presupuesto por categoría</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Gasto del mes frente al tope de cada categoría</p>
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
      <div className="w-full">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Transacciones recientes
          </h2>
          <Link
            href="/transacciones"
            className="flex items-center gap-1 text-xs font-semibold transition-colors shrink-0"
            style={{ color: "var(--info)" }}
          >
            Ver todas
            <ChevronRight size={14} />
          </Link>
        </div>

        {(!data.recentTransactions || data.recentTransactions.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "var(--bg-surface-2)" }}>
              <ShoppingCart size={20} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Sin transacciones</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-placeholder)" }}>Haz clic en «+ Nueva» para comenzar</p>
          </div>
        ) : (
          <TransactionList
            transactions={data.recentTransactions}
            categories={categories}
            mode="flat"
            showRelativeDate
          />
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
      {newTxModalType === "MOVIMIENTO" && (
        <TransactionModal
          accounts={data?.cuentasActivas || []}
          creditCards={creditCards}
          categories={categories}
          onClose={() => setNewTxModalType(null)}
          onSuccess={refresh}
        />
      )}
      {newTxModalType === "TRANSFERENCIA" && (
        <TransferModal
          accounts={data?.cuentasActivas || []}
          onClose={() => setNewTxModalType(null)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
