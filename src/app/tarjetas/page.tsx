/**
 * app/tarjetas/page.tsx — Server Component
 * Fetcha datos de las tarjetas de crédito y sus compras diferidas.
 */

import { db } from "@/lib/db";
import CreditCardView from "@/components/views/CreditCardView";
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
        const remaining = inst.totalMonths - inst.paidMonths;
        const monthly =
          inst.monthlyInterest > 0
            ? (inst.totalAmount * (inst.monthlyInterest / 100)) /
              (1 - Math.pow(1 + inst.monthlyInterest / 100, -inst.totalMonths))
            : inst.totalAmount / inst.totalMonths;

        usedLimit += monthly * remaining;
        nextBillAmount += monthly;
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



  return <CreditCardView initialData={details} accounts={accounts} />;
}

