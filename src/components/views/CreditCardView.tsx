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
import KpiCard from "@/components/dashboard/KpiCard";
import { monthlyPayment } from "@/lib/credit";
import { formatCents, formatCentsParts } from "@/lib/money";
import { useFeedback } from "@/components/ui/Feedback";
import InstallmentModal from "@/components/modals/InstallmentModal";
import BillPaymentModal from "@/components/modals/BillPaymentModal";
import AddCreditCardModal from "@/components/modals/AddCreditCardModal";
import EditCreditCardModal from "@/components/modals/EditCreditCardModal";
import type { Account, CreditCardDetails } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────
// Los montos llegan en centavos enteros.
function formatCOP(value: number): string {
  return formatCents(value);
}
function formatCOPShort(value: number): string {
  return formatCOP(value);
}

interface CreditCardViewProps {
  initialData: CreditCardDetails[];
  accounts: Account[];
}

export default function CreditCardView({ initialData, accounts }: CreditCardViewProps) {
  const router = useRouter();
  const { toast } = useFeedback();
  const [isPending, startTransition] = useTransition();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [editCardOpen, setEditCardOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [payInstallmentId, setPayInstallmentId] = useState<string | null>(null);
  const [payAccountId, setPayAccountId] = useState<string>(accounts[0]?.id ?? "");

  if (initialData.length === 0) {
    return (
      <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-2xl shadow-sm" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--bg-surface-2)" }}>
            <span className="text-3xl">💳</span>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>No hay tarjetas registradas</h2>
          <p className="text-sm max-w-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Aún no tienes tarjetas de crédito. Agrega tu primera tarjeta para empezar a trackear tus compras y cuotas.
          </p>
          <button
            onClick={() => setAddCardOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors shadow-sm"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            <Plus size={18} />
            Agregar primera tarjeta
          </button>
        </div>
        {addCardOpen && (
          <AddCreditCardModal onClose={() => { setAddCardOpen(false); router.refresh(); }} />
        )}
      </div>
    );
  }


  const data = initialData[selectedIndex] || initialData[0];
  const { card, stats, installments } = data;
  const allCards = initialData.map((d) => d.card);

  const usedPercent =
    stats.totalLimit > 0 ? Math.round((stats.usedLimit / stats.totalLimit) * 100) : 0;
  const availablePercent = 100 - usedPercent;

  const kpiData = [
    {
      title: "Cupo Disponible",
      value: formatCOP(stats.availableLimit),
      valueParts: formatCentsParts(stats.availableLimit),
      subtitle: `de ${formatCOPShort(stats.totalLimit)}`,
      icon: ShieldCheck,
      trend: { value: `${availablePercent}%`, positive: true, label: "del total" },
      variant: "success" as const,
      accentColor: "#10b981",
    },
    {
      title: "Cupo Utilizado",
      value: formatCOP(stats.usedLimit),
      valueParts: formatCentsParts(stats.usedLimit),
      subtitle: "Saldo pendiente en cuotas",
      icon: CreditCard,
      trend: { value: `${usedPercent}%`, positive: false, label: "del total" },
      variant: "warning" as const,
      accentColor: "#f59e0b",
    },
    {
      title: "Próxima Cuota",
      value: formatCOP(stats.nextBillAmount),
      valueParts: formatCentsParts(stats.nextBillAmount),
      subtitle: `Día de pago: ${card.paymentDay} de cada mes`,
      icon: AlertCircle,
      trend: { value: "Este mes", positive: false, label: "cuotas activas" },
      variant: "default" as const,
      accentColor: "#6366f1",
    },
  ];

  const handlePayInstallment = (id: string, accountId: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/installments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        toast("error", e.error ?? "No se pudo pagar la cuota");
      }
      setPayInstallmentId(null);
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
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* ── Selector de Tarjetas ── */}
      <div className="flex gap-2 overflow-x-auto pb-6 items-center">
        {initialData.map((d, index) => (
          <button
            key={d.card.id}
            onClick={() => setSelectedIndex(index)}
            className="flex items-center gap-2 border rounded-xl px-4 py-2.5 shrink-0 shadow-sm transition-colors"
            style={index === selectedIndex
              ? { background: "var(--bg-surface-3)", borderColor: "var(--border)", color: "var(--text-primary)" }
              : { background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }
            }
          >
            <CreditCard
              size={16}
              style={{ color: index === selectedIndex ? "var(--text-primary)" : "var(--text-muted)" }}
            />
            <span className="text-sm font-semibold">{d.card.name}</span>
          </button>
        ))}
        <button
          onClick={() => setAddCardOpen(true)}
          className="flex items-center justify-center w-10 h-10 border border-dashed rounded-xl transition-colors shrink-0"
          style={{ borderColor: "var(--text-placeholder)", color: "var(--text-muted)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.borderColor = "var(--text-secondary)"; e.currentTarget.style.background = "var(--bg-surface-2)" }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--text-placeholder)"; e.currentTarget.style.background = "transparent" }}
          title="Añadir nueva tarjeta"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* ── Encabezado de la tarjeta actual ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "var(--accent)" }}>
            <CreditCard size={20} style={{ color: "var(--accent-fg)" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{card.name}</h2>
              <button 
                onClick={() => setEditCardOpen(true)}
                className="p-1 rounded-md transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-surface-2)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <Settings size={14} />
              </button>
            </div>
            <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {card.bank} · Corte: día {card.closingDay} · Pago: día {card.paymentDay}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPayModalOpen(true)}
            disabled={stats.nextBillAmount === 0}
            className="flex items-center gap-2 disabled:opacity-40 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
            style={{ background: "#4f46e5", color: "white" }}
          >
            <Receipt size={16} />
            Pagar Factura
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
          >
            <Plus size={16} />
            Nueva Compra
          </button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpiData.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* ── Tabla Vigentes ── */}
      <div
        className="rounded-2xl border overflow-hidden shadow-sm"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Compras Vigentes</h2>
            <p className="text-xs mt-0.5 tracking-wide" style={{ color: "var(--text-muted)" }}>
              {vigentes.length === 0 ? "Sin compras activas" : `${vigentes.length} compra${vigentes.length > 1 ? "s" : ""} en cuotas`}
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ color: "#4f46e5", background: "rgba(79, 70, 229, 0.1)" }}>
            {vigentes.length} activas
          </span>
        </div>

        {vigentes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center mb-3">
              <ShoppingBag size={20} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-muted">No hay compras diferidas</p>
            <p className="text-xs text-gray-300 mt-1">
              Haz clic en &quot;Nueva Compra Diferida&quot; para registrar
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Table Header */}
            <div className="grid grid-cols-7 gap-4 bg-surface-2/60 border-b border-subtle text-[10px] leading-none uppercase tracking-wide font-bold text-muted px-6 py-3">
              <div className="col-span-2">Establecimiento</div>
              <div>Fecha</div>
              <div className="text-center">Progreso</div>
              <div className="text-right">Valor Total</div>
              <div className="text-right">Cuota / Mes</div>
              <div className="text-center">Acciones</div>
            </div>

            {/* Table Body */}
            <div className="divide-y text-sm" style={{ borderColor: "var(--border-subtle)" }}>
              {vigentes.map((inst) => {
                const monthly = monthlyPayment(inst);
                const pct = (inst.paidMonths / inst.totalMonths) * 100;
                const remaining = inst.totalMonths - inst.paidMonths;

                return (
                  <div key={inst.id} className="grid grid-cols-7 gap-4 items-center px-6 py-5 hover:bg-surface-2/50 transition-colors group" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="col-span-2">
                      <p className="font-semibold text-primary truncate">{inst.establishment}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {remaining} {remaining === 1 ? "cuota restante" : "cuotas restantes"}
                      </p>
                    </div>
                    <div className="text-xs text-secondary">
                      {new Date(inst.purchaseDate.length === 10 ? inst.purchaseDate + 'T12:00:00' : inst.purchaseDate).toLocaleDateString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <span className="text-xs font-bold text-gray-700">
                        {inst.paidMonths}/{inst.totalMonths}
                      </span>
                      <div className="w-24 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right font-medium text-gray-700">
                      {formatCOP(inst.totalAmount)}
                    </div>
                    <div className="text-right font-bold text-primary">
                      {formatCOP(monthly)}
                    </div>
                    <div className="flex items-center justify-center gap-2 opacity-100 sm:opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setPayAccountId(accounts[0]?.id ?? ""); setPayInstallmentId(inst.id); }}
                        disabled={isPending}
                        title="Marcar cuota como pagada"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-success-soft hover:bg-success-soft text-success rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <CalendarCheck size={13} />
                        Pagar cuota
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(inst.id)}
                        title="Eliminar esta compra"
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-3 text-muted hover:text-black transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

       {/* ── Historial Amortizadas ── */}
      {amortizadas.length > 0 && (
        <div
          className="rounded-2xl border overflow-hidden shadow-sm"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: "var(--border-subtle)" }}>
            <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Historial Pagado</h2>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ color: "var(--success)", background: "var(--success-bg)" }}>
              <CheckCircle2 size={11} /> {amortizadas.length} amortizadas
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {amortizadas.map((inst) => (
              <div
                key={inst.id}
                className="px-6 py-4 flex items-center justify-between opacity-70 hover:opacity-100 transition-all hover:bg-surface-2"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{inst.establishment}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {inst.totalMonths} cuotas ·{" "}
                    {new Date(inst.purchaseDate.length === 10 ? inst.purchaseDate + 'T12:00:00' : inst.purchaseDate).toLocaleDateString("es-CO", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>
                    {formatCOP(inst.totalAmount)}
                  </span>
                  <span className="text-[10px] leading-none font-bold uppercase tracking-wide px-2.5 py-1 rounded-md" style={{ color: "var(--success)", background: "var(--success-bg)" }}>
                    Pagada
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <InstallmentModal
          cards={allCards}
          preselectedCardId={card.id}
          onClose={() => setModalOpen(false)}
        />
      )}
      {payModalOpen && (
        <BillPaymentModal
          card={card}
          billAmount={stats.nextBillAmount}
          accounts={accounts}
          onClose={() => setPayModalOpen(false)}
        />
      )}
      {/* Confirm Delete */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-surface rounded-[24px] max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-primary mb-2">¿Eliminar compra?</h3>
            <p className="text-sm text-secondary mb-6">
              Esta acción eliminará el registro de cuotas y recalculará el cupo de tu tarjeta. No se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-3 rounded-xl border border-base text-sm font-semibold text-gray-600 hover:bg-surface-2 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteInstallment(confirmDeleteId)}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pay Installment - select account */}
      {payInstallmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-surface rounded-[24px] max-w-sm w-full p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--success-bg)" }}>
              <CalendarCheck size={24} style={{ color: "var(--success)" }} />
            </div>
            <h3 className="text-lg font-bold text-primary mb-2 text-center">Pagar cuota</h3>
            <p className="text-sm text-secondary mb-6 text-center">
              Elige la cuenta desde la que pagas esta cuota.
            </p>
            {accounts.length === 0 ? (
              <>
                <p className="text-sm mb-6 text-center" style={{ color: "var(--text-muted)" }}>
                  No tienes cuentas registradas para pagar.
                </p>
                <button
                  onClick={() => setPayInstallmentId(null)}
                  className="w-full py-3 rounded-xl border border-base text-sm font-semibold text-gray-600 hover:bg-surface-2 transition-colors"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full mb-6 px-4 py-3 rounded-xl border text-sm font-medium outline-none"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPayInstallmentId(null)}
                    className="flex-1 py-3 rounded-xl border border-base text-sm font-semibold text-gray-600 hover:bg-surface-2 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handlePayInstallment(payInstallmentId, payAccountId)}
                    disabled={!payAccountId || isPending}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    Confirmar pago
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {addCardOpen && <AddCreditCardModal onClose={() => setAddCardOpen(false)} />}
      {editCardOpen && <EditCreditCardModal card={card} onClose={() => setEditCardOpen(false)} />}
    </div>
  );
}
