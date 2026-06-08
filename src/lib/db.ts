/**
 * src/lib/db.ts
 * ─────────────────────────────────────────────────────────────
 * Singleton de better-sqlite3 para usar en API Routes (server-side).
 * Evita múltiples conexiones en desarrollo con hot-reload.
 * ─────────────────────────────────────────────────────────────
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "dev.db");

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

function createDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export const db: Database.Database =
  globalThis.__db ?? (globalThis.__db = createDb());

if (process.env.NODE_ENV !== "production") {
  globalThis.__db = db;
}

// ── Migraciones inline (siempre se evalúan en cada hot-reload) ────
// Añade transactionType a sys_config si no existe (idempotente)
const _cols = db.prepare("PRAGMA table_info(sys_config)").all() as { name: string }[];
if (!_cols.find((c) => c.name === "transactionType")) {
  db.prepare(
    `ALTER TABLE sys_config ADD COLUMN transactionType TEXT NOT NULL DEFAULT 'GASTO'`
  ).run();
}
