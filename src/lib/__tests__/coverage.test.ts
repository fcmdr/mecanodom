import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    coverageZone: { findUnique: vi.fn() },
  },
}));

import { checkCoverage, normalizePostalCode } from "@/lib/coverage";
import { prisma } from "@/lib/prisma";

const zoneMock = vi.mocked(prisma.coverageZone.findUnique);

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
    const res = await checkCoverage("750");
    expect(res.covered).toBe(false);
    expect(zoneMock).not.toHaveBeenCalled();
  });

  it("couvre une zone active", async () => {
    zoneMock.mockResolvedValue({
      postalCode: "75001",
      city: "Paris",
      isActive: true,
    } as never);
    const res = await checkCoverage("75001");
    expect(res.covered).toBe(true);
    expect(res.city).toBe("Paris");
  });

  it("ne couvre pas une zone inactive", async () => {
    zoneMock.mockResolvedValue({
      postalCode: "75001",
      city: "Paris",
      isActive: false,
    } as never);
    const res = await checkCoverage("75001");
    expect(res.covered).toBe(false);
  });

  it("ne couvre pas un code introuvable", async () => {
    zoneMock.mockResolvedValue(null as never);
    const res = await checkCoverage("99999");
    expect(res.covered).toBe(false);
  });
});
