import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { DashboardSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

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
    
    const startDate = new Date(targetYear, targetMonth - 1, 1).toISOString();
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999).toISOString();
    
    // 1. Liquidez (up to endDate)
    const rowLiquidez = db.prepare(`
      SELECT SUM(
         initialBalance +
         COALESCE((SELECT SUM(CASE WHEN type = 'INGRESO' THEN amount ELSE -amount END)
                   FROM fact_transacciones
                   WHERE accountId = c.id AND date <= ?), 0)
      ) as total
      FROM dim_cuentas c WHERE status = 'ACTIVA'
    `).get(endDate) as { total: number | null };
    const totalLiquidity = rowLiquidez.total || 0;

    // 2. Gastos Corrientes (strictly within the period)
    const rowGastos = db.prepare(`
      SELECT SUM(amount) as total
      FROM fact_transacciones
      WHERE type = 'GASTO' AND date >= ? AND date <= ?
    `).get(startDate, endDate) as { total: number | null };
    const expenses = rowGastos.total || 0;

    // 3. Cupo Utilizado TC (using CreditCardStatement if exists, else fallback)
    const cards = db.prepare(`SELECT id, totalLimit FROM dim_tarjetas_credito`).all() as { id: string, totalLimit: number }[];
    let creditCardUsed = 0;
    let creditCardLimit = 0;
    
    for (const card of cards) {
      creditCardLimit += card.totalLimit;
      
      const statement = db.prepare(`
        SELECT id FROM fact_estados_cuenta 
        WHERE creditCardId = ? 
          AND ((startDate <= ? AND closingDate >= ?) OR (startDate >= ? AND startDate <= ?))
        ORDER BY closingDate DESC LIMIT 1
      `).get(card.id, endDate, startDate, startDate, endDate) as { id: string } | undefined;
      
      let installmentsToSum: any[] = [];

      if (statement) {
        installmentsToSum = db.prepare(`
          SELECT totalAmount, totalMonths, paidMonths, monthlyInterest 
          FROM fact_compras_cuotas 
          WHERE statementId = ?
        `).all(statement.id);
      } else {
        // Fallback: all active purchases on this card up to the endDate
        installmentsToSum = db.prepare(`
          SELECT totalAmount, totalMonths, paidMonths, monthlyInterest 
          FROM fact_compras_cuotas
          WHERE creditCardId = ? AND status = 'VIGENTE' AND purchaseDate <= ?
        `).all(card.id, endDate);
      }

      for (const inst of installmentsToSum) {
        const remaining = inst.totalMonths - inst.paidMonths;
        const monthly =
          inst.monthlyInterest > 0
            ? (inst.totalAmount * (inst.monthlyInterest / 100)) /
              (1 - Math.pow(1 + inst.monthlyInterest / 100, -inst.totalMonths))
            : inst.totalAmount / inst.totalMonths;

        creditCardUsed += monthly * remaining;
      }
    }
    
    const creditCardUsedPercent = creditCardLimit > 0 ? (creditCardUsed / creditCardLimit) * 100 : 0;

    // 4. Transacciones recientes del periodo
    const txs = db.prepare(`
      SELECT t.id, t.type, t.date, t.amount, t.category, t.subcategory, t.description, t.accountId, t.debtReferenceId,
             COALESCE(c.name, tc.name) AS paymentMethodName
      FROM fact_transacciones t
      LEFT JOIN dim_cuentas c ON t.accountId = c.id
      LEFT JOIN fact_compras_cuotas fcc ON t.debtReferenceId = fcc.id
      LEFT JOIN dim_tarjetas_credito tc ON fcc.creditCardId = tc.id
      WHERE t.date >= ? AND t.date <= ?
      ORDER BY t.date DESC LIMIT 7
    `).all(startDate, endDate) as DashboardSummary["recentTransactions"];

    // 5. Cuentas activas con saldo proyectado
    const cuentasActivas = db.prepare(`
      SELECT id, name, type,
         (initialBalance +
         COALESCE((SELECT SUM(CASE WHEN type = 'INGRESO' THEN amount ELSE -amount END)
                   FROM fact_transacciones
                   WHERE accountId = c.id AND date <= ?), 0)) as currentBalance
      FROM dim_cuentas c WHERE status = 'ACTIVA' ORDER BY type, name
    `).all(endDate) as DashboardSummary["cuentasActivas"];

    const summary: DashboardSummary = {
      liquidezTotal: totalLiquidity,
      cupoUtilizadoTC: creditCardUsed,
      limiteTC: creditCardLimit,
      cupoUtilizadoPct: creditCardUsedPercent,
      gastosCorrientesMes: expenses,
      recentTransactions: txs,
      cuentasActivas: cuentasActivas,
    };

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
