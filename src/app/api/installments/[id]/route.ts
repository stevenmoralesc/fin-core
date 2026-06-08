import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// PATCH /api/installments/:id — pagar una cuota
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const purchase = db
      .prepare(`SELECT * FROM fact_compras_cuotas WHERE id = ?`)
      .get(id) as {
        id: string;
        paidMonths: number;
        totalMonths: number;
        status: string;
        totalAmount: number;
        establishment: string;
        creditCardId: string;
        purchaseDate: string;
      } | undefined;

    if (!purchase) {
      return Response.json({ error: "Compra no encontrada" }, { status: 404 });
    }

    if (purchase.status === "AMORTIZADA") {
      return Response.json({ error: "Esta compra ya está completamente pagada" }, { status: 400 });
    }

    const newPaidMonths = purchase.paidMonths + 1;
    const newStatus = newPaidMonths >= purchase.totalMonths ? "AMORTIZADA" : "VIGENTE";
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE fact_compras_cuotas
      SET paidMonths = @paidMonths, status = @status, updatedAt = @now
      WHERE id = @id
    `).run({ paidMonths: newPaidMonths, status: newStatus, now, id });

    return Response.json({ success: true, paidMonths: newPaidMonths, status: newStatus });
  } catch (error) {
    console.error("[PATCH /api/installments/:id]", error);
    return Response.json({ error: "Error al actualizar la cuota" }, { status: 500 });
  }
}

// DELETE /api/installments/:id — eliminar una compra diferida
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    db.prepare(`DELETE FROM fact_compras_cuotas WHERE id = ?`).run(id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/installments/:id]", error);
    return Response.json({ error: "Error al eliminar la compra" }, { status: 500 });
  }
}
