/**
 * src/lib/migrate.ts
 * ─────────────────────────────────────────────────────────────
 * Runner de migraciones mínimo para better-sqlite3.
 *
 * - Lee los archivos `migrations/*.sql` en orden alfabético.
 * - Aplica los que aún no estén registrados en la tabla `_migrations`.
 * - Cada migración corre dentro de una transacción: o se aplica
 *   completa o no se aplica (atómico).
 *
 * Convención de nombres: `NNNN_descripcion.sql` (ej. 0002_add_x.sql).
 * El prefijo numérico define el orden de ejecución.
 * ─────────────────────────────────────────────────────────────
 */

import type Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const MIGRATIONS_DIR = path.join(process.cwd(), "migrations");

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    (db.prepare("SELECT name FROM _migrations").all() as { name: string }[]).map(
      (r) => r.name
    )
  );

  if (!fs.existsSync(MIGRATIONS_DIR)) return;

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const record = db.prepare("INSERT INTO _migrations (name) VALUES (?)");

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    const apply = db.transaction(() => {
      db.exec(sql);
      record.run(file);
    });
    apply();

    if (process.env.NODE_ENV !== "production") {
      console.log(`[migrate] aplicada: ${file}`);
    }
  }
}
