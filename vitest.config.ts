import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import "dotenv/config";

// Marqueurs Next.js non résolvables sous Vitest → stub vide.
const emptyModule = fileURLToPath(new URL("./test/empty-module.ts", import.meta.url));

// Fuseau fixe pour des tests déterministes (les libellés d'heures dépendent du TZ).
process.env.TZ = "UTC";

/**
 * Base de test DÉDIÉE : jamais la base de dev. On dérive `<db>_test` de
 * DATABASE_URL. Les tests DB (isolation) tournent contre cette base, provisionnée
 * par le globalSetup. Les tests unitaires purs l'ignorent (pas d'accès Prisma).
 */
function toTestDatabaseUrl(base: string): string {
  const u = new URL(base);
  u.pathname = u.pathname.replace(/[^/]+$/, (name) => `${name}_test`);
  return u.toString();
}

const baseDbUrl = process.env.DATABASE_URL;
const testDbUrl = baseDbUrl ? toTestDatabaseUrl(baseDbUrl) : undefined;
// Exposé au globalSetup (même processus que ce fichier de config).
if (testDbUrl) process.env.TEST_DATABASE_URL = testDbUrl;

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "server-only": emptyModule,
      "client-only": emptyModule,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globalSetup: ["./vitest.global-setup.ts"],
    // Les workers voient la base de test (jamais la base de dev).
    env: testDbUrl ? { DATABASE_URL: testDbUrl } : undefined,
  },
});
