// Liens de navigation et informations légales statiques. Les informations
// d'entreprise (nom, coordonnées, carte…) proviennent désormais du tenant via
// getSiteConfig() (voir src/lib/tenant.ts).

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
