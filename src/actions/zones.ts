"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { coverageZoneSchema } from "@/lib/validators";
import { normalizePostalCode } from "@/lib/coverage";
import type { ActionState } from "./types";

function revalidateZones() {
  revalidatePath("/admin/zones");
  revalidatePath("/zone");
  revalidatePath("/");
}

export async function createZone(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = coverageZoneSchema.safeParse({
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    isActive: true,
  });
  if (!parsed.success) {
    return { error: "Champs invalides", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const postalCode = normalizePostalCode(parsed.data.postalCode);
  const existing = await prisma.coverageZone.findUnique({ where: { postalCode } });
  if (existing) {
    return { error: "Ce code postal existe déjà." };
  }
  await prisma.coverageZone.create({
    data: { postalCode, city: parsed.data.city, isActive: true },
  });
  revalidateZones();
  return { success: true };
}

export async function updateZone(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return { error: "Zone introuvable" };
  const parsed = coverageZoneSchema.safeParse({
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });
  if (!parsed.success) {
    return { error: "Champs invalides", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  await prisma.coverageZone.update({
    where: { id },
    data: {
      postalCode: normalizePostalCode(parsed.data.postalCode),
      city: parsed.data.city,
      isActive: parsed.data.isActive,
    },
  });
  revalidateZones();
  return { success: true };
}

export async function deleteZone(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (id) {
    await prisma.coverageZone.delete({ where: { id } });
    revalidateZones();
  }
}

export async function toggleZone(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  const zone = await prisma.coverageZone.findUnique({ where: { id } });
  if (zone) {
    await prisma.coverageZone.update({
      where: { id },
      data: { isActive: !zone.isActive },
    });
    revalidateZones();
  }
}
