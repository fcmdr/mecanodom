// Informations de l'entreprise, centralisées et faciles à modifier.
export const siteConfig = {
  name: "MécanoDom",
  tagline: "Votre mécanicien à domicile",
  description:
    "Entretien et réparation automobile à domicile en Île-de-France. Prise de rendez-vous en ligne, tarifs transparents, intervention chez vous.",
  phone: "01 23 45 67 89",
  phoneHref: "tel:+33123456789",
  email: "contact@mecanodom.fr",
  emailHref: "mailto:contact@mecanodom.fr",
  address: "Île-de-France",
  hoursSummary: "Lun–Ven 8h–18h · Sam 9h–13h",
  // Centre par défaut de la carte (Paris)
  mapCenter: { lat: 48.8566, lng: 2.3522 },
};

export const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/services", label: "Prestations & tarifs" },
  { href: "/zone", label: "Zone d'intervention" },
  { href: "/contact", label: "Contact" },
];

// Informations légales de l'entreprise. À COMPLÉTER avec les données réelles
// avant toute mise en production (obligatoire en France).
export const legalConfig = {
  // Éditeur du site
  companyName: "[À COMPLÉTER : raison sociale / nom de l'entreprise]",
  legalForm: "[À COMPLÉTER : forme juridique, ex. auto-entrepreneur, SARL]",
  siret: "[À COMPLÉTER : n° SIRET]",
  vatNumber: "[À COMPLÉTER : n° TVA intracommunautaire, si applicable]",
  capital: "", // Optionnel : capital social (sociétés)
  registeredAddress: "[À COMPLÉTER : adresse du siège social]",
  // Responsable / directeur de la publication
  publicationDirector: "[À COMPLÉTER : nom du responsable de publication]",
  // Hébergeur du site
  host: {
    name: "[À COMPLÉTER : nom de l'hébergeur, ex. Vercel Inc.]",
    address: "[À COMPLÉTER : adresse de l'hébergeur]",
    contact: "[À COMPLÉTER : site web ou téléphone de l'hébergeur]",
  },
  // Date de dernière mise à jour des documents légaux
  lastUpdated: "[À COMPLÉTER : date de mise à jour]",
};

export const legalLinks = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Politique de confidentialité" },
];
