"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  sendStatusChangeEmail,
  sendClientCancellationAdminNotice,
  type BookingEmailData,
} from "@/lib/mail";

/**
 * Annulation d'une réservation par le client via son lien sécurisé (jeton).
 * Aucune authentification admin : la sécurité repose sur le cancelToken.
 * Ne lève jamais d'erreur visible ; en cas de jeton invalide, ne fait rien.
 */
export async function cancelBookingByToken(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const token = String(formData.get("token") ?? "");
  if (!id || !token) return;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { service: true },
  });

  // Jeton invalide / absent : on ignore silencieusement.
  if (!booking || !booking.cancelToken || booking.cancelToken !== token) return;

  // Déjà annulée / terminée / passée : rien à faire.
  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") return;
  if (booking.startAt.getTime() <= Date.now()) return;

  await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  const vehicle = [booking.vehicleMake, booking.vehicleModel]
    .filter(Boolean)
    .join(" ")
    .trim();

  const emailData: BookingEmailData = {
    id: booking.id,
    serviceName: booking.service.name,
    priceCents: booking.service.priceCents,
    durationMin: booking.service.durationMin,
    startAt: booking.startAt,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    customerPhone: booking.customerPhone,
    address: booking.address,
    postalCode: booking.postalCode,
    city: booking.city,
    vehicle: vehicle || null,
    notes: booking.notes,
  };

  // Notifications (non bloquantes)
  await sendStatusChangeEmail(emailData, "CANCELLED");
  await sendClientCancellationAdminNotice(emailData);

  revalidatePath("/admin/reservations");
  revalidatePath(`/admin/reservations/${id}`);
  revalidatePath("/admin");
}
