import Link from "next/link";
import { fromZonedTime } from "date-fns-tz";
import { getTenantContext } from "@/lib/tenant";
import { toParisDateKey } from "@/lib/availability";
import {
  TIME_ZONE,
  formatTimeFr,
  formatPrice,
  BOOKING_STATUS_LABELS,
} from "@/lib/utils";

const STATUS_CLASSES: Record<string, string> = {
  PENDING: "border-l-amber-400 bg-amber-50",
  CONFIRMED: "border-l-green-500 bg-green-50",
  COMPLETED: "border-l-blue-400 bg-blue-50",
  CANCELLED: "border-l-slate-300 bg-slate-50 opacity-60",
};

const WEEKDAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** Ajoute n jours à une clé "YYYY-MM-DD". */
function addDaysKey(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

/** Jour de la semaine (0=dim..6=sam) d'une clé. */
function weekdayFromKey(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Lundi (clé) de la semaine contenant `key`. */
function mondayOfWeek(key: string): string {
  const wd = weekdayFromKey(key); // 0=dim
  const offset = wd === 0 ? -6 : 1 - wd;
  return addDaysKey(key, offset);
}

/** Libellé "5 mai" pour une clé. */
function shortLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(dt);
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;

  const todayKey = toParisDateKey(new Date());
  const refKey =
    week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : todayKey;
  const monday = mondayOfWeek(refKey);
  const days = Array.from({ length: 7 }, (_, i) => addDaysKey(monday, i));
  const sunday = days[6];

  // Bornes UTC de la semaine (minuit lundi -> minuit lundi suivant, heure de Paris)
  const startUtc = fromZonedTime(`${monday}T00:00:00`, TIME_ZONE);
  const endUtc = fromZonedTime(`${addDaysKey(monday, 7)}T00:00:00`, TIME_ZONE);

  const { db } = await getTenantContext();
  const bookings = await db.booking.findMany({
    where: { startAt: { gte: startUtc, lt: endUtc } },
    orderBy: { startAt: "asc" },
    include: { service: true },
  });

  const activeCount = bookings.filter(
    (b) => b.status === "PENDING" || b.status === "CONFIRMED",
  ).length;

  const byDay = days.map((key) => ({
    key,
    weekday: weekdayFromKey(key),
    bookings: bookings.filter((b) => toParisDateKey(b.startAt) === key),
  }));

  const prevWeek = addDaysKey(monday, -7);
  const nextWeek = addDaysKey(monday, 7);
  const thisMonday = mondayOfWeek(todayKey);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendrier</h1>
          <p className="mt-1 text-sm text-slate-500">
            Semaine du {shortLabel(monday)} au {shortLabel(sunday)} ·{" "}
            {activeCount} RDV actif(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/calendrier?week=${prevWeek}`}
            className="btn-secondary py-1.5"
          >
            ← Précédente
          </Link>
          <Link
            href={`/admin/calendrier?week=${thisMonday}`}
            className="btn-ghost py-1.5"
          >
            Cette semaine
          </Link>
          <Link
            href={`/admin/calendrier?week=${nextWeek}`}
            className="btn-secondary py-1.5"
          >
            Suivante →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {byDay.map((day) => {
          const isToday = day.key === todayKey;
          return (
            <div
              key={day.key}
              className={`rounded-xl border bg-white p-2 ${
                isToday ? "border-brand ring-1 ring-brand" : "border-slate-200"
              }`}
            >
              <div className="mb-2 px-1">
                <div className="text-xs font-semibold uppercase text-slate-500">
                  {WEEKDAY_SHORT[day.weekday === 0 ? 6 : day.weekday - 1]}
                </div>
                <div
                  className={`text-sm font-bold ${
                    isToday ? "text-brand" : "text-slate-900"
                  }`}
                >
                  {shortLabel(day.key)}
                </div>
              </div>

              <div className="space-y-1.5">
                {day.bookings.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-slate-300">—</p>
                ) : (
                  day.bookings.map((b) => (
                    <Link
                      key={b.id}
                      href={`/admin/reservations/${b.id}`}
                      className={`block rounded-md border-l-4 p-2 text-xs transition hover:shadow-sm ${
                        STATUS_CLASSES[b.status] ?? "border-l-slate-300 bg-slate-50"
                      }`}
                      title={`${BOOKING_STATUS_LABELS[b.status]} · ${formatPrice(
                        b.service.priceCents,
                      )}`}
                    >
                      <div className="font-semibold text-slate-900">
                        {formatTimeFr(b.startAt)}
                      </div>
                      <div className="truncate text-slate-700">
                        {b.customerName}
                      </div>
                      <div className="truncate text-slate-500">
                        {b.service.name}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-l-4 border-l-amber-400 bg-amber-50" />
          En attente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-l-4 border-l-green-500 bg-green-50" />
          Confirmé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-l-4 border-l-blue-400 bg-blue-50" />
          Terminé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-l-4 border-l-slate-300 bg-slate-50" />
          Annulé
        </span>
      </div>
    </div>
  );
}
