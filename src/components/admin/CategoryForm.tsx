"use client";

import { useActionState } from "react";
import { emptyState, type ActionState } from "@/actions/types";
import { SubmitButton } from "./SubmitButton";

type Category = {
  id: number;
  name: string;
  slug: string;
  order: number;
};

export function CategoryForm({
  action,
  category,
  submitLabel = "Enregistrer",
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  category?: Category;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, emptyState);

  return (
    <form action={formAction} className="space-y-3">
      {category && <input type="hidden" name="id" value={category.id} />}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="label">Nom</label>
          <input
            name="name"
            className="input"
            defaultValue={category?.name}
            placeholder="Entretien courant"
            required
          />
        </div>
        <div>
          <label className="label">Ordre</label>
          <input
            name="order"
            type="number"
            className="input"
            defaultValue={category?.order ?? 0}
          />
        </div>
      </div>
      <div>
        <label className="label">Slug (identifiant URL)</label>
        <input
          name="slug"
          className="input"
          defaultValue={category?.slug}
          placeholder="entretien-courant"
          pattern="[a-z0-9\-]+"
          required
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-green-600">Enregistré.</p>
      )}
      <SubmitButton pendingText="Enregistrement…">{submitLabel}</SubmitButton>
    </form>
  );
}
