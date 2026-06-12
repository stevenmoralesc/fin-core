import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/config/categories — devuelve categorías agrupadas
export async function GET() {
  try {
    const rows = db
      .prepare(
        `SELECT category, suggestedBudget
         FROM sys_config
         ORDER BY category`
      )
      .all() as Array<{ category: string; suggestedBudget: number }>;

    // Agrupar por categoría
    const grouped: Record<string, { suggestedBudget: number }[]> = {};
    for (const row of rows) {
      if (!grouped[row.category]) grouped[row.category] = [];
      grouped[row.category].push({
        suggestedBudget: row.suggestedBudget,
      });
    }

    return Response.json(grouped);
  } catch (error) {
    console.error("[GET /api/config/categories]", error);
    return Response.json({ error: "Error al obtener categorías" }, { status: 500 });
  }
}
