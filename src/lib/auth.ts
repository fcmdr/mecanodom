import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  createSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "./session";

/** Vérifie les identifiants admin contre les variables d'environnement. */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminHash) {
    throw new Error("ADMIN_EMAIL ou ADMIN_PASSWORD_HASH manquant dans .env");
  }

  if (email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()) {
    // On effectue quand même un compare pour limiter le timing oracle.
    await bcrypt.compare(password, adminHash);
    return false;
  }

  return bcrypt.compare(password, adminHash);
}

/** Crée le cookie de session admin. */
export async function createSession(email: string): Promise<void> {
  const token = await createSessionToken(email);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8h
  });
}

/** Supprime le cookie de session. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Renvoie la session courante ou null. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/** Garde secondaire : redirige vers /admin/login si non authentifié. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
