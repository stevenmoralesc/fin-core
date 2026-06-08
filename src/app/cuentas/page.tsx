import { db } from "@/lib/db";
import AccountsView from "@/components/AccountsView";
import type { Account, Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export interface AccountWithStats extends Account {
  currentBalance: number;
  totalIngresos: number;
  totalGastos: number;
  recentTransactions: Pick<Transaction, "id" | "date" | "type" | "amount" | "category" | "subcategory" | "description">[];
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
        `SELECT id, date, type, amount, category, subcategory, description
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

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
          <span className="text-3xl">🏦</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No hay cuentas registradas</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Agrega una cuenta en tu base de datos para empezar a trackear tu liquidez.
        </p>
      </div>
    );
  }

  return <AccountsView initialAccounts={accounts} />;
}
