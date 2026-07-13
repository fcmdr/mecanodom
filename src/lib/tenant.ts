import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import type { Tenant } from "@prisma/client";
import { prisma } from "./prisma";
import { dbForTenant, type TenantDb } from "./tenant-db";

// ---------------------------------------------------------------------------
// Point UNIQUE de résolution du tenant courant.
// Aujourd'hui : un seul tenant, résolu par DEFAULT_TENANT_SLUG (fallback).
// Demain : résolution par domaine custom, puis par sous-domaine — seul ce
// fichier (et éventuellement le middleware) changera.
//
// `cache()` garantit une seule requête par rendu React (request-scoped).
// ---------------------------------------------------------------------------

const DEFAULT_TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG ?? "mecanodom";

/** Renvoie le tenant courant. À utiliser dans les pages, actions et routes API. */
export const getCurrentTenant = cache(async (): Promise<Tenant> => {
  // 1. Résolution par domaine (préparée pour le futur ; inoffensive aujourd'hui)
  try {
    const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
    if (host) {
      const byDomain = await prisma.tenant.findUnique({
        where: { domain: host },
      });
      if (byDomain?.isActive) return byDomain;
    }
  } catch {
    // headers() indisponible hors requête (scripts, tests) → fallback
  }

  // 2. Fallback : tenant par défaut
  return prisma.tenant.findUniqueOrThrow({
    where: { slug: DEFAULT_TENANT_SLUG },
  });
});

/** Tenant courant + client Prisma scopé sur ce tenant. Usage le plus courant. */
export const getTenantContext = cache(
  async (): Promise<{ tenant: Tenant; db: TenantDb }> => {
    const tenant = await getCurrentTenant();
    return { tenant, db: dbForTenant(tenant.id) };
  },
);

// ---------------------------------------------------------------------------
// Ex-siteConfig : mêmes champs, mais alimentés par le tenant.
// Les composants serveur appellent getSiteConfig() et passent les valeurs
// aux composants clients via props.
// ---------------------------------------------------------------------------

export type SiteConfig = {
  name: string;
  tagline: string;
  description: string;
  phone: string;
  phoneHref: string;
  email: string;
  emailHref: string;
  address: string;
  hoursSummary: string;
  mapCenter: { lat: number; lng: number };
};

export async function getSiteConfig(): Promise<SiteConfig> {
  const t = await getCurrentTenant();
  const phone = t.phone ?? "";
  return {
    name: t.name,
    tagline: t.tagline ?? "",
    description: t.description ?? "",
    phone,
    phoneHref: "tel:+33" + phone.replace(/\D/g, "").replace(/^0/, ""),
    email: t.email ?? "",
    emailHref: "mailto:" + (t.email ?? ""),
    address: t.address ?? "",
    hoursSummary: t.hoursSummary ?? "",
    mapCenter: {
      lat: t.mapCenterLat ?? 48.8566,
      lng: t.mapCenterLng ?? 2.3522,
    },
  };
}

/** URL de base du tenant (liens e-mail). Fallback sur APP_URL. */
export async function getTenantBaseUrl(): Promise<string> {
  const t = await getCurrentTenant();
  const url = t.baseUrl || process.env.APP_URL || "http://localhost:3000";
  return url.replace(/\/$/, "");
}
