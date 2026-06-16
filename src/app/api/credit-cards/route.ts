import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { toCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cards = db
      .prepare(
        `SELECT id, name, bank, totalLimit, closingDay, paymentDay, createdAt, updatedAt
         FROM dim_tarjetas_credito
         ORDER BY name`
      )
      .all();
    return Response.json(cards);
  } catch (error) {
    console.error("[GET /api/credit-cards]", error);
    return Response.json({ error: "Error al obtener tarjetas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, bank, totalLimit, closingDay, paymentDay } = body;

    if (typeof name !== "string" || !name.trim() || typeof bank !== "string" || !bank.trim()) {
      return Response.json({ error: "Nombre y banco son requeridos" }, { status: 400 });
    }

    const limitNum = Number(totalLimit);
    if (!Number.isFinite(limitNum) || limitNum <= 0) {
      return Response.json({ error: "El cupo total debe ser un número mayor a 0" }, { status: 400 });
    }

    const closing = Number(closingDay);
    const payment = Number(paymentDay);
    if (!Number.isInteger(closing) || closing < 1 || closing > 31 ||
        !Number.isInteger(payment) || payment < 1 || payment > 31) {
      return Response.json({ error: "Los días de corte y pago deben estar entre 1 y 31" }, { status: 400 });
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO dim_tarjetas_credito
      (id, name, bank, totalLimit, closingDay, paymentDay, createdAt, updatedAt)
      VALUES (@id, @name, @bank, @totalLimit, @closingDay, @paymentDay, @now, @now)
    `).run({
      id,
      name: name.trim(),
      bank: bank.trim(),
      totalLimit: toCents(limitNum),
      closingDay: closing,
      paymentDay: payment,
      now,
    });

    return Response.json({ id }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/credit-cards]", error);
    return Response.json({ error: "Error al crear la tarjeta" }, { status: 500 });
  }
}

