// URL de base de l'application (pour les liens absolus dans les e-mails).
export function getAppUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

/** Lien d'annulation client sécurisé par jeton. */
export function buildCancelUrl(id: number, token: string): string {
  return `${getAppUrl()}/rendez-vous/annulation?id=${id}&token=${encodeURIComponent(token)}`;
}
