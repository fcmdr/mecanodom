// Liens absolus utilisés dans les e-mails. L'URL de base provient du tenant
// (getTenantBaseUrl), avec repli sur APP_URL.

/** Lien d'annulation client sécurisé par jeton. */
export function buildCancelUrl(
  baseUrl: string,
  id: number,
  token: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/rendez-vous/annulation?id=${id}&token=${encodeURIComponent(token)}`;
}
