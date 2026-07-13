import "server-only";
import { prisma } from "./prisma";

// ---------------------------------------------------------------------------
// Client Prisma scopé sur UN tenant.
//
// Objectif : rendre structurellement impossible l'oubli d'un filtre tenantId.
//   - Lectures  : tenantId injecté dans le `where` (findUnique → findFirst)
//   - Créations : tenantId injecté dans `data` / `create`
//   - update/delete/upsert par clé unique : vérification préalable que la
//     ligne appartient bien au tenant (sinon erreur), puis opération normale.
//
// Usage :
//   const { db } = await getTenantContext();
//   const services = await db.service.findMany({ where: { isActive: true } });
//   // → SELECT ... WHERE tenantId = X AND isActive = true
// ---------------------------------------------------------------------------

/** Modèles portant un tenantId. Tenant lui-même et les modèles globaux n'y sont pas. */
const TENANT_MODELS = new Set([
  "ServiceCategory",
  "Service",
  "WorkingHours",
  "BlockedDate",
  "BookingSettings",
  "CoverageZone",
  "Booking",
  "AdminUser",
]);

/** Opérations dont le `where` est un filtre libre : injection directe. */
const WHERE_OPS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
]);

/** Opérations par clé unique en écriture : vérification d'appartenance avant. */
const UNIQUE_WRITE_OPS = new Set(["update", "delete"]);

/** Opérations par clé unique en lecture : réécrites en findFirst. */
const UNIQUE_READ_OPS = new Set(["findUnique", "findUniqueOrThrow"]);

class TenantScopeError extends Error {
  constructor(model: string) {
    super(
      `${model} : enregistrement introuvable pour ce tenant (accès inter-tenant bloqué)`,
    );
    this.name = "TenantScopeError";
  }
}

function lcFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** Vérifie qu'une ligne ciblée par clé unique appartient au tenant. */
async function assertOwnership(
  model: string,
  where: Record<string, unknown> | undefined,
  tenantId: number,
): Promise<void> {
  const delegate = (prisma as Record<string, any>)[lcFirst(model)];
  const found = await delegate.findFirst({
    where: { AND: [where ?? {}, { tenantId }] },
    select: { id: true },
  });
  if (!found) throw new TenantScopeError(model);
}

export function dbForTenant(tenantId: number) {
  return prisma.$extends({
    name: `tenant-scoped`,
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!TENANT_MODELS.has(model)) {
            return query(args);
          }
          const a = (args ?? {}) as Record<string, any>;

          // --- Créations : injecter tenantId dans les données -------------
          if (operation === "create") {
            a.data = { ...a.data, tenantId };
            return query(a);
          }
          if (
            operation === "createMany" ||
            operation === "createManyAndReturn"
          ) {
            const rows = Array.isArray(a.data) ? a.data : [a.data];
            a.data = rows.map((d: Record<string, unknown>) => ({
              ...d,
              tenantId,
            }));
            return query(a);
          }
          if (operation === "upsert") {
            a.create = { ...a.create, tenantId };
            // Si la ligne existe déjà, elle doit appartenir au tenant.
            const delegate = (prisma as Record<string, any>)[lcFirst(model)];
            const existing = await delegate.findFirst({
              where: a.where ?? {},
              select: { id: true, tenantId: true },
            });
            if (existing && existing.tenantId !== tenantId) {
              throw new TenantScopeError(model);
            }
            return query(a);
          }

          // --- Filtres libres : injecter tenantId dans le where ------------
          if (WHERE_OPS.has(operation)) {
            a.where = { AND: [{ tenantId }, a.where ?? {}] };
            return query(a);
          }

          // --- Lectures par clé unique : réécrire en findFirst -------------
          // (findUnique n'accepte que des champs uniques dans son where ;
          //  on passe par findFirst pour pouvoir ajouter le filtre tenant)
          if (UNIQUE_READ_OPS.has(operation)) {
            const delegate = (prisma as Record<string, any>)[lcFirst(model)];
            const result = await delegate.findFirst({
              ...a,
              where: { AND: [{ tenantId }, a.where ?? {}] },
            });
            if (result === null && operation === "findUniqueOrThrow") {
              throw new TenantScopeError(model);
            }
            return result;
          }

          // --- Écritures par clé unique : vérifier l'appartenance ----------
          if (UNIQUE_WRITE_OPS.has(operation)) {
            await assertOwnership(model, a.where, tenantId);
            return query(a);
          }

          // Opérations restantes (ex. queryRaw n'arrive pas ici) : passer tel quel
          return query(a);
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof dbForTenant>;
