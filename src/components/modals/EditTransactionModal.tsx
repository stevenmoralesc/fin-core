"use client";

import { useState, useEffect } from "react";
import type { Transaction, CategoriesByType, Account, CreditCard } from "@/lib/types";
import TransactionModal from "./TransactionModal";

interface EditTransactionModalProps {
  transaction: Pick<Transaction, "id" | "date" | "type" | "amount" | "category" | "description">;
  categories: CategoriesByType;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditTransactionModal({
  transaction,
  categories,
  onClose,
  onSuccess,
}: EditTransactionModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/accounts").then((r) => r.json()),
      fetch("/api/credit-cards").then((r) => r.json()),
    ]).then(([accs, ccs]) => {
      setAccounts(accs);
      setCreditCards(ccs);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  return (
    <TransactionModal
      transaction={transaction}
      accounts={accounts}
      creditCards={creditCards}
      categories={categories}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
