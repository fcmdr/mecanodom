import type { TenantDb } from "./tenant-db";

export type CoverageResult = {
  covered: boolean;
  city?: string;
  postalCode: string;
};

/** Normalise un code postal (chiffres uniquement, 5 caractères). */
export function normalizePostalCode(input: string): string {
  return input.replace(/\D/g, "").slice(0, 5);
}

/**
 * Vérifie si un code postal est couvert par une zone d'intervention active.
 * @param db Client Prisma scopé sur le tenant courant (le filtre tenantId est
 *           injecté automatiquement : findFirst suffit).
 */
export async function checkCoverage(
  db: TenantDb,
  postalCodeInput: string,
): Promise<CoverageResult> {
  const postalCode = normalizePostalCode(postalCodeInput);
  if (postalCode.length !== 5) {
    return { covered: false, postalCode };
  }

  const zone = await db.coverageZone.findFirst({
    where: { postalCode },
  });

  if (zone && zone.isActive) {
    return { covered: true, city: zone.city, postalCode };
  }
  return { covered: false, postalCode };
}
