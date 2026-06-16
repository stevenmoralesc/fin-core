/**
 * app/tarjetas/page.tsx — Server Component
 * Fetcha datos de las tarjetas de crédito y sus compras diferidas.
 */

import { db } from "@/lib/db";
import CreditCardView from "@/components/views/CreditCardView";
import { monthlyPayment, outstandingPrincipal } from "@/lib/credit";
import type { Account, CreditCard, InstallmentPurchase, CreditCardDetails } from "@/lib/types";

export const dynamic = "force-dynamic";

function getAccounts(): Account[] {
  return db
    .prepare(
      `SELECT id, name, type, initialBalance, currency, status, createdAt, updatedAt
       FROM dim_cuentas WHERE status = 'ACTIVA' ORDER BY type, name`
    )
    .all() as Account[];
}

function getCreditCardDetails(): CreditCardDetails[] {
  const cards = db
    .prepare(
      `SELECT id, name, bank, totalLimit, closingDay, paymentDay, createdAt, updatedAt
       FROM dim_tarjetas_credito ORDER BY name`
    )
    .all() as CreditCard[];

  return cards.map((card) => {
    const installments = db
      .prepare(
        `SELECT id, purchaseDate, establishment, totalAmount, totalMonths, paidMonths,
                monthlyInterest, status, creditCardId, createdAt, updatedAt
         FROM fact_compras_cuotas
         WHERE creditCardId = ?
         ORDER BY purchaseDate DESC`
      )
      .all(card.id) as InstallmentPurchase[];

    let usedLimit = 0;
    let nextBillAmount = 0;

    for (const inst of installments) {
      if (inst.status === "VIGENTE") {
        // Cupo ocupado = capital pendiente (el interés no consume cupo).
        usedLimit += outstandingPrincipal(inst);
        // Próxima factura = suma de las cuotas mensuales vigentes.
        nextBillAmount += monthlyPayment(inst);
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
  const [details, accounts] = await Promise.all([
    Promise.resolve(getCreditCardDetails()),
    Promise.resolve(getAccounts()),
  ]);



  return (
    <div className="px-6 md:px-10 py-8">
      <CreditCardView initialData={details} accounts={accounts} />
    </div>
  );
}

