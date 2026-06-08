"use client";

import { useState, useTransition } from "react";
import {
  CreditCard,
  ShieldCheck,
  AlertCircle,
  ShoppingBag,
  Plus,
  CheckCircle2,
  Trash2,
  CalendarCheck,
  Receipt,
} from "lucide-react";
import KpiCard from "@/components/KpiCard";
import InstallmentModal from "@/components/InstallmentModal";
import BillPaymentModal from "@/components/BillPaymentModal";
import AddCreditCardModal from "@/components/AddCreditCardModal";
import EditCreditCardModal from "@/components/EditCreditCardModal";
import type { Account, CreditCardDetails } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────
function formatCOP(value: number): string {
  return "$" + Math.round(value).toLocaleString("es-CO");
}
function formatCOPShort(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString("es-CO")}`;
}

interface CreditCardViewProps {
  initialData: CreditCardDetails[];
  accounts: Account[];
}

export default function CreditCardView({ initialData, accounts }: CreditCardViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [editCardOpen, setEditCardOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!initialData || initialData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
          <CreditCard size={28} className="text-gray-300" />
        </div>
        <p className="text-sm font-bold text-gray-900 mb-1">No hay tarjetas registradas</p>
        <p className="text-xs text-gray-400 mb-6 max-w-sm">
          Añade tu primera tarjeta de crédito para empezar a gestionar tus compras a cuotas.
        </p>
        <button
          onClick={() => setAddCardOpen(true)}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus size={18} />
          Añadir Tarjeta
        </button>

        {addCardOpen && <AddCreditCardModal onClose={() => setAddCardOpen(false)} />}
      </div>
    );
  }

  const data = initialData[selectedIndex] || initialData[0];
  const { card, stats, installments } = data;
  const allCards = initialData.map((d) => d.card);

  const usedPercent =
    stats.totalLimit > 0 ? Math.round((stats.usedLimit / stats.totalLimit) * 100) : 0;

  const kpiData = [
    {
      title: "Cupo Disponible",
      value: formatCOPShort(stats.availableLimit),
      subtitle: `Límite total: ${formatCOPShort(stats.totalLimit)}`,
      icon: ShieldCheck,
      trend: { value: `${100 - usedPercent}%`, positive: true, label: "libre" },
      variant: "success" as const,
      accentColor: "#10b981",
    },
    {
      title: "Cupo Utilizado",
      value: formatCOPShort(stats.usedLimit),
      subtitle: "Saldo pendiente en cuotas",
      icon: CreditCard,
      trend: { value: `${usedPercent}%`, positive: false, label: "del total" },
      variant: "warning" as const,
      accentColor: "#f59e0b",
    },
    {
      title: "Próxima Cuota",
      value: formatCOPShort(stats.nextBillAmount),
      subtitle: `Día de pago: ${card.paymentDay} de cada mes`,
      icon: AlertCircle,
      trend: { value: "Este mes", positive: false, label: "cuotas activas" },
      variant: "default" as const,
      accentColor: "#6366f1",
    },
  ];

  const handlePayInstallment = (id: string) => {
    startTransition(async () => {
      await fetch(`/api/installments/${id}`, { method: "PATCH" });
      router.refresh();
    });
  };

  const handleDeleteInstallment = async (id: string) => {
    await fetch(`/api/installments/${id}`, { method: "DELETE" });
    setConfirmDeleteId(null);
    router.refresh();
  };

  const vigentes = installments.filter((i) => i.status === "VIGENTE");
  const amortizadas = installments.filter((i) => i.status === "AMORTIZADA");

  return (
    <>
      {/* ── Selector de Tarjetas ── */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 items-center">
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
            <CreditCard
              size={16}
              className={index === selectedIndex ? "text-gray-300" : "text-gray-400"}
            />
            <span className="text-sm font-semibold">{d.card.name}</span>
          </button>
        ))}
        <button
          onClick={() => setAddCardOpen(true)}
          className="flex items-center justify-center w-10 h-10 border border-dashed border-gray-300 rounded-xl text-gray-400 hover:text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors shrink-0"
          title="Añadir nueva tarjeta"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* ── Encabezado de la tarjeta actual ── */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-sm">
            <CreditCard size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{card.name}</h2>
              <button 
                onClick={() => setEditCardOpen(true)}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-md transition-colors"
              >
                <Settings size={14} />
              </button>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {card.bank} · Corte: día {card.closingDay} · Pago: día {card.paymentDay}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPayModalOpen(true)}
            disabled={stats.nextBillAmount === 0}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Receipt size={16} />
            Pagar Factura
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus size={16} />
            Nueva Compra
          </button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {kpiData.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* ── Tabla Vigentes ── */}
      <div
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6"
        style={{ boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.08)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Compras Vigentes</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {vigentes.length === 0 ? "Sin compras activas" : `${vigentes.length} compra${vigentes.length > 1 ? "s" : ""} en cuotas`}
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
            {vigentes.length} activas
          </span>
        </div>

        {vigentes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
              <ShoppingBag size={20} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No hay compras diferidas</p>
            <p className="text-xs text-gray-300 mt-1">
              Haz clic en "Nueva Compra Diferida" para registrar
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  <th className="px-6 py-3">Establecimiento</th>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3 text-center">Progreso</th>
                  <th className="px-6 py-3 text-right">Valor Total</th>
                  <th className="px-6 py-3 text-right">Cuota / Mes</th>
                  <th className="px-6 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {vigentes.map((inst) => {
                  const monthly = inst.totalAmount / inst.totalMonths;
                  const pct = (inst.paidMonths / inst.totalMonths) * 100;
                  const remaining = inst.totalMonths - inst.paidMonths;

                  return (
                    <tr key={inst.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">{inst.establishment}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {remaining} {remaining === 1 ? "cuota restante" : "cuotas restantes"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(inst.purchaseDate).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-700">
                            {inst.paidMonths}/{inst.totalMonths}
                          </span>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-700">
                        {formatCOP(inst.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {formatCOP(monthly)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handlePayInstallment(inst.id)}
                            disabled={isPending}
                            title="Marcar cuota como pagada"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            <CalendarCheck size={13} />
                            Pagar cuota
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(inst.id)}
                            title="Eliminar esta compra"
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Historial Amortizadas ── */}
      {amortizadas.length > 0 && (
        <div
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          style={{ boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.08)" }}
        >
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Historial Pagado</h2>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <CheckCircle2 size={11} /> {amortizadas.length} amortizadas
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {amortizadas.map((inst) => (
              <div
                key={inst.id}
                className="px-6 py-3.5 flex items-center justify-between opacity-60 hover:opacity-80 transition-opacity"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700">{inst.establishment}</p>
                  <p className="text-xs text-gray-400">
                    {inst.totalMonths} cuotas ·{" "}
                    {new Date(inst.purchaseDate).toLocaleDateString("es-CO", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-500">
                    {formatCOP(inst.totalAmount)}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    Pagada
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal Nueva Compra ── */}
      {modalOpen && (
        <InstallmentModal
          cards={allCards}
          preselectedCardId={card.id}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* ── Modal Pagar Factura ── */}
      {payModalOpen && (
        <BillPaymentModal
          card={card}
          billAmount={stats.nextBillAmount}
          accounts={accounts}
          onClose={() => setPayModalOpen(false)}
        />
      )}

      {/* ── Confirm Delete ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">¿Eliminar esta compra?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Se borrará el registro permanentemente y no se podrá recuperar.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteInstallment(confirmDeleteId)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {addCardOpen && <AddCreditCardModal onClose={() => setAddCardOpen(false)} />}
      {editCardOpen && <EditCreditCardModal card={card} onClose={() => setEditCardOpen(false)} />}
    </>
  );
}
