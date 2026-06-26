"use client";

/**
 * src/components/modals/TransferModal.tsx
 * ─────────────────────────────────────────────────────────────
 * Modal / bottom-sheet "Nueva transferencia". Sigue el handoff
 * design_handoff_transferencia:
 *   - Par de tarjetas origen (navy) / destino (light) con swap central
 *   - Monto split-decimal con cursor índigo parpadeante
 *   - Chips de monto rápido (% del saldo origen + "Todo")
 *   - Fila Fecha
 *   - Botón Transferir (navy)
 *
 * Acento de la vista: índigo (#3b5bda) — neutro, no rojo/verde,
 * porque la transferencia interna no es ni gasto ni ingreso.
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useRef, useEffect } from "react";
import {
  X,
  CreditCard,
  PiggyBank,
  Banknote,
  ArrowLeftRight,
  Calendar,
  ChevronRight,
  Check,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCents, toCents } from "@/lib/money";
import AccountPickerSheet from "@/components/modals/AccountPickerSheet";
import CalendarPicker from "@/components/ui/CalendarPicker";

// ─── Tipos locales ────────────────────────────────────────────

interface AccountWithBalance {
  id: string;
  name: string;
  type: string; // EFECTIVO | AHORROS | CORRIENTE
  currency: string;
  currentBalance: number; // en centavos
}

interface Props {
  accounts: AccountWithBalance[];
  onClose: () => void;
  onSuccess?: () => void;
}

// Constantes de diseño
const NAVY = "#14182a";
const INDIGO = "#3b5bda";

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

function formatDateLabel(iso: string): string {
  const date = new Date(iso + "T12:00:00");
  const pretty = date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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

/** Icono por tipo de cuenta (estimado). */
function AccountIcon({ type, size = 17 }: { type: string; size?: number }) {
  if (type === "AHORROS") return <PiggyBank size={size} />;
  if (type === "EFECTIVO") return <Banknote size={size} />;
  return <CreditCard size={size} />; // CORRIENTE u otros
}

/** Etiqueta de cuenta visible: "Nombre · Tipo". */
function accountLabel(a: AccountWithBalance): string {
  const typeShort =
    a.type === "AHORROS"
      ? "Ahorros"
      : a.type === "EFECTIVO"
      ? "Efectivo"
      : a.type === "CORRIENTE"
      ? "Corriente"
      : a.type;
  return `${a.name} · ${typeShort}`;
}

/** Separa el monto formateado en entero y decimal. */
function splitAmount(value: string): { integer: string; decimal: string } {
  if (!value) return { integer: "$0", decimal: ",00" };
  const [intPart, decPart] = value.split(",");
  return {
    integer: "$" + intPart,
    decimal: decPart !== undefined ? "," + (decPart || "00").padEnd(2, "0") : ",00",
  };
}

// ─── Componente ───────────────────────────────────────────────

export default function TransferModal({ accounts, onClose, onSuccess }: Props) {
  const router = useRouter();

  // Si hay menos de 2 cuentas no se puede transferir; pero asumimos que
  // el botón de Transferencia no se ofreció en ese caso. Aún así, evitamos
  // crashes accediendo con índices seguros.
  const [originId, setOriginId] = useState<string>(accounts[0]?.id ?? "");
  const [destinationId, setDestinationId] = useState<string>(
    accounts[1]?.id ?? ""
  );
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  /** Picker abierto: "origin" | "destination" | null */
  const [pickerSide, setPickerSide] = useState<"origin" | "destination" | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const origin = accounts.find((a) => a.id === originId);
  const destination = accounts.find((a) => a.id === destinationId);

  // ── Handlers ───────────────────────────────────────────────
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9,]/g, "");
    const parts = raw.split(",");
    if (parts.length > 2) raw = parts[0] + "," + parts.slice(1).join("");
    const [int, dec] = raw.split(",");
    let formatted = int ? parseInt(int, 10).toLocaleString("es-CO") : "";
    if (raw.includes(",")) formatted += "," + (dec || "");
    setAmount(formatted);
  };

  const handleSwap = () => {
    if (!origin || !destination) return;
    setOriginId(destination.id);
    setDestinationId(origin.id);
  };

  async function handleSubmit() {
    if (!origin || !destination) {
      setError("Selecciona cuentas válidas");
      return;
    }
    if (origin.id === destination.id) {
      setError("Origen y destino deben ser distintos");
      return;
    }
    const amountNum = parseFloat(
      amount.replace(/\./g, "").replace(",", ".")
    );
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError("Ingresa un monto válido");
      return;
    }
    if (toCents(amountNum) > origin.currentBalance) {
      setError("El monto supera el saldo de la cuenta origen");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "TRANSFERENCIA",
          category: "Transferencia",
          description: `Transferencia ${origin.name} → ${destination.name}`,
          amount: amountNum,
          paymentMethodId: origin.id,
          paymentMethodType: "ACCOUNT",
          destinationAccountId: destination.id,
          date,
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
      setError(err instanceof Error ? err.message : "Error al transferir");
    } finally {
      setLoading(false);
    }
  }

  const { integer: intPart, decimal: decPart } = splitAmount(amount);

  // ── Validación visual del botón ──
  const amountCents = (() => {
    const n = parseFloat(amount.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? toCents(n) : 0;
  })();
  const canSubmit =
    !!origin &&
    !!destination &&
    origin.id !== destination.id &&
    amountCents > 0 &&
    amountCents <= (origin?.currentBalance ?? 0);

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
          <div className="flex items-center justify-between mb-[22px]">
            <h3
              className="text-[19px] font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Nueva transferencia
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

          {/* Par de tarjetas origen/destino + swap */}
          <div className="relative flex gap-2.5 mb-6">
            {/* Tarjeta ORIGEN (navy) */}
            <button
              type="button"
              onClick={() => setPickerSide("origin")}
              className="flex-1 min-w-0 text-left p-[15px] pb-[17px] rounded-[18px]"
              style={{ background: NAVY, color: "#fff" }}
            >
              <div className="flex items-start justify-between mb-[18px]">
                <span
                  className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.12)" }}
                >
                  <AccountIcon type={origin?.type ?? "CORRIENTE"} />
                </span>
                <span
                  className="text-[9px] mt-1"
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    letterSpacing: "0.1em",
                    fontFamily: "var(--font-jetbrains), monospace",
                  }}
                >
                  DESDE
                </span>
              </div>
              <p className="text-[14.5px] font-bold truncate">
                {origin ? accountLabel(origin) : "Selecciona"}
              </p>
              <p
                className="text-[12px] tabular-nums mt-0.5"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {origin ? formatCents(origin.currentBalance) : "$0,00"}
              </p>
            </button>

            {/* Tarjeta DESTINO (light) */}
            <button
              type="button"
              onClick={() => setPickerSide("destination")}
              className="flex-1 min-w-0 text-left p-[15px] pb-[17px] rounded-[18px] border"
              style={{
                background: "var(--bg-surface-2)",
                borderColor: "var(--border-subtle)",
                borderWidth: 1.5,
              }}
            >
              <div className="flex items-start justify-between mb-[18px]">
                <span
                  className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center border"
                  style={{
                    background: "var(--bg-surface)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <AccountIcon type={destination?.type ?? "AHORROS"} />
                </span>
                <span
                  className="text-[9px] mt-1"
                  style={{
                    color: "var(--text-placeholder)",
                    letterSpacing: "0.1em",
                    fontFamily: "var(--font-jetbrains), monospace",
                  }}
                >
                  HACIA
                </span>
              </div>
              <p
                className="text-[14.5px] font-bold truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {destination ? accountLabel(destination) : "Selecciona"}
              </p>
              <p
                className="text-[12px] tabular-nums mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {destination ? formatCents(destination.currentBalance) : "$0,00"}
              </p>
            </button>

            {/* Botón swap centrado sobre la unión */}
            <button
              type="button"
              onClick={handleSwap}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[38px] h-[38px] rounded-full flex items-center justify-center border transition-transform active:rotate-180"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
                borderWidth: 1.5,
                boxShadow: "0 2px 10px rgba(20,20,30,0.18)",
                color: INDIGO,
              }}
              aria-label="Intercambiar origen y destino"
            >
              <ArrowLeftRight size={17} />
            </button>
          </div>

          {/* Monto */}
          <div className="text-center mb-[18px]">
            <p
              className="text-[11px] mb-1.5"
              style={{
                color: "var(--text-placeholder)",
                letterSpacing: "0.12em",
                fontFamily: "var(--font-jetbrains), monospace",
              }}
            >
              MONTO A TRANSFERIR
            </p>
            <div
              className="relative inline-flex items-baseline justify-center font-bold tabular-nums leading-none"
              style={{
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
              }}
              onClick={() => amountRef.current?.focus()}
            >
              <span style={{ fontSize: 44 }}>{intPart}</span>
              <span style={{ fontSize: 25, color: "var(--text-placeholder)" }}>
                {decPart}
              </span>
              <span
                aria-hidden
                className="amount-cursor"
                style={{
                  width: 2.5,
                  height: 40,
                  background: INDIGO,
                  borderRadius: 2,
                  marginLeft: 4,
                  alignSelf: "center",
                }}
              />
            </div>
            <input
              ref={amountRef}
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              aria-label="Monto"
              className="sr-only"
              style={{ position: "absolute", left: -9999 }}
            />
            <style jsx>{`
              .amount-cursor {
                animation: amountBlink 1.1s steps(2, start) infinite;
              }
              @keyframes amountBlink {
                to {
                  visibility: hidden;
                }
              }
            `}</style>
          </div>

          {/* Fecha */}
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="flex items-center gap-3 w-full px-[14px] py-3 rounded-[14px] mb-[22px] text-left"
            style={{ background: "var(--bg-surface-2)" }}
          >
            <span
              className="w-9 h-9 rounded-[10px] flex items-center justify-center border"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              <Calendar size={18} />
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
                FECHA
              </span>
              <span
                className="block text-[14.5px] font-semibold mt-px"
                style={{ color: "var(--text-primary)" }}
              >
                {formatDateLabel(date)}
              </span>
            </span>
            <ChevronRight size={18} style={{ color: "var(--text-placeholder)" }} />
          </button>
          {calendarOpen && (
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
              onClick={(e) => { if (e.target === e.currentTarget) setCalendarOpen(false); }}
            >
              <CalendarPicker
                value={date}
                onChange={(iso) => {
                  setDate(iso);
                  setCalendarOpen(false);
                }}
                onClose={() => setCalendarOpen(false)}
              />
            </div>
          )}

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

          {/* Botón Transferir (navy) */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            className="w-full flex items-center justify-center gap-2.5 transition-opacity disabled:opacity-50"
            style={{
              height: 56,
              borderRadius: 16,
              background: NAVY,
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              boxShadow: "0 8px 20px rgba(20,24,42,0.26)",
            }}
          >
            {loading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <>
                Transferir
                <Check size={19} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom-sheet de selección de cuenta */}
      {pickerSide && (
        <AccountPickerSheet
          accounts={accounts}
          selectedId={pickerSide === "origin" ? originId : destinationId}
          title={pickerSide === "origin" ? "Cuenta de origen" : "Cuenta destino"}
          onClose={() => setPickerSide(null)}
          onSelect={(id) => {
            // Regla: origen ≠ destino. Si el usuario elige una cuenta
            // ya usada del otro lado, hacemos swap automático.
            if (pickerSide === "origin") {
              if (id === destinationId) {
                setDestinationId(originId);
              }
              setOriginId(id);
            } else {
              if (id === originId) {
                setOriginId(destinationId);
              }
              setDestinationId(id);
            }
            setPickerSide(null);
          }}
        />
      )}
    </div>
  );
}
