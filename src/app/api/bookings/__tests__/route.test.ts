import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks des dépendances de la route (on garde les vrais validators zod) ---

vi.mock("next/server", () => ({
  NextResponse: {
    json: (
      body: unknown,
      init?: { status?: number; headers?: Record<string, string> },
    ) => ({ status: init?.status ?? 200, body }),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    service: { findUnique: vi.fn() },
    bookingSettings: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/coverage", () => ({ checkCoverage: vi.fn() }));
vi.mock("@/lib/availability", () => ({
  computeSlotsForDate: vi.fn(),
  toParisDateKey: vi.fn(() => "2026-07-20"),
}));
vi.mock("@/lib/mail", () => ({ sendBookingEmails: vi.fn() }));
vi.mock("@/lib/urls", () => ({ buildCancelUrl: () => "https://x/cancel" }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ allowed: true, remaining: 5, retryAfterSec: 0 }),
  getClientIp: () => "test-ip",
}));

import { POST } from "@/app/api/bookings/route";
import { computeSlotsForDate } from "@/lib/availability";
import { checkCoverage } from "@/lib/coverage";
import { prisma } from "@/lib/prisma";
import { sendBookingEmails } from "@/lib/mail";

const serviceMock = vi.mocked(prisma.service.findUnique);
const settingsMock = vi.mocked(prisma.bookingSettings.findUnique);
const txMock = vi.mocked(prisma.$transaction);
const coverageMock = vi.mocked(checkCoverage);
const slotsMock = vi.mocked(computeSlotsForDate);
const mailMock = vi.mocked(sendBookingEmails);

// --- Store en mémoire simulant la table booking, avec transactions sérialisées ---
// (émule l'isolation d'une transaction DB : les callbacks ne s'entrelacent pas).

type Row = { id: number; startAt: Date; endAt: Date; status: string };
let store: Row[] = [];
let nextId = 1;
let chain: Promise<unknown> = Promise.resolve();

function makeTx() {
  return {
    booking: {
      // Reproduit la clause de chevauchement de la route.
      findFirst: async ({ where }: { where: Record<string, never> }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = where as any;
        const endLt = w.startAt.lt.getTime();
        const startGt = w.endAt.gt.getTime();
        const statuses: string[] = w.status.in;
        const hit = store.find(
          (r) =>
            statuses.includes(r.status) &&
            r.startAt.getTime() < endLt &&
            r.endAt.getTime() > startGt,
        );
        return hit ? { id: hit.id } : null;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: async ({ data }: { data: any }) => {
        const row: Row = {
          id: nextId++,
          startAt: data.startAt,
          endAt: data.endAt,
          status: data.status,
        };
        store.push(row);
        return { id: row.id, cancelToken: data.cancelToken };
      },
    },
  };
}

const SLOT_A = "2026-07-20T06:00:00.000Z"; // 08:00 Paris (durée 45 → 06:45Z)
const SLOT_B = "2026-07-20T06:45:00.000Z"; // 08:45 Paris (durée 45 → 07:30Z)

function body(startUtc: string) {
  return {
    serviceId: 1,
    startUtc,
    customerName: "Jean Dupont",
    customerEmail: "jean@example.com",
    customerPhone: "0601020304",
    address: "12 rue de la Paix",
    postalCode: "75002",
    city: "Paris",
  };
}

function req(startUtc: string): Request {
  return { json: async () => body(startUtc) } as unknown as Request;
}

beforeEach(() => {
  vi.clearAllMocks();
  store = [];
  nextId = 1;
  chain = Promise.resolve();

  serviceMock.mockResolvedValue({
    id: 1,
    name: "Vidange",
    priceCents: 4990,
    durationMin: 45,
    isActive: true,
  } as never);
  settingsMock.mockResolvedValue({ bufferMin: 0 } as never);
  coverageMock.mockResolvedValue({
    covered: true,
    city: "Paris",
    postalCode: "75002",
  });
  slotsMock.mockResolvedValue({
    date: "2026-07-20",
    slots: [
      { startUtc: SLOT_A, label: "08:00" },
      { startUtc: SLOT_B, label: "08:45" },
    ],
  });
  mailMock.mockResolvedValue(undefined as never);

  // Transactions sérialisées sur un store partagé.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  txMock.mockImplementation(((cb: any) => {
    const run = chain.then(() => cb(makeTx()));
    chain = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }) as never);
});

describe("POST /api/bookings — anti double-réservation", () => {
  it("crée une réservation quand le créneau est libre (201)", async () => {
    const res = (await POST(req(SLOT_A))) as unknown as {
      status: number;
      body: { id?: number };
    };
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
    expect(store).toHaveLength(1);
  });

  it("rejette (409) si le créneau est déjà pris", async () => {
    store.push({
      id: 99,
      startAt: new Date(SLOT_A),
      endAt: new Date("2026-07-20T06:45:00.000Z"),
      status: "PENDING",
    });
    const res = (await POST(req(SLOT_A))) as unknown as {
      status: number;
      body: { error?: string };
    };
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/vient d'être réservé/);
    expect(store).toHaveLength(1); // aucune création supplémentaire
  });

  it("sur deux réservations concurrentes du même créneau, une seule réussit", async () => {
    const [r1, r2] = (await Promise.all([
      POST(req(SLOT_A)),
      POST(req(SLOT_A)),
    ])) as unknown as { status: number }[];

    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([201, 409]);
    expect(store).toHaveLength(1); // une seule réservation en base
  });

  it("autorise deux créneaux adjacents non chevauchants (buffer 0)", async () => {
    const [r1, r2] = (await Promise.all([
      POST(req(SLOT_A)),
      POST(req(SLOT_B)),
    ])) as unknown as { status: number }[];

    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);
    expect(store).toHaveLength(2);
  });

  it("rejette (409) un créneau adjacent quand le buffer crée un chevauchement", async () => {
    settingsMock.mockResolvedValue({ bufferMin: 15 } as never);
    // Réservation existante 08:00–08:45 ; demande 08:45–09:30 → chevauchement avec buffer 15.
    store.push({
      id: 42,
      startAt: new Date(SLOT_A),
      endAt: new Date(SLOT_B),
      status: "CONFIRMED",
    });
    const res = (await POST(req(SLOT_B))) as unknown as { status: number };
    expect(res.status).toBe(409);
    expect(store).toHaveLength(1);
  });
});
