import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { dbForTenant } from "@/lib/tenant-db";
import { checkCoverage } from "@/lib/coverage";

// Test d'ISOLATION contre une base de test dédiée (voir vitest.global-setup.ts).
// Idempotence : slugs uniques par exécution + nettoyage ciblé en afterAll
// (cascade sur les enfants). Aucun truncate global.

describe("isolation entre tenants", () => {
  const stamp = Date.now();
  const slugA = `test-a-${stamp}`;
  const slugB = `test-b-${stamp}`;
  const BLOCKED = new Date(Date.UTC(2030, 0, 1));

  let tenantA: number;
  let tenantB: number;
  let bookingA: number;

  beforeAll(async () => {
    const a = await prisma.tenant.create({ data: { slug: slugA, name: "A" } });
    const b = await prisma.tenant.create({ data: { slug: slugB, name: "B" } });
    tenantA = a.id;
    tenantB = b.id;

    const cat = await prisma.serviceCategory.create({
      data: { tenantId: tenantA, name: "Cat", slug: "cat" },
    });
    const svc = await prisma.service.create({
      data: {
        tenantId: tenantA,
        name: "Vidange",
        priceCents: 4990,
        durationMin: 45,
        categoryId: cat.id,
      },
    });
    const bk = await prisma.booking.create({
      data: {
        tenantId: tenantA,
        serviceId: svc.id,
        startAt: new Date(),
        endAt: new Date(),
        customerName: "X",
        customerEmail: "x@x.fr",
        customerPhone: "0",
        address: "1 rue Y",
        postalCode: "75001",
        city: "Paris",
      },
    });
    bookingA = bk.id;

    // Zone couverte + date bloquée pour A uniquement (cas inter-tenant).
    await prisma.coverageZone.create({
      data: { tenantId: tenantA, postalCode: "75001", city: "Paris" },
    });
    await prisma.blockedDate.create({
      data: { tenantId: tenantA, date: BLOCKED },
    });
  });

  afterAll(async () => {
    // Nettoyage ciblé par slug (cascade). Jamais de truncate global.
    await prisma.tenant.deleteMany({ where: { slug: { in: [slugA, slugB] } } });
    await prisma.$disconnect();
  });

  it("B ne lit pas les réservations de A", async () => {
    const dbB = dbForTenant(tenantB);
    expect(await dbB.booking.findMany()).toHaveLength(0);
    expect(await dbB.booking.findUnique({ where: { id: bookingA } })).toBeNull();
  });

  it("B ne peut ni modifier ni supprimer une réservation de A", async () => {
    const dbB = dbForTenant(tenantB);
    await expect(
      dbB.booking.update({
        where: { id: bookingA },
        data: { status: "CANCELLED" },
      }),
    ).rejects.toThrow(/inter-tenant/);
    await expect(
      dbB.booking.delete({ where: { id: bookingA } }),
    ).rejects.toThrow(/inter-tenant/);
  });

  it("les créations de B portent son tenantId", async () => {
    const dbB = dbForTenant(tenantB);
    const cat = await dbB.serviceCategory.create({
      // tenantId volontairement omis : on vérifie l'injection automatique.
      data: { name: "C", slug: "c" } as never,
    });
    expect(cat.tenantId).toBe(tenantB);
  });

  it("un code postal couvert par A n'est pas couvert pour B", async () => {
    const dbA = dbForTenant(tenantA);
    const dbB = dbForTenant(tenantB);
    expect((await checkCoverage(dbA, "75001")).covered).toBe(true);
    expect((await checkCoverage(dbB, "75001")).covered).toBe(false);
  });

  it("une date bloquée chez A ne l'est pas chez B", async () => {
    const dbA = dbForTenant(tenantA);
    const dbB = dbForTenant(tenantB);
    expect(
      await dbA.blockedDate.findFirst({ where: { date: BLOCKED } }),
    ).not.toBeNull();
    expect(
      await dbB.blockedDate.findFirst({ where: { date: BLOCKED } }),
    ).toBeNull();
  });
});
