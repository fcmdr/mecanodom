# Passage en multi-tenant ready — guide d'intégration

Livrables :

| Fichier | Destination dans le projet |
|---|---|
| `schema.prisma` | `prisma/schema.prisma` (remplace) |
| `migration.sql` | contenu de la migration générée (voir étape 1) |
| `tenant.ts` | `src/lib/tenant.ts` (nouveau) |
| `tenant-db.ts` | `src/lib/tenant-db.ts` (nouveau) |

---

## Étape 1 — Migration de la base

```bash
# 1. Remplacer prisma/schema.prisma par le nouveau schéma
# 2. Générer une migration VIDE (--create-only : ne l'applique pas)
npx prisma migrate dev --create-only --name add_multi_tenant

# 3. Remplacer le contenu du fichier SQL généré
#    (prisma/migrations/<timestamp>_add_multi_tenant/migration.sql)
#    par le contenu de migration.sql fourni.
#    ⚠️ Le SQL auto-généré par Prisma est DESTRUCTIF (colonnes NOT NULL sur
#    tables non vides) — celui fourni préserve vos données et rattache tout
#    au tenant n°1 "mecanodom".

# 4. Appliquer
npx prisma migrate dev
```

Vérification rapide :

```sql
SELECT id, slug, name FROM "Tenant";
SELECT COUNT(*) FROM "Booking" WHERE "tenantId" = 1;  -- = total des réservations
```

---

## Étape 2 — Variables d'environnement

Dans `.env`, ajouter :

```bash
# Tenant servi par défaut quand aucun domaine ne matche
DEFAULT_TENANT_SLUG="mecanodom"
```

`ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` restent en place tant que l'étape 5
(auth par table) n'est pas faite. `MAIL_FROM`, `MAIL_ADMIN` et `APP_URL`
deviennent des *fallbacks* : les colonnes `mailFromName`, `notificationEmail`
et `baseUrl` du tenant prennent le dessus quand elles sont renseignées.

---

## Étape 3 — Refactoring des accès données (le gros morceau)

Principe : **plus aucun `import { prisma }` dans `src/actions/` ni
`src/app/api/`**. À la place :

```typescript
import { getTenantContext } from "@/lib/tenant";
```

### Exemple 1 — lecture simple (`app/api/services/route.ts`)

```typescript
// AVANT
const services = await prisma.service.findMany({ where: { isActive: true } });

// APRÈS
const { db } = await getTenantContext();
const services = await db.service.findMany({ where: { isActive: true } });
// → le filtre tenantId est injecté automatiquement
```

### Exemple 2 — le singleton BookingSettings (`actions/availability.ts`)

```typescript
// AVANT (singleton id=1)
await prisma.bookingSettings.upsert({
  where: { id: 1 },
  update: parsed.data,
  create: { id: 1, ...parsed.data },
});

// APRÈS (un réglage par tenant)
const { tenant, db } = await getTenantContext();
await db.bookingSettings.upsert({
  where: { tenantId: tenant.id },
  update: parsed.data,
  create: parsed.data, // tenantId injecté par le client scopé
});
```

### Exemple 3 — update par id (`actions/bookings.ts`)

```typescript
// AVANT
const existing = await prisma.booking.findUnique({
  where: { id },
  include: { service: true },
});
// APRÈS — code identique, via db :
const { db } = await getTenantContext();
const existing = await db.booking.findUnique({
  where: { id },
  include: { service: true },
});
// → réécrit en findFirst({ where: { id, tenantId } }) : un id d'un autre
//   tenant renvoie null au lieu de fuiter ses données.
```

`db.booking.update(...)` et `db.booking.delete(...)` vérifient d'abord que la
ligne appartient au tenant et lèvent `TenantScopeError` sinon.

### Cas particulier : la validation du créneau dans une transaction

Si la création de réservation utilise `prisma.$transaction`, gardez la
transaction mais passez par `db.$transaction` (l'extension s'applique aussi
dans les transactions interactives du client étendu).

---

## Étape 4 — siteConfig → getSiteConfig()

`src/lib/site.ts` garde `navLinks` et `legalLinks` (statiques). Les infos
entreprise migrent vers `getSiteConfig()` (fourni dans `tenant.ts`) :

```typescript
// AVANT (composant serveur)
import { siteConfig } from "@/lib/site";
<Footer phone={siteConfig.phone} />

// APRÈS
import { getSiteConfig } from "@/lib/tenant";
const site = await getSiteConfig();
<Footer phone={site.phone} />
```

Les composants **clients** (Navbar, CoverageMap...) ne peuvent pas appeler
`getSiteConfig()` : le composant serveur parent le fait et passe les valeurs
en props. C'est le seul refactoring un peu invasif (11 fichiers).

Pour les métadonnées (`app/layout.tsx`) : `generateMetadata()` async peut
appeler `getSiteConfig()`.

---

## Étape 5 — Session admin avec tenantId

Dans `src/lib/session.ts` :

```typescript
export type SessionPayload = JWTPayload & {
  email: string;
  role: "admin";
  tenantId: number; // ← nouveau
};

export async function createSessionToken(
  email: string,
  tenantId: number, // ← nouveau
): Promise<string> {
  return new SignJWT({ email, role: "admin", tenantId })
    .setProtectedHeader({ alg: "HS256" })
    // ...
}
```

Dans `verifyCredentials` (à terme) : authentifier contre la table `AdminUser`
au lieu des variables d'env, et récupérer son `tenantId` :

```typescript
const user = await prisma.adminUser.findUnique({ where: { email } });
if (!user) { await bcrypt.compare(password, DUMMY_HASH); return null; }
const ok = await bcrypt.compare(password, user.passwordHash);
return ok ? user : null;
```

Côté back-office, utilisez le tenant de la **session** (pas celui du domaine) :
un helper `getAdminTenantDb()` qui lit `session.tenantId` et renvoie
`dbForTenant(session.tenantId)`. Ça évite qu'un admin connecté sur le mauvais
domaine voie les données d'un autre client.

---

## Étape 6 — E-mails et URLs

`src/lib/mail.ts` : remplacer les constantes module par des paramètres :

```typescript
// AVANT
const FROM = process.env.MAIL_FROM || "MécanoDom <onboarding@resend.dev>";
const ADMIN_TO = process.env.MAIL_ADMIN;

// APRÈS — passer le tenant aux fonctions d'envoi
function fromFor(tenant: Tenant): string {
  const name = tenant.mailFromName ?? tenant.name;
  return process.env.MAIL_FROM_ADDRESS
    ? `${name} <${process.env.MAIL_FROM_ADDRESS}>`
    : `${name} <onboarding@resend.dev>`;
}
const adminTo = tenant.notificationEmail; // ex-MAIL_ADMIN
```

`src/lib/urls.ts` : `buildCancelUrl` prend l'URL de base en paramètre
(obtenue via `getTenantBaseUrl()`).

---

## Étape 7 — Test d'isolation (à ajouter à la suite Vitest)

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { dbForTenant } from "@/lib/tenant-db";

describe("isolation entre tenants", () => {
  let tenantA: number, tenantB: number, bookingA: number;

  beforeAll(async () => {
    const a = await prisma.tenant.create({ data: { slug: "test-a", name: "A" } });
    const b = await prisma.tenant.create({ data: { slug: "test-b", name: "B" } });
    tenantA = a.id; tenantB = b.id;
    const cat = await prisma.serviceCategory.create({
      data: { tenantId: tenantA, name: "Cat", slug: "cat" },
    });
    const svc = await prisma.service.create({
      data: { tenantId: tenantA, name: "Vidange", priceCents: 4990,
              durationMin: 45, categoryId: cat.id },
    });
    const bk = await prisma.booking.create({
      data: { tenantId: tenantA, serviceId: svc.id,
              startAt: new Date(), endAt: new Date(),
              customerName: "X", customerEmail: "x@x.fr", customerPhone: "0",
              address: "1 rue Y", postalCode: "75001", city: "Paris" },
    });
    bookingA = bk.id;
  });

  it("B ne lit pas les réservations de A", async () => {
    const dbB = dbForTenant(tenantB);
    expect(await dbB.booking.findMany()).toHaveLength(0);
    expect(await dbB.booking.findUnique({ where: { id: bookingA } })).toBeNull();
  });

  it("B ne peut ni modifier ni supprimer une réservation de A", async () => {
    const dbB = dbForTenant(tenantB);
    await expect(
      dbB.booking.update({ where: { id: bookingA }, data: { status: "CANCELLED" } }),
    ).rejects.toThrow(/inter-tenant/);
    await expect(
      dbB.booking.delete({ where: { id: bookingA } }),
    ).rejects.toThrow(/inter-tenant/);
  });

  it("les créations de B portent son tenantId", async () => {
    const dbB = dbForTenant(tenantB);
    const cat = await dbB.serviceCategory.create({ data: { name: "C", slug: "c" } });
    expect(cat.tenantId).toBe(tenantB);
  });
});
```

---

## Étape 8 — seed.ts

Créer le tenant en premier, puis référencer son id partout :

```typescript
const tenant = await prisma.tenant.upsert({
  where: { slug: "mecanodom" },
  update: {},
  create: {
    slug: "mecanodom",
    name: "MécanoDom",
    tagline: "Votre mécanicien à domicile",
    phone: "01 23 45 67 89",
    email: "contact@mecanodom.fr",
    // ...
  },
});

await prisma.bookingSettings.upsert({
  where: { tenantId: tenant.id },   // ← plus de { id: 1 }
  update: {},
  create: { tenantId: tenant.id, slotStepMin: 30, bufferMin: 15,
            minLeadHours: 12, maxAdvanceDays: 30 },
});
// + tenantId: tenant.id dans chaque create de catégorie/service/zone/horaire
// (ou : const db = dbForTenant(tenant.id) et laisser l'injection faire le travail)
```

---

## Points de vigilance pour plus tard (à ne PAS traiter maintenant)

- **`revalidatePath` et multi-domaines** : la revalidation Next.js est par
  chemin, pas par hôte. Avec plusieurs domaines sur le même déploiement, un
  `revalidatePath("/services")` touchera tous les tenants. Acceptable au
  début ; à revoir si le cache devient un enjeu.
- **Rate limiting** : préfixer les clés par tenant (`${tenantId}:${ip}`)
  quand il y aura plusieurs clients.
- **`Booking.id` dans les e-mails** : les ids sont globaux (séquence unique),
  donc la "Référence #42" d'un tenant peut sembler sauter des numéros. Purement
  cosmétique ; un numéro par tenant peut s'ajouter plus tard si besoin.
- **RLS PostgreSQL** : inutile à cette échelle, l'extension Prisma suffit.
  À reconsidérer seulement si d'autres services accèdent à la base en direct.
