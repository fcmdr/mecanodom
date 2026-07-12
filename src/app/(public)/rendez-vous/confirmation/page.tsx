import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  formatPrice,
  formatDuration,
  formatDateTimeFr,
} from "@/lib/utils";

export const metadata: Metadata = {
  title: "Réservation confirmée",
};

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const bookingId = Number(id);
  if (!bookingId || Number.isNaN(bookingId)) {
    notFound();
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true },
  });

  if (!booking) {
    notFound();
  }

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16a34a"
            strokeWidth="3"
          >
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl font-black text-slate-900">
          Réservation confirmée !
        </h1>
        <p className="mt-2 text-slate-600">
          Merci {booking.customerName.split(" ")[0]}. Votre demande a bien été
          enregistrée. Nous vous recontacterons rapidement pour confirmer
          l'intervention.
        </p>

        <div className="card mt-8 p-6 text-left">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Détails de la réservation
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Référence</dt>
              <dd className="font-mono font-semibold text-slate-900">
                #{booking.id}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Prestation</dt>
              <dd className="font-medium text-slate-900">
                {booking.service.name}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Date & heure</dt>
              <dd className="font-medium text-slate-900">
                {formatDateTimeFr(booking.startAt)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Durée estimée</dt>
              <dd className="text-slate-900">
                {formatDuration(booking.service.durationMin)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Lieu</dt>
              <dd className="text-right text-slate-900">
                {booking.address}
                <br />
                {booking.postalCode} {booking.city}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3">
              <dt className="font-semibold text-slate-900">Prix</dt>
              <dd className="text-lg font-bold text-brand">
                {formatPrice(booking.service.priceCents)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn-secondary">
            Retour à l'accueil
          </Link>
          <Link href="/services" className="btn-primary">
            Voir les prestations
          </Link>
        </div>
      </div>
    </div>
  );
}
