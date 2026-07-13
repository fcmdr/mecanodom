import Link from "next/link";
import { getTenantContext } from "@/lib/tenant";
import {
  formatDateTimeFr,
  formatPrice,
  BOOKING_STATUS_LABELS,
} from "@/lib/utils";

export default async function AdminDashboardPage() {
  const now = new Date();
  const { db } = await getTenantContext();

  const [pending, upcoming, totalServices, totalZones, recent] =
    await Promise.all([
      db.booking.count({ where: { status: "PENDING" } }),
      db.booking.count({
        where: { startAt: { gte: now }, status: { in: ["PENDING", "CONFIRMED"] } },
      }),
      db.service.count({ where: { isActive: true } }),
      db.coverageZone.count({ where: { isActive: true } }),
      db.booking.findMany({
        where: { startAt: { gte: now }, status: { in: ["PENDING", "CONFIRMED"] } },
        orderBy: { startAt: "asc" },
        take: 8,
        include: { service: true },
      }),
    ]);

  const stats = [
    { label: "En attente", value: pending, href: "/admin/reservations?status=PENDING" },
    { label: "RDV à venir", value: upcoming, href: "/admin/reservations" },
    { label: "Prestations actives", value: totalServices, href: "/admin/services" },
    { label: "Zones actives", value: totalZones, href: "/admin/zones" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-slate-500">
          Vue d'ensemble de votre activité.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-5 hover:border-brand">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900">Prochains rendez-vous</h2>
          <Link
            href="/admin/reservations"
            className="text-sm font-medium text-brand hover:text-brand-dark"
          >
            Tout voir →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            Aucun rendez-vous à venir.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/admin/reservations/${b.id}`}
                  className="flex items-center justify-between gap-4 p-5 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {b.customerName} · {b.service.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatDateTimeFr(b.startAt)} · {b.postalCode} {b.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-sm font-semibold text-slate-700">
                      {formatPrice(b.service.priceCents)}
                    </span>
                    <span
                      className={`badge ${
                        b.status === "PENDING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {BOOKING_STATUS_LABELS[b.status]}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
