import { prisma } from "@/lib/prisma";
import { ZoneForm } from "@/components/admin/ZoneForm";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { createZone, updateZone, deleteZone, toggleZone } from "@/actions/zones";

export default async function AdminZonesPage() {
  const zones = await prisma.coverageZone.findMany({
    orderBy: { postalCode: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Zones d'intervention
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Gérez les codes postaux couverts. La vérification côté client s'appuie
          sur cette liste.
        </p>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold text-slate-900">Ajouter une zone</h2>
        <div className="mt-4">
          <ZoneForm action={createZone} submitLabel="Ajouter la zone" />
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900">
            Zones ({zones.length})
          </h2>
        </div>
        {zones.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Aucune zone renseignée.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {zones.map((z) => (
              <li key={z.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-brand">
                      {z.postalCode}
                    </span>
                    <span className="text-slate-900">{z.city}</span>
                    {!z.isActive && (
                      <span className="badge bg-slate-200 text-slate-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <form action={toggleZone}>
                      <input type="hidden" name="id" value={z.id} />
                      <button
                        type="submit"
                        className="font-medium text-slate-600 hover:text-brand"
                      >
                        {z.isActive ? "Désactiver" : "Activer"}
                      </button>
                    </form>
                    <form action={deleteZone}>
                      <input type="hidden" name="id" value={z.id} />
                      <ConfirmSubmit confirmMessage="Supprimer cette zone ?">
                        Supprimer
                      </ConfirmSubmit>
                    </form>
                  </div>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-brand">
                    Modifier
                  </summary>
                  <div className="mt-3 rounded-lg bg-slate-50 p-4">
                    <ZoneForm
                      action={updateZone}
                      zone={z}
                      submitLabel="Enregistrer"
                    />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
