"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getTenantContext } from "@/lib/tenant";
import {
  bookingSettingsSchema,
  workingHoursSchema,
  blockedDateSchema,
} from "@/lib/validators";
import type { ActionState } from "./types";

function revalidateAvailability() {
  revalidatePath("/admin/disponibilites");
  revalidatePath("/rendez-vous");
}

// ---------- Paramètres de réservation ----------

export async function updateBookingSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = bookingSettingsSchema.safeParse({
    slotStepMin: formData.get("slotStepMin"),
    bufferMin: formData.get("bufferMin"),
    minLeadHours: formData.get("minLeadHours"),
    maxAdvanceDays: formData.get("maxAdvanceDays"),
  });
  if (!parsed.success) {
    return { error: "Paramètres invalides", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { tenant, db } = await getTenantContext();
  await db.bookingSettings.upsert({
    where: { tenantId: tenant.id },
    update: parsed.data,
    create: parsed.data, // tenantId injecté par le client scopé
  });
  revalidateAvailability();
  return { success: true };
}

// ---------- Horaires de travail ----------

export async function addWorkingHours(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = workingHoursSchema.safeParse({
    weekday: formData.get("weekday"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    isActive: true,
  });
  if (!parsed.success) {
    const fe = parsed.error.flatten();
    return {
      error: fe.formErrors[0] ?? "Créneau horaire invalide",
      fieldErrors: fe.fieldErrors,
    };
  }
  const { db } = await getTenantContext();
  await db.workingHours.create({ data: parsed.data });
  revalidateAvailability();
  return { success: true };
}

export async function deleteWorkingHours(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (id) {
    const { db } = await getTenantContext();
    await db.workingHours.delete({ where: { id } });
    revalidateAvailability();
  }
}

export async function toggleWorkingHours(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  const { db } = await getTenantContext();
  const wh = await db.workingHours.findUnique({ where: { id } });
  if (wh) {
    await db.workingHours.update({
      where: { id },
      data: { isActive: !wh.isActive },
    });
    revalidateAvailability();
  }
}

// ---------- Jours bloqués ----------

export async function addBlockedDate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = blockedDateSchema.safeParse({
    date: formData.get("date"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) {
    return { error: "Date invalide", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const [y, m, d] = parsed.data.date.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const { tenant, db } = await getTenantContext();
  await db.blockedDate.upsert({
    where: { tenantId_date: { tenantId: tenant.id, date } },
    update: { reason: parsed.data.reason || null },
    create: { date, reason: parsed.data.reason || null },
  });
  revalidateAvailability();
  return { success: true };
}

export async function deleteBlockedDate(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (id) {
    const { db } = await getTenantContext();
    await db.blockedDate.delete({ where: { id } });
    revalidateAvailability();
  }
}
