"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import TransactionModal from "@/components/modals/TransactionModal";
import type { Account, CreditCard, CategoriesByType } from "@/lib/types";

interface HeaderProps {
  accounts: Account[];
  creditCards: CreditCard[];
  categories: CategoriesByType;
}

export default function Header({ accounts, creditCards, categories }: HeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const pathname = usePathname();

  let title = "Dashboard";
  if (pathname?.startsWith("/tarjetas")) title = "Tarjetas de Crédito";
  if (pathname?.startsWith("/cuentas")) title = "Cuentas";
  if (pathname?.startsWith("/presupuesto")) title = "Presupuesto";

  const today = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <header className="bg-surface border-b border-subtle px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-bold text-primary">{title}</h1>
          <p className="text-xs text-muted mt-0.5 capitalize">{today}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <span className="text-lg leading-none">+</span> Nueva Transacción
          </button>
        </div>
      </header>

      {modalOpen && (
        <TransactionModal
          accounts={accounts}
          creditCards={creditCards}
          categories={categories}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
