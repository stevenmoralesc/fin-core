import { db } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, subcategory, suggestedBudget, transactionType = "GASTO" } = body;

    if (!category || !subcategory || suggestedBudget === undefined) {
      return Response.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    db.prepare(`
      INSERT INTO sys_config (category, subcategory, suggestedBudget, transactionType, createdAt)
      VALUES (@category, @subcategory, @suggestedBudget, @transactionType, @createdAt)
      ON CONFLICT(category, subcategory) DO UPDATE SET
        suggestedBudget = excluded.suggestedBudget,
        transactionType = excluded.transactionType
    `).run({
      category: category.trim(),
      subcategory: subcategory.trim(),
      suggestedBudget: Number(suggestedBudget),
      transactionType,
      createdAt: new Date().toISOString(),
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/budgets]", error);
    return Response.json({ error: "Error al guardar el presupuesto" }, { status: 500 });
  }
}
