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
import AddAccountModal from "@/components/AddAccountModal";

// ── Helpers ───────────────────────────────────────────────────
function formatCOP(v: number) {
  return "$" + Math.round(Math.abs(v)).toLocaleString("es-CO");
}
function formatCOPShort(v: number) {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toLocaleString("es-CO")}`;
}
function relativeDate(iso: string) {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff < 7) return `Hace ${diff} días`;
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

function accountIcon(type: string) {
  switch (type) {
    case "EFECTIVO": return <Banknote size={20} className="text-emerald-600" />;
    case "AHORROS":  return <Building2 size={20} className="text-blue-600" />;
    case "CORRIENTE": return <CreditCard size={20} className="text-indigo-600" />;
    default: return <Wallet size={20} className="text-gray-600" />;
  }
}
function accountBg(type: string) {
  switch (type) {
    case "EFECTIVO": return "bg-emerald-50";
    case "AHORROS":  return "bg-blue-50";
    case "CORRIENTE": return "bg-indigo-50";
    default: return "bg-gray-50";
  }
}

interface AccountsViewProps {
  initialAccounts: AccountWithStats[];
}

export default function AccountsView({ initialAccounts }: AccountsViewProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(initialAccounts[0]?.id ?? "");
  const [addModalOpen, setAddModalOpen] = useState(false);

  const totalLiquidez = initialAccounts.reduce((s, a) => s + a.currentBalance, 0);
  const selectedAccount = initialAccounts.find((a) => a.id === selected);

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mis Cuentas</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Liquidez total:{" "}
              <span className={`font-bold ${totalLiquidez >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {formatCOPShort(totalLiquidez)}
              </span>
            </p>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus size={16} />
            Nueva Cuenta
          </button>
        </div>

        {/* ── Grid de Cuentas + Detalle ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Lista lateral de cuentas */}
          <div className="space-y-3">
            {initialAccounts.map((acc) => {
              const isSelected = acc.id === selected;
              return (
                <button
                  key={acc.id}
                  onClick={() => setSelected(acc.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 ${
                    isSelected
                      ? "bg-gray-900 border-gray-900 text-white shadow-lg"
                      : "bg-white border-gray-100 hover:border-gray-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-white/15" : accountBg(acc.type)}`}>
                      {accountIcon(acc.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-bold truncate ${isSelected ? "text-white" : "text-gray-800"}`}>
                          {acc.name}
                        </p>
                        <ChevronRight size={14} className={isSelected ? "text-gray-400" : "text-gray-300"} />
                      </div>
                      <p className={`text-[11px] font-medium uppercase tracking-widest mt-0.5 ${isSelected ? "text-gray-400" : "text-gray-400"}`}>
                        {acc.type}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className={`text-xl font-bold tabular-nums ${isSelected ? "text-white" : acc.currentBalance < 0 ? "text-red-500" : "text-gray-900"}`}>
                      {formatCOPShort(acc.currentBalance)}
                    </p>
                    <div className={`flex gap-3 mt-1 text-[11px] font-medium ${isSelected ? "text-gray-400" : "text-gray-400"}`}>
                      <span className="flex items-center gap-0.5">
                        <TrendingUp size={10} className="text-emerald-400" />
                        {formatCOPShort(acc.totalIngresos)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <TrendingDown size={10} className="text-red-400" />
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
              {/* KPIs de la cuenta */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Saldo Actual",
                    value: formatCOP(selectedAccount.currentBalance),
                    sub: "Balance disponible",
                    color: selectedAccount.currentBalance >= 0 ? "text-emerald-600" : "text-red-600",
                    bg: "bg-emerald-50",
                    icon: <Wallet size={18} className={selectedAccount.currentBalance >= 0 ? "text-emerald-600" : "text-red-600"} />,
                  },
                  {
                    label: "Total Ingresos",
                    value: formatCOP(selectedAccount.totalIngresos),
                    sub: "Acumulado histórico",
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                    icon: <TrendingUp size={18} className="text-blue-600" />,
                  },
                  {
                    label: "Total Gastos",
                    value: formatCOP(selectedAccount.totalGastos),
                    sub: "Acumulado histórico",
                    color: "text-rose-600",
                    bg: "bg-rose-50",
                    icon: <TrendingDown size={18} className="text-rose-600" />,
                  },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-3`}>
                      {kpi.icon}
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                    <p className={`text-base font-bold mt-1 tabular-nums ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{kpi.sub}</p>
                  </div>
                ))}
              </div>

              {/* Movimientos recientes */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Últimos Movimientos</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selectedAccount.name} · {selectedAccount.currency}
                    </p>
                  </div>
                  {selectedAccount.recentTransactions.length === 0 && (
                    <span className="text-xs text-gray-400">Sin movimientos aún</span>
                  )}
                </div>

                {selectedAccount.recentTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                      <Wallet size={20} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-400">Sin transacciones en esta cuenta</p>
                    <p className="text-xs text-gray-300 mt-1">Usa esta cuenta en una nueva transacción</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {selectedAccount.recentTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            tx.type === "INGRESO" ? "bg-emerald-50" : "bg-gray-100"
                          }`}
                        >
                          {tx.type === "INGRESO" ? (
                            <ArrowDownLeft size={15} className="text-emerald-600" strokeWidth={2.5} />
                          ) : (
                            <ArrowUpRight size={15} className="text-gray-500" strokeWidth={2.5} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {tx.description ?? `${tx.category} · ${tx.subcategory}`}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {tx.category} · {relativeDate(tx.date)}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-bold tabular-nums shrink-0 ${
                            tx.type === "INGRESO" ? "text-emerald-600" : "text-gray-700"
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
              <div className="bg-gray-50 rounded-2xl px-5 py-4 flex items-center justify-between border border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Saldo Inicial</p>
                  <p className="text-sm font-semibold text-gray-700 mt-0.5">
                    Al abrir la cuenta
                  </p>
                </div>
                <p className="text-base font-bold text-gray-700 tabular-nums">
                  {formatCOP(selectedAccount.initialBalance)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {addModalOpen && (
        <AddAccountModal onClose={() => { setAddModalOpen(false); router.refresh(); }} />
      )}
    </>
  );
}
