import { db } from "@/lib/db";
import type { NextRequest } from "next/server";

// PATCH /api/transactions/:id — editar una transacción
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, category, subcategory, amount, description, date } = body;

    const existing = db
      .prepare(`SELECT id FROM fact_transacciones WHERE id = ?`)
      .get(id);
    if (!existing) {
      return Response.json({ error: "Transacción no encontrada" }, { status: 404 });
    }

    db.prepare(`
      UPDATE fact_transacciones
      SET type = @type,
          category = @category,
          subcategory = @subcategory,
          amount = @amount,
          description = @description,
          date = @date,
          updatedAt = @now
      WHERE id = @id
    `).run({
      id,
      type,
      category: category.trim(),
      subcategory: subcategory.trim(),
      amount: Number(amount),
      description: description ?? null,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      now: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/transactions/:id]", error);
    return Response.json({ error: "Error al actualizar la transacción" }, { status: 500 });
  }
}

// DELETE /api/transactions/:id — eliminar una transacción
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    db.prepare(`DELETE FROM fact_transacciones WHERE id = ?`).run(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/transactions/:id]", error);
    return Response.json({ error: "Error al eliminar la transacción" }, { status: 500 });
  }
}
