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
