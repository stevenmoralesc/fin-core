import { db } from "@/lib/db";
import TransactionsView from "@/components/views/TransactionsView";
import type { Transaction, CategoriesByType, SystemConfig } from "@/lib/types";

export const dynamic = "force-dynamic";

function getTransactions(): Transaction[] {
  // Ledger = caja. Excluye las filas "compra original" a cuotas
  // (accountId NULL + debtReferenceId NOT NULL): esas no movieron plata,
  // viven en Tarjetas. Sí entran los pagos de cuota (accountId NOT NULL).
  return db
    .prepare(
      `SELECT t.id, t.type, t.date, t.amount, t.category, t.description,
              t.accountId, t.debtReferenceId, t.createdAt, t.updatedAt,
              COALESCE(c.name, tc.name) AS paymentMethodName
       FROM fact_transacciones t
       LEFT JOIN dim_cuentas c ON t.accountId = c.id
       LEFT JOIN fact_compras_cuotas fcc ON t.debtReferenceId = fcc.id
       LEFT JOIN dim_tarjetas_credito tc ON fcc.creditCardId = tc.id
       WHERE NOT (t.accountId IS NULL AND t.debtReferenceId IS NOT NULL)
       ORDER BY t.date DESC, t.createdAt DESC`
    )
    .all() as Transaction[];
}

function getCategories(): CategoriesByType {
  const rows = db
    .prepare(`SELECT category, suggestedBudget, transactionType, icon FROM sys_config ORDER BY transactionType, category`)
    .all() as SystemConfig[];
  const result: CategoriesByType = { GASTO: {}, INGRESO: {}, TRANSFERENCIA: {} };
  for (const row of rows) {
    const t = row.transactionType ?? "GASTO";
    if (!result[t][row.category]) result[t][row.category] = [];
    result[t][row.category].push({ suggestedBudget: row.suggestedBudget, icon: row.icon });
  }
  return result;
}

export default async function TransaccionesPage() {
  const [transactions, categories] = await Promise.all([
    Promise.resolve(getTransactions()),
    Promise.resolve(getCategories()),
  ]);

  return (
    <div className="px-6 md:px-10 py-8">
      <TransactionsView transactions={transactions} categories={categories} />
    </div>
  );
}
