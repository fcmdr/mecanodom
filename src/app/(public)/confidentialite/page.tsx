import type { Metadata } from "next";
import { siteConfig, legalConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: `Politique de confidentialité et protection des données personnelles du site ${siteConfig.name}.`,
};

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
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">
        {children}
      </div>
    </section>
  );
}

export default function ConfidentialitePage() {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Politique de confidentialité
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Dernière mise à jour : {legalConfig.lastUpdated}
        </p>

        <p className="mt-6 text-sm leading-relaxed text-slate-600">
          La présente politique décrit la manière dont {siteConfig.name} collecte
          et traite vos données personnelles, conformément au Règlement Général
          sur la Protection des Données (RGPD) et à la loi Informatique et
          Libertés.
        </p>

        <Section title="Responsable du traitement">
          <p>
            Le responsable du traitement est {legalConfig.companyName}, dont les
            coordonnées figurent dans les{" "}
            <a href="/mentions-legales" className="text-brand underline">
              mentions légales
            </a>
            .
          </p>
        </Section>

        <Section title="Données collectées">
          <p>
            Lors d'une prise de rendez-vous, nous collectons les données que vous
            renseignez volontairement :
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Identité : nom et prénom</li>
            <li>Coordonnées : adresse e-mail, numéro de téléphone</li>
            <li>Lieu d'intervention : adresse postale, code postal, ville</li>
            <li>
              Informations sur le véhicule : marque, modèle, année,
              immatriculation (facultatif)
            </li>
            <li>Détails de la demande : prestation choisie, créneau, notes</li>
          </ul>
          <p>
            Aucune donnée sensible n'est demandée. Aucun paiement n'est traité en
            ligne.
          </p>
        </Section>

        <Section title="Finalités et base légale">
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Gérer et honorer vos demandes de rendez-vous (exécution de mesures
              précontractuelles et contractuelles) ;
            </li>
            <li>
              Vous contacter au sujet de votre intervention (confirmation,
              modification, annulation) ;
            </li>
            <li>
              Répondre à vos demandes via le formulaire de contact (intérêt
              légitime).
            </li>
          </ul>
        </Section>

        <Section title="Destinataires des données">
          <p>
            Vos données sont destinées exclusivement à {siteConfig.name} pour la
            gestion des rendez-vous. Elles peuvent être traitées par nos
            prestataires techniques (hébergeur, service d'envoi d'e-mails) agissant
            en tant que sous-traitants, uniquement pour le fonctionnement du
            service. Vos données ne sont ni vendues ni cédées à des tiers à des
            fins commerciales.
          </p>
        </Section>

        <Section title="Durée de conservation">
          <p>
            Les données liées à un rendez-vous sont conservées le temps nécessaire
            à la gestion de la relation client, puis archivées ou supprimées
            conformément aux obligations légales applicables (notamment comptables
            le cas échéant).
          </p>
        </Section>

        <Section title="Vos droits">
          <p>
            Conformément au RGPD, vous disposez d'un droit d'accès, de
            rectification, d'effacement, de limitation, d'opposition et de
            portabilité de vos données. Pour exercer ces droits, contactez-nous à{" "}
            <a href={siteConfig.emailHref} className="text-brand">
              {siteConfig.email}
            </a>
            .
          </p>
          <p>
            Vous pouvez également introduire une réclamation auprès de la CNIL
            (Commission Nationale de l'Informatique et des Libertés) —{" "}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand underline"
            >
              www.cnil.fr
            </a>
            .
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            Ce site n'utilise pas de cookies publicitaires ni de traceurs à des
            fins de suivi. Un unique cookie strictement nécessaire est utilisé
            pour la session de l'espace administrateur (accès réservé au
            gestionnaire du site) ; il n'est pas déposé lors de la navigation
            publique. Aucun consentement préalable n'est donc requis pour naviguer
            sur le site.
          </p>
        </Section>

        <Section title="Sécurité">
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles
            appropriées pour protéger vos données contre tout accès, altération ou
            divulgation non autorisés (connexion sécurisée HTTPS, accès
            d'administration protégé).
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Pour toute question relative à cette politique ou au traitement de vos
            données, écrivez-nous à{" "}
            <a href={siteConfig.emailHref} className="text-brand">
              {siteConfig.email}
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}
