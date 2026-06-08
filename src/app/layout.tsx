import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { db } from "@/lib/db";
import type { Account, CreditCard, SystemConfig } from "@/lib/types";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FinControl — Sistema de Control Financiero Personal",
  description:
    "Gestiona tu liquidez, cupos de tarjeta de crédito y gastos corrientes en un solo lugar.",
};

export const dynamic = "force-dynamic";

function getAccounts(): Account[] {
  return db
    .prepare(
      `SELECT id, name, type, initialBalance, currency, status, createdAt, updatedAt
       FROM dim_cuentas WHERE status = 'ACTIVA' ORDER BY type, name`
    )
    .all() as Account[];
}

function getCreditCards(): CreditCard[] {
  return db
    .prepare(
      `SELECT id, name, bank, totalLimit, closingDay, paymentDay, createdAt, updatedAt
       FROM dim_tarjetas_credito ORDER BY name`
    )
    .all() as CreditCard[];
}

function getCategories(): import("@/lib/types").CategoriesByType {
  const rows = db
    .prepare(
      `SELECT category, subcategory, suggestedBudget, transactionType
       FROM sys_config ORDER BY transactionType, category, subcategory`
    )
    .all() as import("@/lib/types").SystemConfig[];

  const result: import("@/lib/types").CategoriesByType = {
    GASTO: {},
    INGRESO: {},
    TRANSFERENCIA: {},
  };

  for (const row of rows) {
    const type = row.transactionType ?? "GASTO";
    if (!result[type]) result[type as keyof typeof result] = {};
    if (!result[type][row.category]) result[type][row.category] = [];
    result[type][row.category].push({
      subcategory: row.subcategory,
      suggestedBudget: row.suggestedBudget,
    });
  }
  return result;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [accounts, creditCards, categories] = await Promise.all([
    Promise.resolve(getAccounts()),
    Promise.resolve(getCreditCards()),
    Promise.resolve(getCategories()),
  ]);

  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen bg-[#f9fafb] font-sans antialiased overflow-hidden">
        <div className="flex h-screen w-screen overflow-hidden bg-[#f9fafb]">
          <Sidebar />
          <main className="flex-1 h-full overflow-y-auto p-6 md:p-10 flex flex-col gap-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
