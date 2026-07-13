import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

// Provisionne une base de test DÉDIÉE (jamais la base de dev) :
//   1. la crée si besoin,
//   2. applique le schéma via `prisma migrate deploy`.
// Échec FRANC et bruyant si la base est injoignable (pas de skip silencieux :
// une CI verte doit signifier que l'isolation a réellement été vérifiée).

const HELP = "Base de test injoignable — lancez `pnpm db:up` (Docker) et vérifiez DATABASE_URL.";

export default async function setup(): Promise<void> {
  const base = process.env.DATABASE_URL;
  const testUrl = process.env.TEST_DATABASE_URL;

  if (!base || !testUrl) {
    throw new Error(`${HELP} (DATABASE_URL absente)`);
  }
  if (testUrl === base) {
    throw new Error(
      "La base de test doit être distincte de la base de dev (sécurité anti-écrasement).",
    );
  }

  const dbName = new URL(testUrl).pathname.replace(/^\//, "");

  // 1. Créer la base de test si elle n'existe pas (connexion à la base de base).
  const admin = new PrismaClient({ datasources: { db: { url: base } } });
  try {
    await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName}"`);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    const message = String((e as Error)?.message ?? "");
    // 42P04 = duplicate_database : déjà créée, cas normal.
    const alreadyExists = code === "42P04" || /already exists/i.test(message);
    if (!alreadyExists) {
      await admin.$disconnect();
      throw new Error(`${HELP}\nDétail : ${message}`);
    }
  } finally {
    await admin.$disconnect();
  }

  // 2. Appliquer le schéma sur la base de test.
  try {
    execSync("pnpm exec prisma migrate deploy", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: testUrl },
    });
  } catch {
    throw new Error(
      `Échec de \`prisma migrate deploy\` sur la base de test (${dbName}). ${HELP}`,
    );
  }
}
