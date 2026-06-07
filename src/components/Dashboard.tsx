"use client";

import { Wallet, CreditCard, ShoppingCart, ArrowUpRight, ArrowDownLeft, MoreHorizontal } from "lucide-react";
import KpiCard from "@/components/KpiCard";
import type { DashboardSummary } from "@/lib/types";

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
  if (days === 0) return `Hoy, ${date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`;
  if (days === 1) return `Ayer, ${date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`;
  return date.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
}

interface DashboardProps {
  initialData: DashboardSummary;
}

export default function Dashboard({ initialData: data }: DashboardProps) {
  // ── KPI data derived from real data ──────────────────────────
  const kpiData = [
    {
      title: "Liquidez Total",
      value: formatCOPShort(data.liquidezTotal),
      subtitle: "Efectivo + Cuentas bancarias",
      icon: Wallet,
      trend: { value: "+8.4%", positive: true, label: "vs. mes anterior" },
      variant: "success" as const,
      accentColor: "#10b981",
    },
    {
      title: "Cupo Utilizado TC",
      value: formatCOPShort(data.cupoUtilizadoTC),
      subtitle: `Disponible: ${formatCOPShort(data.limiteTC - data.cupoUtilizadoTC)}`,
      icon: CreditCard,
      trend: {
        value: `${data.cupoUtilizadoPct.toFixed(1)}%`,
        positive: false,
        label: "de cupo total",
      },
      variant: "warning" as const,
      accentColor: "#f59e0b",
    },
    {
      title: "Gastos Corrientes",
      value: formatCOPShort(data.gastosCorrientesMes),
      subtitle: `${new Date().toLocaleString("es-CO", { month: "long", year: "numeric" })}`,
      icon: ShoppingCart,
      trend: { value: "+12%", positive: false, label: "vs. mes anterior" },
      variant: "default" as const,
      accentColor: "#6366f1",
    },
  ];

  return (
    <>
      {/* Accounts strip */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {data.cuentasActivas?.map((acc) => (
          <div
            key={acc.id}
            className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 shrink-0 shadow-sm"
          >
            <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
              <Wallet size={12} className="text-gray-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 leading-none">{acc.name}</p>
              <p className="text-xs font-bold text-gray-800">{formatCOPShort(acc.initialBalance + ((acc as any).currentBalance || 0))}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
        Resumen financiero
      </p>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {kpiData.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* ── Transactions table ── */}
      <div
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.08)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Transacciones recientes</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {data.recentTransactions?.length > 0
                ? `Últimos ${data.recentTransactions.length} movimientos`
                : "Sin transacciones aún — crea la primera"}
            </p>
          </div>
          <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            Ver todas →
          </button>
        </div>

        {(!data.recentTransactions || data.recentTransactions.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
              <ShoppingCart size={20} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No hay transacciones</p>
            <p className="text-xs text-gray-300 mt-1">Haz clic en "+ Nueva Transacción" para comenzar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors group"
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
                  <p className="text-sm font-semibold text-gray-800 truncate">{tx.description}</p>
                  <p className="text-xs text-gray-400">
                    {tx.category} · {tx.subcategory} · {relativeDate(tx.date)}
                  </p>
                </div>
                <span
                  className={`text-sm font-bold tabular-nums shrink-0 ${
                    tx.type === "INGRESO" ? "text-emerald-600" : "text-gray-700"
                  }`}
                >
                  {formatCOP(tx.type === "INGRESO" ? tx.amount : -tx.amount)}
                </span>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 shrink-0">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
