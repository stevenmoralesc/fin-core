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
    const { type, category, amount, description, date } = body;

    const existing = db
      .prepare(`SELECT id, debtReferenceId FROM fact_transacciones WHERE id = ?`)
      .get(id) as { id: string, debtReferenceId: string | null };
    if (!existing) {
      return Response.json({ error: "Transacción no encontrada" }, { status: 404 });
    }

    db.prepare(`
      UPDATE fact_transacciones
      SET type = @type,
          category = @category,

          amount = @amount,
          description = @description,
          date = @date,
          updatedAt = @now
      WHERE id = @id
    `).run({
      id,
      type,
      category: category.trim(),

      amount: Number(amount),
      description: description ?? null,
      date: date || new Date().toISOString().slice(0, 10),
      now: new Date().toISOString(),
    });
    if (existing.debtReferenceId) {
      db.prepare(`
        UPDATE fact_compras_cuotas
        SET totalAmount = @amount, establishment = @description, updatedAt = @now
        WHERE id = @debtId
      `).run({
        amount: Number(amount),
        description: description ?? null,
        now: new Date().toISOString(),
        debtId: existing.debtReferenceId,
      });
    }

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
    const existing = db.prepare(`SELECT debtReferenceId FROM fact_transacciones WHERE id = ?`).get(id) as { debtReferenceId: string | null } | undefined;
    
    if (existing?.debtReferenceId) {
      db.prepare(`DELETE FROM fact_compras_cuotas WHERE id = ?`).run(existing.debtReferenceId);
    }
    
    db.prepare(`DELETE FROM fact_transacciones WHERE id = ?`).run(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/transactions/:id]", error);
    return Response.json({ error: "Error al eliminar la transacción" }, { status: 500 });
  }
}
