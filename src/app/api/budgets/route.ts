import { db } from "@/lib/db";
import { toCents } from "@/lib/money";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, suggestedBudget, transactionType = "GASTO", icon } = body;

    if (!category || suggestedBudget === undefined) {
      return Response.json({ error: "Campos requeridos faltantes" }, { status: 400 });
    }

    db.prepare(`
      INSERT INTO sys_config (category, icon, suggestedBudget, transactionType, createdAt)
      VALUES (@category, @icon, @suggestedBudget, @transactionType, @createdAt)
      ON CONFLICT(category, transactionType) DO UPDATE SET
        suggestedBudget = excluded.suggestedBudget,
        icon = excluded.icon
    `).run({
      category: category.trim(),
      icon: icon ? icon.trim() : null,
      suggestedBudget: toCents(Number(suggestedBudget)),
      transactionType,
      createdAt: new Date().toISOString(),
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/budgets]", error);
    return Response.json({ error: "Error al guardar el presupuesto" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const transactionType = searchParams.get("transactionType");

    if (!category) {
      return Response.json({ error: "Falta la categoría" }, { status: 400 });
    }

    if (transactionType) {
      db.prepare(`DELETE FROM sys_config WHERE category = ? AND transactionType = ?`).run(category, transactionType);
    } else {
      db.prepare(`DELETE FROM sys_config WHERE category = ?`).run(category);
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[DELETE /api/budgets]", error);
    return Response.json({ error: "Error al eliminar el presupuesto" }, { status: 500 });
  }
}
