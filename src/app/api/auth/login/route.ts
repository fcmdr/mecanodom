import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validators";
import { verifyCredentials, createSession } from "@/lib/auth";

// POST /api/auth/login
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Email ou mot de passe manquant" },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;
  const ok = await verifyCredentials(email, password);
  if (!ok) {
    return NextResponse.json(
      { error: "Identifiants incorrects" },
      { status: 401 },
    );
  }

  await createSession(email);
  return NextResponse.json({ ok: true });
}
