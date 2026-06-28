import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { monthlyPayment, outstandingPrincipal } from "@/lib/credit";
import type { DashboardSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

type InstallmentRow = {
  totalAmount: number;
  totalMonths: number;
  paidMonths: number;
  monthlyInterest: number;
};

export async function GET(req: NextRequest) {
  try {
    const periodo = req.nextUrl.searchParams.get("periodo");
    let targetYear: number, targetMonth: number;
    
    if (periodo) {
      const [y, m] = periodo.split("-");
      targetYear = parseInt(y, 10);
      targetMonth = parseInt(m, 10);
    } else {
      const now = new Date();
      targetYear = now.getFullYear();
      targetMonth = now.getMonth() + 1; // 1-12
    }
    
    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    
    // 1. Liquidez (up to endDate)
    const rowLiquidez = db.prepare(`
      SELECT SUM(
         initialBalance
         + COALESCE((SELECT SUM(CASE WHEN type = 'INGRESO' THEN amount
                                     WHEN type IN ('GASTO','TRANSFERENCIA') THEN -amount
                                     ELSE 0 END)
                     FROM fact_transacciones
                     WHERE accountId = c.id AND date <= ?), 0)
         + COALESCE((SELECT SUM(amount)
                     FROM fact_transacciones
                     WHERE destinationAccountId = c.id AND type = 'TRANSFERENCIA' AND date <= ?), 0)
      ) as total
      FROM dim_cuentas c WHERE status = 'ACTIVA'
    `).get(endDate, endDate) as { total: number | null };
    const totalLiquidity = rowLiquidez.total || 0;

    // 2. Gastos Corrientes del periodo. Dos fuentes:
    //    (a) Gastos de contado: la fila de transacción cae dentro del periodo.
    //    (b) Devengo de cuotas: una compra a TC devenga 1 cuota por mes, desde
    //        purchaseDate (mes 1) hasta purchaseDate + totalMonths - 1 (mes N).
    //        Es DETERMINISTA: no depende de status ni paidMonths, así el
    //        histórico de meses pasados queda inmutable.
    const contadoRows = db.prepare(`
      SELECT category, amount
      FROM fact_transacciones
      WHERE type = 'GASTO'
        AND debtReferenceId IS NULL
        AND date >= ? AND date <= ?
    `).all(startDate, endDate) as { category: string; amount: number }[];

    const comprasRows = db.prepare(`
      SELECT c.purchaseDate, c.totalAmount, c.totalMonths, c.monthlyInterest, t.category
      FROM fact_compras_cuotas c
      JOIN fact_transacciones t
        ON t.debtReferenceId = c.id AND t.accountId IS NULL
      WHERE c.purchaseDate <= ?
    `).all(endDate) as {
      purchaseDate: string;
      totalAmount: number;
      totalMonths: number;
      monthlyInterest: number;
      category: string;
    }[];

    const targetMonthIndex = targetYear * 12 + (targetMonth - 1);

    let expenses = 0;
    const spentByCategory = new Map<string, number>();

    for (const row of contadoRows) {
      expenses += row.amount;
      spentByCategory.set(row.category, (spentByCategory.get(row.category) || 0) + row.amount);
    }

    for (const compra of comprasRows) {
      const [py, pm] = compra.purchaseDate.slice(0, 10).split('-').map(Number);
      const purchaseMonthIndex = py * 12 + (pm - 1);
      const installmentIndex = targetMonthIndex - purchaseMonthIndex; // 0 = mes de compra
      if (installmentIndex < 0 || installmentIndex >= compra.totalMonths) continue;
      const cuota = monthlyPayment(compra);
      expenses += cuota;
      spentByCategory.set(compra.category, (spentByCategory.get(compra.category) || 0) + cuota);
    }

    // 2b. Ingresos del periodo (solo INGRESO, sin contar transferencias).
    const incomeRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM fact_transacciones
      WHERE type = 'INGRESO' AND date >= ? AND date <= ?
    `).get(startDate, endDate) as { total: number };
    const incomeTotal = incomeRow.total;

    // 3. Cupo Utilizado TC (using CreditCardStatement if exists, else fallback)
    // y Pago TC pendiente del mes = suma de cuotas mensuales vigentes.
    const cards = db.prepare(`SELECT id, totalLimit FROM dim_tarjetas_credito`).all() as { id: string, totalLimit: number }[];
    let creditCardUsed = 0;
    let creditCardLimit = 0;
    let creditCardBillDue = 0;

    for (const card of cards) {
      creditCardLimit += card.totalLimit;

      const statement = db.prepare(`
        SELECT id FROM fact_estados_cuenta
        WHERE creditCardId = ?
          AND ((startDate <= ? AND closingDate >= ?) OR (startDate >= ? AND startDate <= ?))
        ORDER BY closingDate DESC LIMIT 1
      `).get(card.id, endDate, startDate, startDate, endDate) as { id: string } | undefined;

      let installmentsToSum: InstallmentRow[] = [];

      if (statement) {
        installmentsToSum = db.prepare(`
          SELECT totalAmount, totalMonths, paidMonths, monthlyInterest
          FROM fact_compras_cuotas
          WHERE statementId = ?
        `).all(statement.id) as InstallmentRow[];
      } else {
        // Fallback: all active purchases on this card up to the endDate
        installmentsToSum = db.prepare(`
          SELECT totalAmount, totalMonths, paidMonths, monthlyInterest
          FROM fact_compras_cuotas
          WHERE creditCardId = ? AND status = 'VIGENTE' AND purchaseDate <= ?
        `).all(card.id, endDate) as InstallmentRow[];
      }

      for (const inst of installmentsToSum) {
        // Cupo ocupado = capital pendiente (el interés no consume cupo).
        creditCardUsed += outstandingPrincipal(inst);
        // Pago del mes = cuota mensual de cada compra vigente.
        if (inst.totalMonths > inst.paidMonths) {
          creditCardBillDue += monthlyPayment(inst);
        }
      }
    }

    const creditCardUsedPercent = creditCardLimit > 0 ? (creditCardUsed / creditCardLimit) * 100 : 0;

    // 4. Transacciones recientes del periodo (últimas 5) + total del periodo.
    //    Incluye todas las filas, incluida la compra original a cuotas en su día.
    const txs = db.prepare(`
      SELECT t.id, t.type, t.date, t.amount, t.category, t.description, t.accountId, t.destinationAccountId, t.debtReferenceId,
             fcc.creditCardId,
             COALESCE(c.name, tc.name) AS paymentMethodName
      FROM fact_transacciones t
      LEFT JOIN dim_cuentas c ON t.accountId = c.id
      LEFT JOIN fact_compras_cuotas fcc ON t.debtReferenceId = fcc.id
      LEFT JOIN dim_tarjetas_credito tc ON fcc.creditCardId = tc.id
      WHERE t.date >= ? AND t.date <= ?
      ORDER BY t.date DESC, t.createdAt DESC LIMIT 5
    `).all(startDate, endDate) as DashboardSummary["recentTransactions"];

    const periodTransactionsCount = (db.prepare(`
      SELECT COUNT(*) AS n FROM fact_transacciones
      WHERE date >= ? AND date <= ?
    `).get(startDate, endDate) as { n: number }).n;

    // 5. Cuentas activas con saldo proyectado
    const cuentasActivas = db.prepare(`
      SELECT id, name, type,
         (initialBalance
          + COALESCE((SELECT SUM(CASE WHEN type = 'INGRESO' THEN amount
                                      WHEN type IN ('GASTO','TRANSFERENCIA') THEN -amount
                                      ELSE 0 END)
                      FROM fact_transacciones
                      WHERE accountId = c.id AND date <= ?), 0)
          + COALESCE((SELECT SUM(amount)
                      FROM fact_transacciones
                      WHERE destinationAccountId = c.id AND type = 'TRANSFERENCIA' AND date <= ?), 0)
         ) as currentBalance
      FROM dim_cuentas c WHERE status = 'ACTIVA' ORDER BY type, name
    `).all(endDate, endDate) as DashboardSummary["cuentasActivas"];

    // 6. Presupuesto por categoría (solo GASTO con tope > 0)
    const budgetRows = db.prepare(`
      SELECT category, icon, suggestedBudget
      FROM sys_config
      WHERE transactionType = 'GASTO' AND suggestedBudget > 0
      ORDER BY suggestedBudget DESC
    `).all() as { category: string; icon: string | null; suggestedBudget: number }[];
    const budgetByCategory = budgetRows.map((b) => ({
      category: b.category,
      icon: b.icon,
      budget: b.suggestedBudget,
      spent: Math.round(spentByCategory.get(b.category) || 0),
    }));

    const summary: DashboardSummary = {
      liquidezTotal: totalLiquidity,
      cupoUtilizadoTC: creditCardUsed,
      limiteTC: creditCardLimit,
      cupoUtilizadoPct: creditCardUsedPercent,
      gastosCorrientesMes: expenses,
      ingresosDelPeriodo: incomeTotal,
      pagoTcPendiente: creditCardBillDue,
      recentTransactions: txs,
      periodTransactionsCount,
      cuentasActivas: cuentasActivas,
      budgetByCategory,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Error al cargar el dashboard" }, { status: 500 });
  }
}
