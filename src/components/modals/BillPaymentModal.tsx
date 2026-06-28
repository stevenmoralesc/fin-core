"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, Wallet, AlertTriangle, Check, Banknote, CreditCard as CreditCardIcon, Briefcase, Landmark, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Account, CreditCard } from "@/lib/types";
import { formatCents, formatCentsParts } from "@/lib/money";
import { useFeedback } from "@/components/ui/Feedback";

interface BillPaymentModalProps {
  card: CreditCard;
  billAmount: number; // monto de la factura del mes
  accounts: Account[];
  onClose: () => void;
}

interface AccountWithBalance extends Account {
  currentBalance: number;
}

const INDIGO = "#3b5bda";

function formatCOP(value: number): string {
  return formatCents(value);
}

// ─── Helpers from AccountPickerSheet ───────────────────────────────────────

interface AvatarMeta {
  bg: string;
  fg: string;
  text?: string;
  icon?: React.ReactNode;
}

function getIconForType(type: string) {
  if (type === "EFECTIVO") return <Banknote size={20} />;
  if (type === "Crédito" || type === "TARJETA") return <CreditCardIcon size={20} />;
  if (type === "CORRIENTE") return <Briefcase size={20} />;
  return <Landmark size={20} />; // Ahorros y fallback
}

function avatarMeta(name: string, type: string): AvatarMeta {
  const n = name.toLowerCase();
  const icon = getIconForType(type);

  if (n.includes("inversión") || n.includes("inversion")) {
    return { bg: "#eaeef9", fg: INDIGO, icon: <TrendingUp size={20} /> };
  }
  if (n.includes("efectivo") || type === "EFECTIVO") {
    return { bg: "#e6f4ea", fg: "#1f7a4d", icon: <Banknote size={20} /> };
  }

  if (n.startsWith("arq")) return { bg: "#e7eafc", fg: "#14182a", icon };
  if (n.includes("davibank") || n.includes("daviplata"))
    return { bg: "#fbe9e9", fg: "#c0392b", icon };
  if (n.includes("nequi")) return { bg: "#efe7fb", fg: "#7b3fe4", icon };
  if (n.includes("pibank")) return { bg: "#e3f4f1", fg: "#138a72", icon };
  if (n.startsWith("rappicuenta j") || n.startsWith("rappicard j"))
    return { bg: "#ffeede", fg: "#e8590c", icon };
  if (n.startsWith("rappi"))
    return { bg: "#ffeede", fg: "#e8590c", icon };
  if (n.startsWith("soles")) return { bg: "#fbf0dd", fg: "#b9821a", icon };
  if (n.startsWith("bancolombia"))
    return { bg: "#e9f0fb", fg: "#1d63b8", icon };

  return { bg: "var(--bg-surface-3)", fg: "var(--text-secondary)", icon };
}

function typeLabel(type: string): string {
  if (type === "AHORROS") return "Ahorros";
  if (type === "EFECTIVO") return "Efectivo";
  if (type === "CORRIENTE") return "Corriente";
  return type;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function BillPaymentModal({ card, billAmount, accounts, onClose }: BillPaymentModalProps) {
  const router = useRouter();
  const { toast } = useFeedback();
  const [loading, setLoading] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [accountsWithBalance, setAccountsWithBalance] = useState<AccountWithBalance[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id ?? "");

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data: AccountWithBalance[]) => {
        setAccountsWithBalance(data);
        setLoadingBalances(false);
      })
      .catch(() => {
        setAccountsWithBalance(accounts.map(a => ({ ...a, currentBalance: a.initialBalance })));
        setLoadingBalances(false);
      });
  }, [accounts]);

  const selectedAccount = accountsWithBalance.find((a) => a.id === selectedAccountId);
  const payAmount = billAmount;

  const insufficientFunds = selectedAccount
    ? selectedAccount.currentBalance < payAmount
    : false;

  const handlePay = async () => {
    if (!selectedAccountId || payAmount <= 0) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/credit-cards/${card.id}/pay-bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: selectedAccountId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error desconocido");
      }

      router.refresh();
      onClose();
    } catch (error) {
      toast("error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const closingDay = card.closingDay;
  const closingDate = new Date(today.getFullYear(), today.getMonth(), closingDay);
  if (closingDate < today) closingDate.setMonth(closingDate.getMonth() + 1);
  const daysUntilClosing = Math.ceil((closingDate.getTime() - today.getTime()) / 86400000);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-[420px] sm:rounded-[30px] rounded-t-[30px] overflow-hidden flex flex-col"
        style={{
          background: "var(--bg-surface)",
          boxShadow: "0 12px 40px rgba(20,20,30,0.10)",
          fontFamily: "var(--font-hanken), system-ui, sans-serif",
          maxHeight: "min(720px, 90vh)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-[22px] pt-[14px] pb-3 shrink-0 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div
            className="mx-auto mb-[18px] w-10 h-1 rounded-full"
            style={{ background: "var(--border)" }}
          />
          <div className="flex items-center justify-between">
            <div>
              <h3
                className="text-[19px] font-bold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Pagar Factura del Mes
              </h3>
              <p className="text-xs text-muted mt-0.5">{card.name} · {card.bank}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "var(--bg-surface-2)", color: "var(--text-muted)" }}
              aria-label="Cerrar"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto px-[22px] py-5 space-y-6"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Resumen de la factura */}
          <div className="bg-surface-2 rounded-[20px] p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-muted uppercase tracking-widest">Total cuotas del mes</span>
              <span className="text-xl font-extrabold text-primary tabular-nums">{formatCOP(billAmount)}</span>
            </div>
            <div className="w-full h-px" style={{ background: "var(--border-subtle)" }} />
            <div className="flex justify-between items-center text-xs text-secondary">
              <span>Próximo corte: día {card.closingDay}</span>
              <span className={`font-semibold ${daysUntilClosing <= 5 ? "text-red-500" : "text-secondary"}`}>
                {daysUntilClosing === 0 ? "¡Hoy!" : `Faltan ${daysUntilClosing} días`}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-secondary">
              <span>Día de pago</span>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Día {card.paymentDay} de cada mes</span>
            </div>
            <p className="text-[11px] text-muted pt-1 leading-relaxed">
              Al confirmar, se registrará un pago desde la cuenta seleccionada para cubrir las cuotas vigentes de este mes.
            </p>
          </div>

          {/* Selector de cuenta */}
          <div>
            <h4 className="text-[13px] font-bold mb-3 tracking-wide" style={{ color: "var(--text-primary)" }}>
              Selecciona la cuenta de origen
            </h4>
            <div className="space-y-1">
              {loadingBalances ? (
                <div className="h-16 bg-surface-2 rounded-xl animate-pulse" />
              ) : (
                accountsWithBalance.map((acc) => {
                  const isSelected = acc.id === selectedAccountId;
                  const insufficient = acc.currentBalance < payAmount;
                  const meta = avatarMeta(acc.name, acc.type);
                  const { integer, decimal } = formatCentsParts(acc.currentBalance);
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedAccountId(acc.id)}
                      className="flex items-center gap-[13px] w-full px-3 py-[11px] rounded-2xl text-left transition-colors"
                      style={
                        isSelected
                          ? {
                              background: "#f4f6fe",
                              border: "1.5px solid #d4ddf6",
                            }
                          : insufficient
                          ? {
                              background: "var(--bg-surface-2)",
                              border: "1.5px solid transparent",
                              opacity: 0.6,
                            }
                          : {
                              background: "transparent",
                              border: "1.5px solid transparent",
                            }
                      }
                    >
                      {/* Avatar */}
                      <span
                        className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0"
                        style={{
                          background: meta.bg,
                          color: meta.fg,
                        }}
                      >
                        {meta.icon ?? (
                          <span
                            className="font-extrabold"
                            style={{ fontSize: (meta.text?.length ?? 1) >= 2 ? 14 : 15 }}
                          >
                            {meta.text}
                          </span>
                        )}
                      </span>

                      {/* Nombre + tipo */}
                      <span className="flex-1 min-w-0">
                        <span
                          className="block text-[15px] font-bold truncate"
                          style={{ color: isSelected ? "#1a1a1e" : "var(--text-primary)" }}
                        >
                          {acc.name}
                        </span>
                        <span
                          className="block text-[12.5px] mt-px"
                          style={{ color: isSelected ? "#8a8a92" : "var(--text-muted)" }}
                        >
                          {typeLabel(acc.type)}
                        </span>
                      </span>

                      {/* Saldo y mensajes */}
                      <span className="text-right shrink-0">
                        <span
                          className="block text-[14.5px] font-bold tabular-nums"
                          style={{ color: isSelected ? "#1a1a1e" : insufficient ? "#ef4444" : "var(--text-primary)" }}
                        >
                          {integer}
                          <span
                            style={{
                              color: isSelected ? "#c9c9d0" : insufficient ? "#f87171" : "var(--text-placeholder)",
                              fontSize: 12,
                            }}
                          >
                            {decimal}
                          </span>
                        </span>
                        {insufficient && !isSelected && (
                          <span className="block text-[10px] text-red-500 font-medium mt-0.5">Fondos insuf.</span>
                        )}
                      </span>

                      {/* Check si está seleccionada */}
                      {isSelected && (
                        <span
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-1"
                          style={{ background: INDIGO, color: "#fff" }}
                        >
                          <Check size={15} />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Advertencia fondos insuficientes */}
          {insufficientFunds && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                El saldo ({formatCOP(selectedAccount?.currentBalance ?? 0)}) es menor al monto a pagar. El pago quedará en números negativos.
              </p>
            </div>
          )}
        </div>

        {/* Footer fijo con el botón */}
        <div className="p-[22px] border-t shrink-0" style={{ background: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}>
          <button
            onClick={handlePay}
            disabled={loading || !selectedAccountId || payAmount <= 0}
            className="w-full flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
            style={{
              height: 56,
              borderRadius: 16,
              background: "var(--text-primary)",
              color: "var(--bg-surface)",
              fontSize: 16,
              fontWeight: 700,
              boxShadow: "0 8px 20px rgba(20,20,30,0.24)",
            }}
          >
            {loading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <>
                Confirmar Pago de {formatCOP(payAmount)}
                <Wallet size={18} className="ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
