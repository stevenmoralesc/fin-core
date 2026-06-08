import { db } from "@/lib/db";
import BudgetDashboard from "@/components/BudgetDashboard";

export const dynamic = "force-dynamic";

export interface BudgetStats {
  category: string;
  subcategory: string;
  budget: number;
  spent: number;
}

export default async function PresupuestoPage() {
  const ahora = new Date();
  const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();

  // Obtener todas las configuraciones de presupuesto
  const budgets = db
    .prepare(`SELECT category, subcategory, suggestedBudget FROM sys_config ORDER BY category, subcategory`)
    .all() as { category: string; subcategory: string; suggestedBudget: number }[];

  // Obtener todos los gastos del mes actual agrupados por categoria y subcategoria
  const spentRows = db
    .prepare(`
      SELECT category, subcategory, SUM(amount) as spent
      FROM fact_transacciones
      WHERE type = 'GASTO' AND date >= ?
      GROUP BY category, subcategory
    `)
    .all(primerDiaMes) as { category: string; subcategory: string; spent: number }[];

  const spentMap = new Map<string, number>();
  for (const row of spentRows) {
    spentMap.set(`${row.category}|${row.subcategory}`, row.spent);
  }

  // Combinar presupuestos con gastos
  const stats: BudgetStats[] = budgets.map((b) => ({
    category: b.category,
    subcategory: b.subcategory,
    budget: b.suggestedBudget,
    spent: spentMap.get(`${b.category}|${b.subcategory}`) || 0,
  }));

  // Identificar gastos que no tienen un presupuesto configurado
  const existingSet = new Set(budgets.map(b => `${b.category}|${b.subcategory}`));
  for (const row of spentRows) {
    if (!existingSet.has(`${row.category}|${row.subcategory}`)) {
      stats.push({
        category: row.category,
        subcategory: row.subcategory,
        budget: 0,
        spent: row.spent,
      });
    }
  }

  return <BudgetDashboard initialStats={stats} />;
}
