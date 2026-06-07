/**
 * app/tarjetas/page.tsx — Server Component
 * Fetcha datos de las tarjetas de crédito y sus compras diferidas.
 */

import { db } from "@/lib/db";
import CreditCardView from "@/components/CreditCardView";
import type { CreditCard, InstallmentPurchase, CreditCardDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

function getCreditCardDetails(): CreditCardDetails[] {
  const cards = db
    .prepare(
      `SELECT id, name, bank, totalLimit, closingDay, paymentDay, createdAt, updatedAt
       FROM dim_tarjetas_credito ORDER BY name`
    )
    .all() as CreditCard[];

  return cards.map((card) => {
    // Obtener las compras diferidas para esta tarjeta
    const installments = db
      .prepare(
        `SELECT id, purchaseDate, establishment, totalAmount, totalMonths, paidMonths,
                monthlyInterest, status, creditCardId, createdAt, updatedAt
         FROM fact_compras_cuotas
         WHERE creditCardId = ?
         ORDER BY purchaseDate DESC`
      )
      .all(card.id) as InstallmentPurchase[];

    // Calcular KPIs
    let usedLimit = 0;
    let nextBillAmount = 0;

    for (const inst of installments) {
      if (inst.status === "VIGENTE") {
        const remainingMonths = inst.totalMonths - inst.paidMonths;
        const monthlyAmount = inst.totalAmount / inst.totalMonths; // lineal simple
        
        usedLimit += monthlyAmount * remainingMonths;
        nextBillAmount += monthlyAmount;
      }
    }

    return {
      card,
      installments,
      stats: {
        totalLimit: card.totalLimit,
        usedLimit,
        availableLimit: card.totalLimit - usedLimit,
        nextBillAmount,
      },
    };
  });
}

export default async function TarjetasPage() {
  const details = await Promise.resolve(getCreditCardDetails());
  
  if (details.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">No hay tarjetas registradas</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Agrega una tarjeta de crédito en tu base de datos para ver la amortización de tus compras a cuotas.
        </p>
      </div>
    );
  }

  return <CreditCardView initialData={details} />;
}
