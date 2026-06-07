import "dotenv/config";
import { defineConfig } from "prisma/config";
import path from "path";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --import tsx/esm prisma/seed.mjs",
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? `file:${path.join(__dirname, "prisma", "dev.db")}`,
  },
});
