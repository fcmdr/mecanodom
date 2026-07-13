import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkCoverage, normalizePostalCode } from "@/lib/coverage";
import type { TenantDb } from "@/lib/tenant-db";

// db scopé injecté (DI) : stub avec la seule méthode lue par checkCoverage.
const zoneMock = vi.fn();
const db = {
  coverageZone: { findFirst: zoneMock },
} as unknown as TenantDb;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("normalizePostalCode", () => {
  it("garde un code déjà propre", () => {
    expect(normalizePostalCode("75001")).toBe("75001");
  });
  it("supprime espaces et non-chiffres", () => {
    expect(normalizePostalCode(" 75 001 ")).toBe("75001");
  });
  it("laisse un code trop court tel quel", () => {
    expect(normalizePostalCode("7500")).toBe("7500");
  });
  it("tronque à 5 chiffres", () => {
    expect(normalizePostalCode("750012")).toBe("75001");
  });
});

describe("checkCoverage", () => {
  it("rejette une longueur invalide sans requête", async () => {
    const res = await checkCoverage(db, "750");
    expect(res.covered).toBe(false);
    expect(zoneMock).not.toHaveBeenCalled();
  });

  it("couvre une zone active", async () => {
    zoneMock.mockResolvedValue({
      postalCode: "75001",
      city: "Paris",
      isActive: true,
    });
    const res = await checkCoverage(db, "75001");
    expect(res.covered).toBe(true);
    expect(res.city).toBe("Paris");
  });

  it("ne couvre pas une zone inactive", async () => {
    zoneMock.mockResolvedValue({
      postalCode: "75001",
      city: "Paris",
      isActive: false,
    });
    const res = await checkCoverage(db, "75001");
    expect(res.covered).toBe(false);
  });

  it("ne couvre pas un code introuvable", async () => {
    zoneMock.mockResolvedValue(null);
    const res = await checkCoverage(db, "99999");
    expect(res.covered).toBe(false);
  });
});
