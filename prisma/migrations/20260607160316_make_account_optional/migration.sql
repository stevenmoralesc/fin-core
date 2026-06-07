-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_fact_transacciones" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "debtReferenceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "accountId" TEXT,
    CONSTRAINT "fact_transacciones_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "dim_cuentas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_fact_transacciones" ("accountId", "amount", "category", "createdAt", "date", "debtReferenceId", "description", "id", "subcategory", "type", "updatedAt") SELECT "accountId", "amount", "category", "createdAt", "date", "debtReferenceId", "description", "id", "subcategory", "type", "updatedAt" FROM "fact_transacciones";
DROP TABLE "fact_transacciones";
ALTER TABLE "new_fact_transacciones" RENAME TO "fact_transacciones";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
