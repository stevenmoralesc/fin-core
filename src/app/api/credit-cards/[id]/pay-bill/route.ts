import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { monthlyPayment } from "@/lib/credit";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/credit-cards/:id/pay-bill — pagar la factura del mes:
// avanza +1 cuota en TODAS las compras vigentes de la tarjeta y
// registra el movimiento de caja (un GASTO por compra, con
// debtReferenceId para que solo reduzca el saldo, sin doble conteo).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { accountId } = body as { accountId?: string };

    const card = db
      .prepare(`SELECT id FROM dim_tarjetas_credito WHERE id = ?`)
      .get(id);
    if (!card) {
      return Response.json({ error: "Tarjeta no encontrada" }, { status: 404 });
    }

    if (!accountId || typeof accountId !== "string") {
      return Response.json(
        { error: "Selecciona la cuenta desde la que se paga la factura" },
        { status: 400 }
      );
    }
    const account = db.prepare(`SELECT id FROM dim_cuentas WHERE id = ?`).get(accountId);
    if (!account) {
      return Response.json({ error: "La cuenta de pago no existe" }, { status: 400 });
    }

    const vigentes = db
      .prepare(
        `SELECT id, establishment, totalAmount, totalMonths, paidMonths, monthlyInterest
         FROM fact_compras_cuotas
         WHERE creditCardId = ? AND status = 'VIGENTE' AND totalMonths > paidMonths`
      )
      .all(id) as {
        id: string;
        establishment: string;
        totalAmount: number;
        totalMonths: number;
        paidMonths: number;
        monthlyInterest: number;
      }[];

    if (vigentes.length === 0) {
      return Response.json(
        { error: "No hay cuotas pendientes para esta tarjeta" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const d = new Date();
    const today =
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0");

    let cuotasPagadas = 0;
    let total = 0;

    const payBill = db.transaction(() => {
      const updateStmt = db.prepare(
        `UPDATE fact_compras_cuotas SET paidMonths = @paidMonths, status = @status, updatedAt = @now WHERE id = @id`
      );
      const insertStmt = db.prepare(
        `INSERT INTO fact_transacciones
           (id, date, type, category, amount, description, accountId, destinationAccountId, debtReferenceId, createdAt, updatedAt)
         VALUES
           (@id, @date, 'GASTO', 'Tarjetas de Crédito', @amount, @description, @accountId, NULL, @debtReferenceId, @now, @now)`
      );

      for (const inst of vigentes) {
        const newPaidMonths = inst.paidMonths + 1;
        const newStatus = newPaidMonths >= inst.totalMonths ? "AMORTIZADA" : "VIGENTE";
        const monthly = monthlyPayment(inst);

        updateStmt.run({ paidMonths: newPaidMonths, status: newStatus, now, id: inst.id });
        insertStmt.run({
          id: randomUUID(),
          date: today,
          amount: monthly,
          description: `Pago cuota ${newPaidMonths}/${inst.totalMonths} · ${inst.establishment}`,
          accountId,
          debtReferenceId: inst.id,
          now,
        });

        cuotasPagadas++;
        total += monthly;
      }
    });
    payBill();

    return Response.json({ success: true, cuotasPagadas, total });
  } catch (error) {
    console.error("[POST /api/credit-cards/:id/pay-bill]", error);
    return Response.json({ error: "Error al pagar la factura" }, { status: 500 });
  }
}
