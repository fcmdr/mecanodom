import type { Metadata } from "next";
import { getTenantContext, getSiteConfig } from "@/lib/tenant";
import { MapSection } from "@/components/MapSection";
import { CoverageChecker } from "@/components/CoverageChecker";

export const metadata: Metadata = {
  title: "Zone d'intervention",
  description:
    "Découvrez les communes couvertes par notre service de mécanique à domicile et vérifiez votre code postal.",
};

export default async function ZonePage() {
  const { db } = await getTenantContext();
  const site = await getSiteConfig();
  const zones = await db.coverageZone.findMany({
    where: { isActive: true },
    orderBy: { postalCode: "asc" },
  });

  return (
    <div className="container-page py-12">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          Zone d'intervention
        </h1>
        <p className="mt-3 text-slate-600">
          Nous nous déplaçons à votre domicile dans les communes ci-dessous.
          Vérifiez votre code postal en un instant.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <MapSection
          center={[site.mapCenter.lat, site.mapCenter.lng]}
          siteName={site.name}
        />

        <div className="space-y-6">
          <CoverageChecker />

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Communes couvertes
            </h2>
            {zones.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Aucune zone renseignée pour le moment.
              </p>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {zones.map((z) => (
                  <li
                    key={z.id}
                    className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="font-mono font-semibold text-brand">
                      {z.postalCode}
                    </span>
                    <span className="text-slate-700">{z.city}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs text-slate-500">
              Votre commune n'apparaît pas ? Contactez-nous, nous étudions les
              demandes au cas par cas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
