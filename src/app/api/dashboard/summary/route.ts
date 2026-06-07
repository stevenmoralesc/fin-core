import { db } from "@/lib/db";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const primerDiaMes = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString();

    // ── 1. Liquidez Total ─────────────────────────────────────
    // SQL hace el SUM — nunca cargamos filas a JS
    const cuentas = db
      .prepare(
        `SELECT id, initialBalance FROM dim_cuentas WHERE status = 'ACTIVA'`
      )
      .all() as { id: string; initialBalance: number }[];

    let liquidezTotal = 0;
    for (const cuenta of cuentas) {
      const { net } = db
        .prepare(
          `SELECT COALESCE(
             SUM(CASE
               WHEN type = 'INGRESO'      THEN  amount
               WHEN type = 'GASTO'        THEN -amount
               WHEN type = 'TRANSFERENCIA' THEN 0
             END), 0) AS net
           FROM fact_transacciones
           WHERE accountId = ?`
        )
        .get(cuenta.id) as { net: number };

      liquidezTotal += cuenta.initialBalance + net;
    }

    // ── 2. Cupo Utilizado TC ──────────────────────────────────
    // Saldo pendiente = totalAmount - (paidMonths × cuota lineal)
    // Todo calculado en SQLite, sin loops en JS
    const { cupoUtilizadoTC } = db
      .prepare(
        `SELECT COALESCE(SUM(
           totalAmount - (paidMonths * (totalAmount / totalMonths))
         ), 0) AS cupoUtilizadoTC
         FROM fact_compras_cuotas
         WHERE status = 'VIGENTE'`
      )
      .get() as { cupoUtilizadoTC: number };

    const limiteTC = db
      .prepare(`SELECT COALESCE(SUM(totalLimit), 0) AS total FROM dim_tarjetas_credito`)
      .get() as { total: number };

    // ── 3. Gastos Corrientes del Mes ──────────────────────────
    const { gastosCorrientesMes } = db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) AS gastosCorrientesMes
         FROM fact_transacciones
         WHERE type = 'GASTO' AND date >= ?`
      )
      .get(primerDiaMes) as { gastosCorrientesMes: number };

    // ── 4. Transacciones recientes ────────────────────────────
    const transaccionesRecientes = db
      .prepare(
        `SELECT id, date, type, category, subcategory, amount,
                description, accountId, debtReferenceId, createdAt, updatedAt
         FROM fact_transacciones
         ORDER BY date DESC
         LIMIT 10`
      )
      .all();

    // ── 5. Cuentas activas ────────────────────────────────────
    const cuentasActivas = db
      .prepare(
        `SELECT id, name, type, initialBalance, currency, status, createdAt, updatedAt
         FROM dim_cuentas WHERE status = 'ACTIVA' ORDER BY type, name`
      )
      .all();

    return Response.json({
      liquidezTotal,
      cupoUtilizadoTC,
      limiteTC: limiteTC.total,
      cupoUtilizadoPct: limiteTC.total > 0
        ? Math.round((cupoUtilizadoTC / limiteTC.total) * 100)
        : 0,
      gastosCorrientesMes,
      transaccionesRecientes,
      cuentasActivas,
    });

  } catch (error) {
    console.error("[GET /api/dashboard/summary]", error);
    return Response.json(
      { error: "Error en el motor del Dashboard" },
      { status: 500 }
    );
  }
}
