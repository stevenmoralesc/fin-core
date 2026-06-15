import { db } from "@/lib/db";
import BudgetDashboard from "@/components/views/BudgetDashboard";

export const dynamic = "force-dynamic";

export interface BudgetStats {
  category: string;
  icon?: string | null;
  budget: number;
  spent: number;
}

export default async function PresupuestoPage() {
  const ahora = new Date();
  const primerDiaMes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-01`;

  // Obtener todas las configuraciones de presupuesto
  const budgets = db
    .prepare(`SELECT category, icon, suggestedBudget FROM sys_config ORDER BY category`)
    .all() as { category: string; icon: string | null; suggestedBudget: number }[];

  // Obtener todos los gastos del mes actual y compras vigentes
  const expenseRows = db
    .prepare(`
      SELECT t.category, t.amount, t.debtReferenceId, c.totalAmount, c.totalMonths, c.monthlyInterest, c.status
      FROM fact_transacciones t
      LEFT JOIN fact_compras_cuotas c ON t.debtReferenceId = c.id
      WHERE t.type = 'GASTO'
        AND (
          (t.debtReferenceId IS NULL AND t.date >= ?)
          OR
          -- Devengo de cuotas: solo la compra original (accountId NULL),
          -- no los pagos de cuota (que ya redujeron el saldo de la cuenta).
          (t.debtReferenceId IS NOT NULL AND t.accountId IS NULL AND c.status = 'VIGENTE')
        )
    `)
    .all(primerDiaMes) as { category: string; amount: number; debtReferenceId: string | null; totalAmount: number; totalMonths: number; monthlyInterest: number; status: string }[];

  const spentMap = new Map<string, number>();
  for (const row of expenseRows) {
    let spent = 0;
    if (row.debtReferenceId && row.status === 'VIGENTE') {
      const interest = row.monthlyInterest || 0;
      if (interest > 0) {
        const r = interest / 100;
        const n = row.totalMonths;
        spent = (row.totalAmount * r) / (1 - Math.pow(1 + r, -n));
      } else {
        spent = row.totalAmount / row.totalMonths;
      }
    } else if (!row.debtReferenceId) {
      spent = row.amount;
    }
    
    spentMap.set(row.category, (spentMap.get(row.category) || 0) + spent);
  }

  // Combinar presupuestos con gastos
  const stats: BudgetStats[] = budgets.map((b) => ({
    category: b.category,
    icon: b.icon,
    budget: b.suggestedBudget,
    spent: spentMap.get(b.category) || 0,
  }));

  // Identificar gastos que no tienen un presupuesto configurado
  const existingSet = new Set(budgets.map(b => b.category));
  for (const [category, spent] of spentMap.entries()) {
    if (!existingSet.has(category)) {
      stats.push({
        category,
        budget: 0,
        spent,
      });
    }
  }

  return (
    <div className="px-6 md:px-10 py-8">
      <BudgetDashboard initialStats={stats} />
    </div>
  );
}
