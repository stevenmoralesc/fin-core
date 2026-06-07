/**
 * app/page.tsx — Server Component
 * Fetcha datos directamente de la DB en el servidor
 * y los pasa al Dashboard (Client Component) como props.
 */

import { db } from "@/lib/db";
import Dashboard from "@/components/Dashboard";
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

function getCategories(): Record<string, { subcategory: string; suggestedBudget: number }[]> {
  const rows = db
    .prepare(
      `SELECT category, subcategory, suggestedBudget FROM sys_config ORDER BY category, subcategory`
    )
    .all() as SystemConfig[];

  const grouped: Record<string, { subcategory: string; suggestedBudget: number }[]> = {};
  for (const row of rows) {
    if (!grouped[row.category]) grouped[row.category] = [];
    grouped[row.category].push({
      subcategory: row.subcategory,
      suggestedBudget: row.suggestedBudget,
    });
  }
  return grouped;
}

async function getDashboardData(): Promise<DashboardSummary> {
  const ahora = new Date();
  const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();

  // Liquidez
  const rowLiquidez = db
    .prepare(
      `SELECT SUM(
         initialBalance +
         COALESCE((SELECT SUM(CASE WHEN type = 'INGRESO' THEN amount ELSE -amount END)
                   FROM fact_transacciones
                   WHERE accountId = c.id), 0)
       ) as total
       FROM dim_cuentas c WHERE status = 'ACTIVA'`
    )
    .get() as { total: number | null };
  const totalLiquidity = rowLiquidez.total || 0;

  // Cupo TC
  const rowTcUsed = db
    .prepare(
      `SELECT SUM(totalAmount) as used
       FROM fact_compras_cuotas WHERE status = 'VIGENTE'`
    )
    .get() as { used: number | null };
  const creditCardUsed = rowTcUsed.used || 0;

  const rowTcTotal = db
    .prepare(`SELECT SUM(totalLimit) as total FROM dim_tarjetas_credito`)
    .get() as { total: number | null };
  const creditCardLimit = rowTcTotal.total || 0;
  const creditCardUsedPercent = creditCardLimit > 0 ? (creditCardUsed / creditCardLimit) * 100 : 0;

  // Gastos
  const rowGastos = db
    .prepare(
      `SELECT SUM(amount) as total
       FROM fact_transacciones
       WHERE type = 'GASTO' AND date >= ?`
    )
    .get(primerDiaMes) as { total: number | null };
  const expenses = rowGastos.total || 0;

  // Transacciones
  const txs = db
    .prepare(
      `SELECT id, type, date, amount, category, subcategory, description, accountId, debtReferenceId
       FROM fact_transacciones
       ORDER BY date DESC LIMIT 7`
    )
    .all() as DashboardSummary["recentTransactions"];

  // Cuentas con saldo (para la tira de cuentas)
  const cuentasActivas = db
    .prepare(
      `SELECT id, name, type,
         (initialBalance +
         COALESCE((SELECT SUM(CASE WHEN type = 'INGRESO' THEN amount ELSE -amount END)
                   FROM fact_transacciones
                   WHERE accountId = c.id), 0)) as currentBalance
       FROM dim_cuentas c WHERE status = 'ACTIVA' ORDER BY type, name`
    )
    .all() as DashboardSummary["cuentasActivas"];

  return {
    liquidezTotal: totalLiquidity,
    cupoUtilizadoTC: creditCardUsed,
    limiteTC: creditCardLimit,
    cupoUtilizadoPct: creditCardUsedPercent,
    gastosCorrientesMes: expenses,
    recentTransactions: txs,
    cuentasActivas: cuentasActivas,
  };
}

export default async function HomePage() {
  const summary = await getDashboardData();

  return <Dashboard initialData={summary} />;
}
