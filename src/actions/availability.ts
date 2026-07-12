"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
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
  await prisma.bookingSettings.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
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
  await prisma.workingHours.create({ data: parsed.data });
  revalidateAvailability();
  return { success: true };
}

export async function deleteWorkingHours(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (id) {
    await prisma.workingHours.delete({ where: { id } });
    revalidateAvailability();
  }
}

export async function toggleWorkingHours(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  const wh = await prisma.workingHours.findUnique({ where: { id } });
  if (wh) {
    await prisma.workingHours.update({
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
  await prisma.blockedDate.upsert({
    where: { date },
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
    await prisma.blockedDate.delete({ where: { id } });
    revalidateAvailability();
  }
}
