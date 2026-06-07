/*
  Warnings:

  - You are about to drop the column `date` on the `fact_compras_cuotas` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyInterestRate` on the `fact_compras_cuotas` table. All the data in the column will be lost.
  - You are about to drop the column `paidInstallments` on the `fact_compras_cuotas` table. All the data in the column will be lost.
  - You are about to drop the column `totalInstallments` on the `fact_compras_cuotas` table. All the data in the column will be lost.
  - Added the required column `totalMonths` to the `fact_compras_cuotas` table without a default value. This is not possible if the table is not empty.
  - Made the column `accountId` on table `fact_transacciones` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_fact_compras_cuotas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "establishment" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "totalMonths" INTEGER NOT NULL,
    "paidMonths" INTEGER NOT NULL DEFAULT 0,
    "monthlyInterest" REAL NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'VIGENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "creditCardId" TEXT NOT NULL,
    CONSTRAINT "fact_compras_cuotas_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "dim_tarjetas_credito" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_fact_compras_cuotas" ("createdAt", "creditCardId", "establishment", "id", "status", "totalAmount", "updatedAt") SELECT "createdAt", "creditCardId", "establishment", "id", "status", "totalAmount", "updatedAt" FROM "fact_compras_cuotas";
DROP TABLE "fact_compras_cuotas";
ALTER TABLE "new_fact_compras_cuotas" RENAME TO "fact_compras_cuotas";
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
    "accountId" TEXT NOT NULL,
    CONSTRAINT "fact_transacciones_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "dim_cuentas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_fact_transacciones" ("accountId", "amount", "category", "createdAt", "date", "description", "id", "subcategory", "type", "updatedAt") SELECT "accountId", "amount", "category", "createdAt", "date", "description", "id", "subcategory", "type", "updatedAt" FROM "fact_transacciones";
DROP TABLE "fact_transacciones";
ALTER TABLE "new_fact_transacciones" RENAME TO "fact_transacciones";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
