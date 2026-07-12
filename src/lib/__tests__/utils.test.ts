import { describe, expect, it } from "vitest";
import {
  BOOKING_STATUS_LABELS,
  WEEKDAY_LABELS,
  formatDateFr,
  formatDateTimeFr,
  formatDuration,
  formatIsoDateKeyFr,
  formatPrice,
  formatTimeFr,
} from "@/lib/utils";

/** Normalise les espaces insécables (U+00A0 / U+202F) produits par Intl. */
function normSpace(s: string): string {
  return s.replace(/[\u00a0\u202f]/g, " ");
}

describe("formatPrice", () => {
  it("formate des centimes en euros fr", () => {
    expect(normSpace(formatPrice(4990))).toBe("49,90 €");
    expect(normSpace(formatPrice(0))).toBe("0,00 €");
    expect(normSpace(formatPrice(89000))).toBe("890,00 €");
  });
});

describe("formatDuration", () => {
  it("formate des durées lisibles", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(90)).toBe("1 h 30");
    expect(formatDuration(120)).toBe("2 h");
  });
});

describe("formatTimeFr", () => {
  it("affiche l'heure locale Paris (été DST +2)", () => {
    expect(formatTimeFr("2026-07-17T06:00:00Z")).toBe("08:00");
  });
  it("affiche l'heure locale Paris (hiver DST +1)", () => {
    expect(formatTimeFr("2026-01-17T06:00:00Z")).toBe("07:00");
  });
});

describe("formatage de dates fr", () => {
  const instant = "2026-07-17T06:00:00Z";
  it("formatDateFr contient le jour lisible", () => {
    expect(formatDateFr(instant)).toContain("17 juillet 2026");
  });
  it("formatDateTimeFr contient date et heure", () => {
    const out = formatDateTimeFr(instant);
    expect(out).toContain("17 juillet 2026");
    expect(out).toContain("08:00");
  });
  it("formatIsoDateKeyFr convertit une clé ISO", () => {
    expect(formatIsoDateKeyFr("2026-07-17")).toContain("17 juillet 2026");
  });
});

describe("libellés statiques", () => {
  it("WEEKDAY_LABELS", () => {
    expect(WEEKDAY_LABELS).toHaveLength(7);
    expect(WEEKDAY_LABELS[0]).toBe("Dimanche");
    expect(WEEKDAY_LABELS[1]).toBe("Lundi");
  });
  it("BOOKING_STATUS_LABELS", () => {
    expect(BOOKING_STATUS_LABELS.PENDING).toBe("En attente");
    expect(BOOKING_STATUS_LABELS.CONFIRMED).toBe("Confirmé");
  });
});
