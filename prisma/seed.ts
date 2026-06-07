/**
 * prisma/seed.ts
 * ─────────────────────────────────────────────────────────────
 * Pobla la base de datos con:
 *   - Cuentas (efectivo + bancarias)
 *   - Tarjeta de crédito (Black)
 *   - Diccionario de categorías + presupuestos sugeridos (sys_config)
 *
 * Usa @prisma/adapter-better-sqlite3 (requerido por Prisma v7)
 * ─────────────────────────────────────────────────────────────
 */

import { PrismaClient } from "../src/generated/prisma";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "..", "prisma", "dev.db");
const sqlite = new Database(dbPath);
const adapter = new PrismaBetterSQLite3(sqlite);
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  console.log("🌱  Iniciando seed...\n");

  // ── 1. Cuentas ──────────────────────────────────────────────
  const accounts = await Promise.all([
    prisma.account.upsert({
      where: { id: "acc_efectivo" },
      update: {},
      create: {
        id: "acc_efectivo",
        name: "Efectivo / Billetera",
        type: "EFECTIVO",
        initialBalance: 200_000,
        currency: "COP",
        status: "ACTIVA",
      },
    }),
    prisma.account.upsert({
      where: { id: "acc_bancolombia" },
      update: {},
      create: {
        id: "acc_bancolombia",
        name: "Bancolombia Ahorros",
        type: "BANCO",
        initialBalance: 1_200_000,
        currency: "COP",
        status: "ACTIVA",
      },
    }),
    prisma.account.upsert({
      where: { id: "acc_nequi" },
      update: {},
      create: {
        id: "acc_nequi",
        name: "Nequi",
        type: "AHORRO",
        initialBalance: 100_000,
        currency: "COP",
        status: "ACTIVA",
      },
    }),
  ]);
  console.log(`✅  ${accounts.length} cuentas creadas`);

  // ── 2. Tarjeta de crédito ───────────────────────────────────
  const card = await prisma.creditCard.upsert({
    where: { id: "card_black" },
    update: {},
    create: {
      id: "card_black",
      name: "Mastercard Black",
      bank: "Bancolombia",
      totalLimit: 1_500_000,
      closingDay: 25,
      paymentDay: 10,
    },
  });
  console.log(`✅  Tarjeta "${card.name}" creada`);

  // ── 3. Diccionario de categorías (sys_config) ───────────────
  const categories: Array<{
    category: string;
    subcategory: string;
    suggestedBudget: number;
  }> = [
    // INGRESOS
    { category: "INGRESO", subcategory: "Salario",                    suggestedBudget: 0 },
    { category: "INGRESO", subcategory: "Freelance",                  suggestedBudget: 0 },
    { category: "INGRESO", subcategory: "Arriendo recibido",          suggestedBudget: 0 },
    { category: "INGRESO", subcategory: "Transferencia recibida",     suggestedBudget: 0 },
    { category: "INGRESO", subcategory: "Reembolso",                  suggestedBudget: 0 },
    { category: "INGRESO", subcategory: "Otros ingresos",             suggestedBudget: 0 },

    // VIVIENDA
    { category: "VIVIENDA", subcategory: "Arriendo",                  suggestedBudget: 800_000 },
    { category: "VIVIENDA", subcategory: "Servicios públicos",        suggestedBudget: 150_000 },
    { category: "VIVIENDA", subcategory: "Internet y TV",             suggestedBudget: 80_000 },
    { category: "VIVIENDA", subcategory: "Celular",                   suggestedBudget: 60_000 },
    { category: "VIVIENDA", subcategory: "Mantenimiento",             suggestedBudget: 50_000 },

    // ALIMENTACIÓN
    { category: "ALIMENTACION", subcategory: "Mercado",               suggestedBudget: 300_000 },
    { category: "ALIMENTACION", subcategory: "Restaurantes",          suggestedBudget: 150_000 },
    { category: "ALIMENTACION", subcategory: "Domicilios",            suggestedBudget: 80_000 },
    { category: "ALIMENTACION", subcategory: "Café y snacks",         suggestedBudget: 40_000 },

    // TRANSPORTE
    { category: "TRANSPORTE", subcategory: "Gasolina",                suggestedBudget: 200_000 },
    { category: "TRANSPORTE", subcategory: "Transporte público",      suggestedBudget: 60_000 },
    { category: "TRANSPORTE", subcategory: "Taxi / Uber",             suggestedBudget: 80_000 },
    { category: "TRANSPORTE", subcategory: "Parqueadero",             suggestedBudget: 30_000 },

    // SALUD
    { category: "SALUD", subcategory: "Medicina prepagada",           suggestedBudget: 120_000 },
    { category: "SALUD", subcategory: "Medicamentos",                 suggestedBudget: 30_000 },
    { category: "SALUD", subcategory: "Consultas médicas",            suggestedBudget: 50_000 },
    { category: "SALUD", subcategory: "Gimnasio",                     suggestedBudget: 60_000 },

    // ENTRETENIMIENTO
    { category: "ENTRETENIMIENTO", subcategory: "Streaming",          suggestedBudget: 50_000 },
    { category: "ENTRETENIMIENTO", subcategory: "Salidas y ocio",     suggestedBudget: 100_000 },
    { category: "ENTRETENIMIENTO", subcategory: "Viajes",             suggestedBudget: 200_000 },
    { category: "ENTRETENIMIENTO", subcategory: "Libros y cursos",    suggestedBudget: 50_000 },

    // DEUDAS Y CUOTAS
    { category: "DEUDAS", subcategory: "Cuota tarjeta de crédito",    suggestedBudget: 0 },
    { category: "DEUDAS", subcategory: "Crédito bancario",            suggestedBudget: 0 },
    { category: "DEUDAS", subcategory: "Compra a cuotas",             suggestedBudget: 0 },

    // AHORRO E INVERSIÓN
    { category: "AHORRO", subcategory: "Fondo de emergencia",         suggestedBudget: 100_000 },
    { category: "AHORRO", subcategory: "Inversión / CDT",             suggestedBudget: 100_000 },
    { category: "AHORRO", subcategory: "Meta específica",             suggestedBudget: 50_000 },

    // OTROS
    { category: "OTROS", subcategory: "Ropa y calzado",               suggestedBudget: 100_000 },
    { category: "OTROS", subcategory: "Mascotas",                     suggestedBudget: 50_000 },
    { category: "OTROS", subcategory: "Regalos",                      suggestedBudget: 50_000 },
    { category: "OTROS", subcategory: "Transferencia enviada",        suggestedBudget: 0 },
    { category: "OTROS", subcategory: "Sin clasificar",               suggestedBudget: 0 },
  ];

  let configCount = 0;
  for (const entry of categories) {
    await prisma.systemConfig.upsert({
      where: {
        category_subcategory: {
          category: entry.category,
          subcategory: entry.subcategory,
        },
      },
      update: { suggestedBudget: entry.suggestedBudget },
      create: entry,
    });
    configCount++;
  }
  console.log(`✅  ${configCount} entradas en sys_config`);

  console.log("\n🎉  Seed completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("❌  Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    sqlite.close();
  });
