"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getTenantContext } from "@/lib/tenant";
import { categorySchema, serviceSchema } from "@/lib/validators";
import type { ActionState } from "./types";

function revalidateServices() {
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/");
  revalidatePath("/rendez-vous");
}

// ---------- Catégories ----------

export async function createCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    order: formData.get("order") ?? 0,
  });
  if (!parsed.success) {
    return { error: "Champs invalides", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { tenant, db } = await getTenantContext();
  const existing = await db.serviceCategory.findFirst({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return { error: "Ce slug est déjà utilisé." };
  }

  await db.serviceCategory.create({ data: { ...parsed.data, tenantId: tenant.id } });
  revalidateServices();
  return { success: true };
}

export async function updateCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    order: formData.get("order") ?? 0,
  });
  if (!id) return { error: "Catégorie introuvable" };
  if (!parsed.success) {
    return { error: "Champs invalides", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { db } = await getTenantContext();
  await db.serviceCategory.update({ where: { id }, data: parsed.data });
  revalidateServices();
  return { success: true };
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (id) {
    const { db } = await getTenantContext();
    await db.serviceCategory.delete({ where: { id } });
    revalidateServices();
  }
}

// ---------- Prestations ----------

function parseService(formData: FormData) {
  return serviceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    priceEuros: formData.get("priceEuros"),
    durationMin: formData.get("durationMin"),
    categoryId: formData.get("categoryId"),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    order: formData.get("order") ?? 0,
  });
}

export async function createService(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseService(formData);
  if (!parsed.success) {
    return { error: "Champs invalides", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { priceEuros, description, ...rest } = parsed.data;
  const { tenant, db } = await getTenantContext();
  await db.service.create({
    data: {
      ...rest,
      tenantId: tenant.id,
      description: description || null,
      priceCents: Math.round(priceEuros * 100),
    },
  });
  revalidateServices();
  return { success: true };
}

export async function updateService(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return { error: "Prestation introuvable" };
  const parsed = parseService(formData);
  if (!parsed.success) {
    return { error: "Champs invalides", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { priceEuros, description, ...rest } = parsed.data;
  const { db } = await getTenantContext();
  await db.service.update({
    where: { id },
    data: {
      ...rest,
      description: description || null,
      priceCents: Math.round(priceEuros * 100),
    },
  });
  revalidateServices();
  return { success: true };
}

export async function deleteService(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (id) {
    const { db } = await getTenantContext();
    await db.service.delete({ where: { id } });
    revalidateServices();
  }
}

export async function toggleService(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  const { db } = await getTenantContext();
  const service = await db.service.findUnique({ where: { id } });
  if (service) {
    await db.service.update({
      where: { id },
      data: { isActive: !service.isActive },
    });
    revalidateServices();
  }
}
