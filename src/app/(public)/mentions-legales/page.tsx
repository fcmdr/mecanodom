import type { Metadata } from "next";
import { legalConfig } from "@/lib/site";
import { getSiteConfig } from "@/lib/tenant";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return {
    title: "Mentions légales",
    description: `Mentions légales du site ${site.name}.`,
  };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-2 space-y-1 text-sm leading-relaxed text-slate-600">
        {children}
      </div>
    </section>
  );
}

export default async function MentionsLegalesPage() {
  const site = await getSiteConfig();
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Mentions légales
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Dernière mise à jour : {legalConfig.lastUpdated}
        </p>

        <Section title="Éditeur du site">
          <p>
            Le site <strong>{site.name}</strong> est édité par :
          </p>
          <p>{legalConfig.companyName}</p>
          <p>Forme juridique : {legalConfig.legalForm}</p>
          {legalConfig.capital && <p>Capital social : {legalConfig.capital}</p>}
          <p>SIRET : {legalConfig.siret}</p>
          <p>N° TVA : {legalConfig.vatNumber}</p>
          <p>Siège social : {legalConfig.registeredAddress}</p>
          <p>
            Téléphone :{" "}
            <a href={site.phoneHref} className="text-brand">
              {site.phone}
            </a>
          </p>
          <p>
            Email :{" "}
            <a href={site.emailHref} className="text-brand">
              {site.email}
            </a>
          </p>
        </Section>

        <Section title="Directeur de la publication">
          <p>{legalConfig.publicationDirector}</p>
        </Section>

        <Section title="Hébergement">
          <p>Le site est hébergé par :</p>
          <p>{legalConfig.host.name}</p>
          <p>{legalConfig.host.address}</p>
          <p>{legalConfig.host.contact}</p>
        </Section>

        <Section title="Propriété intellectuelle">
          <p>
            L'ensemble des contenus présents sur ce site (textes, images,
            éléments graphiques, structure) est, sauf mention contraire, la
            propriété de {legalConfig.companyName} ou de ses partenaires. Toute
            reproduction, représentation, modification ou exploitation, totale ou
            partielle, sans autorisation écrite préalable est interdite.
          </p>
          <p>
            La cartographie est fournie par OpenStreetMap et ses contributeurs
            (licence ODbL).
          </p>
        </Section>

        <Section title="Responsabilité">
          <p>
            {site.name} s'efforce d'assurer l'exactitude des informations
            diffusées (notamment les tarifs et disponibilités), sans garantie
            qu'elles soient exemptes d'erreurs. Les informations sont fournies à
            titre indicatif et peuvent être modifiées à tout moment. Un
            rendez-vous pris en ligne fait l'objet d'une confirmation par nos
            soins.
          </p>
        </Section>

        <Section title="Données personnelles">
          <p>
            Le traitement des données personnelles collectées via ce site est
            décrit dans notre{" "}
            <a href="/confidentialite" className="text-brand underline">
              politique de confidentialité
            </a>
            .
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Pour toute question relative au site, vous pouvez nous écrire à{" "}
            <a href={site.emailHref} className="text-brand">
              {site.email}
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}
