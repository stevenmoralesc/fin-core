"use client";

import { useState } from "react";
import { X, RefreshCw, Trash2, Settings } from "lucide-react";
import type { AccountWithStats } from "@/app/cuentas/page";
import { fromCents } from "@/lib/money";

interface EditAccountModalProps {
  account: AccountWithStats;
  onClose: () => void;
}

export default function EditAccountModal({ account, onClose }: EditAccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [form, setForm] = useState({
    name: account.name,
    type: account.type as "EFECTIVO" | "AHORROS" | "CORRIENTE",
    initialBalance: fromCents(account.initialBalance).toString(),
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          initialBalance: Number(form.initialBalance),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al actualizar");
      }
      onClose();
    } catch (err) {
      alert("Error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta cuenta? Esto no se puede deshacer y solo es posible si no hay transacciones asociadas.")) return;
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al eliminar");
      }
      onClose();
    } catch (err) {
      alert("Error: " + (err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  const inputClass =
    "w-full border-b py-2.5 text-sm focus:outline-none transition-colors bg-transparent";
  const labelClass =
    "block text-[10px] leading-none font-bold uppercase tracking-wide mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div 
        className="rounded-[24px] w-full max-w-[400px] shadow-2xl overflow-hidden border"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Settings size={20} />
            Editar Cuenta
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-surface-2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-5">
          {/* Nombre */}
          <div>
            <label className={labelClass} style={{ color: "var(--text-muted)" }}>Nombre de la Cuenta</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Bancolombia Ahorros"
              className={inputClass}
              style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
              required
            />
          </div>

          {/* Tipo */}
          <div>
            <label className={labelClass} style={{ color: "var(--text-muted)" }}>Tipo de Cuenta</label>
            <div className="flex gap-2 mt-1.5">
              {(["EFECTIVO", "AHORROS", "CORRIENTE"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors border"
                  style={form.type === t 
                    ? { background: "var(--accent)", color: "var(--accent-fg)", borderColor: "var(--accent)" }
                    : { background: "transparent", color: "var(--text-muted)", borderColor: "var(--border)" }
                  }
                >
                  {t === "EFECTIVO" ? "💵 Efectivo" : t === "AHORROS" ? "🏦 Ahorros" : "🏧 Corriente"}
                </button>
              ))}
            </div>
          </div>

          {/* Saldo Inicial */}
          <div>
            <label className={labelClass} style={{ color: "var(--text-muted)" }}>Saldo Inicial</label>
            <input
              type="number"
              step="0.01"
              value={form.initialBalance}
              onChange={(e) => setForm((f) => ({ ...f, initialBalance: e.target.value }))}
              placeholder="$0"
              className={inputClass}
              style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
              required
            />
            <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              El saldo que tenías en esta cuenta antes de empezar a trackear.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              disabled={loading || deleting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-70"
              style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : "Guardar Cambios"}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || deleting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm transition-all border disabled:opacity-70"
              style={{ background: "var(--bg-surface)", color: "var(--danger)", borderColor: "var(--border)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-surface-2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-surface)"}
            >
              {deleting ? <RefreshCw size={18} className="animate-spin" /> : <><Trash2 size={16} /> Eliminar Cuenta</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
