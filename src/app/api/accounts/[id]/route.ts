import { db } from "@/lib/db";
import { toCents } from "@/lib/money";
import type { NextRequest } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, initialBalance } = body;

    if (typeof name !== "string" || !name.trim() || typeof type !== "string" || !type) {
      return Response.json({ error: "Nombre y tipo son requeridos" }, { status: 400 });
    }
    const balanceNum = Number(initialBalance);
    if (!Number.isFinite(balanceNum)) {
      return Response.json({ error: "El saldo inicial debe ser numérico" }, { status: 400 });
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE dim_cuentas
      SET name = @name, type = @type, initialBalance = @initialBalance, updatedAt = @now
      WHERE id = @id
    `).run({ id, name: name.trim(), type, initialBalance: toCents(balanceNum), now });

    return Response.json({ success: true });
  } catch (error) {
    console.error("[PUT /api/accounts/:id]", error);
    return Response.json({ error: "Error al actualizar la cuenta" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Check if it has transactions
    const count = db.prepare(`SELECT count(*) as total FROM fact_transacciones WHERE accountId = ?`).get(id) as { total: number };
    
    if (count.total > 0) {
      return Response.json({ error: "No se puede eliminar la cuenta porque tiene transacciones asociadas." }, { status: 400 });
    }

    db.prepare(`DELETE FROM dim_cuentas WHERE id = ?`).run(id);

    return Response.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/accounts/:id]", error);
    return Response.json({ error: "Error al eliminar la cuenta" }, { status: 500 });
  }
}
