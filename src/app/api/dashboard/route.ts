import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
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

    // 2. Gastos Corrientes (strictly within the period + active installments)
    const expenseRows = db.prepare(`
      SELECT t.amount, t.debtReferenceId, c.totalAmount, c.totalMonths, c.monthlyInterest, c.status
      FROM fact_transacciones t
      LEFT JOIN fact_compras_cuotas c ON t.debtReferenceId = c.id
      WHERE t.type = 'GASTO'
        AND (
          (t.debtReferenceId IS NULL AND t.date >= ? AND t.date <= ?)
          OR
          -- Devengo de cuotas: solo la compra original (accountId NULL),
          -- nunca los pagos de cuota (que llevan accountId y ya redujeron el saldo).
          (t.debtReferenceId IS NOT NULL AND t.accountId IS NULL AND c.status = 'VIGENTE' AND t.date <= ?)
        )
    `).all(startDate, endDate, endDate) as {
      amount: number;
      debtReferenceId: string | null;
      totalAmount: number;
      totalMonths: number;
      monthlyInterest: number;
      status: string | null;
    }[];

    let expenses = 0;
    for (const row of expenseRows) {
      if (row.debtReferenceId && row.status === 'VIGENTE') {
        if (!row.totalMonths || row.totalMonths <= 0) continue; // evita división por cero
        const interest = row.monthlyInterest || 0;
        if (interest > 0) {
          const r = interest / 100;
          const n = row.totalMonths;
          expenses += (row.totalAmount * r) / (1 - Math.pow(1 + r, -n));
        } else {
          expenses += row.totalAmount / row.totalMonths;
        }
      } else if (!row.debtReferenceId) {
        expenses += row.amount;
      }
    }

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
        if (!inst.totalMonths || inst.totalMonths <= 0) continue; // evita división por cero
        const remaining = Math.max(0, inst.totalMonths - inst.paidMonths);
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
      SELECT t.id, t.type, t.date, t.amount, t.category, t.description, t.accountId, t.debtReferenceId,
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
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Error al cargar el dashboard" }, { status: 500 });
  }
}
