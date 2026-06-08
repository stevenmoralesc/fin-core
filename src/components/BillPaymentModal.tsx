"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, Wallet, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Account, CreditCard } from "@/lib/types";

interface BillPaymentModalProps {
  card: CreditCard;
  billAmount: number; // monto de la factura del mes
  accounts: Account[];
  onClose: () => void;
}

interface AccountWithBalance extends Account {
  currentBalance: number;
}

function formatCOP(value: number): string {
  return "$" + Math.round(value).toLocaleString("es-CO");
}

function accountIcon(type: string) {
  switch (type) {
    case "EFECTIVO": return "💵";
    case "AHORROS":  return "🏦";
    case "CORRIENTE": return "🏧";
    default: return "💳";
  }
}

export default function BillPaymentModal({ card, billAmount, accounts, onClose }: BillPaymentModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [accountsWithBalance, setAccountsWithBalance] = useState<AccountWithBalance[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id ?? "");
  const [customAmount, setCustomAmount] = useState(formatCOP(billAmount).replace("$", "$"));
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  // Cargar saldos actuales de las cuentas
  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data: AccountWithBalance[]) => {
        setAccountsWithBalance(data);
        setLoadingBalances(false);
      })
      .catch(() => {
        // Si falla, usar las cuentas sin saldo
        setAccountsWithBalance(accounts.map(a => ({ ...a, currentBalance: a.initialBalance })));
        setLoadingBalances(false);
      });
  }, [accounts]);

  const selectedAccount = accountsWithBalance.find((a) => a.id === selectedAccountId);
  const payAmount = useCustomAmount
    ? Number(customAmount.replace(/\D/g, ""))
    : billAmount;

  const insufficientFunds = selectedAccount
    ? selectedAccount.currentBalance < payAmount
    : false;

  const formatCOPInput = (val: string) => {
    const num = val.replace(/\D/g, "");
    if (!num) return "";
    return "$" + parseInt(num, 10).toLocaleString("es-CO");
  };

  const handlePay = async () => {
    if (!selectedAccountId || payAmount <= 0) return;
    setLoading(true);

    try {
      const today = new Date().toISOString().split("T")[0];

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "GASTO",
          category: "Tarjetas de Crédito",
          subcategory: `Pago ${card.name}`,
          amount: payAmount,
          description: `Pago factura ${card.name} — ${new Date().toLocaleString("es-CO", { month: "long", year: "numeric" })}`,
          paymentMethodId: selectedAccountId,
          paymentMethodType: "ACCOUNT",
          date: today,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error desconocido");
      }

      router.refresh();
      onClose();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fecha de próximo corte
  const today = new Date();
  const closingDay = card.closingDay;
  const closingDate = new Date(today.getFullYear(), today.getMonth(), closingDay);
  if (closingDate < today) closingDate.setMonth(closingDate.getMonth() + 1);
  const daysUntilClosing = Math.ceil((closingDate.getTime() - today.getTime()) / 86400000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] w-full max-w-[440px] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Pagar Factura del Mes</h2>
            <p className="text-xs text-gray-400 mt-0.5">{card.name} · {card.bank}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Resumen de la factura */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Total cuotas del mes</span>
              <span className="text-xl font-bold text-gray-900">{formatCOP(billAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Próximo corte: día {card.closingDay}</span>
              <span className={`font-semibold ${daysUntilClosing <= 5 ? "text-red-500" : "text-gray-500"}`}>
                {daysUntilClosing === 0 ? "¡Hoy!" : `Faltan ${daysUntilClosing} días`}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Día de pago</span>
              <span className="font-semibold text-gray-700">Día {card.paymentDay} de cada mes</span>
            </div>
          </div>

          {/* Monto a pagar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Monto a Pagar
              </label>
              <button
                type="button"
                onClick={() => setUseCustomAmount(!useCustomAmount)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                {useCustomAmount ? "Usar total calculado" : "Monto personalizado"}
              </button>
            </div>
            {useCustomAmount ? (
              <input
                type="text"
                value={customAmount}
                onChange={(e) => setCustomAmount(formatCOPInput(e.target.value))}
                className="w-full border-b border-gray-200 py-2.5 text-gray-900 text-base font-bold focus:outline-none focus:border-gray-800 transition-colors bg-transparent"
                placeholder="$0"
              />
            ) : (
              <div className="py-2.5 border-b border-gray-100">
                <span className="text-base font-bold text-gray-900">{formatCOP(billAmount)}</span>
              </div>
            )}
          </div>

          {/* Selector de cuenta */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Pagar desde
            </label>
            <div className="space-y-2">
              {loadingBalances ? (
                <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
              ) : (
                accountsWithBalance.map((acc) => {
                  const isSelected = acc.id === selectedAccountId;
                  const insufficient = acc.currentBalance < payAmount;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                        isSelected
                          ? "border-gray-900 bg-gray-900 text-white"
                          : insufficient
                          ? "border-gray-100 bg-gray-50 opacity-60"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{accountIcon(acc.type)}</span>
                        <div>
                          <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-gray-800"}`}>
                            {acc.name}
                          </p>
                          <p className={`text-xs ${isSelected ? "text-gray-300" : "text-gray-400"}`}>
                            {acc.type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold tabular-nums ${isSelected ? "text-white" : insufficient ? "text-red-400" : "text-gray-800"}`}>
                          {formatCOP(acc.currentBalance)}
                        </p>
                        {insufficient && !isSelected && (
                          <p className="text-[10px] text-red-400 font-medium">Fondos insuficientes</p>
                        )}
                      </div>
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
                El saldo disponible ({formatCOP(selectedAccount?.currentBalance ?? 0)}) es menor al monto a pagar ({formatCOP(payAmount)}). El pago quedará en números negativos.
              </p>
            </div>
          )}

          {/* Botón */}
          <button
            onClick={handlePay}
            disabled={loading || !selectedAccountId || payAmount <= 0}
            className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <>
                <Wallet size={16} />
                Confirmar Pago de {formatCOP(payAmount)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
