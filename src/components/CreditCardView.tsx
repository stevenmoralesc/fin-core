"use client";

import { useState } from "react";
import { CreditCard, ShieldCheck, AlertCircle, CalendarDays, ShoppingBag } from "lucide-react";
import KpiCard from "@/components/KpiCard";
import type { CreditCardDetails } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────
function formatCOP(value: number): string {
  return `$${value.toLocaleString("es-CO")}`;
}

function formatCOPShort(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString("es-CO")}`;
}

interface CreditCardViewProps {
  initialData: CreditCardDetails[];
}

export default function CreditCardView({ initialData }: CreditCardViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const data = initialData[selectedIndex];
  const { card, stats, installments } = data;

  const usedPercent = stats.totalLimit > 0 ? Math.round((stats.usedLimit / stats.totalLimit) * 100) : 0;

  const kpiData = [
    {
      title: "Cupo Disponible",
      value: formatCOPShort(stats.availableLimit),
      subtitle: `Total: ${formatCOPShort(stats.totalLimit)}`,
      icon: ShieldCheck,
      trend: { value: `${100 - usedPercent}%`, positive: true, label: "libre" },
      variant: "success" as const,
      accentColor: "#10b981",
    },
    {
      title: "Cupo Utilizado",
      value: formatCOPShort(stats.usedLimit),
      subtitle: "Saldo pendiente total",
      icon: CreditCard,
      trend: { value: `${usedPercent}%`, positive: false, label: "del total" },
      variant: "warning" as const,
      accentColor: "#f59e0b",
    },
    {
      title: "Próximo Pago Estimado",
      value: formatCOPShort(stats.nextBillAmount),
      subtitle: `Día de pago: ${card.paymentDay} de cada mes`,
      icon: AlertCircle,
      trend: { value: "Mensual", positive: false, label: "cuotas actuales" },
      variant: "default" as const,
      accentColor: "#6366f1",
    },
  ];

  return (
    <>
      {/* ── Selector de Tarjetas ── */}
      {initialData.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {initialData.map((d, index) => (
            <button
              key={d.card.id}
              onClick={() => setSelectedIndex(index)}
              className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 shrink-0 shadow-sm transition-colors ${
                index === selectedIndex
                  ? "bg-gray-900 border-gray-900 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <CreditCard size={16} className={index === selectedIndex ? "text-gray-300" : "text-gray-400"} />
              <span className="text-sm font-semibold">{d.card.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Info extra de la tarjeta actual si hay solo una y queremos título (opcional) */}
      {initialData.length === 1 && (
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-sm">
            <CreditCard size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{card.name}</h2>
            <p className="text-xs text-gray-500 font-medium">{card.bank} · Corte: día {card.closingDay}</p>
          </div>
        </div>
      )}

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {kpiData.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* ── Tabla de Amortización ── */}
      <div
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.08)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Detalle de Compras a Cuotas</h2>
            <p className="text-xs text-gray-400 mt-0.5">Amortización mes a mes</p>
          </div>
        </div>

        {installments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
              <ShoppingBag size={20} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No hay compras diferidas</p>
            <p className="text-xs text-gray-300 mt-1">Usa esta tarjeta en una transacción para verla aquí</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  <th className="px-6 py-3 font-semibold">Establecimiento</th>
                  <th className="px-6 py-3 font-semibold">Fecha</th>
                  <th className="px-6 py-3 font-semibold text-center">Progreso</th>
                  <th className="px-6 py-3 font-semibold text-right">Valor Total</th>
                  <th className="px-6 py-3 font-semibold text-right">Cuota Mensual</th>
                  <th className="px-6 py-3 font-semibold text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {installments.map((inst) => {
                  const monthlyAmount = inst.totalAmount / inst.totalMonths;
                  const isPaid = inst.status === "AMORTIZADA";

                  return (
                    <tr key={inst.id} className={`hover:bg-gray-50/50 transition-colors ${isPaid ? "opacity-60 grayscale" : ""}`}>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {inst.establishment}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(inst.purchaseDate).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs font-bold text-gray-700">{inst.paidMonths}/{inst.totalMonths}</span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isPaid ? 'bg-gray-400' : 'bg-indigo-500'}`}
                              style={{ width: `${(inst.paidMonths / inst.totalMonths) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-700">
                        {formatCOP(inst.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {isPaid ? "—" : formatCOP(monthlyAmount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                          isPaid ? "bg-gray-100 text-gray-500" : "bg-emerald-50 text-emerald-600"
                        }`}>
                          {inst.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
