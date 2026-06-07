"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, Wallet, PieChart, Settings, Bell } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Tarjetas", href: "/tarjetas", icon: CreditCard },
    { name: "Cuentas", href: "/cuentas", icon: Wallet },
    { name: "Presupuesto", href: "/presupuesto", icon: PieChart },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 shrink-0 py-6 px-4">
      {/* Brand */}
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center">
          <BarChart3 size={18} className="text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight text-gray-900">FinControl</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || (pathname?.startsWith(link.href) && link.href !== "/");
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              }`}
            >
              <Icon size={18} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Nav */}
      <div className="pt-4 border-t border-gray-100 space-y-1">
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
          <Bell size={18} />
          Notificaciones
        </button>
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors">
          <Settings size={18} />
          Configuración
        </button>
      </div>

      {/* User Profile */}
      <div className="mt-6 flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-inner">
          <span className="text-xs font-bold text-white">SV</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">Steve V.</p>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Pro Plan</p>
        </div>
      </div>
    </aside>
  );
}
