"use client";

import { useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  ChevronRight,
  Banknote,
  CreditCard as CreditCardIcon,
  Settings,
  Landmark,
  Briefcase
} from "lucide-react";
import type { AccountWithStats } from "@/app/cuentas/page";
import { useRouter } from "next/navigation";
import AddAccountModal from "@/components/modals/AddAccountModal";
import EditAccountModal from "@/components/modals/EditAccountModal";
import { formatCents, formatCentsParts } from "@/lib/money";
import type { CategoriesByType } from "@/lib/types";

// ── Helpers ───────────
import TransactionList from "@/components/ui/TransactionList";
function formatCOP(v: number) {
  return formatCents(v);
}
function formatCOPShort(v: number) {
  return formatCOP(v);
}

const INDIGO = "#3b5bda";

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

interface AccountsViewProps {
  initialAccounts: AccountWithStats[];
  categories?: CategoriesByType;
}

export default function AccountsView({ initialAccounts, categories }: AccountsViewProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(initialAccounts[0]?.id ?? "");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const totalLiquidez = initialAccounts.reduce((s, a) => s + a.currentBalance, 0);
  const selectedAccount = initialAccounts.find((a) => a.id === selected);

  return (
    <>
      <div className="space-y-8 md:space-y-12">
        {/* ── Header Exaggerated Minimalism ── */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter" style={{ color: "var(--text-primary)" }}>
              Mis Cuentas
            </h1>
            <p className="text-lg md:text-xl font-medium tracking-tight" style={{ color: "var(--text-muted)" }}>
              Liquidez total:{" "}
              <span className={`font-bold ${totalLiquidez >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {formatCOPShort(totalLiquidez)}
              </span>
            </p>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-[16px] text-[15px] font-bold transition-all hover:scale-[1.02] shadow-sm shrink-0"
            style={{ background: "var(--text-primary)", color: "var(--bg-surface)" }}
          >
            <Plus size={18} strokeWidth={2.5} />
            Nueva Cuenta
          </button>
        </div>

        {/* ── Grid de Cuentas + Detalle ── */}
        {initialAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center rounded-[32px] border shadow-sm" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
            <div className="w-20 h-20 rounded-[24px] flex items-center justify-center mb-6" style={{ background: "var(--bg-surface-2)", color: "var(--text-muted)" }}>
              <Landmark size={40} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold mb-3 tracking-tight" style={{ color: "var(--text-primary)" }}>No hay cuentas registradas</h2>
            <p className="text-base max-w-sm mb-8 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Aún no tienes cuentas registradas. Agrega tu primera cuenta para empezar a trackear tu liquidez de forma centralizada.
            </p>
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-[16px] text-[15px] font-bold transition-all shadow-sm"
              style={{ background: "var(--text-primary)", color: "var(--bg-surface)" }}
            >
              <Plus size={18} strokeWidth={2.5} />
              Agregar primera cuenta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            
            {/* ── Lista lateral de cuentas ── */}
            <div className="space-y-3">
              <h3 className="text-[13px] font-bold tracking-widest uppercase mb-4" style={{ color: "var(--text-muted)" }}>
                Cuentas activas
              </h3>
              {initialAccounts.map((acc) => {
                const isSelected = acc.id === selected;
                const meta = avatarMeta(acc.name, acc.type);
                return (
                  <button
                    key={acc.id}
                    onClick={() => setSelected(acc.id)}
                    className="w-full text-left p-[18px] rounded-[24px] border transition-all duration-200 group"
                    style={isSelected
                      ? { 
                          background: "var(--bg-surface-2)", 
                          borderColor: "var(--border)", 
                          boxShadow: "0 8px 30px rgba(0,0,0,0.04)"
                        }
                      : { 
                          background: "transparent", 
                          borderColor: "transparent",
                        }
                    }
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105"
                        style={{ background: meta.bg, color: meta.fg }}
                      >
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[16px] font-bold truncate" style={{ color: "var(--text-primary)" }}>
                            {acc.name}
                          </p>
                          <ChevronRight 
                            size={16} 
                            style={{ 
                              color: isSelected ? "var(--text-primary)" : "var(--text-placeholder)",
                              transform: isSelected ? "translateX(2px)" : "none",
                              transition: "transform 0.2s"
                            }} 
                          />
                        </div>
                        <p className="text-[12px] font-semibold mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {acc.type === "AHORROS" ? "Ahorros" : acc.type === "EFECTIVO" ? "Efectivo" : acc.type === "CORRIENTE" ? "Corriente" : acc.type}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: isSelected ? "var(--border-subtle)" : "transparent" }}>
                      <p className="text-[22px] font-extrabold tabular-nums tracking-tight" style={{ color: acc.currentBalance < 0 ? "#ef4444" : "var(--text-primary)" }}>
                        {(() => {
                          const { integer, decimal } = formatCentsParts(acc.currentBalance);
                          return (
                            <>
                              {integer}
                              <span style={{ fontSize: "14px", color: "var(--text-placeholder)", marginLeft: "2px" }}>{decimal}</span>
                            </>
                          );
                        })()}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ── Panel de detalle ── */}
            {selectedAccount && (
              <div className="lg:col-span-2 space-y-6">
                
                {/* Header de la cuenta seleccionada */}
                <div 
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[32px] border shadow-sm backdrop-blur-md"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-center gap-5">
                    {(() => {
                      const meta = avatarMeta(selectedAccount.name, selectedAccount.type);
                      return (
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                          style={{ background: meta.bg, color: meta.fg }}
                        >
                          {meta.icon}
                        </div>
                      );
                    })()}
                    <div>
                      <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
                        {selectedAccount.name}
                      </h2>
                      <p className="text-[13px] font-medium mt-1" style={{ color: "var(--text-muted)" }}>
                        {selectedAccount.type} · Moneda: {selectedAccount.currency}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[14px] text-[13px] font-bold transition-colors border shadow-sm"
                    style={{ background: "var(--bg-surface-2)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                  >
                    <Settings size={15} strokeWidth={2.5} style={{ color: "var(--text-muted)" }} />
                    Ajustes
                  </button>
                </div>

                {/* KPIs de la cuenta (Bento Box style) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      label: "Saldo Actual",
                      cents: selectedAccount.currentBalance,
                      color: selectedAccount.currentBalance >= 0 ? "var(--text-primary)" : "#ef4444",
                    },
                    {
                      label: "Ingresos (Histórico)",
                      cents: selectedAccount.totalIngresos,
                      color: "var(--text-primary)",
                    },
                    {
                      label: "Gastos (Histórico)",
                      cents: selectedAccount.totalGastos,
                      color: "var(--text-primary)",
                    },
                  ].map((kpi, i) => (
                    <div 
                      key={kpi.label} 
                      className="p-5 rounded-[24px] border shadow-sm flex flex-col justify-between"
                      style={{ 
                        background: i === 0 ? "var(--bg-surface-2)" : "var(--bg-surface)", 
                        borderColor: i === 0 ? "var(--border)" : "var(--border-subtle)",
                        minHeight: "120px"
                      }}
                    >
                      <p className="text-[12px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                        {kpi.label}
                      </p>
                      <p className="text-2xl font-extrabold mt-3 tabular-nums tracking-tight" style={{ color: kpi.color }}>
                        {(() => {
                          const { integer, decimal } = formatCentsParts(kpi.cents);
                          return (
                            <>
                              {integer}
                              <span style={{ fontSize: "14px", color: "var(--text-placeholder)", marginLeft: "2px" }}>{decimal}</span>
                            </>
                          );
                        })()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Movimientos recientes */}
                <div className="rounded-[32px] border overflow-hidden shadow-sm" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between px-7 py-6 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    <div>
                      <h3 className="text-lg font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Últimos Movimientos</h3>
                    </div>
                  </div>

                  {selectedAccount.recentTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--bg-surface-2)", color: "var(--text-muted)" }}>
                        <Wallet size={24} strokeWidth={1.5} />
                      </div>
                      <p className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>Sin transacciones</p>
                      <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>Aún no hay actividad registrada en esta cuenta.</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      <TransactionList transactions={selectedAccount.recentTransactions} categories={categories} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {addModalOpen && (
        <AddAccountModal onClose={() => { setAddModalOpen(false); router.refresh(); }} />
      )}
      {editModalOpen && selectedAccount && (
        <EditAccountModal account={selectedAccount} onClose={() => { setEditModalOpen(false); router.refresh(); }} />
      )}
    </>
  );
}
