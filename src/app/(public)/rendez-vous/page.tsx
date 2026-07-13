import type { Metadata } from "next";
import Link from "next/link";
import { getTenantContext } from "@/lib/tenant";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata: Metadata = {
  title: "Prendre rendez-vous",
  description:
    "Réservez en ligne votre intervention de mécanique à domicile : choisissez la prestation, la date et le créneau.",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service } = await searchParams;
  const initialServiceId = service ? Number(service) : undefined;

  const { db } = await getTenantContext();
  const [categories, settings] = await Promise.all([
    db.serviceCategory.findMany({
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
    }),
    db.bookingSettings.findFirst(),
  ]);

  const withServices = categories.filter((c) => c.services.length > 0);

  if (withServices.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Réservation indisponible
        </h1>
        <p className="mt-2 text-slate-600">
          Aucune prestation n'est disponible pour le moment. Merci de nous
          contacter.
        </p>
        <Link href="/contact" className="btn-primary mt-6">
          Nous contacter
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-4xl font-black tracking-tight text-slate-900">
          Prendre rendez-vous
        </h1>
        <p className="mt-3 text-slate-600">
          Quelques étapes suffisent pour réserver votre intervention à domicile.
        </p>
      </header>

      <BookingWizard
        categories={withServices}
        maxAdvanceDays={settings?.maxAdvanceDays ?? 30}
        initialServiceId={initialServiceId}
      />
    </div>
  );
}
