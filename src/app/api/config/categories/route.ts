import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/config/categories — devuelve categorías agrupadas
export async function GET() {
  try {
    const rows = db
      .prepare(
        `SELECT category, subcategory, suggestedBudget
         FROM sys_config
         ORDER BY category, subcategory`
      )
      .all() as Array<{ category: string; subcategory: string; suggestedBudget: number }>;

    // Agrupar por categoría
    const grouped: Record<string, { subcategory: string; suggestedBudget: number }[]> = {};
    for (const row of rows) {
      if (!grouped[row.category]) grouped[row.category] = [];
      grouped[row.category].push({
        subcategory: row.subcategory,
        suggestedBudget: row.suggestedBudget,
      });
    }

    return Response.json(grouped);
  } catch (error) {
    console.error("[GET /api/config/categories]", error);
    return Response.json({ error: "Error al obtener categorías" }, { status: 500 });
  }
}
