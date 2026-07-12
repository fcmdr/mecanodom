import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/services : liste des prestations actives groupées par catégorie
export async function GET() {
  const categories = await prisma.serviceCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          priceCents: true,
          durationMin: true,
        },
      },
    },
  });

  const result = categories
    .filter((c) => c.services.length > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      services: c.services,
    }));

  return NextResponse.json(result);
}
