import { beforeEach, describe, expect, it, vi } from "vitest";

// Prisma mocké : la factory est hoistée au-dessus des imports par Vitest.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    bookingSettings: { findUnique: vi.fn() },
    blockedDate: { findUnique: vi.fn() },
    workingHours: { findMany: vi.fn() },
    booking: { findMany: vi.fn() },
  },
}));

import { computeSlotsForDate } from "@/lib/availability";
import { prisma } from "@/lib/prisma";

const settingsMock = vi.mocked(prisma.bookingSettings.findUnique);
const blockedMock = vi.mocked(prisma.blockedDate.findUnique);
const windowsMock = vi.mocked(prisma.workingHours.findMany);
const bookingMock = vi.mocked(prisma.booking.findMany);

const DEFAULT_SETTINGS = {
  slotStepMin: 30,
  bufferMin: 0,
  minLeadHours: 12,
  maxAdvanceDays: 30,
};

/** Fenêtre de travail minimale (seuls startTime/endTime sont lus). */
function win(startTime: string, endTime: string) {
  return { startTime, endTime } as never;
}

/** Réservation minimale (seuls startAt/endAt sont lus). */
function booking(startAt: string, endAt: string) {
  return { startAt: new Date(startAt), endAt: new Date(endAt) } as never;
}

const service = { durationMin: 45 };

beforeEach(() => {
  vi.clearAllMocks();
  settingsMock.mockResolvedValue(DEFAULT_SETTINGS as never);
  blockedMock.mockResolvedValue(null as never);
  windowsMock.mockResolvedValue([] as never);
  bookingMock.mockResolvedValue([] as never);
});

describe("computeSlotsForDate — fenêtre autorisée", () => {
  it("rejette une date passée", async () => {
    const now = new Date("2026-07-20T08:00:00.000Z"); // Paris 10:00
    const res = await computeSlotsForDate("2026-07-19", service, now);
    expect(res.slots).toEqual([]);
    expect(res.reason).toBe("Date passée");
  });

  it("accepte la borne exacte diff == maxAdvanceDays", async () => {
    windowsMock.mockResolvedValue([win("08:00", "12:00")] as never);
    const now = new Date("2026-07-01T08:00:00.000Z"); // Paris "2026-07-01"
    const res = await computeSlotsForDate("2026-07-31", service, now); // diff = 30
    expect(res.slots.length).toBeGreaterThan(0);
    expect(res.reason).toBeUndefined(); // pas rejeté par la fenêtre max
  });

  it("rejette diff == maxAdvanceDays + 1", async () => {
    const now = new Date("2026-07-01T08:00:00.000Z");
    const res = await computeSlotsForDate("2026-08-01", service, now); // diff = 31
    expect(res.slots).toEqual([]);
    expect(res.reason).toMatch(/30 jours à l'avance/);
  });
});

describe("computeSlotsForDate — jours indisponibles", () => {
  it("renvoie « Jour indisponible » pour un jour bloqué", async () => {
    blockedMock.mockResolvedValue({ id: 1 } as never);
    const now = new Date("2026-07-13T08:00:00.000Z");
    const res = await computeSlotsForDate("2026-07-20", service, now);
    expect(res.slots).toEqual([]);
    expect(res.reason).toBe("Jour indisponible");
  });

  it("renvoie « Fermé ce jour » sans horaires de travail", async () => {
    windowsMock.mockResolvedValue([] as never);
    const now = new Date("2026-07-13T08:00:00.000Z");
    const res = await computeSlotsForDate("2026-07-20", service, now);
    expect(res.slots).toEqual([]);
    expect(res.reason).toBe("Fermé ce jour");
  });
});

describe("computeSlotsForDate — génération & fuseau", () => {
  it("génère les créneaux d'un jour normal en été (DST +2)", async () => {
    windowsMock.mockResolvedValue([
      win("08:00", "12:00"),
      win("13:00", "18:00"),
    ] as never);
    const now = new Date("2026-07-13T08:00:00.000Z");
    const res = await computeSlotsForDate("2026-07-20", service, now);

    expect(res.reason).toBeUndefined();
    expect(res.slots[0].label).toBe("08:00");
    expect(res.slots[0].startUtc).toBe("2026-07-20T06:00:00.000Z"); // 08:00 Paris été

    const morning = res.slots.filter((s) => s.label < "12:00");
    expect(morning[morning.length - 1].label).toBe("11:00"); // dernier créneau matin (durée 45)

    const afternoon = res.slots.filter((s) => s.label >= "13:00");
    expect(afternoon[0].label).toBe("13:00");
  });

  it("respecte le fuseau en hiver (DST +1)", async () => {
    windowsMock.mockResolvedValue([win("08:00", "12:00")] as never);
    const now = new Date("2026-01-12T08:00:00.000Z");
    const res = await computeSlotsForDate("2026-01-19", service, now);

    expect(res.slots[0].label).toBe("08:00");
    expect(res.slots[0].startUtc).toBe("2026-01-19T07:00:00.000Z"); // 08:00 Paris hiver
  });
});

describe("computeSlotsForDate — délai minimum", () => {
  it("coupe les créneaux avant now + minLeadHours (borne incluse gardée)", async () => {
    settingsMock.mockResolvedValue({
      ...DEFAULT_SETTINGS,
      minLeadHours: 2,
      slotStepMin: 30,
    } as never);
    windowsMock.mockResolvedValue([win("08:00", "12:00")] as never);
    // now = Paris 08:30 ; leadCutoff = Paris 10:30
    const now = new Date("2026-07-20T06:30:00.000Z");
    const res = await computeSlotsForDate(
      "2026-07-20",
      { durationMin: 30 },
      now,
    );

    const labels = res.slots.map((s) => s.label);
    expect(labels).not.toContain("08:00");
    expect(labels).not.toContain("10:00");
    expect(labels[0]).toBe("10:30"); // borne == cutoff conservée
  });
});

describe("computeSlotsForDate — durée & chevauchements", () => {
  it("exclut une durée qui ne rentre pas dans la fenêtre", async () => {
    windowsMock.mockResolvedValue([win("08:00", "09:00")] as never);
    const now = new Date("2026-07-13T08:00:00.000Z");
    const res = await computeSlotsForDate("2026-07-20", { durationMin: 90 }, now);
    expect(res.slots).toEqual([]);
    expect(res.reason).toBe("Aucun créneau disponible");
  });

  it("exclut les chevauchements avec buffer", async () => {
    settingsMock.mockResolvedValue({
      ...DEFAULT_SETTINGS,
      bufferMin: 15,
    } as never);
    windowsMock.mockResolvedValue([win("08:00", "12:00")] as never);
    // Réservation 10:00–10:45 Paris (été → 08:00Z–08:45Z)
    bookingMock.mockResolvedValue([
      booking("2026-07-20T08:00:00.000Z", "2026-07-20T08:45:00.000Z"),
    ] as never);
    const now = new Date("2026-07-13T08:00:00.000Z");
    const res = await computeSlotsForDate("2026-07-20", service, now);

    const labels = res.slots.map((s) => s.label);
    expect(labels).not.toContain("09:30");
    expect(labels).not.toContain("10:00");
    expect(labels).not.toContain("10:30");
    expect(labels).toContain("09:00");
    expect(labels).toContain("11:00");
  });
});

describe("computeSlotsForDate — fallback settings", () => {
  it("applique les valeurs par défaut quand bookingSettings est null", async () => {
    settingsMock.mockResolvedValue(null as never);
    windowsMock.mockResolvedValue([win("08:00", "09:30")] as never);
    const now = new Date("2026-07-13T00:00:00.000Z");
    const res = await computeSlotsForDate("2026-07-20", { durationMin: 30 }, now);
    // step par défaut 30 → 08:00, 08:30, 09:00
    expect(res.slots.map((s) => s.label)).toEqual(["08:00", "08:30", "09:00"]);
  });
});
