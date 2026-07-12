// Génère un hash bcrypt pour un mot de passe admin.
// Usage: pnpm hash "mon-mot-de-passe"
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error('Usage: pnpm hash "votre-mot-de-passe"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
// Next.js interprète $VAR dans les fichiers .env : on échappe les $ avec \.
const escaped = hash.replace(/\$/g, "\\$");
console.log("\nCopiez cette ligne dans votre fichier .env :\n");
console.log(`ADMIN_PASSWORD_HASH="${escaped}"\n`);
