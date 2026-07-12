import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  formatDateTimeFr,
  formatPrice,
  formatDuration,
  BOOKING_STATUS_LABELS,
} from "@/lib/utils";
import { updateBookingStatus, deleteBooking } from "@/actions/bookings";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";

const STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bookingId = Number(id);
  if (!bookingId || Number.isNaN(bookingId)) notFound();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true },
  });
  if (!booking) notFound();

  const vehicle = [
    booking.vehicleMake,
    booking.vehicleModel,
    booking.vehicleYear ? `(${booking.vehicleYear})` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/reservations"
            className="text-sm text-slate-500 hover:text-brand"
          >
            ← Réservations
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Réservation #{booking.id}
          </h1>
        </div>
        <span className="badge bg-slate-100 text-slate-700">
          {BOOKING_STATUS_LABELS[booking.status]}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Intervention
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-slate-500">Prestation</dt>
                <dd className="font-medium text-slate-900">
                  {booking.service.name}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Prix</dt>
                <dd className="font-medium text-slate-900">
                  {formatPrice(booking.service.priceCents)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Date & heure</dt>
                <dd className="font-medium text-slate-900">
                  {formatDateTimeFr(booking.startAt)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Durée</dt>
                <dd className="font-medium text-slate-900">
                  {formatDuration(booking.service.durationMin)}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Adresse</dt>
                <dd className="font-medium text-slate-900">
                  {booking.address}, {booking.postalCode} {booking.city}
                </dd>
              </div>
              {booking.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Notes</dt>
                  <dd className="text-slate-900">{booking.notes}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Client & véhicule
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-slate-500">Nom</dt>
                <dd className="font-medium text-slate-900">
                  {booking.customerName}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Téléphone</dt>
                <dd className="font-medium text-slate-900">
                  <a href={`tel:${booking.customerPhone}`} className="hover:text-brand">
                    {booking.customerPhone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium text-slate-900">
                  <a href={`mailto:${booking.customerEmail}`} className="hover:text-brand">
                    {booking.customerEmail}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Véhicule</dt>
                <dd className="font-medium text-slate-900">
                  {vehicle || "—"}
                  {booking.vehiclePlate ? ` · ${booking.vehiclePlate}` : ""}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Changer le statut
            </h2>
            <form action={updateBookingStatus} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={booking.id} />
              <select
                name="status"
                defaultValue={booking.status}
                className="input"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {BOOKING_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-primary w-full">
                Enregistrer
              </button>
            </form>
          </section>

          <section className="card p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Zone de danger
            </h2>
            <form action={deleteBooking} className="mt-4">
              <input type="hidden" name="id" value={booking.id} />
              <ConfirmSubmit
                confirmMessage="Supprimer définitivement cette réservation ?"
                className="btn-danger w-full"
              >
                Supprimer la réservation
              </ConfirmSubmit>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
