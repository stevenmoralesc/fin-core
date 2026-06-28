"use client";

/**
 * src/components/modals/TransactionModal.tsx
 * ─────────────────────────────────────────────────────────────
 * Modal / bottom-sheet "Nuevo movimiento". Sigue el handoff
 * design_handoff_nuevo_movimiento:
 *   - Grabber + header + cerrar X
 *   - Toggle Gasto / Ingreso (−/+ con knob deslizante de color)
 *   - Monto con tipografía split (entero grande + decimal muted) y
 *     cursor de acento
 *   - Categoría horizontal scrolleable (discos con emoji)
 *   - Fila Medio de pago + Fila Fecha (cards con icono · caption · valor)
 *   - Botón Guardar negro
 *
 * Cuando `initialType="TRANSFERENCIA"` el modal reutiliza el mismo
 * shell pero omite el toggle y la categoría y agrega la cuenta destino.
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useRef, useEffect } from "react";
import {
  X,
  CreditCard,
  Calendar,
  Check,
  ChevronRight,
  ArrowLeftRight,
  RefreshCw,
  Trash2,
} from "lucide-react";
import CalendarPicker from "@/components/ui/CalendarPicker";
import type {
  Account,
  CreditCard as CreditCardType,
  CategoriesByType,
} from "@/lib/types";
import { useRouter } from "next/navigation";
import AccountPickerSheet from "@/components/modals/AccountPickerSheet";

type TxType = "INGRESO" | "GASTO" | "TRANSFERENCIA";

interface ModalProps {
  accounts: Account[];
  creditCards: CreditCardType[];
  categories: CategoriesByType;
  onClose: () => void;
  onSuccess?: () => void;
  /** Si es "TRANSFERENCIA", el modal arranca en modo transferencia y
   * bloquea el toggle a Gasto/Ingreso. */
  initialType?: TxType;
  /** Si se pasa una transacción, el modal funciona en modo Edición */
  transaction?: any;
}

// ─── Helpers ──────────────────────────────────────────────────

const todayIso = () => {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
};

/** Formato visual de fecha "25 jun · Hoy". */
function formatDateLabel(iso: string): string {
  const date = new Date(iso + "T12:00:00");
  const pretty = date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  // diff vs hoy
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yest.getFullYear() &&
    date.getMonth() === yest.getMonth() &&
    date.getDate() === yest.getDate();
  const suffix = sameDay ? " · Hoy" : isYesterday ? " · Ayer" : "";
  return pretty + suffix;
}

/** Separa el monto formateado (es-CO) en entero "$1.234" y decimal ",00". */
function splitAmount(value: string): { integer: string; decimal: string } {
  if (!value) return { integer: "$0", decimal: "" };
  const [intPart, decPart] = value.split(",");
  return {
    integer: "$" + intPart,
    decimal: decPart !== undefined ? "," + decPart : "",
  };
}

// ─── Componente principal ─────────────────────────────────────

export default function TransactionModal({
  accounts,
  creditCards,
  categories,
  onClose,
  onSuccess,
  initialType,
  transaction,
}: ModalProps) {
  const router = useRouter();
  const isTransferOnly = initialType === "TRANSFERENCIA" || transaction?.type === "TRANSFERENCIA";

  const [form, setForm] = useState(() => {
    if (transaction) {
      const absValue = Math.abs(transaction.amount / 100);
      const [int, dec] = String(absValue).split(".");
      let formatted = parseInt(int, 10).toLocaleString("es-CO");
      if (dec !== undefined) formatted += "," + dec;
      return {
        type: transaction.type as TxType,
        category: transaction.category,
        amount: formatted,
        destinationAccount: transaction.destinationAccountId || "",
        paymentMethod: transaction.creditCardId
          ? `CREDIT_CARD:${transaction.creditCardId}`
          : transaction.accountId
          ? `ACCOUNT:${transaction.accountId}`
          : (accounts.length > 0 ? `ACCOUNT:${accounts[0].id}` : ""),
        installments: String(transaction.installments || 1),
        date: transaction.date.split("T")[0],
      };
    }
    return {
      type: (initialType ?? "GASTO") as TxType,
      category: "",
      amount: "",
      destinationAccount: "",
      paymentMethod: accounts.length > 0 ? `ACCOUNT:${accounts[0].id}` : "",
      installments: "1",
      date: todayIso(),
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pmOpen, setPmOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);

  // Auto-focus monto al abrir
  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  // ── Derivados ──────────────────────────────────────────────
  const isGasto = form.type === "GASTO";
  const isIngreso = form.type === "INGRESO";
  const accent = isIngreso ? "var(--success)" : "var(--danger)"; // gasto/transfer = rojo acento del cursor
  const categoriesForType = categories[form.type] ?? {};
  const flatCategories = Object.keys(categoriesForType);

  // Etiquetas legibles del medio de pago y cuenta destino
  const paymentLabel = (() => {
    if (!form.paymentMethod) return "Selecciona…";
    const [pmType, pmId] = form.paymentMethod.split(":");
    if (pmType === "ACCOUNT") {
      const acc = accounts.find((a) => a.id === pmId);
      return acc ? `${acc.name} · Débito` : "Selecciona…";
    }
    const cc = creditCards.find((c) => c.id === pmId);
    return cc ? `${cc.name} · Crédito` : "Selecciona…";
  })();
  const destLabel = (() => {
    if (!form.destinationAccount) return "Selecciona…";
    const acc = accounts.find((a) => a.id === form.destinationAccount);
    return acc ? acc.name : "Selecciona…";
  })();
  const originAccountId = form.paymentMethod.startsWith("ACCOUNT:")
    ? form.paymentMethod.split(":")[1]
    : "";

  // ── Handlers ───────────────────────────────────────────────
  function setType(t: "INGRESO" | "GASTO") {
    setForm((f) => {
      // Si cambio a INGRESO y el medio era TC, vuelvo a la primera cuenta.
      let pm = f.paymentMethod;
      if (t !== "GASTO" && pm.startsWith("CREDIT_CARD")) {
        pm = accounts.length > 0 ? `ACCOUNT:${accounts[0].id}` : "";
      }
      return { ...f, type: t, category: "", paymentMethod: pm };
    });
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9,]/g, "");
    const parts = raw.split(",");
    if (parts.length > 2) raw = parts[0] + "," + parts.slice(1).join("");
    const [integer, decimal] = raw.split(",");
    let formatted = integer
      ? parseInt(integer, 10).toLocaleString("es-CO")
      : "";
    if (raw.includes(",")) formatted += "," + (decimal || "");
    setForm((f) => ({ ...f, amount: formatted }));
  };

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!form.amount) {
      setError("Ingresa el monto.");
      return;
    }
    if (!isTransferOnly && !form.category) {
      setError("Elige una categoría.");
      return;
    }

    const [paymentMethodType, paymentMethodId] = form.paymentMethod.split(":");

    if (isTransferOnly) {
      if (!form.destinationAccount) {
        setError("Selecciona la cuenta destino");
        return;
      }
      if (form.destinationAccount === paymentMethodId) {
        setError("La cuenta destino debe ser distinta");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const url = transaction ? `/api/transactions/${transaction.id}` : "/api/transactions";
      const method = transaction ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          category: form.category,
          description: form.category, // la categoría queda como descripción por defecto
          amount: parseFloat(form.amount.replace(/\./g, "").replace(",", ".")),
          paymentMethodId,
          paymentMethodType,
          destinationAccountId: isTransferOnly
            ? form.destinationAccount
            : undefined,
          installments: parseInt(form.installments || "1"),
          date: form.date,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error desconocido");
      }
      router.refresh();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!transaction) return;
    setLoading(true);
    try {
      await fetch(`/api/transactions/${transaction.id}`, { method: "DELETE" });
      router.refresh();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
      setLoading(false);
    }
  }

  // ── Render: monto split ───────────────────────────────────
  const { integer: intPart, decimal: decPart } = splitAmount(form.amount);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-[392px] sm:rounded-[30px] rounded-t-[30px] overflow-hidden border"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          boxShadow: "0 12px 40px rgba(20,20,30,0.10)",
          fontFamily: "var(--font-hanken), system-ui, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-[22px] pt-[14px] pb-6">
          {/* Grabber */}
          <div
            className="mx-auto mb-[18px] w-10 h-1 rounded-full"
            style={{ background: "var(--border)" }}
          />

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h3
              className="text-[19px] font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {transaction 
                ? (isTransferOnly ? "Editar transferencia" : "Editar movimiento")
                : (isTransferOnly ? "Nueva transferencia" : "Nuevo movimiento")}
            </h3>
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

          {/* Switch Gasto / Ingreso (solo movimiento) */}
          {!isTransferOnly && (
            <div className="flex flex-col items-center gap-[7px] mb-6">
              <div
                className="relative w-[108px] h-10 rounded-full flex items-center p-1"
                style={{ background: "var(--bg-surface-3)" }}
              >
                {/* Knob */}
                <div
                  className="absolute top-1 w-12 h-8 rounded-full transition-all duration-250"
                  style={{
                    left: isGasto ? 4 : 56,
                    background: isGasto ? "var(--danger)" : "var(--success)",
                    boxShadow: isGasto
                      ? "0 3px 8px rgba(229,72,77,0.32)"
                      : "0 3px 8px rgba(52,211,153,0.32)",
                  }}
                />
                {/* Símbolos */}
                <button
                  type="button"
                  onClick={() => setType("GASTO")}
                  className="relative flex-1 flex items-center justify-center text-[22px] font-semibold leading-none"
                  style={{ color: isGasto ? "#fff" : "var(--text-placeholder)" }}
                  aria-label="Gasto"
                >
                  −
                </button>
                <button
                  type="button"
                  onClick={() => setType("INGRESO")}
                  className="relative flex-1 flex items-center justify-center text-[20px] font-semibold leading-none"
                  style={{ color: isIngreso ? "#fff" : "var(--text-placeholder)" }}
                  aria-label="Ingreso"
                >
                  +
                </button>
              </div>
              <span
                className="text-[13px] font-bold"
                style={{
                  color: isIngreso ? "var(--success)" : "var(--danger)",
                  letterSpacing: "0.01em",
                }}
              >
                {isIngreso ? "Ingreso" : "Gasto"}
              </span>
            </div>
          )}

          {/* Monto */}
          <div className="text-center mb-6">
            <p
              className="text-[11px] mb-1.5"
              style={{
                color: "var(--text-placeholder)",
                letterSpacing: "0.12em",
                fontFamily: "var(--font-jetbrains), monospace",
              }}
            >
              MONTO
            </p>
            {/* Display visual del monto (entero + decimal + cursor) */}
            <div
              className="relative inline-flex items-baseline justify-center font-bold tabular-nums leading-none"
              style={{
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
              }}
              onClick={() => amountRef.current?.focus()}
            >
              <span style={{ fontSize: 46 }}>{intPart}</span>
              <span
                aria-hidden
                className="amount-cursor"
                style={{
                  width: 2.5,
                  height: 42,
                  background: accent,
                  borderRadius: 2,
                  marginLeft: 4,
                  marginRight: 4,
                  alignSelf: "center",
                }}
              />
              <span style={{ fontSize: 26, color: "var(--text-placeholder)" }}>
                {decPart}
              </span>
            </div>
            {/* Input real invisible para captura nativa */}
            <input
              ref={amountRef}
              type="text"
              inputMode="decimal"
              value={form.amount}
              onChange={handleAmountChange}
              aria-label="Monto"
              className="sr-only"
              style={{ position: "absolute", left: -9999 }}
            />
            <style jsx>{`
              .amount-cursor {
                animation: amountBlink 1s steps(2, start) infinite;
              }
              @keyframes amountBlink {
                to {
                  visibility: hidden;
                }
              }
            `}</style>
          </div>

          {/* Categorías (solo movimiento) */}
          {!isTransferOnly && (
            <>
              <div className="flex items-center justify-between mb-3">
                <p
                  className="text-[13px] font-bold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Categoría
                </p>
              </div>
              {flatCategories.length === 0 ? (
                <p
                  className="text-xs mb-6"
                  style={{ color: "var(--text-muted)" }}
                >
                  Sin categorías para este tipo. Créalas en Categorías.
                </p>
              ) : (
                <div
                  className="flex gap-[18px] mb-6 overflow-x-auto cats-scroll pb-1"
                  style={{ scrollbarWidth: "none" }}
                >
                  {flatCategories.map((cat) => {
                    const meta = categoriesForType[cat]?.[0];
                    const selected = form.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, category: cat }))}
                        className="flex flex-col items-center gap-[7px] shrink-0 w-14"
                      >
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all"
                          style={{
                            background: selected
                              ? "var(--text-primary)"
                              : "var(--bg-surface-3)",
                            boxShadow: selected
                              ? "0 6px 14px rgba(20,20,30,0.24)"
                              : "none",
                          }}
                        >
                          <span style={{ filter: selected ? "none" : "grayscale(0)" }}>
                            {meta?.icon || "📂"}
                          </span>
                        </div>
                        <span
                          className="text-[12px] truncate max-w-full"
                          style={{
                            fontWeight: selected ? 700 : 600,
                            color: selected
                              ? "var(--text-primary)"
                              : "var(--text-muted)",
                          }}
                        >
                          {cat}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <style jsx>{`
                .cats-scroll::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
            </>
          )}

          {/* Filas: Medio de pago / Cuenta destino / Fecha */}
          <div className="flex flex-col gap-2.5 mb-[22px]">
            {/* Medio de pago (o "Cuenta origen" en transferencia) */}
            <SheetRow
              icon={<CreditCard size={18} />}
              caption={isTransferOnly ? "CUENTA ORIGEN" : "MEDIO DE PAGO"}
              value={paymentLabel}
              onClick={() => setPmOpen((o) => !o)}
            />
            {pmOpen && (
              <AccountPickerSheet
                title={isTransferOnly ? "Cuenta origen" : "Medio de pago"}
                accounts={[
                  ...accounts.map((acc) => ({
                    id: `ACCOUNT:${acc.id}`,
                    name: acc.name,
                    type: acc.type || "AHORROS",
                    currentBalance: (acc as any).currentBalance ?? 0,
                  })),
                  ...(isGasto && !isTransferOnly
                    ? creditCards.map((cc) => ({
                        id: `CREDIT_CARD:${cc.id}`,
                        name: cc.name,
                        type: "Crédito",
                        currentBalance: cc.totalLimit ?? 0,
                      }))
                    : []),
                ]}
                selectedId={form.paymentMethod}
                onSelect={(id) => {
                  setForm((f) => ({ ...f, paymentMethod: id }));
                  setPmOpen(false);
                }}
                onClose={() => setPmOpen(false)}
              />
            )}

            {/* Cuenta destino (solo transferencia) */}
            {isTransferOnly && (
              <>
                <SheetRow
                  icon={<ArrowLeftRight size={18} />}
                  caption="CUENTA DESTINO"
                  value={destLabel}
                  onClick={() => setDestOpen((o) => !o)}
                />
                {destOpen && (
                  <AccountPickerSheet
                    title="Cuenta destino"
                    accounts={accounts
                      .filter((acc) => acc.id !== originAccountId)
                      .map((acc) => ({
                        id: acc.id,
                        name: acc.name,
                        type: acc.type || "AHORROS",
                        currentBalance: (acc as any).currentBalance ?? 0,
                      }))}
                    selectedId={form.destinationAccount}
                    onSelect={(id) => {
                      setForm((f) => ({ ...f, destinationAccount: id }));
                      setDestOpen(false);
                    }}
                    onClose={() => setDestOpen(false)}
                  />
                )}
              </>
            )}

            {/* Cuotas (solo TC) */}
            {form.paymentMethod.startsWith("CREDIT_CARD") && !isTransferOnly && (
              <div
                className="flex items-center gap-3 px-[14px] py-3 rounded-[14px]"
                style={{ background: "var(--bg-surface-2)" }}
              >
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center border"
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span className="text-sm font-bold">N°</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[10px]"
                    style={{
                      color: "var(--text-placeholder)",
                      letterSpacing: "0.08em",
                      fontFamily: "var(--font-jetbrains), monospace",
                    }}
                  >
                    CUOTAS
                  </p>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={form.installments}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, installments: e.target.value }))
                    }
                    className="text-[14.5px] font-semibold bg-transparent outline-none w-16 mt-px"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>
              </div>
            )}

            {/* Fecha */}
            <SheetRow
              icon={<Calendar size={18} />}
              caption="FECHA"
              value={formatDateLabel(form.date)}
              onClick={() => setDateOpen(!dateOpen)}
            />
            {dateOpen && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 70,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.25)",
                  backdropFilter: "blur(2px)",
                }}
                onClick={(e) => { if (e.target === e.currentTarget) setDateOpen(false); }}
              >
                <CalendarPicker
                  value={form.date}
                  onChange={(iso) => {
                    setForm((f) => ({ ...f, date: iso }));
                    setDateOpen(false);
                  }}
                  onClose={() => setDateOpen(false)}
                />
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              className="text-xs rounded-lg px-3 py-2 mb-3"
              style={{
                background: "var(--danger-bg)",
                color: "var(--danger)",
                border: "1px solid var(--danger)",
              }}
            >
              {error}
            </div>
          )}

          {/* Guardar y Eliminar */}
          <div className="flex gap-3">
            {transaction && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("¿Estás seguro de que deseas eliminar este movimiento?")) {
                    handleDelete();
                  }
                }}
                disabled={loading}
                className="flex items-center justify-center transition-opacity disabled:opacity-70 px-4"
                style={{
                  height: 56,
                  borderRadius: 16,
                  background: "var(--danger-bg)",
                  color: "var(--danger)",
                }}
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2.5 transition-opacity disabled:opacity-70"
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
                  Guardar
                  <Check size={19} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SheetRow: fila del estilo Medio de pago / Fecha ──────────

function SheetRow({
  icon,
  caption,
  value,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  caption: string;
  value: string;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 px-[14px] py-3 rounded-[14px] text-left w-full transition-colors hover:opacity-90"
      style={{ background: "var(--bg-surface-2)" }}
    >
      <span
        className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 border"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-secondary)",
        }}
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span
          className="block text-[10px]"
          style={{
            color: "var(--text-placeholder)",
            letterSpacing: "0.08em",
            fontFamily: "var(--font-jetbrains), monospace",
          }}
        >
          {caption}
        </span>
        <span
          className="block text-[14.5px] font-semibold truncate mt-px"
          style={{ color: "var(--text-primary)" }}
        >
          {value}
        </span>
      </span>
      <ChevronRight
        size={18}
        style={{ color: "var(--text-placeholder)" }}
      />
      {children}
    </button>
  );
}
