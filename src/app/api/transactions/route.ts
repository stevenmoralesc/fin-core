import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { toCents } from "@/lib/money";
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
      SELECT t.id, t.date, t.type, t.category, t.amount, t.description,
             t.accountId, t.destinationAccountId, t.debtReferenceId, t.createdAt, t.updatedAt,
             fcc.creditCardId
      FROM fact_transacciones t
      LEFT JOIN fact_compras_cuotas fcc ON t.debtReferenceId = fcc.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (type) {
      query += " AND t.type = ?";
      params.push(type);
    }
    if (accountId) {
      query += " AND t.accountId = ?";
      params.push(accountId);
    }

    query += " ORDER BY t.date DESC LIMIT ?";
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
    const { type, category, amount, description, paymentMethodId, paymentMethodType, installments, date, destinationAccountId: destAccountIdInput } = body;

    // Validación básica
    if (!type || amount === undefined || !paymentMethodId || !paymentMethodType) {
      return Response.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    if (!["INGRESO", "GASTO", "TRANSFERENCIA"].includes(type)) {
      return Response.json({ error: "type debe ser INGRESO, GASTO o TRANSFERENCIA" }, { status: 400 });
    }

    // Las transferencias internas no llevan categoría: el evento se describe
    // por las cuentas origen y destino. Forzamos el sentinel del lado servidor.
    const txCategory = type === "TRANSFERENCIA" ? "Transferencia" : category;
    if (!txCategory) {
      return Response.json({ error: "La categoría es requerida" }, { status: 400 });
    }

    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return Response.json({ error: "El monto debe ser un número mayor a 0" }, { status: 400 });
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const d = new Date();
    // Normalizar fecha a YYYY-MM-DD (local). Si llega un ISO completo, recortar.
    const txDate = (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date))
      ? date.slice(0, 10)
      : (d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0'));

    let accountId: string | null = null;
    let debtReferenceId: string | null = null;
    let destinationAccountId: string | null = null;
    let numInstallments = 1;

    if (paymentMethodType === "CREDIT_CARD") {
      if (type !== "GASTO") {
        return Response.json({ error: "Las tarjetas de crédito solo se pueden usar para GASTOS" }, { status: 400 });
      }

      numInstallments = parseInt(installments ?? "1", 10);
      if (!Number.isInteger(numInstallments) || numInstallments < 1) {
        return Response.json({ error: "El número de cuotas debe ser un entero mayor o igual a 1" }, { status: 400 });
      }
      debtReferenceId = randomUUID();
    } else {
      accountId = paymentMethodId;
    }

    // Transferencia: requiere cuenta destino distinta del origen (doble asiento).
    if (type === "TRANSFERENCIA") {
      if (paymentMethodType !== "ACCOUNT") {
        return Response.json({ error: "Una transferencia debe salir de una cuenta" }, { status: 400 });
      }
      if (!destAccountIdInput || typeof destAccountIdInput !== "string") {
        return Response.json({ error: "Selecciona la cuenta destino" }, { status: 400 });
      }
      if (destAccountIdInput === accountId) {
        return Response.json({ error: "La cuenta destino debe ser distinta de la origen" }, { status: 400 });
      }
      const destExists = db.prepare(`SELECT id FROM dim_cuentas WHERE id = ?`).get(destAccountIdInput);
      if (!destExists) {
        return Response.json({ error: "La cuenta destino no existe" }, { status: 400 });
      }
      destinationAccountId = destAccountIdInput;
    }

    // Doble escritura atómica: compra a cuotas (si aplica) + transacción.
    const insertAll = db.transaction(() => {
      if (debtReferenceId) {
        db.prepare(`
          INSERT INTO fact_compras_cuotas
            (id, purchaseDate, establishment, totalAmount, totalMonths, paidMonths, monthlyInterest, status, creditCardId, createdAt, updatedAt)
          VALUES
            (@id, @purchaseDate, @establishment, @totalAmount, @totalMonths, @paidMonths, @monthlyInterest, @status, @creditCardId, @createdAt, @updatedAt)
        `).run({
          id: debtReferenceId,
          purchaseDate: txDate,
          establishment: description || "Compra con TC",
          totalAmount: toCents(amountNum),
          totalMonths: numInstallments,
          paidMonths: 0,
          monthlyInterest: 0,
          status: "VIGENTE",
          creditCardId: paymentMethodId,
          createdAt: now,
          updatedAt: now,
        });
      }

      db.prepare(`
        INSERT INTO fact_transacciones
          (id, date, type, category, amount, description, accountId, destinationAccountId, debtReferenceId, createdAt, updatedAt)
        VALUES
          (@id, @date, @type, @category, @amount, @description, @accountId, @destinationAccountId, @debtReferenceId, @createdAt, @updatedAt)
      `).run({
        id,
        date: txDate,
        type,
        category: txCategory,
        amount: toCents(amountNum),
        description: description ?? null,
        accountId,
        destinationAccountId,
        debtReferenceId,
        createdAt: now,
        updatedAt: now,
      });
    });
    insertAll();

    const created = db
      .prepare("SELECT * FROM fact_transacciones WHERE id = ?")
      .get(id);

    return Response.json(created, { status: 201 });
  } catch (error) {
    console.error("[POST /api/transactions]", error);
    return Response.json({ error: "Error al crear transacción" }, { status: 500 });
  }
}
