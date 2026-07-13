import Link from "next/link";
import { getTenantContext } from "@/lib/tenant";
import { siteConfig } from "@/lib/site";
import { formatPrice, formatDuration } from "@/lib/utils";

export default async function HomePage() {
  const { db } = await getTenantContext();
  const featured = await db.service.findMany({
    where: { isActive: true },
    orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
    include: { category: true },
    take: 4,
  });

  const zones = await db.coverageZone.findMany({
    where: { isActive: true },
    orderBy: { postalCode: "asc" },
  });

  const steps = [
    {
      title: "Choisissez votre prestation",
      text: "Sélectionnez l'entretien ou la réparation dont vous avez besoin.",
    },
    {
      title: "Réservez un créneau",
      text: "Choisissez la date et l'heure qui vous conviennent en ligne.",
    },
    {
      title: "On vient chez vous",
      text: "Notre mécanicien intervient directement à votre domicile.",
    },
  ];

  const advantages = [
    {
      title: "À domicile",
      text: "Plus besoin de vous déplacer ni d'attendre au garage.",
    },
    {
      title: "Tarifs transparents",
      text: "Les prix sont affichés clairement, sans surprise.",
    },
    {
      title: "Réservation en ligne",
      text: "Prenez rendez-vous en quelques clics, 24h/24.",
    },
    {
      title: "Mécanicien qualifié",
      text: "Un professionnel expérimenté et équipé.",
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="container-page relative grid gap-8 py-20 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center rounded-full bg-brand/20 px-3 py-1 text-sm font-medium text-brand-light">
              {siteConfig.tagline}
            </span>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              L'entretien de votre voiture, sans quitter chez vous
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-300">
              {siteConfig.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/rendez-vous" className="btn-primary text-base">
                Prendre rendez-vous
              </Link>
              <Link
                href="/services"
                className="btn border border-white/30 text-white hover:bg-white/10"
              >
                Voir les tarifs
              </Link>
            </div>
            <p className="mt-6 text-sm text-slate-400">
              {siteConfig.hoursSummary} · {siteConfig.phone}
            </p>
          </div>

          <div className="flex items-center justify-center">
            <div className="grid w-full max-w-md grid-cols-2 gap-4">
              {advantages.map((a) => (
                <div
                  key={a.title}
                  className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur"
                >
                  <h3 className="font-semibold text-white">{a.title}</h3>
                  <p className="mt-1 text-sm text-slate-300">{a.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="container-page py-16">
        <h2 className="text-center text-3xl font-bold text-slate-900">
          Comment ça marche ?
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
                {i + 1}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prestations en vedette */}
      {featured.length > 0 && (
        <section className="bg-white py-16">
          <div className="container-page">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  Prestations populaires
                </h2>
                <p className="mt-2 text-slate-600">
                  Des tarifs clairs, affichés à l'avance.
                </p>
              </div>
              <Link
                href="/services"
                className="hidden text-sm font-semibold text-brand hover:text-brand-dark sm:block"
              >
                Toutes les prestations →
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((s) => (
                <div key={s.id} className="card flex flex-col p-5">
                  <span className="text-xs font-medium uppercase tracking-wide text-brand">
                    {s.category.name}
                  </span>
                  <h3 className="mt-1 font-semibold text-slate-900">{s.name}</h3>
                  <p className="mt-2 flex-1 text-sm text-slate-600 line-clamp-3">
                    {s.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-900">
                      {formatPrice(s.priceCents)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDuration(s.durationMin)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Zone d'intervention */}
      <section className="container-page py-16">
        <div className="card flex flex-col items-center gap-6 p-8 text-center md:flex-row md:text-left">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">
              Nous intervenons près de chez vous
            </h2>
            <p className="mt-2 text-slate-600">
              Vérifiez si votre commune est couverte par notre service à
              domicile.
            </p>
            {zones.length > 0 && (
              <p className="mt-3 text-sm text-slate-500">
                Déjà disponible à{" "}
                {zones
                  .slice(0, 4)
                  .map((z) => z.city)
                  .join(", ")}
                {zones.length > 4 ? "…" : ""}
              </p>
            )}
          </div>
          <Link href="/zone" className="btn-primary whitespace-nowrap">
            Vérifier ma zone
          </Link>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-brand">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-12 text-center md:flex-row md:text-left">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Prêt à réserver votre intervention ?
            </h2>
            <p className="mt-1 text-orange-50">
              Prise de rendez-vous en ligne, simple et rapide.
            </p>
          </div>
          <Link
            href="/rendez-vous"
            className="btn bg-white text-brand hover:bg-orange-50"
          >
            Prendre rendez-vous
          </Link>
        </div>
      </section>
    </>
  );
}
