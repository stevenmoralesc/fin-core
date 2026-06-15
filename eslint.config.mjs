import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
    "check.js",
    "fix.js",
    "fix2.js",
    "force.js",
    "migrate.js",
    "refactor.js",
    "fix-dates.js",
    "fix-dates-loop.js",
    "prisma/*.mjs",
  ]),
]);

export default eslintConfig;
