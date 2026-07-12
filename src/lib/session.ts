import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// Module compatible Edge (middleware) : n'utilise que `jose`, pas de dépendance Node.

export const SESSION_COOKIE = "mecano_session";
const SESSION_TTL = "8h";

export type SessionPayload = JWTPayload & {
  email: string;
  role: "admin";
};

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET manquant ou trop court (min 16 caractères) dans .env",
    );
  }
  return new TextEncoder().encode(secret);
}

/** Crée un JWT de session signé (expire après 8h). */
export async function createSessionToken(email: string): Promise<string> {
  return new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(getSecret());
}

/** Vérifie un JWT de session ; renvoie le payload ou null si invalide/expiré. */
export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "admin") return null;
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
