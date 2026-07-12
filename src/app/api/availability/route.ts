import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeSlotsForDate } from "@/lib/availability";

// GET /api/availability?serviceId=1&date=2025-05-05
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = Number(searchParams.get("serviceId"));
  const date = searchParams.get("date") ?? "";

  if (!serviceId || Number.isNaN(serviceId)) {
    return NextResponse.json(
      { error: "Paramètre serviceId requis" },
      { status: 400 },
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Paramètre date invalide (attendu YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, durationMin: true, isActive: true },
  });

  if (!service || !service.isActive) {
    return NextResponse.json(
      { error: "Prestation introuvable" },
      { status: 404 },
    );
  }

  const result = await computeSlotsForDate(date, service);
  return NextResponse.json(result);
}
