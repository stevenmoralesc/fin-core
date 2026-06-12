/**
 * app/page.tsx — Server Component
 * Fetcha datos directamente de la DB en el servidor
 * y los pasa al Dashboard (Client Component) como props.
 */

import { db } from "@/lib/db";
import Dashboard from "@/components/dashboard/Dashboard";
import type { DashboardSummary, Account, CreditCard, SystemConfig } from "@/lib/types";

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

function getCategories(): Record<string, { suggestedBudget: number }[]> {
  const rows = db
    .prepare(
      `SELECT category, suggestedBudget FROM sys_config ORDER BY category`
    )
    .all() as SystemConfig[];

  const grouped: Record<string, { suggestedBudget: number }[]> = {};
  for (const row of rows) {
    if (!grouped[row.category]) grouped[row.category] = [];
    grouped[row.category].push({
      suggestedBudget: row.suggestedBudget,
    });
  }
  return grouped;
}

// Datos hidratados desde cliente (API Router)

export default async function HomePage() {
  const categories = await Promise.resolve(
    (() => {
      const rows = db
        .prepare(`SELECT category, suggestedBudget, transactionType FROM sys_config ORDER BY transactionType, category`)
        .all() as import("@/lib/types").SystemConfig[];
      const result: import("@/lib/types").CategoriesByType = { GASTO: {}, INGRESO: {}, TRANSFERENCIA: {} };
      for (const row of rows) {
        const t = row.transactionType ?? "GASTO";
        if (!result[t][row.category]) result[t][row.category] = [];
        result[t][row.category].push({ suggestedBudget: row.suggestedBudget });
      }
      return result;
    })()
  );

  const creditCards = getCreditCards();

  return <Dashboard categories={categories} creditCards={creditCards} />;
}
