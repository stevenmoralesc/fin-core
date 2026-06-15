import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const accounts = db
      .prepare(
        `SELECT id, name, type, currency, status, createdAt, updatedAt,
                initialBalance,
                (initialBalance
                 + COALESCE((
                     SELECT SUM(CASE WHEN type = 'INGRESO' THEN amount
                                     WHEN type IN ('GASTO','TRANSFERENCIA') THEN -amount
                                     ELSE 0 END)
                     FROM fact_transacciones
                     WHERE accountId = c.id
                   ), 0)
                 + COALESCE((
                     SELECT SUM(amount)
                     FROM fact_transacciones
                     WHERE destinationAccountId = c.id AND type = 'TRANSFERENCIA'
                   ), 0)
                ) AS currentBalance
         FROM dim_cuentas c
         WHERE status = 'ACTIVA'
         ORDER BY type, name`
      )
      .all();
    return Response.json(accounts);
  } catch (error) {
    console.error("[GET /api/accounts]", error);
    return Response.json({ error: "Error al obtener cuentas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, initialBalance = 0, currency = "COP" } = body;

    if (!name || !type) {
      return Response.json({ error: "Nombre y tipo son requeridos" }, { status: 400 });
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO dim_cuentas (id, name, type, initialBalance, currency, status, createdAt, updatedAt)
      VALUES (@id, @name, @type, @initialBalance, @currency, 'ACTIVA', @now, @now)
    `).run({ id, name: name.trim(), type, initialBalance: Number(initialBalance), currency, now });

    return Response.json({ id }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/accounts]", error);
    return Response.json({ error: "Error al crear la cuenta" }, { status: 500 });
  }
}

