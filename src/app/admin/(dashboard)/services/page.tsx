import { prisma } from "@/lib/prisma";
import { formatPrice, formatDuration } from "@/lib/utils";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createService,
  updateService,
  deleteService,
  toggleService,
} from "@/actions/services";

export default async function AdminServicesPage() {
  const categories = await prisma.serviceCategory.findMany({
    orderBy: { order: "asc" },
    include: { services: { orderBy: { order: "asc" } } },
  });

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Prestations & tarifs
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Ajoutez, modifiez ou masquez des prestations. Les changements sont
          immédiatement visibles sur le site.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-semibold text-slate-900">Nouvelle catégorie</h2>
          <div className="mt-4">
            <CategoryForm action={createCategory} submitLabel="Ajouter la catégorie" />
          </div>
        </section>

        {categoryOptions.length > 0 && (
          <section className="card p-6">
            <h2 className="font-semibold text-slate-900">Nouvelle prestation</h2>
            <div className="mt-4">
              <ServiceForm
                action={createService}
                categories={categoryOptions}
                submitLabel="Ajouter la prestation"
              />
            </div>
          </section>
        )}
      </div>

      <div className="space-y-6">
        {categories.length === 0 && (
          <p className="text-sm text-slate-500">
            Aucune catégorie. Commencez par en créer une.
          </p>
        )}
        {categories.map((cat) => (
          <section key={cat.id} className="card overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {cat.name}
                </h2>
                <p className="text-xs text-slate-500">
                  /{cat.slug} · {cat.services.length} prestation(s)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <details className="group relative">
                  <summary className="btn-ghost cursor-pointer list-none py-1.5 text-sm">
                    Modifier
                  </summary>
                  <div className="absolute right-0 z-10 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
                    <CategoryForm action={updateCategory} category={cat} />
                  </div>
                </details>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={cat.id} />
                  <ConfirmSubmit confirmMessage="Supprimer cette catégorie et toutes ses prestations ?">
                    Supprimer
                  </ConfirmSubmit>
                </form>
              </div>
            </div>

            {cat.services.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">
                Aucune prestation dans cette catégorie.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {cat.services.map((s) => (
                  <li key={s.id} className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {s.name}
                          </span>
                          {!s.isActive && (
                            <span className="badge bg-slate-200 text-slate-600">
                              Masquée
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">
                          {formatPrice(s.priceCents)} ·{" "}
                          {formatDuration(s.durationMin)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <form action={toggleService}>
                          <input type="hidden" name="id" value={s.id} />
                          <button
                            type="submit"
                            className="font-medium text-slate-600 hover:text-brand"
                          >
                            {s.isActive ? "Masquer" : "Activer"}
                          </button>
                        </form>
                        <form action={deleteService}>
                          <input type="hidden" name="id" value={s.id} />
                          <ConfirmSubmit confirmMessage="Supprimer cette prestation ?">
                            Supprimer
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </div>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-brand">
                        Modifier cette prestation
                      </summary>
                      <div className="mt-3 rounded-lg bg-slate-50 p-4">
                        <ServiceForm
                          action={updateService}
                          categories={categoryOptions}
                          service={s}
                        />
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
