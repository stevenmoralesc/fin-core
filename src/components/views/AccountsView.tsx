"use client";

import { useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  ChevronRight,
  Banknote,
  Building2,
  CreditCard,
} from "lucide-react";
import type { AccountWithStats } from "@/app/cuentas/page";
import { useRouter } from "next/navigation";
import AddAccountModal from "@/components/modals/AddAccountModal";
import EditAccountModal from "@/components/modals/EditAccountModal";
import { Settings } from "lucide-react";
import { formatCents } from "@/lib/money";
import { relativeDate } from "@/lib/format";

// ── Helpers (los montos llegan en centavos enteros) ───────────
function formatCOP(v: number) {
  return formatCents(v);
}
function formatCOPShort(v: number) {
  return formatCOP(v);
}

function accountIcon(type: string) {
  switch (type) {
    case "EFECTIVO": return <Banknote size={20} className="text-success" />;
    case "AHORROS":  return <Building2 size={20} className="text-info" />;
    case "CORRIENTE": return <CreditCard size={20} className="text-warning" />;
    default: return <Wallet size={20} className="text-muted" />;
  }
}
function accountBg(type: string) {
  switch (type) {
    case "EFECTIVO": return "bg-success-soft";
    case "AHORROS":  return "bg-info-soft";
    case "CORRIENTE": return "bg-warning-soft";
    default: return "bg-surface-2";
  }
}

interface AccountsViewProps {
  initialAccounts: AccountWithStats[];
}

export default function AccountsView({ initialAccounts }: AccountsViewProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(initialAccounts[0]?.id ?? "");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const totalLiquidez = initialAccounts.reduce((s, a) => s + a.currentBalance, 0);
  const selectedAccount = initialAccounts.find((a) => a.id === selected);

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Mis Cuentas</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              Liquidez total:{" "}
              <span className={`font-bold ${totalLiquidez >= 0 ? "text-success" : "text-danger"}`}>
                {formatCOPShort(totalLiquidez)}
              </span>
            </p>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            <Plus size={16} />
            Nueva Cuenta
          </button>
        </div>

        {/* ── Grid de Cuentas + Detalle ── */}
        {initialAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border rounded-2xl shadow-sm" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--bg-surface-2)" }}>
              <span className="text-3xl">🏦</span>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>No hay cuentas registradas</h2>
            <p className="text-sm max-w-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Aún no tienes cuentas registradas. Agrega tu primera cuenta para empezar a trackear tu liquidez.
            </p>
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors shadow-sm"
              style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
            >
              <Plus size={18} />
              Agregar primera cuenta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Lista lateral de cuentas */}
          <div className="space-y-3">
            {initialAccounts.map((acc) => {
              const isSelected = acc.id === selected;
              return (
                  <button
                  key={acc.id}
                  onClick={() => setSelected(acc.id)}
                  className="w-full text-left p-4 rounded-2xl border transition-all duration-150"
                  style={isSelected
                    ? { background: "var(--bg-surface-3)", borderColor: "var(--border)", color: "var(--text-primary)", boxShadow: "var(--shadow-lg)" }
                    : { background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-black/10 dark:bg-surface/10" : accountBg(acc.type)}`}>
                      {accountIcon(acc.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
                          {acc.name}
                        </p>
                        <ChevronRight size={14} style={{ color: isSelected ? "var(--text-primary)" : "var(--text-placeholder)" }} />
                      </div>
                      <p className="text-[11px] font-medium uppercase tracking-widest mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {acc.type}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                    <p className="text-xl font-bold tabular-nums" style={{ color: acc.currentBalance < 0 ? "var(--danger)" : "var(--text-primary)" }}>
                      {formatCOPShort(acc.currentBalance)}
                    </p>
                    <div className="flex gap-3 mt-1 text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                      <span className="flex items-center gap-0.5">
                        <TrendingUp size={10} style={{ color: "var(--success)" }} />
                        {formatCOPShort(acc.totalIngresos)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <TrendingDown size={10} style={{ color: "var(--danger)" }} />
                        {formatCOPShort(acc.totalGastos)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Panel de detalle */}
          {selectedAccount && (
            <div className="lg:col-span-2 space-y-4">
              {/* Header de la cuenta seleccionada */}
              <div className="flex items-center justify-between rounded-2xl border p-4 shadow-sm" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{selectedAccount.name}</h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{selectedAccount.type} · Moneda: {selectedAccount.currency}</p>
                </div>
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors border shadow-sm bg-surface-2 hover:bg-surface-3"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                >
                  <Settings size={16} style={{ color: "var(--text-muted)" }} />
                  Editar
                </button>
              </div>

              {/* KPIs de la cuenta */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Saldo Actual",
                    value: formatCOP(selectedAccount.currentBalance),
                    sub: "Balance disponible",
                    color: selectedAccount.currentBalance >= 0 ? "text-success" : "text-danger",
                    bg: "bg-success-soft",
                    icon: <Wallet size={18} className={selectedAccount.currentBalance >= 0 ? "text-success" : "text-danger"} />,
                  },
                  {
                    label: "Total Ingresos",
                    value: formatCOP(selectedAccount.totalIngresos),
                    sub: "Acumulado histórico",
                    color: "text-info",
                    bg: "bg-info-soft",
                    icon: <TrendingUp size={18} className="text-info" />,
                  },
                  {
                    label: "Total Gastos",
                    value: formatCOP(selectedAccount.totalGastos),
                    sub: "Acumulado histórico",
                    color: "text-danger",
                    bg: "bg-danger-soft",
                    icon: <TrendingDown size={18} className="text-danger" />,
                  },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-2xl border p-4 shadow-sm" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                    <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
                      {kpi.icon}
                    </div>
                    <p className="text-[10px] leading-none font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{kpi.label}</p>
                    <p className={`text-base font-bold mt-1 tabular-nums ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{kpi.sub}</p>
                  </div>
                ))}
              </div>

              {/* Movimientos recientes */}
              <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Últimos Movimientos</h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {selectedAccount.name} · {selectedAccount.currency}
                    </p>
                  </div>
                  {selectedAccount.recentTransactions.length === 0 && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Sin movimientos aún</span>
                  )}
                </div>

                {selectedAccount.recentTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mb-3">
                      <Wallet size={20} className="text-placeholder" />
                    </div>
                    <p className="text-sm font-medium text-muted">Sin transacciones en esta cuenta</p>
                    <p className="text-xs text-placeholder mt-1">Usa esta cuenta en una nueva transacción</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                    {selectedAccount.recentTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-2"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            tx.type === "INGRESO" ? "bg-success-soft" : "bg-surface-3"
                          }`}
                        >
                          {tx.type === "INGRESO" ? (
                            <ArrowDownLeft size={15} className="text-success" strokeWidth={2.5} />
                          ) : (
                            <ArrowUpRight size={15} className="text-secondary" strokeWidth={2.5} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                            {tx.description ?? `${tx.category}`}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {tx.category} · {relativeDate(tx.date)}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-bold tabular-nums shrink-0 ${
                            tx.type === "INGRESO" ? "text-success" : "text-secondary"
                          }`}
                        >
                          {tx.type === "INGRESO" ? "+" : "−"}{formatCOP(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Saldo inicial */}
              <div className="rounded-2xl px-5 py-4 flex items-center justify-between border" style={{ background: "var(--bg-surface-2)", borderColor: "var(--border-subtle)" }}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Saldo Inicial</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>
                    Al abrir la cuenta
                  </p>
                </div>
                <p className="text-base font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {formatCOP(selectedAccount.initialBalance)}
                </p>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {addModalOpen && (
        <AddAccountModal onClose={() => { setAddModalOpen(false); router.refresh(); }} />
      )}
      {editModalOpen && selectedAccount && (
        <EditAccountModal account={selectedAccount} onClose={() => { setEditModalOpen(false); router.refresh(); }} />
      )}
    </>
  );
}
