"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, Wallet, PieChart, Settings, Bell } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Tarjetas", href: "/tarjetas", icon: CreditCard },
    { name: "Cuentas", href: "/cuentas", icon: Wallet },
    { name: "Presupuesto", href: "/presupuesto", icon: PieChart },
  ];

  return (
    <aside
      className="hidden md:flex flex-col w-64 shrink-0 py-6 px-4 border-r"
      style={{
        background: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 px-2 mb-8">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "var(--accent)" }}
        >
          <BarChart3 size={18} style={{ color: "var(--accent-fg)" }} />
        </div>
        <span
          className="font-bold text-lg tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          FinControl
        </span>
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
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
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
            >
              <Icon size={18} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Nav */}
      <div
        className="pt-4 space-y-1 border-t"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <button
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{ color: "var(--sidebar-item-text)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sidebar-item-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Bell size={18} />
          Notificaciones
        </button>
        <button
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{ color: "var(--sidebar-item-text)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sidebar-item-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Settings size={18} />
          Configuración
        </button>
      </div>

      {/* User Profile + Theme Toggle */}
      <div className="mt-6 flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-inner shrink-0">
          <span className="text-xs font-bold text-white">SV</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>Steve V.</p>
          <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Pro Plan</p>
        </div>
        <ThemeToggle />
      </div>
    </aside>
  );
}
