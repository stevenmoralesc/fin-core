import { db } from "@/lib/db";
import AccountsView from "@/components/views/AccountsView";
import type { Account, Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export interface AccountWithStats extends Account {
  currentBalance: number;
  totalIngresos: number;
  totalGastos: number;
  recentTransactions: Pick<Transaction, "id" | "date" | "type" | "amount" | "category" | "description">[];
}

function getAccountsWithStats(): AccountWithStats[] {
  const accounts = db
    .prepare(
      `SELECT id, name, type, initialBalance, currency, status, createdAt, updatedAt
       FROM dim_cuentas WHERE status = 'ACTIVA' ORDER BY type, name`
    )
    .all() as Account[];

  return accounts.map((acc) => {
    const balanceRow = db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN type = 'INGRESO' THEN amount ELSE 0 END), 0) AS totalIngresos,
           COALESCE(SUM(CASE WHEN type = 'GASTO'   THEN amount ELSE 0 END), 0) AS totalGastos
         FROM fact_transacciones
         WHERE accountId = ?`
      )
      .get(acc.id) as { totalIngresos: number; totalGastos: number };

    const recentTransactions = db
      .prepare(
        `SELECT id, date, type, amount, category, description
         FROM fact_transacciones
         WHERE accountId = ?
         ORDER BY date DESC
         LIMIT 8`
      )
      .all(acc.id) as AccountWithStats["recentTransactions"];

    const currentBalance =
      acc.initialBalance + balanceRow.totalIngresos - balanceRow.totalGastos;

    return {
      ...acc,
      currentBalance,
      totalIngresos: balanceRow.totalIngresos,
      totalGastos: balanceRow.totalGastos,
      recentTransactions,
    };
  });
}

export default async function CuentasPage() {
  const accounts = await Promise.resolve(getAccountsWithStats());

  return <AccountsView initialAccounts={accounts} />;
}
