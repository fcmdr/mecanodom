import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG ?? "mecanodom";

async function main() {
  console.log("Seed : démarrage...");

  // 0. Tenant par défaut (un seul client pour l'instant)
  const tenant = await prisma.tenant.upsert({
    where: { slug: TENANT_SLUG },
    update: {},
    create: {
      slug: TENANT_SLUG,
      name: "MécanoDom",
      tagline: "Votre mécanicien à domicile",
      description:
        "Entretien et réparation automobile à domicile en Île-de-France. Prise de rendez-vous en ligne, tarifs transparents, intervention chez vous.",
      phone: "01 23 45 67 89",
      email: "contact@mecanodom.fr",
      address: "Île-de-France",
      hoursSummary: "Lun–Ven 8h–18h · Sam 9h–13h",
      mapCenterLat: 48.8566,
      mapCenterLng: 2.3522,
    },
  });
  const tenantId = tenant.id;
  console.log("  ✓ Tenant par défaut");

  // 1. Paramètres de réservation (un réglage par tenant)
  await prisma.bookingSettings.upsert({
    where: { tenantId },
    update: {},
    create: {
      tenantId,
      slotStepMin: 30,
      bufferMin: 15,
      minLeadHours: 12,
      maxAdvanceDays: 30,
    },
  });
  console.log("  ✓ Paramètres de réservation");

  // 2. Catégories + prestations
  const categories = [
    {
      slug: "entretien",
      name: "Entretien courant",
      order: 1,
      services: [
        {
          name: "Vidange + filtre à huile",
          description:
            "Vidange complète avec remplacement du filtre à huile. Huile fournie.",
          priceCents: 4990,
          durationMin: 45,
          order: 1,
        },
        {
          name: "Remplacement filtre à air",
          description: "Contrôle et remplacement du filtre à air moteur.",
          priceCents: 2500,
          durationMin: 30,
          order: 2,
        },
        {
          name: "Remplacement filtre habitacle",
          description: "Changement du filtre d'habitacle (pollen).",
          priceCents: 2900,
          durationMin: 30,
          order: 3,
        },
      ],
    },
    {
      slug: "freinage",
      name: "Freinage",
      order: 2,
      services: [
        {
          name: "Plaquettes de frein (avant)",
          description: "Remplacement des plaquettes de frein avant. Pièces non incluses.",
          priceCents: 8900,
          durationMin: 90,
          order: 1,
        },
        {
          name: "Plaquettes + disques (avant)",
          description:
            "Remplacement plaquettes et disques avant. Main d'œuvre uniquement.",
          priceCents: 12900,
          durationMin: 120,
          order: 2,
        },
      ],
    },
    {
      slug: "diagnostic",
      name: "Diagnostic",
      order: 3,
      services: [
        {
          name: "Diagnostic électronique (valise OBD)",
          description:
            "Lecture des codes défauts et diagnostic électronique du véhicule.",
          priceCents: 3900,
          durationMin: 45,
          order: 1,
        },
      ],
    },
    {
      slug: "batterie",
      name: "Batterie & démarrage",
      order: 4,
      services: [
        {
          name: "Remplacement batterie",
          description:
            "Dépose/repose de la batterie et réinitialisation. Batterie non incluse.",
          priceCents: 3500,
          durationMin: 30,
          order: 1,
        },
        {
          name: "Test batterie & alternateur",
          description: "Contrôle de l'état de charge et du circuit de charge.",
          priceCents: 1900,
          durationMin: 30,
          order: 2,
        },
      ],
    },
  ];

  for (const cat of categories) {
    const category = await prisma.serviceCategory.upsert({
      where: { tenantId_slug: { tenantId, slug: cat.slug } },
      update: { name: cat.name, order: cat.order },
      create: { tenantId, slug: cat.slug, name: cat.name, order: cat.order },
    });

    for (const svc of cat.services) {
      // Idempotence : on cherche par nom + catégorie
      const existing = await prisma.service.findFirst({
        where: { tenantId, name: svc.name, categoryId: category.id },
      });
      if (existing) {
        await prisma.service.update({
          where: { id: existing.id },
          data: {
            description: svc.description,
            priceCents: svc.priceCents,
            durationMin: svc.durationMin,
            order: svc.order,
            isActive: true,
          },
        });
      } else {
        await prisma.service.create({
          data: {
            tenantId,
            name: svc.name,
            description: svc.description,
            priceCents: svc.priceCents,
            durationMin: svc.durationMin,
            order: svc.order,
            categoryId: category.id,
          },
        });
      }
    }
  }
  console.log("  ✓ Catégories et prestations");

  // 3. Horaires de travail (Lun-Ven 08-12 & 13-18, Sam 09-13, Dim off)
  const workingHours = [
    // Lundi(1) à Vendredi(5)
    ...[1, 2, 3, 4, 5].flatMap((weekday) => [
      { weekday, startTime: "08:00", endTime: "12:00" },
      { weekday, startTime: "13:00", endTime: "18:00" },
    ]),
    // Samedi(6)
    { weekday: 6, startTime: "09:00", endTime: "13:00" },
  ];

  // Idempotence : on réinitialise les horaires de CE tenant uniquement
  await prisma.workingHours.deleteMany({ where: { tenantId } });
  await prisma.workingHours.createMany({
    data: workingHours.map((w) => ({ ...w, tenantId })),
  });
  console.log("  ✓ Horaires de travail");

  // 4. Zones de couverture
  const zones = [
    { postalCode: "75001", city: "Paris 1er" },
    { postalCode: "92100", city: "Boulogne-Billancourt" },
    { postalCode: "93100", city: "Montreuil" },
    { postalCode: "94200", city: "Ivry-sur-Seine" },
  ];
  for (const zone of zones) {
    await prisma.coverageZone.upsert({
      where: { tenantId_postalCode: { tenantId, postalCode: zone.postalCode } },
      update: { city: zone.city, isActive: true },
      create: { ...zone, tenantId, isActive: true },
    });
  }
  console.log("  ✓ Zones de couverture");

  // 5. Un jour bloqué exemple (1er janvier de l'année prochaine)
  const nextYear = new Date().getUTCFullYear() + 1;
  const blocked = new Date(Date.UTC(nextYear, 0, 1));
  await prisma.blockedDate.upsert({
    where: { tenantId_date: { tenantId, date: blocked } },
    update: { reason: "Jour férié (Nouvel An)" },
    create: { tenantId, date: blocked, reason: "Jour férié (Nouvel An)" },
  });
  console.log("  ✓ Jour bloqué exemple");

  console.log("Seed : terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
