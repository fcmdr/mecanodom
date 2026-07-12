// Rate-limiter simple en mémoire (fenêtre glissante), par clé (ex. IP).
// Suffisant pour un déploiement mono-instance (SQLite). Pour du multi-instance,
// remplacer par un store partagé (Redis, etc.).

type Bucket = number[]; // horodatages (ms) des requêtes récentes

const store = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

/**
 * Vérifie et enregistre une requête pour une clé donnée.
 * @param key    Identifiant (ex. adresse IP).
 * @param limit  Nombre max de requêtes autorisées sur la fenêtre.
 * @param windowMs Durée de la fenêtre en millisecondes.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  const bucket = (store.get(key) ?? []).filter((t) => t > cutoff);

  if (bucket.length >= limit) {
    const retryAfterSec = Math.ceil((bucket[0] + windowMs - now) / 1000);
    store.set(key, bucket);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  bucket.push(now);
  store.set(key, bucket);

  // Nettoyage opportuniste pour éviter une croissance mémoire non bornée.
  if (store.size > 5000) {
    for (const [k, v] of store) {
      const pruned = v.filter((t) => t > cutoff);
      if (pruned.length === 0) store.delete(k);
      else store.set(k, pruned);
    }
  }

  return { allowed: true, remaining: limit - bucket.length, retryAfterSec: 0 };
}

/** Extrait une clé IP raisonnable depuis les en-têtes d'une requête. */
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
