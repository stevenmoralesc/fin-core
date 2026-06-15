import { db } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, bank, totalLimit, closingDay, paymentDay } = body;

    if (typeof name !== "string" || !name.trim() || typeof bank !== "string" || !bank.trim()) {
      return Response.json({ error: "Nombre y banco son requeridos" }, { status: 400 });
    }
    const limitNum = Number(totalLimit);
    if (!Number.isFinite(limitNum) || limitNum <= 0) {
      return Response.json({ error: "El cupo total debe ser un número mayor a 0" }, { status: 400 });
    }
    const closing = Number(closingDay);
    const payment = Number(paymentDay);
    if (!Number.isInteger(closing) || closing < 1 || closing > 31 ||
        !Number.isInteger(payment) || payment < 1 || payment > 31) {
      return Response.json({ error: "Los días de corte y pago deben estar entre 1 y 31" }, { status: 400 });
    }

    const existing = db
      .prepare(`SELECT id FROM dim_tarjetas_credito WHERE id = ?`)
      .get(id);
    if (!existing) {
      return Response.json({ error: "Tarjeta no encontrada" }, { status: 404 });
    }

    db.prepare(`
      UPDATE dim_tarjetas_credito
      SET name = @name,
          bank = @bank,
          totalLimit = @totalLimit,
          closingDay = @closingDay,
          paymentDay = @paymentDay,
          updatedAt = @now
      WHERE id = @id
    `).run({
      id,
      name: name.trim(),
      bank: bank.trim(),
      totalLimit: limitNum,
      closingDay: closing,
      paymentDay: payment,
      now: new Date().toISOString(),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/credit-cards/:id]", error);
    return Response.json({ error: "Error al actualizar la tarjeta" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if there are active installments
    const hasInstallments = db
      .prepare(`SELECT id FROM fact_compras_cuotas WHERE creditCardId = ? LIMIT 1`)
      .get(id);
      
    if (hasInstallments) {
      return Response.json({ error: "No puedes eliminar una tarjeta que tiene compras registradas. Elimina las compras primero." }, { status: 400 });
    }

    db.prepare(`DELETE FROM dim_tarjetas_credito WHERE id = ?`).run(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/credit-cards/:id]", error);
    return Response.json({ error: "Error al eliminar la tarjeta" }, { status: 500 });
  }
}
