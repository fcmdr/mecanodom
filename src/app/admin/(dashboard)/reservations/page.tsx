import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTimeFr, BOOKING_STATUS_LABELS } from "@/lib/utils";

const STATUS_FILTERS = [
  { key: "", label: "Tous" },
  { key: "PENDING", label: "En attente" },
  { key: "CONFIRMED", label: "Confirmés" },
  { key: "COMPLETED", label: "Terminés" },
  { key: "CANCELLED", label: "Annulés" },
];

const STATUS_CLASSES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-green-100 text-green-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-slate-200 text-slate-600",
};

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const where = status ? { status } : {};

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { startAt: "desc" },
    include: { service: true },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Réservations</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gérez les demandes de rendez-vous.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = (status ?? "") === f.key;
          return (
            <Link
              key={f.key}
              href={f.key ? `/admin/reservations?status=${f.key}` : "/admin/reservations"}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                active
                  ? "bg-brand text-white"
                  : "bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        {bookings.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucune réservation.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Prestation</th>
                  <th className="px-4 py-3">Lieu</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">
                      {formatDateTimeFr(b.startAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {b.customerName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {b.customerPhone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{b.service.name}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {b.postalCode} {b.city}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_CLASSES[b.status]}`}>
                        {BOOKING_STATUS_LABELS[b.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/reservations/${b.id}`}
                        className="font-medium text-brand hover:text-brand-dark"
                      >
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
