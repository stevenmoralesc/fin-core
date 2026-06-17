"use client";

/**
 * src/components/ui/Feedback.tsx
 * ─────────────────────────────────────────────────────────────
 * Reemplaza alert()/confirm() nativos por toasts y un diálogo de
 * confirmación propios, temáticos (claro/oscuro).
 *
 *   const { toast, confirm } = useFeedback();
 *   toast("error", "Algo falló");
 *   if (await confirm({ title: "¿Eliminar?", danger: true })) { ... }
 * ─────────────────────────────────────────────────────────────
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface FeedbackContextValue {
  toast: (kind: ToastKind, message: string) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback debe usarse dentro de <FeedbackProvider>");
  return ctx;
}

const TOAST_META: Record<ToastKind, { color: string; bg: string; icon: typeof Info }> = {
  success: { color: "var(--success)", bg: "var(--success-bg)", icon: CheckCircle2 },
  error: { color: "var(--danger)", bg: "var(--danger-bg)", icon: AlertTriangle },
  info: { color: "var(--info)", bg: "var(--info-bg)", icon: Info },
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    opts: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const toast = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, kind, message }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setConfirmState({ opts, resolve })),
    []
  );

  const resolveConfirm = (value: boolean) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  };

  const co = confirmState?.opts;

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      {/* ── Toasts ─────────────────────────────────────────── */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[320px] max-w-[calc(100vw-2.5rem)]">
        {toasts.map((t) => {
          const meta = TOAST_META[t.kind];
          const Icon = meta.icon;
          return (
            <div
              key={t.id}
              className="flex items-start gap-3 rounded-xl border px-4 py-3 animate-in fade-in slide-in-from-bottom-2"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}
              role="status"
            >
              <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
                <Icon size={15} style={{ color: meta.color }} />
              </span>
              <p className="flex-1 text-sm font-medium leading-snug pt-0.5" style={{ color: "var(--text-primary)" }}>
                {t.message}
              </p>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-md p-0.5 hover:bg-surface-2"
                style={{ color: "var(--text-muted)" }}
                aria-label="Cerrar"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Diálogo de confirmación ────────────────────────── */}
      {co && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
          <div className="rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: co.danger ? "var(--danger-bg)" : "var(--info-bg)" }}>
              <AlertTriangle size={22} style={{ color: co.danger ? "var(--danger)" : "var(--info)" }} />
            </div>
            <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>{co.title}</h3>
            {co.message && <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>{co.message}</p>}
            <div className={`flex gap-3 ${co.message ? "" : "mt-5"}`}>
              <button
                onClick={() => resolveConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold hover:bg-surface-2"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                {co.cancelText ?? "Cancelar"}
              </button>
              <button
                onClick={() => resolveConfirm(true)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
                style={{ background: co.danger ? "var(--danger)" : "var(--accent)", color: co.danger ? "#fff" : "var(--accent-fg)" }}
              >
                {co.confirmText ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
