"use client";

import { useActionState } from "react";
import { emptyState, type ActionState } from "@/actions/types";
import { SubmitButton } from "./SubmitButton";

type Category = { id: number; name: string };
type Service = {
  id: number;
  name: string;
  description: string | null;
  priceCents: number;
  durationMin: number;
  categoryId: number;
  isActive: boolean;
  order: number;
};

export function ServiceForm({
  action,
  categories,
  service,
  submitLabel = "Enregistrer",
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  categories: Category[];
  service?: Service;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, emptyState);

  return (
    <form action={formAction} className="space-y-3">
      {service && <input type="hidden" name="id" value={service.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Nom de la prestation</label>
          <input
            name="name"
            className="input"
            defaultValue={service?.name}
            placeholder="Vidange + filtre à huile"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea
            name="description"
            rows={2}
            className="input"
            defaultValue={service?.description ?? ""}
          />
        </div>
        <div>
          <label className="label">Prix (€)</label>
          <input
            name="priceEuros"
            type="number"
            step="0.01"
            min="0"
            className="input"
            defaultValue={service ? (service.priceCents / 100).toFixed(2) : ""}
            required
          />
        </div>
        <div>
          <label className="label">Durée (min)</label>
          <input
            name="durationMin"
            type="number"
            min="5"
            step="5"
            className="input"
            defaultValue={service?.durationMin ?? 30}
            required
          />
        </div>
        <div>
          <label className="label">Catégorie</label>
          <select
            name="categoryId"
            className="input"
            defaultValue={service?.categoryId ?? categories[0]?.id}
            required
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Ordre</label>
          <input
            name="order"
            type="number"
            className="input"
            defaultValue={service?.order ?? 0}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={service ? service.isActive : true}
            className="h-4 w-4 rounded border-slate-300"
          />
          Prestation active (visible sur le site)
        </label>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Enregistré.</p>}
      <SubmitButton pendingText="Enregistrement…">{submitLabel}</SubmitButton>
    </form>
  );
}
