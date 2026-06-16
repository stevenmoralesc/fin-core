/**
 * prisma/seed-direct.mjs
 * ─────────────────────────────────────────────────────────────
 * Seed directo usando better-sqlite3 (sin Prisma Client).
 * Compatible con Node.js puro, sin transpilación.
 *
 * Ejecutar con: node prisma/seed-direct.mjs
 * ─────────────────────────────────────────────────────────────
 */

import BetterSqlite3 from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "..", "dev.db");

const db = new BetterSqlite3(dbPath);
console.log(`\n🌱  Seed iniciado → ${dbPath}\n`);

// ── Helper: upsert genérico ────────────────────────────────
function upsertAccount(row) {
  const existing = db.prepare("SELECT id FROM dim_cuentas WHERE id = ?").get(row.id);
  if (!existing) {
    db.prepare(`
      INSERT INTO dim_cuentas (id, name, type, initialBalance, currency, status, createdAt, updatedAt)
      VALUES (@id, @name, @type, @initialBalance, @currency, @status, @createdAt, @updatedAt)
    `).run({ ...row, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
}

function upsertCard(row) {
  const existing = db.prepare("SELECT id FROM dim_tarjetas_credito WHERE id = ?").get(row.id);
  if (!existing) {
    db.prepare(`
      INSERT INTO dim_tarjetas_credito (id, name, bank, totalLimit, closingDay, paymentDay, createdAt, updatedAt)
      VALUES (@id, @name, @bank, @totalLimit, @closingDay, @paymentDay, @createdAt, @updatedAt)
    `).run({ ...row, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
}

function upsertConfig(row) {
  const existing = db.prepare(
    "SELECT id FROM sys_config WHERE category = ? AND subcategory = ?"
  ).get(row.category, row.subcategory);
  if (!existing) {
    db.prepare(`
      INSERT INTO sys_config (category, subcategory, suggestedBudget, createdAt)
      VALUES (@category, @subcategory, @suggestedBudget, @createdAt)
    `).run({ ...row, createdAt: new Date().toISOString() });
  } else {
    db.prepare(
      "UPDATE sys_config SET suggestedBudget = ? WHERE category = ? AND subcategory = ?"
    ).run(row.suggestedBudget, row.category, row.subcategory);
  }
}

// ── 1. Cuentas ─────────────────────────────────────────────
const accounts = [
  { id: "acc_efectivo",    name: "Efectivo / Billetera", type: "EFECTIVO", initialBalance: 200000,   currency: "COP", status: "ACTIVA" },
  { id: "acc_bancolombia", name: "Bancolombia Ahorros",  type: "BANCO",    initialBalance: 1200000,  currency: "COP", status: "ACTIVA" },
  { id: "acc_nequi",       name: "Nequi",                type: "AHORRO",   initialBalance: 100000,   currency: "COP", status: "ACTIVA" },
];
for (const acc of accounts) upsertAccount(acc);
console.log(`✅  ${accounts.length} cuentas insertadas`);

// ── 2. Tarjeta de crédito ──────────────────────────────────
upsertCard({ id: "card_black", name: "Mastercard Black", bank: "Bancolombia", totalLimit: 1500000, closingDay: 25, paymentDay: 10 });
console.log(`✅  Tarjeta "Mastercard Black" insertada`);

// ── 3. Diccionario sys_config ──────────────────────────────
const categories = [
  { category: "INGRESO",         subcategory: "Salario",                  suggestedBudget: 0 },
  { category: "INGRESO",         subcategory: "Freelance",                suggestedBudget: 0 },
  { category: "INGRESO",         subcategory: "Arriendo recibido",        suggestedBudget: 0 },
  { category: "INGRESO",         subcategory: "Transferencia recibida",   suggestedBudget: 0 },
  { category: "INGRESO",         subcategory: "Reembolso",                suggestedBudget: 0 },
  { category: "INGRESO",         subcategory: "Otros ingresos",           suggestedBudget: 0 },
  { category: "VIVIENDA",        subcategory: "Arriendo",                 suggestedBudget: 800000 },
  { category: "VIVIENDA",        subcategory: "Servicios públicos",       suggestedBudget: 150000 },
  { category: "VIVIENDA",        subcategory: "Internet y TV",            suggestedBudget: 80000 },
  { category: "VIVIENDA",        subcategory: "Celular",                  suggestedBudget: 60000 },
  { category: "VIVIENDA",        subcategory: "Mantenimiento",            suggestedBudget: 50000 },
  { category: "ALIMENTACION",    subcategory: "Mercado",                  suggestedBudget: 300000 },
  { category: "ALIMENTACION",    subcategory: "Restaurantes",             suggestedBudget: 150000 },
  { category: "ALIMENTACION",    subcategory: "Domicilios",               suggestedBudget: 80000 },
  { category: "ALIMENTACION",    subcategory: "Café y snacks",            suggestedBudget: 40000 },
  { category: "TRANSPORTE",      subcategory: "Gasolina",                 suggestedBudget: 200000 },
  { category: "TRANSPORTE",      subcategory: "Transporte público",       suggestedBudget: 60000 },
  { category: "TRANSPORTE",      subcategory: "Taxi / Uber",              suggestedBudget: 80000 },
  { category: "TRANSPORTE",      subcategory: "Parqueadero",              suggestedBudget: 30000 },
  { category: "SALUD",           subcategory: "Medicina prepagada",       suggestedBudget: 120000 },
  { category: "SALUD",           subcategory: "Medicamentos",             suggestedBudget: 30000 },
  { category: "SALUD",           subcategory: "Consultas médicas",        suggestedBudget: 50000 },
  { category: "SALUD",           subcategory: "Gimnasio",                 suggestedBudget: 60000 },
  { category: "ENTRETENIMIENTO", subcategory: "Streaming",                suggestedBudget: 50000 },
  { category: "ENTRETENIMIENTO", subcategory: "Salidas y ocio",           suggestedBudget: 100000 },
  { category: "ENTRETENIMIENTO", subcategory: "Viajes",                   suggestedBudget: 200000 },
  { category: "ENTRETENIMIENTO", subcategory: "Libros y cursos",          suggestedBudget: 50000 },
  { category: "DEUDAS",          subcategory: "Cuota tarjeta de crédito", suggestedBudget: 0 },
  { category: "DEUDAS",          subcategory: "Crédito bancario",         suggestedBudget: 0 },
  { category: "DEUDAS",          subcategory: "Compra a cuotas",          suggestedBudget: 0 },
  { category: "AHORRO",          subcategory: "Fondo de emergencia",      suggestedBudget: 100000 },
  { category: "AHORRO",          subcategory: "Inversión / CDT",          suggestedBudget: 100000 },
  { category: "AHORRO",          subcategory: "Meta específica",          suggestedBudget: 50000 },
  { category: "OTROS",           subcategory: "Ropa y calzado",           suggestedBudget: 100000 },
  { category: "OTROS",           subcategory: "Mascotas",                 suggestedBudget: 50000 },
  { category: "OTROS",           subcategory: "Regalos",                  suggestedBudget: 50000 },
  { category: "OTROS",           subcategory: "Transferencia enviada",    suggestedBudget: 0 },
  { category: "OTROS",           subcategory: "Sin clasificar",           suggestedBudget: 0 },
];
for (const cat of categories) upsertConfig(cat);
console.log(`✅  ${categories.length} entradas insertadas en sys_config`);

// ── Verificación ───────────────────────────────────────────
const counts = {
  cuentas:     db.prepare("SELECT COUNT(*) as n FROM dim_cuentas").get().n,
  tarjetas:    db.prepare("SELECT COUNT(*) as n FROM dim_tarjetas_credito").get().n,
  categorias:  db.prepare("SELECT COUNT(*) as n FROM sys_config").get().n,
};

console.log(`\n📊  Resumen BD:`);
console.log(`    dim_cuentas:          ${counts.cuentas} registros`);
console.log(`    dim_tarjetas_credito: ${counts.tarjetas} registros`);
console.log(`    sys_config:           ${counts.categorias} registros`);
console.log(`\n🎉  Seed completado exitosamente.\n`);

db.close();
