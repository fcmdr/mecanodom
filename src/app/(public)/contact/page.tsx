import type { Metadata } from "next";
import Link from "next/link";
import { getSiteConfig } from "@/lib/tenant";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez notre service de mécanique automobile à domicile par téléphone ou email.",
};

export default async function ContactPage() {
  const site = await getSiteConfig();
  return (
    <div className="container-page py-12">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          Contact
        </h1>
        <p className="mt-3 text-slate-600">
          Une question, un devis, une demande particulière ? Nous sommes à votre
          écoute.
        </p>
      </header>

      <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
        <a href={site.phoneHref} className="card p-6 hover:border-brand">
          <h2 className="font-semibold text-slate-900">Téléphone</h2>
          <p className="mt-2 text-lg font-bold text-brand">
            {site.phone}
          </p>
          <p className="mt-1 text-sm text-slate-600">{site.hoursSummary}</p>
        </a>

        <a href={site.emailHref} className="card p-6 hover:border-brand">
          <h2 className="font-semibold text-slate-900">Email</h2>
          <p className="mt-2 text-lg font-bold text-brand">
            {site.email}
          </p>
          <p className="mt-1 text-sm text-slate-600">Réponse sous 24–48h</p>
        </a>
      </div>

      <div className="mx-auto mt-8 max-w-3xl rounded-xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-2xl font-bold">Besoin d'une intervention ?</h2>
        <p className="mt-2 text-slate-300">
          Le plus simple reste la réservation en ligne : choisissez votre
          prestation et votre créneau.
        </p>
        <Link href="/rendez-vous" className="btn-primary mt-4">
          Prendre rendez-vous
        </Link>
      </div>
    </div>
  );
}
