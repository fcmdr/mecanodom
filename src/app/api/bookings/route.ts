import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { bookingCreateSchema } from "@/lib/validators";
import { checkCoverage } from "@/lib/coverage";
import { randomBytes } from "crypto";
import { computeSlotsForDate, toParisDateKey } from "@/lib/availability";
import { sendBookingEmails } from "@/lib/mail";
import { buildCancelUrl } from "@/lib/urls";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// Anti-spam
const RATE_LIMIT = 6; // réservations max
const RATE_WINDOW_MS = 10 * 60 * 1000; // par tranche de 10 minutes / IP
const MIN_FILL_MS = 3000; // formulaire rempli en moins de 3s = suspect (bot)

// POST /api/bookings : crée une réservation avec re-validation transactionnelle
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  // 0. Anti-spam
  const meta = body as { website?: unknown; renderedAt?: unknown };

  // (a) Honeypot : un champ invisible que seuls les robots remplissent.
  if (typeof meta.website === "string" && meta.website.trim() !== "") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  // (b) Piège temporel : soumission trop rapide pour un humain.
  if (typeof meta.renderedAt === "number") {
    const elapsed = Date.now() - meta.renderedAt;
    if (elapsed >= 0 && elapsed < MIN_FILL_MS) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }
  }

  // (c) Limitation de débit par IP.
  const ip = getClientIp(request);
  const rl = rateLimit(`bookings:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  // 1. Validation des données
  const parsed = bookingCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Tenant courant + client Prisma scopé (tenantId injecté automatiquement)
  const { tenant, db } = await getTenantContext();

  // 2. Re-vérification de la couverture côté serveur
  const coverage = await checkCoverage(db, data.postalCode);
  if (!coverage.covered) {
    return NextResponse.json(
      { error: "Nous n'intervenons pas dans cette zone (code postal)." },
      { status: 422 },
    );
  }

  // 3. Chargement de la prestation
  const service = await db.service.findUnique({
    where: { id: data.serviceId },
    select: {
      id: true,
      name: true,
      priceCents: true,
      durationMin: true,
      isActive: true,
    },
  });
  if (!service || !service.isActive) {
    return NextResponse.json(
      { error: "Prestation introuvable ou inactive." },
      { status: 404 },
    );
  }

  const startUtc = new Date(data.startUtc);
  if (Number.isNaN(startUtc.getTime())) {
    return NextResponse.json({ error: "Créneau invalide." }, { status: 400 });
  }
  const endUtc = new Date(startUtc.getTime() + service.durationMin * 60 * 1000);

  // 4. Re-validation que le créneau est bien proposé (horaires, délai, fenêtre)
  const dateKey = toParisDateKey(startUtc);
  const availability = await computeSlotsForDate(db, dateKey, service);
  const isValidSlot = availability.slots.some(
    (s) => new Date(s.startUtc).getTime() === startUtc.getTime(),
  );
  if (!isValidSlot) {
    return NextResponse.json(
      { error: "Ce créneau n'est plus disponible. Veuillez en choisir un autre." },
      { status: 409 },
    );
  }

  // 5. Création en transaction avec anti double-réservation (re-check chevauchement)
  try {
    const settings = await db.bookingSettings.findFirst();
    const bufferMs = (settings?.bufferMin ?? 0) * 60 * 1000;

    const booking = await db.$transaction(async (tx) => {
      const overlap = await tx.booking.findFirst({
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
          // chevauchement : startExistante < finDemandée(+buffer) ET finExistante > débutDemandé(-buffer)
          startAt: { lt: new Date(endUtc.getTime() + bufferMs) },
          endAt: { gt: new Date(startUtc.getTime() - bufferMs) },
        },
        select: { id: true },
      });

      if (overlap) {
        throw new Error("SLOT_TAKEN");
      }

      return tx.booking.create({
        data: {
          tenantId: tenant.id,
          serviceId: service.id,
          startAt: startUtc,
          endAt: endUtc,
          status: "PENDING",
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          vehicleMake: data.vehicleMake || null,
          vehicleModel: data.vehicleModel || null,
          vehicleYear:
            typeof data.vehicleYear === "number" ? data.vehicleYear : null,
          vehiclePlate: data.vehiclePlate || null,
          address: data.address,
          postalCode: data.postalCode,
          city: coverage.city ?? data.city,
          notes: data.notes || null,
          cancelToken: randomBytes(24).toString("hex"),
        },
        select: { id: true, cancelToken: true },
      });
    });

    // 6. Notifications e-mail (non bloquant : n'échoue jamais la réservation)
    const vehicle = [data.vehicleMake, data.vehicleModel]
      .filter(Boolean)
      .join(" ")
      .trim();
    await sendBookingEmails({
      id: booking.id,
      serviceName: service.name,
      priceCents: service.priceCents,
      durationMin: service.durationMin,
      startAt: startUtc,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      address: data.address,
      postalCode: data.postalCode,
      city: coverage.city ?? data.city,
      vehicle: vehicle || null,
      notes: data.notes || null,
      cancelUrl: booking.cancelToken
        ? buildCancelUrl(booking.id, booking.cancelToken)
        : null,
    });

    return NextResponse.json({ id: booking.id }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return NextResponse.json(
        {
          error:
            "Ce créneau vient d'être réservé. Veuillez en choisir un autre.",
        },
        { status: 409 },
      );
    }
    console.error("Erreur création booking:", err);
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 },
    );
  }
}
