import type { Metadata } from "next";
import Link from "next/link";
import { getTenantContext } from "@/lib/tenant";
import { cancelBookingByToken } from "@/actions/public-cancel";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import {
  formatDateTimeFr,
  formatPrice,
  formatDuration,
} from "@/lib/utils";

export const metadata: Metadata = {
  title: "Annuler mon rendez-vous",
  robots: { index: false },
};

function Message({
  title,
  children,
  tone = "neutral",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "neutral" | "success" | "error";
}) {
  const toneClasses =
    tone === "success"
      ? "bg-green-50 text-green-800"
      : tone === "error"
        ? "bg-red-50 text-red-700"
        : "bg-slate-50 text-slate-700";
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl font-black text-slate-900">{title}</h1>
        <div className={`mt-6 rounded-xl p-6 text-sm ${toneClasses}`}>
          {children}
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn-secondary">
            Accueil
          </Link>
          <Link href="/rendez-vous" className="btn-primary">
            Prendre un nouveau rendez-vous
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function CancelPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; token?: string }>;
}) {
  const { id, token } = await searchParams;
  const bookingId = Number(id);

  if (!bookingId || Number.isNaN(bookingId) || !token) {
    return (
      <Message title="Lien invalide" tone="error">
        Ce lien d'annulation est incomplet ou invalide. Vérifiez le lien reçu par
        e-mail, ou contactez-nous.
      </Message>
    );
  }

  const { db } = await getTenantContext();
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { service: true },
  });

  // Jeton invalide → message neutre (on ne révèle pas l'existence du RDV).
  if (!booking || !booking.cancelToken || booking.cancelToken !== token) {
    return (
      <Message title="Lien invalide" tone="error">
        Ce lien d'annulation n'est pas valide. Contactez-nous si vous souhaitez
        annuler votre rendez-vous.
      </Message>
    );
  }

  // Déjà annulé
  if (booking.status === "CANCELLED") {
    return (
      <Message title="Rendez-vous annulé" tone="success">
        Votre rendez-vous <strong>#{booking.id}</strong> a bien été annulé. Le
        créneau a été libéré.
      </Message>
    );
  }

  // Terminé ou passé → non annulable en ligne
  const isPast = booking.startAt.getTime() <= Date.now();
  if (booking.status === "COMPLETED" || isPast) {
    return (
      <Message title="Annulation impossible" tone="error">
        Ce rendez-vous ne peut plus être annulé en ligne. Pour toute question,
        merci de nous contacter directement.
      </Message>
    );
  }

  // Annulable → afficher le récapitulatif + confirmation
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-xl">
        <h1 className="text-center text-3xl font-black text-slate-900">
          Annuler votre rendez-vous
        </h1>
        <p className="mt-3 text-center text-slate-600">
          Vous êtes sur le point d'annuler la réservation suivante. Cette action
          est définitive.
        </p>

        <div className="card mt-8 p-6">
          <dl className="space-y-3 text-sm">
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
              <dt className="text-slate-500">Durée</dt>
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

        <form
          action={cancelBookingByToken}
          className="mt-6 flex flex-col items-center gap-3"
        >
          <input type="hidden" name="id" value={booking.id} />
          <input type="hidden" name="token" value={booking.cancelToken} />
          <ConfirmSubmit
            confirmMessage="Confirmer l'annulation de ce rendez-vous ?"
            className="btn-danger w-full sm:w-auto"
          >
            Confirmer l'annulation
          </ConfirmSubmit>
          <Link href="/" className="text-sm text-slate-500 hover:text-brand">
            Non, garder mon rendez-vous
          </Link>
        </form>
      </div>
    </div>
  );
}
