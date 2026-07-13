import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";

// GET /api/services : liste des prestations actives groupées par catégorie
export async function GET() {
  const { db } = await getTenantContext();
  const categories = await db.serviceCategory.findMany({
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
