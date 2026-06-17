import { db } from "@/lib/db";
import CategoriesManager from "@/components/views/CategoriesManager";

export const dynamic = "force-dynamic";

export interface CategoryItem {
  category: string;
  transactionType: "INGRESO" | "GASTO" | "TRANSFERENCIA";
  icon?: string | null;
  suggestedBudget: number; // tope en centavos (solo relevante para GASTO)
}

export default async function CategoriasPage() {
  const categories = db
    .prepare(
      `SELECT category, transactionType, icon, suggestedBudget
       FROM sys_config
       ORDER BY transactionType, category`
    )
    .all() as CategoryItem[];

  return (
    <div className="px-6 md:px-10 py-8">
      <CategoriesManager initialCategories={categories} />
    </div>
  );
}
