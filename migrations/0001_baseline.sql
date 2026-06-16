-- ─────────────────────────────────────────────────────────────
--  0001_baseline — esquema completo de FinControl
--  Refleja el estado real de dev.db. Idempotente (IF NOT EXISTS)
--  para poder aplicarse tanto sobre una BD nueva como sobre la
--  BD existente sin destruir datos.
-- ─────────────────────────────────────────────────────────────

-- dim_cuentas
CREATE TABLE IF NOT EXISTS "dim_cuentas" (
    "id"             TEXT NOT NULL PRIMARY KEY,
    "name"           TEXT NOT NULL,
    "type"           TEXT NOT NULL,                       -- EFECTIVO | AHORROS | CORRIENTE
    "initialBalance" REAL NOT NULL DEFAULT 0,
    "currency"       TEXT NOT NULL DEFAULT 'COP',         -- COP | USD
    "status"         TEXT NOT NULL DEFAULT 'ACTIVA',      -- ACTIVA | INACTIVA
    "createdAt"      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      DATETIME NOT NULL
);

-- dim_tarjetas_credito
CREATE TABLE IF NOT EXISTS "dim_tarjetas_credito" (
    "id"         TEXT NOT NULL PRIMARY KEY,
    "name"       TEXT NOT NULL,
    "bank"       TEXT NOT NULL,
    "totalLimit" REAL NOT NULL,
    "closingDay" INTEGER NOT NULL,
    "paymentDay" INTEGER NOT NULL,
    "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  DATETIME NOT NULL
);

-- fact_estados_cuenta
CREATE TABLE IF NOT EXISTS "fact_estados_cuenta" (
    "id"           TEXT NOT NULL PRIMARY KEY,
    "startDate"    DATETIME NOT NULL,
    "closingDate"  DATETIME NOT NULL,
    "dueDate"      DATETIME NOT NULL,
    "status"       TEXT NOT NULL DEFAULT 'ABIERTO',       -- ABIERTO | FACTURADO | PAGADO
    "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    DATETIME NOT NULL,
    "creditCardId" TEXT NOT NULL,
    CONSTRAINT "fact_estados_cuenta_creditCardId_fkey"
        FOREIGN KEY ("creditCardId") REFERENCES "dim_tarjetas_credito" ("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- fact_compras_cuotas
CREATE TABLE IF NOT EXISTS "fact_compras_cuotas" (
    "id"              TEXT NOT NULL PRIMARY KEY,
    "purchaseDate"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "establishment"   TEXT NOT NULL,
    "totalAmount"     REAL NOT NULL,
    "totalMonths"     INTEGER NOT NULL,
    "paidMonths"      INTEGER NOT NULL DEFAULT 0,
    "monthlyInterest" REAL NOT NULL DEFAULT 0.0,
    "status"          TEXT NOT NULL DEFAULT 'VIGENTE',    -- VIGENTE | AMORTIZADA
    "createdAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       DATETIME NOT NULL,
    "creditCardId"    TEXT NOT NULL,
    "statementId"     TEXT,
    CONSTRAINT "fact_compras_cuotas_creditCardId_fkey"
        FOREIGN KEY ("creditCardId") REFERENCES "dim_tarjetas_credito" ("id")
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "fact_compras_cuotas_statementId_fkey"
        FOREIGN KEY ("statementId") REFERENCES "fact_estados_cuenta" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- fact_transacciones
CREATE TABLE IF NOT EXISTS "fact_transacciones" (
    "id"                   TEXT NOT NULL PRIMARY KEY,
    "date"                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type"                 TEXT NOT NULL,                 -- INGRESO | GASTO | TRANSFERENCIA
    "category"             TEXT NOT NULL,
    "amount"               REAL NOT NULL,
    "description"          TEXT,
    "debtReferenceId"      TEXT,                          -- FK lógica → fact_compras_cuotas
    "createdAt"            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            DATETIME NOT NULL,
    "accountId"            TEXT,
    "destinationAccountId" TEXT,                          -- cuenta destino de TRANSFERENCIA
    CONSTRAINT "fact_transacciones_accountId_fkey"
        FOREIGN KEY ("accountId") REFERENCES "dim_cuentas" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- sys_config (catálogo de categorías + presupuesto sugerido)
CREATE TABLE IF NOT EXISTS "sys_config" (
    "id"              INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category"        TEXT NOT NULL,
    "suggestedBudget" REAL NOT NULL DEFAULT 0,
    "transactionType" TEXT NOT NULL DEFAULT 'GASTO',
    "createdAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "icon"            TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS "sys_config_category_transactionType_key"
    ON "sys_config" ("category", "transactionType");
