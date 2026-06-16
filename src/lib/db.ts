/**
 * src/lib/db.ts
 * ─────────────────────────────────────────────────────────────
 * Singleton de better-sqlite3 para usar en API Routes (server-side).
 * Evita múltiples conexiones en desarrollo con hot-reload.
 * ─────────────────────────────────────────────────────────────
 */

import Database from "better-sqlite3";
import path from "path";
import { runMigrations } from "./migrate";

const DB_PATH = path.join(process.cwd(), "dev.db");

declare global {
  var __db: Database.Database | undefined;
}

function createDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  // Esquema gestionado por archivos migrations/*.sql (ver src/lib/migrate.ts).
  // Se ejecuta una sola vez por conexión, al crearla.
  runMigrations(db);
  return db;
}

export const db: Database.Database =
  globalThis.__db ?? (globalThis.__db = createDb());

if (process.env.NODE_ENV !== "production") {
  globalThis.__db = db;
}
