"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getTenantContext } from "@/lib/tenant";
import { sendStatusChangeEmail } from "@/lib/mail";
import { buildCancelUrl } from "@/lib/urls";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
// Statuts qui déclenchent une notification e-mail au client.
const NOTIFY_STATUSES = ["CONFIRMED", "CANCELLED"] as const;

export async function updateBookingStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  if (!id || !VALID_STATUSES.includes(status)) return;

  const { db } = await getTenantContext();
  const existing = await db.booking.findUnique({
    where: { id },
    include: { service: true },
  });
  if (!existing) return;

  // Rien à faire si le statut est inchangé.
  if (existing.status === status) return;

  await db.booking.update({ where: { id }, data: { status } });

  // Notification client (non bloquante) pour confirmé / annulé.
  if ((NOTIFY_STATUSES as readonly string[]).includes(status)) {
    const vehicle = [existing.vehicleMake, existing.vehicleModel]
      .filter(Boolean)
      .join(" ")
      .trim();
    await sendStatusChangeEmail(
      {
        id: existing.id,
        serviceName: existing.service.name,
        priceCents: existing.service.priceCents,
        durationMin: existing.service.durationMin,
        startAt: existing.startAt,
        customerName: existing.customerName,
        customerEmail: existing.customerEmail,
        customerPhone: existing.customerPhone,
        address: existing.address,
        postalCode: existing.postalCode,
        city: existing.city,
        vehicle: vehicle || null,
        notes: existing.notes,
        cancelUrl:
          status === "CONFIRMED" && existing.cancelToken
            ? buildCancelUrl(existing.id, existing.cancelToken)
            : null,
      },
      status as "CONFIRMED" | "CANCELLED",
    );
  }

  revalidatePath("/admin/reservations");
  revalidatePath(`/admin/reservations/${id}`);
  revalidatePath("/admin");
}

export async function deleteBooking(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (id) {
    const { db } = await getTenantContext();
    await db.booking.delete({ where: { id } });
    revalidatePath("/admin/reservations");
    revalidatePath("/admin");
  }
}
