import { db } from "@/lib/db";
import { toCents } from "@/lib/money";
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

    // Validación de entrada
    if (typeof category !== "string" || !category.trim()) {
      return Response.json({ error: "La categoría es requerida" }, { status: 400 });
    }
    if (!["INGRESO", "GASTO", "TRANSFERENCIA"].includes(type)) {
      return Response.json({ error: "type debe ser INGRESO, GASTO o TRANSFERENCIA" }, { status: 400 });
    }
    const amountNum = Number(amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return Response.json({ error: "El monto debe ser un número mayor a 0" }, { status: 400 });
    }
    const txDate = (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date))
      ? date.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    const existing = db
      .prepare(`SELECT id, debtReferenceId FROM fact_transacciones WHERE id = ?`)
      .get(id) as { id: string, debtReferenceId: string | null } | undefined;
    if (!existing) {
      return Response.json({ error: "Transacción no encontrada" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updateAll = db.transaction(() => {
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
        amount: toCents(amountNum),
        description: description ?? null,
        date: txDate,
        now,
      });

      if (existing.debtReferenceId) {
        db.prepare(`
          UPDATE fact_compras_cuotas
          SET totalAmount = @amount, establishment = @description, updatedAt = @now
          WHERE id = @debtId
        `).run({
          amount: toCents(amountNum),
          description: description ?? null,
          now,
          debtId: existing.debtReferenceId,
        });
      }
    });
    updateAll();

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

    // Borrado atómico: la transacción y su compra a cuotas asociada (si existe).
    const deleteAll = db.transaction(() => {
      if (existing?.debtReferenceId) {
        db.prepare(`DELETE FROM fact_compras_cuotas WHERE id = ?`).run(existing.debtReferenceId);
      }
      db.prepare(`DELETE FROM fact_transacciones WHERE id = ?`).run(id);
    });
    deleteAll();

    return Response.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/transactions/:id]", error);
    return Response.json({ error: "Error al eliminar la transacción" }, { status: 500 });
  }
}
