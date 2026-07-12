import { fromZonedTime } from "date-fns-tz";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "./prisma";
import { TIME_ZONE } from "./utils";

export type Slot = {
  /** Instant UTC (ISO) du début du créneau. */
  startUtc: string;
  /** Heure locale d'affichage "HH:MM" (Europe/Paris). */
  label: string;
};

export type AvailabilityResult = {
  date: string; // "YYYY-MM-DD"
  slots: Slot[];
  /** Raison si aucune disponibilité (jour off, bloqué, hors fenêtre...). */
  reason?: string;
};

type ServiceLike = { durationMin: number };

/** Convertit "HH:MM" en minutes depuis minuit. */
function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Formate un nombre de minutes depuis minuit en "HH:MM". */
function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Clé de date locale (Europe/Paris) "YYYY-MM-DD" pour un instant donné. */
export function toParisDateKey(date: Date): string {
  return formatInTimeZone(date, TIME_ZONE, "yyyy-MM-dd");
}

/** Convertit une heure locale (Paris) d'une date donnée en instant UTC. */
function parisWallClockToUtc(dateKey: string, minutesFromMidnight: number): Date {
  const time = minutesToTime(minutesFromMidnight);
  return fromZonedTime(`${dateKey}T${time}:00`, TIME_ZONE);
}

/** Différence en jours entre deux clés "YYYY-MM-DD" (b - a). */
function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const aUtc = Date.UTC(ay, am - 1, ad);
  const bUtc = Date.UTC(by, bm - 1, bd);
  return Math.round((bUtc - aUtc) / (1000 * 60 * 60 * 24));
}

/** Jour de la semaine (0=dimanche) pour une clé de date. */
function weekdayFromKey(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Calcule les créneaux disponibles pour une date locale donnée et une prestation.
 * @param dateKey Date locale (Europe/Paris) au format "YYYY-MM-DD".
 * @param service Prestation (au moins durationMin).
 * @param now Instant courant (injectable pour les tests).
 */
export async function computeSlotsForDate(
  dateKey: string,
  service: ServiceLike,
  now: Date = new Date(),
): Promise<AvailabilityResult> {
  const settings =
    (await prisma.bookingSettings.findUnique({ where: { id: 1 } })) ?? {
      slotStepMin: 30,
      bufferMin: 0,
      minLeadHours: 12,
      maxAdvanceDays: 30,
    };

  const todayKey = toParisDateKey(now);
  const diff = dayDiff(todayKey, dateKey);

  // 1. Fenêtre autorisée
  if (diff < 0) {
    return { date: dateKey, slots: [], reason: "Date passée" };
  }
  if (diff > settings.maxAdvanceDays) {
    return {
      date: dateKey,
      slots: [],
      reason: `Réservation possible jusqu'à ${settings.maxAdvanceDays} jours à l'avance`,
    };
  }

  // 2. Jour bloqué exceptionnellement
  const [y, m, d] = dateKey.split("-").map(Number);
  const blockedDate = new Date(Date.UTC(y, m - 1, d));
  const blocked = await prisma.blockedDate.findUnique({
    where: { date: blockedDate },
  });
  if (blocked) {
    return { date: dateKey, slots: [], reason: "Jour indisponible" };
  }

  // 3. Horaires de travail du jour
  const weekday = weekdayFromKey(dateKey);
  const windows = await prisma.workingHours.findMany({
    where: { weekday, isActive: true },
    orderBy: { startTime: "asc" },
  });
  if (windows.length === 0) {
    return { date: dateKey, slots: [], reason: "Fermé ce jour" };
  }

  // 5. Réservations existantes du jour (pour exclure les chevauchements)
  const dayStartUtc = parisWallClockToUtc(dateKey, 0);
  const nextDayStartUtc = new Date(dayStartUtc.getTime() + 24 * 60 * 60 * 1000);
  const existing = await prisma.booking.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED"] },
      startAt: { gte: dayStartUtc, lt: nextDayStartUtc },
    },
    select: { startAt: true, endAt: true },
  });

  const bufferMs = settings.bufferMin * 60 * 1000;
  const leadCutoff = new Date(now.getTime() + settings.minLeadHours * 60 * 60 * 1000);

  const slots: Slot[] = [];

  // 4. Génération des créneaux candidats par fenêtre
  for (const w of windows) {
    const winStart = timeToMinutes(w.startTime);
    const winEnd = timeToMinutes(w.endTime);

    for (
      let start = winStart;
      start + service.durationMin <= winEnd;
      start += settings.slotStepMin
    ) {
      const startUtc = parisWallClockToUtc(dateKey, start);
      const endUtc = new Date(startUtc.getTime() + service.durationMin * 60 * 1000);

      // 6. Exclure avant le délai minimum
      if (startUtc < leadCutoff) continue;

      // 5. Exclure les chevauchements (avec buffer)
      const overlaps = existing.some((b) => {
        const bStart = b.startAt.getTime() - bufferMs;
        const bEnd = b.endAt.getTime() + bufferMs;
        return startUtc.getTime() < bEnd && endUtc.getTime() > bStart;
      });
      if (overlaps) continue;

      slots.push({ startUtc: startUtc.toISOString(), label: minutesToTime(start) });
    }
  }

  return {
    date: dateKey,
    slots,
    reason: slots.length === 0 ? "Aucun créneau disponible" : undefined,
  };
}
