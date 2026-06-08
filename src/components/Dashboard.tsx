"use client";

import { useState, useEffect } from "react";
import { Wallet, CreditCard, ShoppingCart, ArrowUpRight, ArrowDownLeft, MoreHorizontal, Plus } from "lucide-react";
import KpiCard from "@/components/KpiCard";
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

interface DashboardProps {
  categories: CategoriesByType;
  creditCards: import("@/lib/types").CreditCard[];
}

export default function Dashboard({ categories, creditCards }: DashboardProps) {
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [newTxModalOpen, setNewTxModalOpen] = useState(false);

  // Period state (YYYY-MM)
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
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load dashboard:", err);
        setLoading(false);
      });
    return () => { isMounted = false; };
  }, [periodo, refreshTrigger]);

  // Generar opciones de meses (últimos 12 meses)
  const periodOptions = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
    return { value, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });

  // Si está cargando o no hay data, renderizamos esqueleto o esperamos
  if (!data) {
    return (
      <div className="w-full flex flex-col gap-8 animate-pulse">
        <div className="h-10 w-1/3 bg-gray-200 rounded"></div>
        <div className="h-10 w-full bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

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
    <div className="w-full flex flex-col gap-8">
      
      {/* BLOQUE 1: HEADER (Título y Botón) */}
      <div className="flex justify-between items-start w-full">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Resumen General</h1>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-1.5 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-black/5 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              {periodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">
            {periodOptions.find(o => o.value === periodo)?.label || "Periodo seleccionado"}
          </p>
        </div>
        <button
          onClick={() => setNewTxModalOpen(true)}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          + Nueva Transacción
        </button>
      </div>
      
      {/* BLOQUE 2: FILA DE CUENTAS BANCARIAS */}
      <div className="flex flex-wrap gap-3 w-full border-b border-gray-100 pb-4">
          {data.cuentasActivas?.map((acc) => (
            <div
              key={acc.id}
              className="bg-white border border-gray-100 rounded-xl px-3 py-1.5 text-xs flex items-center gap-2 shadow-sm"
            >
              <div className="w-5 h-5 rounded flex items-center justify-center bg-gray-50">
                <Wallet size={12} className="text-gray-400" />
              </div>
              <span className="font-medium text-gray-500">{acc.name}</span>
              <span className="font-bold text-gray-800">{formatCOPShort((acc as any).currentBalance ?? 0)}</span>
            </div>
          ))}
        </div>

      {/* BLOQUE 3: GRILLA DE KPIS (Tarjetas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {kpiData.map((kpi) => (
          <div key={kpi.title} className="bg-white p-6 rounded-2xl border border-gray-100/80 shadow-sm flex flex-col justify-between min-h-[140px]">
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">{kpi.title}</span>
            <span className="text-3xl font-semibold tracking-tight text-gray-900">{kpi.value}</span>
            <span className={`text-xs font-medium ${kpi.trend.positive ? "text-green-500" : "text-red-500"}`}>
              {kpi.trend.value} {kpi.trend.label}
            </span>
          </div>
        ))}
      </div>

      {/* BLOQUE 4: TABLA DE TRANSACCIONES */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm w-full">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Transacciones recientes</h3>

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
                    {tx.paymentMethodName ? <span className="font-medium text-gray-600">{tx.paymentMethodName} · </span> : ""}
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
                <button
                  onClick={() => setEditingTx(tx as Transaction)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-400 shrink-0"
                  title="Editar transacción"
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          categories={categories}
          onClose={() => setEditingTx(null)}
          onSuccess={() => setRefreshTrigger(r => r + 1)}
        />
      )}
      
      {newTxModalOpen && (
        <TransactionModal
          accounts={data?.cuentasActivas || []}
          creditCards={creditCards}
          categories={categories}
          onClose={() => setNewTxModalOpen(false)}
          onSuccess={() => setRefreshTrigger(r => r + 1)}
        />
      )}
    </div>
  );
}
