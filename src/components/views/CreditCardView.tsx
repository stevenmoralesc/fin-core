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
  Settings,
  Banknote,
  CalendarClock,
} from "lucide-react";
import { monthlyPayment } from "@/lib/credit";
import { formatCents, formatCentsParts } from "@/lib/money";
import { useFeedback } from "@/components/ui/Feedback";
import InstallmentModal from "@/components/modals/InstallmentModal";
import BillPaymentModal from "@/components/modals/BillPaymentModal";
import AddCreditCardModal from "@/components/modals/AddCreditCardModal";
import EditCreditCardModal from "@/components/modals/EditCreditCardModal";
import type { Account, CreditCardDetails, CategoriesByType } from "@/lib/types";
import { useRouter } from "next/navigation";

// ── Helpers ───────────────────────────────────────────────────
function formatCOP(value: number): string {
  return formatCents(value);
}

// Generador de color sutil basado en el banco (similar a avatarMeta)
function getBankColors(bankName: string) {
  const n = bankName.toLowerCase();
  if (n.includes("nu")) return { bg: "#efe7fb", fg: "#7b3fe4" };
  if (n.includes("bancolombia")) return { bg: "#e9f0fb", fg: "#1d63b8" };
  if (n.includes("davivienda")) return { bg: "#fbe9e9", fg: "#c0392b" };
  if (n.includes("falabella")) return { bg: "#e6f4ea", fg: "#1f7a4d" };
  if (n.includes("scotiabank") || n.includes("colpatria")) return { bg: "#ffeede", fg: "#e8590c" };
  if (n.includes("rappi")) return { bg: "#ffeede", fg: "#e8590c" };
  return { bg: "var(--bg-surface-3)", fg: "var(--text-secondary)" };
}

interface Props {
  initialData: CreditCardDetails[];
  accounts: Account[];
  categories?: CategoriesByType;
}

export default function CreditCardView({ initialData, accounts, categories }: Props) {
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

  // Empty state
  if (initialData.length === 0) {
    return (
      <div className="p-6 md:p-10 max-w-[1200px] mx-auto">
        <div className="flex flex-col items-center justify-center py-32 text-center rounded-[32px] border shadow-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <div className="w-20 h-20 rounded-[24px] flex items-center justify-center mb-6" style={{ background: "var(--bg-surface-2)", color: "var(--text-muted)" }}>
            <CreditCard size={40} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold mb-3 tracking-tight" style={{ color: "var(--text-primary)" }}>No hay tarjetas registradas</h2>
          <p className="text-base max-w-sm mb-8 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Aún no tienes tarjetas de crédito. Agrega tu primera tarjeta para empezar a gestionar tus compras a cuotas de forma centralizada.
          </p>
          <button
            onClick={() => setAddCardOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 rounded-[16px] text-[15px] font-bold transition-all hover:scale-[1.02] shadow-sm"
            style={{ background: "var(--text-primary)", color: "var(--bg-surface)" }}
          >
            <Plus size={18} strokeWidth={2.5} />
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

  const usedPercent = stats.totalLimit > 0 ? Math.round((stats.usedLimit / stats.totalLimit) * 100) : 0;
  const availablePercent = 100 - usedPercent;

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
  const bankColors = getBankColors(card.bank);

  return (
    <div className="space-y-10 md:space-y-14 p-6 md:p-10 max-w-[1200px] mx-auto">
      
      {/* ── Selector de Tarjetas (Píldoras) ── */}
      <div className="flex gap-3 overflow-x-auto pb-4 items-center no-scrollbar">
        {initialData.map((d, index) => {
          const isSelected = index === selectedIndex;
          const colors = getBankColors(d.card.bank);
          return (
            <button
              key={d.card.id}
              onClick={() => setSelectedIndex(index)}
              className="flex items-center gap-3 rounded-[20px] px-5 py-3 shrink-0 transition-all duration-300"
              style={isSelected
                ? { 
                    background: "var(--bg-surface)", 
                    borderColor: "var(--border)", 
                    borderWidth: "1px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                  }
                : { 
                    background: "transparent", 
                    borderColor: "transparent", 
                    borderWidth: "1px",
                  }
              }
            >
              <div 
                className={`w-8 h-8 flex items-center justify-center rounded-full shadow-sm transition-transform ${isSelected ? "scale-110" : ""}`}
                style={{ background: colors.bg, color: colors.fg }}
              >
                <CreditCard size={15} strokeWidth={2} />
              </div>
              <span className={`text-[15px] ${isSelected ? "font-extrabold" : "font-bold"}`} style={{ color: isSelected ? "var(--text-primary)" : "var(--text-muted)" }}>
                {d.card.name}
              </span>
            </button>
          );
        })}
        <button
          onClick={() => setAddCardOpen(true)}
          className="flex items-center justify-center w-12 h-12 rounded-[20px] transition-colors shrink-0 ml-2 border border-dashed"
          style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-surface-2)" }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.background = "transparent" }}
          title="Añadir nueva tarjeta"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* ── Encabezado Principal ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-4">
            <h1 className="text-[30px] md:text-[42px] font-extrabold tracking-tight leading-none" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              {card.name}
            </h1>
            <button 
              onClick={() => setEditCardOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-[10px] transition-colors"
              style={{ background: "var(--bg-surface-2)", color: "var(--text-secondary)" }}
              title="Ajustes de la tarjeta"
            >
              <Settings size={16} strokeWidth={2} />
            </button>
          </div>
          <p className="text-[13px] md:text-[15px] font-medium" style={{ color: "var(--text-muted)" }}>
            {card.bank} · Corte: día {card.closingDay} · Pago: día {card.paymentDay}
          </p>
        </div>
        
        <button
          onClick={() => setPayModalOpen(true)}
          disabled={stats.nextBillAmount === 0}
          className="hidden md:flex items-center justify-center gap-2.5 px-5 py-3 rounded-[13px] text-[15px] font-bold shadow-sm transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          style={{ background: "#ffffff", color: "#111111" }}
        >
          <Banknote size={18} strokeWidth={2.5} />
          Pagar Factura
        </button>
      </div>

      {/* ── Panel Unificado (Handoff Dir A) ── */}
      <div 
        className="w-full rounded-[22px] overflow-hidden p-6 md:py-7 md:px-8 mb-10 flex flex-wrap gap-[30px] items-center border shadow-sm relative"
        style={{ background: "#16161a", borderColor: "rgba(255,255,255,0.06)" }}
      >
        {/* Zona 1: Disponibilidad y Uso */}
        <div className="flex-[1_1_440px] min-w-[280px] md:min-w-[320px]">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[11px] uppercase font-medium" style={{ fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.14em", color: "#8e8e96" }}>
                Cupo Disponible
              </p>
              <div className="flex items-baseline mt-1" style={{ color: "#3ddc91" }}>
                {(() => {
                  const { integer, decimal } = formatCentsParts(stats.availableLimit);
                  return (
                    <>
                      <span className="text-[32px] md:text-[40px] font-extrabold tracking-tight tabular-nums" style={{ letterSpacing: "-0.02em" }}>
                        {integer}
                      </span>
                      <span className="text-[18px] md:text-[22px] font-extrabold tabular-nums ml-0.5" style={{ color: "#2a8f63" }}>
                        {decimal}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="text-right pb-1 hidden sm:block">
              <span className="text-[12px]" style={{ color: "#6a6a72" }}>de</span>
              <span className="text-[15px] md:text-[17px] font-bold tabular-nums ml-1.5" style={{ color: "#c9c9d0" }}>
                {formatCOP(stats.totalLimit)}
              </span>
            </div>
          </div>

          <div className="w-full h-[11px] rounded-full overflow-hidden mb-3" style={{ background: "#27272b" }}>
            <div 
              className="h-full rounded-full transition-all duration-700 ease-out" 
              style={{ 
                width: `${usedPercent}%`, 
                background: "linear-gradient(90deg, #ff7a45, #ff5e2e)" 
              }} 
            />
          </div>

          <div className="flex items-center justify-between text-[13px] font-semibold" style={{ color: "#a8a8b0" }}>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full block" style={{ background: "#ff5e2e" }}></span>
              Utilizado <span className="hidden sm:inline">· <span className="tabular-nums">{formatCOP(stats.usedLimit)}</span></span>
              <span style={{ color: "#6a6a72" }}>({usedPercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full block" style={{ background: "#3ddc91" }}></span>
              Disponible
              <span style={{ color: "#6a6a72" }}>({availablePercent}%)</span>
            </div>
          </div>
        </div>

        {/* Divisor */}
        <div className="hidden md:block w-[1px] self-stretch" style={{ background: "rgba(255,255,255,0.07)" }}></div>
        <div className="block md:hidden w-full h-[1px]" style={{ background: "rgba(255,255,255,0.06)" }}></div>

        {/* Zona 2: Próxima Cuota */}
        <div className="flex-[0_0_auto] min-w-[230px]">
          <div className="flex items-center gap-2 mb-2">
            <CalendarClock size={14} style={{ color: "#ff8a5c" }} strokeWidth={2.5} />
            <p className="text-[11px] uppercase font-medium" style={{ fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.14em", color: "#ff8a5c" }}>
              Próxima Cuota
            </p>
          </div>
          
          <div className="flex items-baseline mb-2">
            {(() => {
              const { integer, decimal } = formatCentsParts(stats.nextBillAmount);
              return (
                <>
                  <span className="text-[28px] md:text-[34px] font-extrabold tabular-nums tracking-tight" style={{ color: "#f6f6f8" }}>
                    {integer}
                  </span>
                  <span className="text-[16px] md:text-[18px] font-extrabold tabular-nums ml-0.5" style={{ color: "#7c7c84" }}>
                    {decimal}
                  </span>
                </>
              );
            })()}
          </div>
          
          <p className="text-[13px] md:text-[13.5px]" style={{ color: "#8e8e96" }}>
            Vence el <strong className="font-bold" style={{ color: "#c9c9d0" }}>día {card.paymentDay}</strong>
          </p>
        </div>

        {/* Botón Pagar Factura Mobile */}
        <button
          onClick={() => setPayModalOpen(true)}
          disabled={stats.nextBillAmount === 0}
          className="flex md:hidden w-full items-center justify-center gap-2.5 px-5 py-3.5 rounded-[13px] text-[15px] font-bold shadow-sm transition-transform active:scale-95 disabled:opacity-50 mt-2"
          style={{ background: "#ffffff", color: "#111111" }}
        >
          <Banknote size={18} strokeWidth={2.5} />
          Pagar Factura
        </button>
      </div>

      {/* ── Compras Vigentes (Lista de Alta Densidad) ── */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: "var(--border-subtle)" }}>
          <span className="w-10 h-10 rounded-[12px] flex items-center justify-center shadow-sm" style={{ background: "var(--bg-surface-2)" }}>
            <ShoppingBag size={20} style={{ color: "var(--text-primary)" }} strokeWidth={2} />
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Compras Vigentes
          </h2>
          <span className="text-[13px] font-bold px-3 py-1 rounded-full ml-2" style={{ background: "var(--text-primary)", color: "var(--bg-surface)" }}>
            {vigentes.length}
          </span>
        </div>

        {vigentes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-[32px] border border-dashed" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
            <div className="w-16 h-16 rounded-[24px] flex items-center justify-center mb-4" style={{ background: "var(--bg-surface-2)", color: "var(--text-placeholder)" }}>
              <CheckCircle2 size={24} strokeWidth={1.5} />
            </div>
            <p className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>No hay compras diferidas</p>
            <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>El saldo de tu tarjeta está limpio de cuotas.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {vigentes.map((inst, i) => {
              const monthly = monthlyPayment(inst);
              const pct = (inst.paidMonths / inst.totalMonths) * 100;
              const remaining = inst.totalMonths - inst.paidMonths;
              
              return (
                <div 
                  key={inst.id} 
                  className="group grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] md:items-center gap-4 px-5 py-3.5 transition-colors cursor-default hover:bg-surface-2"
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)" }}
                >
                  {/* Icono y Detalles Principales */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 text-[22px] leading-none"
                      style={{ background: "var(--bg-surface-2)" }}
                      aria-hidden
                    >
                      {categories?.["GASTO"]?.[inst.category ?? ""]?.[0]?.icon || "🛍️"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold truncate tracking-tight" style={{ color: "var(--text-primary)" }}>
                        {inst.establishment}
                      </p>
                      <p className="text-[13px] font-medium mt-1" style={{ color: "var(--text-muted)" }}>
                        {new Date(inst.purchaseDate.length === 10 ? inst.purchaseDate + 'T12:00:00' : inst.purchaseDate).toLocaleDateString("es-CO", {
                          day: "2-digit", month: "short", year: "numeric",
                        })} · {formatCOP(inst.totalAmount)} total
                      </p>
                    </div>
                  </div>
                  
                  {/* Progreso */}
                  <div className="flex flex-col md:items-start justify-center">
                    {inst.totalMonths > 1 ? (
                      <>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[12px] font-bold" style={{ color: "var(--text-secondary)" }}>
                            {inst.paidMonths} / {inst.totalMonths} cuotas
                          </span>
                          <span className="text-[11px]" style={{ color: "var(--text-placeholder)" }}>
                            ({remaining} restan)
                          </span>
                        </div>
                        <div className="w-full md:w-32 h-1.5 bg-surface-3 rounded-full overflow-hidden" style={{ background: "var(--bg-surface-2)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: "var(--text-primary)" }}
                          />
                        </div>
                      </>
                    ) : null}
                  </div>

                  {/* Valor de Cuota y Acciones */}
                  <div className="flex items-center justify-between md:justify-end gap-6">
                    <div className="text-right">
                      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                        Mensual
                      </p>
                      <p className="text-xl font-extrabold tabular-nums tracking-tight" style={{ color: "var(--text-primary)" }}>
                        {(() => {
                          const { integer, decimal } = formatCentsParts(monthly);
                          return (
                            <>
                              {integer}
                              <span style={{ fontSize: "12px", color: "var(--text-placeholder)", marginLeft: "1px" }}>{decimal}</span>
                            </>
                          );
                        })()}
                      </p>
                    </div>

                    {/* Acciones invisibles hasta hover */}
                    <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setPayAccountId(accounts[0]?.id ?? ""); setPayInstallmentId(inst.id); }}
                        disabled={isPending}
                        title="Pagar cuota"
                        className="w-10 h-10 flex items-center justify-center rounded-full transition-colors disabled:opacity-50"
                        style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}
                      >
                        <CalendarCheck size={16} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(inst.id)}
                        title="Eliminar compra"
                        className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
                        style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Historial Amortizadas ── */}
      {amortizadas.length > 0 && (
        <div className="space-y-4 pt-8">
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Historial Pagado</h2>
            <span className="text-[12px] font-bold px-2 py-1 rounded-md" style={{ color: "var(--text-muted)", background: "var(--bg-surface-2)" }}>
              {amortizadas.length} archivadas
            </span>
          </div>
          <div className="space-y-0">
            {amortizadas.map((inst, i) => (
              <div
                key={inst.id}
                className="px-5 py-3.5 flex items-center justify-between transition-colors hover:bg-surface-2 cursor-default"
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)" }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 text-[18px] leading-none opacity-80"
                    style={{ background: "var(--bg-surface-2)" }}
                    aria-hidden
                  >
                    {categories?.["GASTO"]?.[inst.category ?? ""]?.[0]?.icon || "🛍️"}
                  </div>
                  <div>
                    <p className="text-[15px] font-bold" style={{ color: "var(--text-secondary)" }}>{inst.establishment}</p>
                    <p className="text-[12px] font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {inst.totalMonths} cuotas · Pagado
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[15px] font-extrabold tabular-nums tracking-tight" style={{ color: "var(--text-placeholder)" }}>
                    {formatCOP(inst.totalAmount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modals Globales ── */}
      {modalOpen && (
        <InstallmentModal cards={allCards} preselectedCardId={card.id} onClose={() => setModalOpen(false)} />
      )}
      {payModalOpen && (
        <BillPaymentModal card={card} billAmount={stats.nextBillAmount} accounts={accounts} onClose={() => setPayModalOpen(false)} />
      )}
      {addCardOpen && <AddCreditCardModal onClose={() => setAddCardOpen(false)} />}
      {editCardOpen && <EditCreditCardModal card={card} onClose={() => setEditCardOpen(false)} />}

      {/* ── Confirm Delete (Impeccable style) ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="rounded-[32px] max-w-sm w-full p-8 text-center shadow-2xl border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div className="w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
              <Trash2 size={28} strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>¿Eliminar compra?</h3>
            <p className="text-[15px] leading-relaxed mb-8" style={{ color: "var(--text-muted)" }}>
              Esta acción eliminará el registro de cuotas y recalculará el cupo disponible. No se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-3.5 rounded-[16px] text-[15px] font-bold transition-colors"
                style={{ background: "var(--bg-surface-2)", color: "var(--text-primary)" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteInstallment(confirmDeleteId)}
                className="flex-1 py-3.5 rounded-[16px] text-[15px] font-bold transition-colors"
                style={{ background: "#ef4444", color: "#ffffff" }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pay Installment (Impeccable style) ── */}
      {payInstallmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="rounded-[32px] max-w-sm w-full p-8 shadow-2xl border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div className="w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
              <CalendarCheck size={28} strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight mb-2 text-center" style={{ color: "var(--text-primary)" }}>Pagar cuota</h3>
            <p className="text-[15px] leading-relaxed mb-6 text-center" style={{ color: "var(--text-muted)" }}>
              Elige la cuenta desde la que descontarás esta cuota.
            </p>
            
            {accounts.length === 0 ? (
              <>
                <p className="text-[14px] font-medium mb-8 text-center" style={{ color: "var(--text-placeholder)" }}>
                  No tienes cuentas registradas.
                </p>
                <button
                  onClick={() => setPayInstallmentId(null)}
                  className="w-full py-3.5 rounded-[16px] text-[15px] font-bold transition-colors"
                  style={{ background: "var(--bg-surface-2)", color: "var(--text-primary)" }}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full mb-8 px-5 py-4 rounded-[16px] border text-[15px] font-bold outline-none cursor-pointer appearance-none"
                  style={{ background: "var(--bg-surface-2)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPayInstallmentId(null)}
                    className="flex-1 py-3.5 rounded-[16px] text-[15px] font-bold transition-colors"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handlePayInstallment(payInstallmentId, payAccountId)}
                    disabled={!payAccountId || isPending}
                    className="flex-1 py-3.5 rounded-[16px] text-[15px] font-bold transition-colors disabled:opacity-50"
                    style={{ background: "var(--text-primary)", color: "var(--bg-surface)" }}
                  >
                    Confirmar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
