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
    const body = await request.json().catch(() => ({}));
    const { accountId } = body as { accountId?: string };

    const purchase = db
      .prepare(`SELECT * FROM fact_compras_cuotas WHERE id = ?`)
      .get(id) as {
        id: string;
        paidMonths: number;
        totalMonths: number;
        monthlyInterest: number;
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

    if (!purchase.totalMonths || purchase.totalMonths <= 0) {
      return Response.json({ error: "La compra tiene un número de cuotas inválido" }, { status: 400 });
    }

    // La cuenta desde la que se paga es obligatoria (el pago mueve el saldo).
    if (!accountId || typeof accountId !== "string") {
      return Response.json({ error: "Selecciona la cuenta desde la que se paga la cuota" }, { status: 400 });
    }
    const account = db.prepare(`SELECT id FROM dim_cuentas WHERE id = ?`).get(accountId);
    if (!account) {
      return Response.json({ error: "La cuenta de pago no existe" }, { status: 400 });
    }

    const newPaidMonths = purchase.paidMonths + 1;
    const newStatus = newPaidMonths >= purchase.totalMonths ? "AMORTIZADA" : "VIGENTE";
    const now = new Date().toISOString();
    const d = new Date();
    const today = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');

    // Valor de la cuota mensual (amortización francesa si hay interés).
    const interest = purchase.monthlyInterest || 0;
    const monthly = interest > 0
      ? (purchase.totalAmount * (interest / 100)) / (1 - Math.pow(1 + interest / 100, -purchase.totalMonths))
      : purchase.totalAmount / purchase.totalMonths;

    // Atómico: subir la cuota pagada + registrar el gasto contra la cuenta.
    // El gasto lleva debtReferenceId para excluirse del KPI de "gastos del periodo"
    // (el gasto ya se devengó vía la cuota); solo reduce el saldo de la cuenta.
    const payInstallment = db.transaction(() => {
      db.prepare(`
        UPDATE fact_compras_cuotas
        SET paidMonths = @paidMonths, status = @status, updatedAt = @now
        WHERE id = @id
      `).run({ paidMonths: newPaidMonths, status: newStatus, now, id });

      db.prepare(`
        INSERT INTO fact_transacciones
          (id, date, type, category, amount, description, accountId, destinationAccountId, debtReferenceId, createdAt, updatedAt)
        VALUES
          (@id, @date, 'GASTO', 'Tarjetas de Crédito', @amount, @description, @accountId, NULL, @debtReferenceId, @now, @now)
      `).run({
        id: randomUUID(),
        date: today,
        amount: monthly,
        description: `Pago cuota ${newPaidMonths}/${purchase.totalMonths} · ${purchase.establishment}`,
        accountId,
        debtReferenceId: id,
        now,
      });
    });
    payInstallment();

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

    // Borrado atómico: la compra a cuotas y cualquier transacción que la referencie.
    const deleteAll = db.transaction(() => {
      db.prepare(`DELETE FROM fact_transacciones WHERE debtReferenceId = ?`).run(id);
      db.prepare(`DELETE FROM fact_compras_cuotas WHERE id = ?`).run(id);
    });
    deleteAll();

    return Response.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/installments/:id]", error);
    return Response.json({ error: "Error al eliminar la compra" }, { status: 500 });
  }
}
