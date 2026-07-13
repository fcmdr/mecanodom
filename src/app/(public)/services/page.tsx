import type { Metadata } from "next";
import Link from "next/link";
import { getTenantContext } from "@/lib/tenant";
import { formatPrice, formatDuration } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Prestations & tarifs",
  description:
    "Découvrez nos prestations d'entretien et de réparation automobile à domicile avec des tarifs transparents.",
};

export default async function ServicesPage() {
  const { db } = await getTenantContext();
  const categories = await db.serviceCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { order: "asc" },
      },
    },
  });

  const withServices = categories.filter((c) => c.services.length > 0);

  return (
    <div className="container-page py-12">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          Prestations & tarifs
        </h1>
        <p className="mt-3 text-slate-600">
          Des prix transparents, affichés à l'avance. Les pièces détachées
          peuvent être facturées en supplément selon la prestation.
        </p>
      </header>

      {withServices.length === 0 ? (
        <p className="mt-12 text-center text-slate-500">
          Aucune prestation disponible pour le moment.
        </p>
      ) : (
        <div className="mt-12 space-y-12">
          {withServices.map((cat) => (
            <section key={cat.id}>
              <h2 className="text-2xl font-bold text-slate-900">{cat.name}</h2>
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                <ul className="divide-y divide-slate-100">
                  {cat.services.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">
                          {s.name}
                        </h3>
                        {s.description && (
                          <p className="mt-1 text-sm text-slate-600">
                            {s.description}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                          Durée estimée : {formatDuration(s.durationMin)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <span className="text-xl font-bold text-slate-900">
                          {formatPrice(s.priceCents)}
                        </span>
                        <Link
                          href={`/rendez-vous?service=${s.id}`}
                          className="btn-secondary py-1.5 text-xs"
                        >
                          Réserver
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-14 flex flex-col items-center gap-4 rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Une question sur un tarif ?</h2>
        <p className="max-w-lg text-slate-300">
          Contactez-nous pour un devis personnalisé ou pour toute demande
          spécifique.
        </p>
        <div className="flex gap-3">
          <Link href="/rendez-vous" className="btn-primary">
            Prendre RDV
          </Link>
          <Link
            href="/contact"
            className="btn border border-white/30 text-white hover:bg-white/10"
          >
            Nous contacter
          </Link>
        </div>
      </div>
    </div>
  );
}
