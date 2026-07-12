"use client";

import { useActionState } from "react";
import { emptyState, type ActionState } from "@/actions/types";
import { SubmitButton } from "./SubmitButton";
import { WEEKDAY_LABELS } from "@/lib/utils";

// Ordre d'affichage : Lundi -> Dimanche
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function WorkingHoursForm({
  action,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, emptyState);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Jour</label>
          <select name="weekday" className="input" defaultValue={1}>
            {WEEKDAY_ORDER.map((d) => (
              <option key={d} value={d}>
                {WEEKDAY_LABELS[d]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Début</label>
          <input name="startTime" type="time" className="input" defaultValue="08:00" required />
        </div>
        <div>
          <label className="label">Fin</label>
          <input name="endTime" type="time" className="input" defaultValue="12:00" required />
        </div>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-600">Créneau ajouté.</p>}
      <SubmitButton pendingText="Ajout…">Ajouter le créneau</SubmitButton>
    </form>
  );
}
