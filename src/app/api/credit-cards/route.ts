import { db } from "@/lib/db";

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

    if (!name || !bank || !totalLimit || !closingDay || !paymentDay) {
      return Response.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const { randomUUID } = require("crypto");
    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO dim_tarjetas_credito 
      (id, name, bank, totalLimit, closingDay, paymentDay, createdAt, updatedAt)
      VALUES (@id, @name, @bank, @totalLimit, @closingDay, @paymentDay, @now, @now)
    `).run({
      id,
      name,
      bank,
      totalLimit: Number(totalLimit),
      closingDay: Number(closingDay),
      paymentDay: Number(paymentDay),
      now,
    });

    return Response.json({ id }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/credit-cards]", error);
    return Response.json({ error: "Error al crear la tarjeta" }, { status: 500 });
  }
}

