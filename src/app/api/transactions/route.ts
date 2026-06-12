import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// ── GET /api/transactions ──────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const type = searchParams.get("type"); // INGRESO | GASTO | TRANSFERENCIA
    const accountId = searchParams.get("accountId");

    let query = `
      SELECT id, date, type, category, amount, description,
             accountId, createdAt, updatedAt
      FROM fact_transacciones
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (type) {
      query += " AND type = ?";
      params.push(type);
    }
    if (accountId) {
      query += " AND accountId = ?";
      params.push(accountId);
    }

    query += " ORDER BY date DESC LIMIT ?";
    params.push(limit);

    const transactions = db.prepare(query).all(...params);
    return Response.json(transactions);
  } catch (error) {
    console.error("[GET /api/transactions]", error);
    return Response.json({ error: "Error al obtener transacciones" }, { status: 500 });
  }
}

// ── POST /api/transactions ─────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, category, amount, description, paymentMethodId, paymentMethodType, installments, date } = body;

    // Validación básica
    if (!type || !category || amount === undefined || !paymentMethodId || !paymentMethodType) {
      return Response.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    if (!["INGRESO", "GASTO", "TRANSFERENCIA"].includes(type)) {
      return Response.json({ error: "type debe ser INGRESO, GASTO o TRANSFERENCIA" }, { status: 400 });
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const d = new Date();
    const txDate = date ?? (d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0'));

    let accountId = null;
    let debtReferenceId = null;

    if (paymentMethodType === "CREDIT_CARD") {
      if (type !== "GASTO") {
        return Response.json({ error: "Las tarjetas de crédito solo se pueden usar para GASTOS" }, { status: 400 });
      }
      
      const installmentId = randomUUID();
      const numInstallments = parseInt(installments || "1");

      // Crear la compra a cuotas
      db.prepare(`
        INSERT INTO fact_compras_cuotas
          (id, purchaseDate, establishment, totalAmount, totalMonths, paidMonths, monthlyInterest, status, creditCardId, createdAt, updatedAt)
        VALUES
          (@id, @purchaseDate, @establishment, @totalAmount, @totalMonths, @paidMonths, @monthlyInterest, @status, @creditCardId, @createdAt, @updatedAt)
      `).run({
        id: installmentId,
        purchaseDate: txDate,
        establishment: description || "Compra con TC",
        totalAmount: Number(amount),
        totalMonths: numInstallments,
        paidMonths: 0,
        monthlyInterest: 0,
        status: "VIGENTE",
        creditCardId: paymentMethodId,
        createdAt: now,
        updatedAt: now,
      });

      debtReferenceId = installmentId;
    } else {
      accountId = paymentMethodId;
    }

    // Crear la transacción
    db.prepare(`
      INSERT INTO fact_transacciones
        (id, date, type, category, amount, description, accountId, debtReferenceId, createdAt, updatedAt)
      VALUES
        (@id, @date, @type, @category, @amount, @description, @accountId, @debtReferenceId, @createdAt, @updatedAt)
    `).run({
      id,
      date: txDate,
      type,
      category,

      amount: Number(amount),
      description: description ?? null,
      accountId,
      debtReferenceId,
      createdAt: now,
      updatedAt: now,
    });

    const created = db
      .prepare("SELECT * FROM fact_transacciones WHERE id = ?")
      .get(id);

    return Response.json(created, { status: 201 });
  } catch (error) {
    console.error("[POST /api/transactions]", error);
    return Response.json({ error: "Error al crear transacción" }, { status: 500 });
  }
}
