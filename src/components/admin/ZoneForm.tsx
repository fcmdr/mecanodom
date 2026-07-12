"use client";

import { useActionState } from "react";
import { emptyState, type ActionState } from "@/actions/types";
import { SubmitButton } from "./SubmitButton";

type Zone = {
  id: number;
  postalCode: string;
  city: string;
  isActive: boolean;
};

export function ZoneForm({
  action,
  zone,
  submitLabel = "Ajouter",
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  zone?: Zone;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, emptyState);

  return (
    <form action={formAction} className="space-y-3">
      {zone && <input type="hidden" name="id" value={zone.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Code postal</label>
          <input
            name="postalCode"
            className="input"
            inputMode="numeric"
            maxLength={5}
            defaultValue={zone?.postalCode}
            placeholder="75001"
            required
          />
        </div>
        <div>
          <label className="label">Ville</label>
          <input
            name="city"
            className="input"
            defaultValue={zone?.city}
            placeholder="Paris"
            required
          />
        </div>
      </div>
      {zone && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={zone.isActive}
            className="h-4 w-4 rounded border-slate-300"
          />
          Zone active
        </label>
      )}
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Enregistré.</p>}
      <SubmitButton pendingText="…">{submitLabel}</SubmitButton>
    </form>
  );
}
