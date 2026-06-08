/**
 * src/lib/types.ts
 * Tipos compartidos entre API y componentes
 * — sincronizados con el schema fusionado
 */

export interface Account {
  id: string;
  name: string;
  type: string;        // EFECTIVO | AHORROS | CORRIENTE
  initialBalance: number;
  currency: string;   // COP | USD
  status: string;     // ACTIVA | INACTIVA
  createdAt: string;
  updatedAt: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  totalLimit: number;
  closingDay: number;
  paymentDay: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: "INGRESO" | "GASTO" | "TRANSFERENCIA";
  category: string;
  subcategory: string;
  amount: number;
  description: string | null;
  accountId: string | null;
  debtReferenceId: string | null;
  paymentMethodName?: string | null;  // joined from account or credit card name
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentPurchase {
  id: string;
  purchaseDate: string;       // renombrado desde date
  establishment: string;
  totalAmount: number;
  totalMonths: number;        // renombrado desde totalInstallments
  paidMonths: number;         // renombrado desde paidInstallments
  monthlyInterest: number;    // renombrado desde monthlyInterestRate
  status: "VIGENTE" | "AMORTIZADA"; // vocabulario del dominio
  creditCardId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfig {
  id: number;
  category: string;
  subcategory: string;
  suggestedBudget: number;
  transactionType: "INGRESO" | "GASTO" | "TRANSFERENCIA";
  createdAt: string;
}

// Mapa de categorías agrupadas por tipo de transacción
export type CategoriesByType = Record<
  "INGRESO" | "GASTO" | "TRANSFERENCIA",
  Record<string, { subcategory: string; suggestedBudget: number }[]>
>;

export interface DashboardSummary {
  liquidezTotal: number;
  cupoUtilizadoTC: number;
  limiteTC: number;
  cupoUtilizadoPct: number;
  gastosCorrientesMes: number;
  recentTransactions: Transaction[];
  cuentasActivas: Account[];
}

export interface TransactionCreate {
  date?: string;
  type: "INGRESO" | "GASTO" | "TRANSFERENCIA";
  category: string;
  subcategory: string;
  amount: number;
  description?: string | null;
  paymentMethodId: string;    // ID de la cuenta o tarjeta
  paymentMethodType: "ACCOUNT" | "CREDIT_CARD";
  installments?: number;      // Número de cuotas (solo para TC)
}

export interface CreditCardDetails {
  card: CreditCard;
  installments: InstallmentPurchase[];
  stats: {
    totalLimit: number;
    usedLimit: number;
    availableLimit: number;
    nextBillAmount: number;
  };
}
