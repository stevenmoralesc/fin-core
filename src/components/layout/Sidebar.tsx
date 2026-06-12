"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, Wallet, PieChart, Settings, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const links = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Tarjetas", href: "/tarjetas", icon: CreditCard },
    { name: "Cuentas", href: "/cuentas", icon: Wallet },
    { name: "Presupuesto", href: "/presupuesto", icon: PieChart },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 py-6 px-4 border-r transition-all duration-300 relative ${
        isCollapsed ? "w-20" : "w-64"
      }`}
      style={{
        background: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
      }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 w-6 h-6 rounded-full border flex items-center justify-center bg-surface text-secondary hover:text-primary shadow-sm z-50 transition-colors"
        style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Brand */}
      <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2 px-2"} mb-8`}>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--accent)" }}
        >
          <BarChart3 size={18} style={{ color: "var(--accent-fg)" }} />
        </div>
        {!isCollapsed && (
          <span
            className="font-bold text-lg tracking-tight truncate"
            style={{ color: "var(--text-primary)" }}
          >
            FinControl
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            pathname === link.href ||
            (pathname?.startsWith(link.href) && link.href !== "/");
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isCollapsed ? "justify-center px-0" : "gap-3 px-3"
              }`}
              style={{
                background: active ? "var(--sidebar-item-active-bg)" : "transparent",
                color: active
                  ? "var(--sidebar-item-active-text)"
                  : "var(--sidebar-item-text)",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "var(--sidebar-item-hover)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
              title={isCollapsed ? link.name : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!isCollapsed && <span className="truncate">{link.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Nav */}
      <div
        className={`pt-4 space-y-1 border-t ${isCollapsed ? "flex flex-col items-center" : ""}`}
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <button
          className={`flex items-center w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
            isCollapsed ? "justify-center px-0" : "gap-3 px-3"
          }`}
          style={{ color: "var(--sidebar-item-text)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sidebar-item-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          title={isCollapsed ? "Notificaciones" : undefined}
        >
          <Bell size={18} className="shrink-0" />
          {!isCollapsed && <span className="truncate">Notificaciones</span>}
        </button>
        <button
          className={`flex items-center w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
            isCollapsed ? "justify-center px-0" : "gap-3 px-3"
          }`}
          style={{ color: "var(--sidebar-item-text)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sidebar-item-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          title={isCollapsed ? "Configuración" : undefined}
        >
          <Settings size={18} className="shrink-0" />
          {!isCollapsed && <span className="truncate">Configuración</span>}
        </button>
      </div>

      {/* User Profile + Theme Toggle */}
      <div className={`mt-6 flex items-center ${isCollapsed ? "flex-col justify-center gap-4" : "gap-3 px-2"}`}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-inner shrink-0">
          <span className="text-xs font-bold text-white">SV</span>
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>Steve V.</p>
            <p className="text-[10px] leading-none font-medium uppercase tracking-wide truncate" style={{ color: "var(--text-muted)" }}>Pro Plan</p>
          </div>
        )}
        <div className={isCollapsed ? "mt-2" : ""}>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
