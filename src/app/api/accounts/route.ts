import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const accounts = db
      .prepare(
        `SELECT id, name, type, initialBalance, currency, status, createdAt, updatedAt
         FROM dim_cuentas
         ORDER BY type, name`
      )
      .all();
    return Response.json(accounts);
  } catch (error) {
    console.error("[GET /api/accounts]", error);
    return Response.json({ error: "Error al obtener cuentas" }, { status: 500 });
  }
}
