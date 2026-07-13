import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { checkCoverage } from "@/lib/coverage";

// GET /api/coverage?postalCode=75001
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postalCode = searchParams.get("postalCode") ?? "";

  if (!postalCode) {
    return NextResponse.json(
      { error: "Paramètre postalCode requis" },
      { status: 400 },
    );
  }

  const { db } = await getTenantContext();
  const result = await checkCoverage(db, postalCode);
  return NextResponse.json(result);
}
